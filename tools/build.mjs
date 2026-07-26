import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { assertIndicatorDataset } from "./indicator-contract.mjs";
import { assertOfficialSources } from "./official-source-contract.mjs";
import { assertV1RecordCount } from "./release-contract.mjs";

const projectRoot = resolve(import.meta.dirname, "..");
const sourceDir = resolve(projectRoot, "src");
const dataFile = resolve(projectRoot, "data", "policies.json");
const indicatorDataFile = resolve(projectRoot, "data", "policy-indicators.json");
const officialSourcesFile = resolve(projectRoot, "data", "official-sources.json");
const outputDir = resolve(projectRoot, "dist");

const policies = JSON.parse(await readFile(dataFile, "utf8"));
const indicatorData = JSON.parse(await readFile(indicatorDataFile, "utf8"));
const officialSources = JSON.parse(await readFile(officialSourcesFile, "utf8"));
assertV1RecordCount(policies);
assertIndicatorDataset(
  indicatorData,
  new Set(policies.map((policy) => policy.id)),
);
assertOfficialSources(officialSources);

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
const staticPolicyList = `<ul>${policies
  .map(
    (policy) =>
      `<li><a href="${escapeHtml(policy.primary_source_url)}">${escapeHtml(
        policy.title,
      )}</a> — ${escapeHtml(policy.status)}; ${escapeHtml(policy.verification)}</li>`,
  )
  .join("")}</ul>`;
const staticSourceList = `<ul>${officialSources.sources
  .map(
    (source) =>
      `<li><a href="${escapeHtml(source.url)}">${escapeHtml(source.title)}</a> — ${escapeHtml(
        source.publisher,
      )}; ${escapeHtml(source.latest_period)}</li>`,
  )
  .join("")}</ul>`;

await rm(outputDir, { recursive: true, force: true });
await mkdir(resolve(outputDir, "data"), { recursive: true });
await cp(sourceDir, outputDir, { recursive: true });
const [indexHtml, sourcesHtml] = await Promise.all([
  readFile(resolve(sourceDir, "index.html"), "utf8"),
  readFile(resolve(sourceDir, "sources.html"), "utf8"),
]);
await Promise.all([
  writeFile(
    resolve(outputDir, "index.html"),
    indexHtml.replace("<!-- BUILD:STATIC-POLICY-LIST -->", staticPolicyList),
    "utf8",
  ),
  writeFile(
    resolve(outputDir, "sources.html"),
    sourcesHtml.replace("<!-- BUILD:STATIC-SOURCE-LIST -->", staticSourceList),
    "utf8",
  ),
]);
await writeFile(
  resolve(outputDir, "data", "policies.json"),
  `${JSON.stringify(policies)}\n`,
  "utf8",
);
await writeFile(
  resolve(outputDir, "data", "policy-indicators.json"),
  `${JSON.stringify(indicatorData)}\n`,
  "utf8",
);
await writeFile(
  resolve(outputDir, "data", "official-sources.json"),
  `${JSON.stringify(officialSources)}\n`,
  "utf8",
);

console.log(
  `Built ${policies.length} policies, ${indicatorData.indicators.length} indicators, and ${officialSources.sources.length} official sources to ${outputDir}`,
);
