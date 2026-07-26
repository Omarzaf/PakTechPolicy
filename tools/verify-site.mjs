import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const requiredFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "policy-engine.js",
  "ui-utils.js",
  "data/policies.json",
  "data/policy-indicators.json",
];
const failures = [];

for (const file of requiredFiles) {
  try {
    await access(resolve(dist, file));
  } catch {
    failures.push(`missing dist/${file}`);
  }
}

if (!failures.length) {
  const [html, css, app, sourceData, builtData, sourceIndicators, builtIndicators] =
    await Promise.all([
      readFile(resolve(dist, "index.html"), "utf8"),
      readFile(resolve(dist, "styles.css"), "utf8"),
      readFile(resolve(dist, "app.js"), "utf8"),
      readFile(resolve(root, "data", "policies.json"), "utf8"),
      readFile(resolve(dist, "data", "policies.json"), "utf8"),
      readFile(resolve(root, "data", "policy-indicators.json"), "utf8"),
      readFile(resolve(dist, "data", "policy-indicators.json"), "utf8"),
    ]);

  for (const marker of [
    'id="landscape"',
    'id="directory"',
    'id="domain-filter"',
    'id="policy-results"',
    'id="policy-dialog"',
    'id="methodology"',
  ]) {
    if (!html.includes(marker)) failures.push(`index.html missing ${marker}`);
  }
  if (/<(?:script|link)[^>]+(?:src|href)=["']https?:/i.test(html)) {
    failures.push("index.html contains an external script or stylesheet");
  }
  if (/url\(\s*["']?https?:/i.test(css)) {
    failures.push("styles.css contains an external asset");
  }
  if (/fetch\(\s*["']https?:/i.test(app)) {
    failures.push("app.js contains a remote data fetch");
  }
  if (JSON.stringify(JSON.parse(sourceData)) !== JSON.stringify(JSON.parse(builtData))) {
    failures.push("built dataset does not match data/policies.json");
  }
  if (
    JSON.stringify(JSON.parse(sourceIndicators)) !==
    JSON.stringify(JSON.parse(builtIndicators))
  ) {
    failures.push("built indicator dataset does not match data/policy-indicators.json");
  }
}

const baseUrl = process.env.PAKTECH_URL ?? "http://127.0.0.1:4173";
try {
  const [home, data, indicators, privateFile] = await Promise.all([
    fetch(`${baseUrl}/`),
    fetch(`${baseUrl}/data/policies.json`),
    fetch(`${baseUrl}/data/policy-indicators.json`),
    fetch(`${baseUrl}/AGENTS.md`),
  ]);
  if (!home.ok) failures.push(`preview home returned HTTP ${home.status}`);
  if (!data.ok) failures.push(`preview data returned HTTP ${data.status}`);
  if (!indicators.ok) failures.push(`preview indicators returned HTTP ${indicators.status}`);
  if (privateFile.status !== 404) {
    failures.push(`preview hygiene check expected /AGENTS.md 404, got ${privateFile.status}`);
  }
} catch (error) {
  failures.push(`preview server unavailable: ${error.message}`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`VERIFY_SITE=PASS files=${requiredFiles.length} base=${baseUrl}`);
}
