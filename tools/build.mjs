import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { assertIndicatorDataset } from "./indicator-contract.mjs";
import { assertV1RecordCount } from "./release-contract.mjs";

const projectRoot = resolve(import.meta.dirname, "..");
const sourceDir = resolve(projectRoot, "src");
const dataFile = resolve(projectRoot, "data", "policies.json");
const indicatorDataFile = resolve(projectRoot, "data", "policy-indicators.json");
const outputDir = resolve(projectRoot, "dist");

const policies = JSON.parse(await readFile(dataFile, "utf8"));
const indicatorData = JSON.parse(await readFile(indicatorDataFile, "utf8"));
assertV1RecordCount(policies);
assertIndicatorDataset(
  indicatorData,
  new Set(policies.map((policy) => policy.id)),
);

await rm(outputDir, { recursive: true, force: true });
await mkdir(resolve(outputDir, "data"), { recursive: true });
await cp(sourceDir, outputDir, { recursive: true });
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

console.log(
  `Built ${policies.length} policy records and ${indicatorData.indicators.length} indicators to ${outputDir}`,
);
