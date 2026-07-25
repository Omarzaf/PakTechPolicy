import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

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
      complete({
        id: policy.id,
        verification: policy.verification,
        url: policy.primary_source_url,
        final_url: finalUrl || null,
        http_code: httpCode,
        content_type: contentType || null,
        size_bytes: sizeBytes,
        reachable:
          httpCode >= 200 &&
          httpCode < 300 &&
          supportedContent &&
          !authenticationRedirect &&
          sizeBytes >= 512,
        elapsed_ms: Date.now() - started,
        exit_code: exitCode,
        error: stderr.trim() || null,
      });
    });
  });

const results = [];
const concurrency = 8;
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
  ({ reachable, verification }) => verification === "Verified" && !reachable,
);
console.log(
  `SOURCE_AUDIT records=${results.length} reachable=${audit.reachable_count} unexpected_failures=${unexpected.length}`,
);
if (unexpected.length) {
  console.error(unexpected.map(({ id, http_code }) => `${id}: HTTP ${http_code}`).join("\n"));
  process.exitCode = 1;
}
