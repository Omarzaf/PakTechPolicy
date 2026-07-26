import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const requiredFiles = [
  "index.html",
  "sources.html",
  "styles.css",
  "app.js",
  "sources.js",
  "source-engine.js",
  "policy-engine.js",
  "ui-utils.js",
  "data/policies.json",
  "data/policy-indicators.json",
  "data/official-sources.json",
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
  const [
    html,
    sourcesHtml,
    css,
    app,
    sourcesApp,
    sourceData,
    builtData,
    sourceIndicators,
    builtIndicators,
    sourceDirectory,
    builtDirectory,
  ] =
    await Promise.all([
      readFile(resolve(dist, "index.html"), "utf8"),
      readFile(resolve(dist, "sources.html"), "utf8"),
      readFile(resolve(dist, "styles.css"), "utf8"),
      readFile(resolve(dist, "app.js"), "utf8"),
      readFile(resolve(dist, "sources.js"), "utf8"),
      readFile(resolve(root, "data", "policies.json"), "utf8"),
      readFile(resolve(dist, "data", "policies.json"), "utf8"),
      readFile(resolve(root, "data", "policy-indicators.json"), "utf8"),
      readFile(resolve(dist, "data", "policy-indicators.json"), "utf8"),
      readFile(resolve(root, "data", "official-sources.json"), "utf8"),
      readFile(resolve(dist, "data", "official-sources.json"), "utf8"),
    ]);

  for (const marker of [
    'id="landscape"',
    'id="evidence"',
    'id="directory"',
    'id="domain-filter"',
    'id="policy-results"',
    'id="policy-dialog"',
    'id="methodology"',
  ]) {
    if (!html.includes(marker)) failures.push(`index.html missing ${marker}`);
  }
  for (const marker of [
    'id="sources-title"',
    'id="source-filter-form"',
    'id="source-access"',
    'id="source-results"',
    'id="responsible-comparison"',
  ]) {
    if (!sourcesHtml.includes(marker)) failures.push(`sources.html missing ${marker}`);
  }
  if (
    html.includes("<!-- BUILD:STATIC-POLICY-LIST -->") ||
    sourcesHtml.includes("<!-- BUILD:STATIC-SOURCE-LIST -->")
  ) {
    failures.push("build-time static fallbacks were not rendered");
  }
  if (/<(?:script|link)[^>]+(?:src|href)=["']https?:/i.test(html)) {
    failures.push("index.html contains an external script or stylesheet");
  }
  if (/<(?:script|link)[^>]+(?:src|href)=["']https?:/i.test(sourcesHtml)) {
    failures.push("sources.html contains an external script or stylesheet");
  }
  if (/url\(\s*["']?https?:/i.test(css)) {
    failures.push("styles.css contains an external asset");
  }
  if (/fetch\(\s*["']https?:/i.test(app)) {
    failures.push("app.js contains a remote data fetch");
  }
  if (/fetch\(\s*["']https?:/i.test(sourcesApp)) {
    failures.push("sources.js contains a remote data fetch");
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
  if (
    JSON.stringify(JSON.parse(sourceDirectory)) !==
    JSON.stringify(JSON.parse(builtDirectory))
  ) {
    failures.push("built source directory does not match data/official-sources.json");
  }
}

const baseUrl = process.env.PAKTECH_URL ?? "http://127.0.0.1:4173";
try {
  const [home, sourcesPage, data, indicators, officialSources, privateFile] =
    await Promise.all([
    fetch(`${baseUrl}/`),
    fetch(`${baseUrl}/sources.html`),
    fetch(`${baseUrl}/data/policies.json`),
    fetch(`${baseUrl}/data/policy-indicators.json`),
    fetch(`${baseUrl}/data/official-sources.json`),
    fetch(`${baseUrl}/AGENTS.md`),
  ]);
  if (!home.ok) failures.push(`preview home returned HTTP ${home.status}`);
  if (!sourcesPage.ok) failures.push(`preview sources returned HTTP ${sourcesPage.status}`);
  if (!data.ok) failures.push(`preview data returned HTTP ${data.status}`);
  if (!indicators.ok) failures.push(`preview indicators returned HTTP ${indicators.status}`);
  if (!officialSources.ok) {
    failures.push(`preview official sources returned HTTP ${officialSources.status}`);
  }
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
