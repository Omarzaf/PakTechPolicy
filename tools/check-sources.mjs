import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { matchAccessProtection } from "./release-contract.mjs";

const root = resolve(import.meta.dirname, "..");
const getFlag = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
};
const inputName = getFlag("--file", "data/policies.json");
const outputName = getFlag("--output", "research/source-link-audit.json");
const resolveInsideRoot = (name) => {
  if (!name) throw new Error("A file flag is missing its path");
  const path = resolve(root, name);
  if (path !== root && !path.startsWith(`${root}${sep}`)) {
    throw new Error("Audit paths must stay inside the project");
  }
  return path;
};

const inputPath = resolveInsideRoot(inputName);
const outputPath = resolveInsideRoot(outputName);
const policies = JSON.parse(await readFile(inputPath, "utf8"));
const allowlist = JSON.parse(
  await readFile(resolve(root, "research", "access-protection-allowlist.json"), "utf8"),
);

const check = (policy) =>
  new Promise((complete) => {
    const started = Date.now();
    const child = spawn("curl", [
      "-L",
      "-sS",
      "-o",
      "/dev/null",
      "--max-time",
      "20",
      "--retry",
      "2",
      "--retry-delay",
      "2",
      "--retry-all-errors",
      "-w",
      "%{http_code}\t%{content_type}\t%{url_effective}\t%{size_download}",
      policy.primary_source_url,
    ]);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("close", (exitCode) => {
      const [statusValue, contentType = "", finalUrl = "", sizeValue = "0"] = stdout
        .trim()
        .split("\t");
      const httpCode = Number.parseInt(statusValue, 10) || 0;
      const sizeBytes = Number.parseInt(sizeValue, 10) || 0;
      const supportedContent = /^(application\/pdf|text\/html|application\/octet-stream|binary\/octet-stream|application\/msword|application\/vnd\.openxmlformats)/i.test(
        contentType,
      );
      const authenticationRedirect = /(?:\/|[?&])(login|sign-?in|auth)(?:\/|[?&#=]|$)/i.test(
        finalUrl,
      );
      const reachable =
        httpCode >= 200 &&
        httpCode < 300 &&
        supportedContent &&
        !authenticationRedirect &&
        sizeBytes >= 512;
      // Never upgrades reachability: an allowlist match is recorded alongside
      // reachable: false so the release gate can apply its narrower rule.
      const protection = reachable
        ? null
        : matchAccessProtection(policy.primary_source_url, httpCode, allowlist);
      complete({
        id: policy.id,
        verification: policy.verification,
        url: policy.primary_source_url,
        final_url: finalUrl || null,
        http_code: httpCode,
        content_type: contentType || null,
        size_bytes: sizeBytes,
        reachable,
        ...(protection
          ? { access_protected: true, allowlist_rationale: protection.rationale }
          : {}),
        elapsed_ms: Date.now() - started,
        exit_code: exitCode,
        error: stderr.trim() || null,
      });
    });
  });

const results = [];
// Public-sector hosts often throttle or time out under burst traffic. Keep the
// audit deliberately gentle so a transient 5xx response is less likely to be
// mistaken for a broken official source.
const concurrency = 3;
for (let index = 0; index < policies.length; index += concurrency) {
  results.push(...(await Promise.all(policies.slice(index, index + concurrency).map(check))));
}

const audit = {
  checked_at: new Date().toISOString(),
  input: inputName,
  record_count: policies.length,
  reachable_count: results.filter(({ reachable }) => reachable).length,
  results,
};
await writeFile(outputPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");

const unexpected = results.filter(
  ({ id, reachable, verification, access_protected: accessProtected }) =>
    verification === "Verified" &&
    !reachable &&
    !(accessProtected && allowlist.hosts.some((entry) => (entry.record_ids ?? []).includes(id))),
);
const protectedCount = results.filter(({ access_protected: flag }) => flag).length;
console.log(
  `SOURCE_AUDIT records=${results.length} reachable=${audit.reachable_count} access_protected=${protectedCount} unexpected_failures=${unexpected.length}`,
);
if (unexpected.length) {
  console.error(unexpected.map(({ id, http_code }) => `${id}: HTTP ${http_code}`).join("\n"));
  process.exitCode = 1;
}
