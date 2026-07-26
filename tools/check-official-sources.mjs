import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { assertOfficialSources } from "./official-source-contract.mjs";

const root = resolve(import.meta.dirname, "..");
const inputName = "data/official-sources.json";
const outputName = "research/official-sources-link-audit.json";
const dataset = JSON.parse(await readFile(resolve(root, inputName), "utf8"));
assertOfficialSources(dataset);

const check = (source) =>
  new Promise((complete) => {
    const started = Date.now();
    const child = spawn("curl", [
      "-L",
      "-sS",
      "-o",
      "/dev/null",
      "--max-time",
      "25",
      "--user-agent",
      "PakTechPolicySourceAudit/1.0",
      "-w",
      "%{http_code}\t%{content_type}\t%{url_effective}\t%{size_download}",
      source.url,
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
      const authenticationRedirect = /(?:\/|[?&])(login|sign-?in|auth)(?:\/|[?&#=]|$)/i.test(
        finalUrl,
      );
      complete({
        id: source.id,
        publisher: source.publisher,
        declared_status: source.access_status,
        url: source.url,
        final_url: finalUrl || null,
        http_code: httpCode,
        content_type: contentType || null,
        size_bytes: sizeBytes,
        reachable:
          httpCode >= 200 &&
          httpCode < 400 &&
          !authenticationRedirect &&
          sizeBytes >= 256,
        elapsed_ms: Date.now() - started,
        exit_code: exitCode,
        error: stderr.trim() || null,
      });
    });
  });

const results = [];
const concurrency = 6;
for (let index = 0; index < dataset.sources.length; index += concurrency) {
  results.push(
    ...(await Promise.all(dataset.sources.slice(index, index + concurrency).map(check))),
  );
}

const audit = {
  checked_at: new Date().toISOString(),
  input: inputName,
  record_count: dataset.sources.length,
  reachable_count: results.filter(({ reachable }) => reachable).length,
  results,
};
await writeFile(resolve(root, outputName), `${JSON.stringify(audit, null, 2)}\n`, "utf8");

const failures = results.filter(
  ({ reachable, declared_status }) => !reachable && declared_status === "Reachable",
);
console.log(
  `OFFICIAL_SOURCE_AUDIT records=${results.length} reachable=${audit.reachable_count} limited=${
    results.filter(({ declared_status }) => declared_status === "Limited").length
  } failures=${failures.length}`,
);
if (failures.length) {
  console.error(
    failures
      .map(({ id, http_code, error }) => `${id}: HTTP ${http_code}${error ? ` — ${error}` : ""}`)
      .join("\n"),
  );
  process.exitCode = 1;
}
