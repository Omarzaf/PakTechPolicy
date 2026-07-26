import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [indexHtml, sourcesHtml, app, sourcesApp, css] = await Promise.all([
  readFile(new URL("../src/index.html", import.meta.url), "utf8"),
  readFile(new URL("../src/sources.html", import.meta.url), "utf8"),
  readFile(new URL("../src/app.js", import.meta.url), "utf8"),
  readFile(new URL("../src/sources.js", import.meta.url), "utf8"),
  readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
]);

test("responsible-comparison guidance keeps each sentence in its content column", () => {
  const section = sourcesHtml.match(
    /<section\s+class="responsible-comparison[^"]*"[\s\S]+?<\/section>/,
  )?.[0];

  assert.ok(section);
  assert.equal(section.match(/<li>/g)?.length, 4);
  assert.equal(section.match(/<li>\s*<span>\d{2}<\/span>\s*<div>/g)?.length, 4);
  assert.doesNotMatch(section, /<\/strong>\s+[A-Z][^<]+<\/li>/);
  assert.match(css, /\.responsible-comparison li > div/);
});

test("interactive filters expose selected state and prevent native form submission", () => {
  assert.match(indexHtml, /data-quick-domain="[^"]+"\s+aria-pressed="false"/);
  assert.match(sourcesHtml, /data-topic-shortcut="[^"]+"\s+aria-pressed="false"/);
  assert.match(app, /button\.setAttribute\("aria-pressed", String\(selected\)\)/);
  assert.match(sourcesApp, /source-filter-form"\)\.addEventListener\("submit"/);
  assert.match(sourcesApp, /event\.preventDefault\(\)/);
});

test("source cards use local official brand assets and pastel coordination", () => {
  assert.match(sourcesApp, /import \{ getSourceBrand \} from "\.\/source-brands\.js"/);
  assert.match(sourcesApp, /class="source-logo/);
  assert.match(css, /--sky-wash: #ddeaf3/);
  assert.match(css, /--lavender-wash: #e9e2f2/);
  assert.match(css, /--butter-wash: #f3ebcf/);
  assert.match(css, /--peach-wash: #f5e4d8/);
});
