import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const sourceDir = resolve(projectRoot, "src");
const dataFile = resolve(projectRoot, "data", "policies.json");
const outputDir = resolve(projectRoot, "dist");

const policies = JSON.parse(await readFile(dataFile, "utf8"));
if (!Array.isArray(policies)) {
  throw new TypeError("data/policies.json must contain an array");
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(resolve(outputDir, "data"), { recursive: true });
await cp(sourceDir, outputDir, { recursive: true });
await writeFile(
  resolve(outputDir, "data", "policies.json"),
  `${JSON.stringify(policies)}\n`,
  "utf8",
);

console.log(`Built ${policies.length} policy records to ${outputDir}`);
