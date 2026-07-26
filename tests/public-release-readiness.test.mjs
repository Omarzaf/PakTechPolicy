import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const publicPages = [
  ["src/index.html", "https://omarzaf.github.io/PakTechPolicy/"],
  [
    "src/sources.html",
    "https://omarzaf.github.io/PakTechPolicy/sources.html",
  ],
  [
    "src/methodology.html",
    "https://omarzaf.github.io/PakTechPolicy/methodology.html",
  ],
];

test("public routes publish complete discovery and social metadata without trackers", async () => {
  for (const [path, canonical] of publicPages) {
    const html = await read(path);
    assert.match(
      html,
      new RegExp(`<link\\s+rel="canonical"\\s+href="${canonical.replaceAll(".", "\\.")}"`),
      `${path}: canonical`,
    );
    for (const marker of [
      'property="og:title"',
      'property="og:description"',
      'property="og:image"',
      'name="twitter:card"',
      'name="twitter:image"',
      'rel="icon"',
      'rel="manifest"',
    ]) {
      assert.match(html, new RegExp(marker), `${path}: ${marker}`);
    }
    assert.doesNotMatch(
      html,
      /google-analytics|googletagmanager|segment\.com|plausible\.io|mixpanel/i,
      `${path}: no analytics or tracker`,
    );
  }
});

test("homepage structured data identifies the site and downloadable dataset", async () => {
  const html = await read("src/index.html");
  const payload = html.match(
    /<script type="application\/ld\+json">([\s\S]+?)<\/script>/,
  )?.[1];
  assert.ok(payload, "JSON-LD block");
  const graph = JSON.parse(payload)["@graph"];

  assert.equal(graph.find((entry) => entry["@type"] === "WebSite")?.creator?.name, "Muhammad Umar Zafar");
  const dataset = graph.find((entry) => entry["@type"] === "Dataset");
  assert.equal(
    dataset?.url,
    "https://omarzaf.github.io/PakTechPolicy/data/policies.json",
  );
  assert.equal(dataset?.isAccessibleForFree, true);
});

test("static launch assets and branded recovery route are internally consistent", async () => {
  const [manifest, robots, sitemap, notFound] = await Promise.all([
    read("src/site.webmanifest").then(JSON.parse),
    read("src/robots.txt"),
    read("src/sitemap.xml"),
    read("src/404.html"),
  ]);

  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.icons[0].src, "./assets/favicon.svg");
  assert.match(robots, /Sitemap: https:\/\/omarzaf\.github\.io\/PakTechPolicy\/sitemap\.xml/);
  for (const [, canonical] of publicPages) {
    assert.match(sitemap, new RegExp(`<loc>${canonical.replaceAll(".", "\\.")}</loc>`));
  }
  assert.match(notFound, /id="not-found-title"/);
  assert.match(notFound, /data-correction\.yml/);
  await Promise.all(
    ["src/assets/favicon.svg", "src/assets/social-card.svg"].map((path) =>
      access(new URL(`../${path}`, import.meta.url)),
    ),
  );
});

test("public pages disclose maintenance, independence, privacy, and correction routes", async () => {
  for (const [path] of publicPages) {
    const html = await read(path);
    assert.match(html, /Muhammad Umar Zafar/);
    assert.match(html, /independent/i);
    assert.match(html, /tracking cookies|no accounts, advertising, analytics/i);
    assert.match(html, /data-correction\.yml/);
    assert.match(html, /product-feedback\.yml/);
    assert.match(html, /public/i);
    assert.match(html, /sensitive information/i);
  }
});

test("repository governance and feedback forms enforce evidence and human review", async () => {
  const required = [
    "LICENSE",
    "LICENSE-DATA-DOCS.md",
    "CONTRIBUTING.md",
    "SECURITY.md",
    "CODE_OF_CONDUCT.md",
    "CITATION.cff",
    ".github/pull_request_template.md",
    ".github/ISSUE_TEMPLATE/config.yml",
    ".github/ISSUE_TEMPLATE/data-correction.yml",
    ".github/ISSUE_TEMPLATE/product-feedback.yml",
    "docs/feedback-loop.md",
    ".agents/skills/maintain-pak-tech-policy/SKILL.md",
  ];
  await Promise.all(required.map((path) => access(new URL(`../${path}`, import.meta.url))));

  const [dataForm, productForm, feedbackLoop, dataLicense] = await Promise.all([
    read(".github/ISSUE_TEMPLATE/data-correction.yml"),
    read(".github/ISSUE_TEMPLATE/product-feedback.yml"),
    read("docs/feedback-loop.md"),
    read("LICENSE-DATA-DOCS.md"),
  ]);
  for (const form of [dataForm, productForm]) {
    for (const field of [
      "Affected page or record",
      "Feedback type",
      "What did you observe?",
      "Proposed improvement",
      "Accessibility context",
      "sensitive",
    ]) {
      assert.match(form, new RegExp(field.replace("?", "\\?"), "i"));
    }
  }
  assert.match(dataForm, /Official evidence URL/);
  assert.match(productForm, /Evidence or reference URL/);
  assert.match(feedbackLoop, /skillopt-approved/);
  assert.match(feedbackLoop, /reviewed: false/);
  assert.match(feedbackLoop, /never edits the product/i);
  assert.match(dataLicense, /src\/assets\/source-logos/);
  assert.match(dataLicense, /does not imply affiliation, sponsorship, or endorsement/i);
});
