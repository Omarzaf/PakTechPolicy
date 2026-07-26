import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { SOURCE_BRANDS } from "../src/source-brands.js";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const requiredFiles = [
  "index.html",
  "sources.html",
  "methodology.html",
  "styles.css",
  "app.js",
  "sources.js",
  "source-brands.js",
  "source-engine.js",
  "policy-engine.js",
  "ui-utils.js",
  "data/policies.json",
  "data/policy-indicators.json",
  "data/official-sources.json",
  ...new Set(
    Object.values(SOURCE_BRANDS).map(({ asset }) => asset.replace(/^\.\//, "")),
  ),
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
    methodologyHtml,
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
      readFile(resolve(dist, "methodology.html"), "utf8"),
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
  for (const marker of [
    'id="methods-title"',
    'id="methodology-overview"',
    'id="verification-rules"',
    'id="confidence-title"',
    'id="refresh-title"',
    'id="downloads-title"',
    'id="limitations-title"',
  ]) {
    if (!methodologyHtml.includes(marker)) {
      failures.push(`methodology.html missing ${marker}`);
    }
  }
  if (
    html.includes("<!-- BUILD:STATIC-POLICY-LIST -->") ||
    sourcesHtml.includes("<!-- BUILD:STATIC-SOURCE-LIST -->") ||
    methodologyHtml.includes("{{")
  ) {
    failures.push("build-time content was not fully rendered");
  }
  if (/<(?:script|link)[^>]+(?:src|href)=["']https?:/i.test(html)) {
    failures.push("index.html contains an external script or stylesheet");
  }
  if (/<(?:script|link)[^>]+(?:src|href)=["']https?:/i.test(sourcesHtml)) {
    failures.push("sources.html contains an external script or stylesheet");
  }
  if (/<(?:script|link)[^>]+(?:src|href)=["']https?:/i.test(methodologyHtml)) {
    failures.push("methodology.html contains an external script or stylesheet");
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
  const [
    home,
    sourcesPage,
    methodologyPage,
    data,
    indicators,
    officialSources,
    privateFile,
    privateDocs,
    privateResearch,
  ] =
    await Promise.all([
    fetch(`${baseUrl}/`),
    fetch(`${baseUrl}/sources.html`),
    fetch(`${baseUrl}/methodology.html`),
    fetch(`${baseUrl}/data/policies.json`),
    fetch(`${baseUrl}/data/policy-indicators.json`),
    fetch(`${baseUrl}/data/official-sources.json`),
    fetch(`${baseUrl}/AGENTS.md`),
    fetch(`${baseUrl}/docs/data-quality.md`),
    fetch(`${baseUrl}/research/source-link-audit.json`),
  ]);
  if (!home.ok) failures.push(`preview home returned HTTP ${home.status}`);
  if (!sourcesPage.ok) failures.push(`preview sources returned HTTP ${sourcesPage.status}`);
  if (!methodologyPage.ok) {
    failures.push(`preview methodology returned HTTP ${methodologyPage.status}`);
  }
  if (!data.ok) failures.push(`preview data returned HTTP ${data.status}`);
  if (!indicators.ok) failures.push(`preview indicators returned HTTP ${indicators.status}`);
  if (!officialSources.ok) {
    failures.push(`preview official sources returned HTTP ${officialSources.status}`);
  }
  if (privateFile.status !== 404) {
    failures.push(`preview hygiene check expected /AGENTS.md 404, got ${privateFile.status}`);
  }
  if (privateDocs.status !== 404) {
    failures.push(
      `preview hygiene check expected /docs/data-quality.md 404, got ${privateDocs.status}`,
    );
  }
  if (privateResearch.status !== 404) {
    failures.push(
      `preview hygiene check expected /research/source-link-audit.json 404, got ${privateResearch.status}`,
    );
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
