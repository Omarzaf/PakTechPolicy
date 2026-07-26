import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [home, sources, methodology] = await Promise.all([
  readFile(new URL("../src/index.html", import.meta.url), "utf8"),
  readFile(new URL("../src/sources.html", import.meta.url), "utf8"),
  readFile(new URL("../src/methodology.html", import.meta.url), "utf8"),
]);

test("public pages expose local methodology and a correction path", () => {
  for (const [name, html] of [
    ["home", home],
    ["sources", sources],
    ["methodology", methodology],
  ]) {
    assert.match(html, /href="\.\/methodology\.html"/, `${name}: local methodology link`);
    assert.match(
      html,
      /https:\/\/github\.com\/Omarzaf\/PakTechPolicy\/issues/,
      `${name}: correction path`,
    );
  }

  assert.doesNotMatch(home, /tree\/feat\/pak-tech-policy-v1\/docs/);
  assert.doesNotMatch(sources, /tree\/feat\/pak-tech-policy-v1\/docs/);
});

test("methodology discloses evidence layers, limitations, and public downloads", () => {
  for (const marker of [
    'id="methodology-overview"',
    'id="verification-rules"',
    'id="confidence-title"',
    'id="refresh-title"',
    'id="downloads-title"',
    'id="limitations-title"',
  ]) {
    assert.match(methodology, new RegExp(marker));
  }

  for (const dataset of [
    "./data/policies.json",
    "./data/policy-indicators.json",
    "./data/official-sources.json",
  ]) {
    assert.match(methodology, new RegExp(`href="${dataset.replaceAll(".", "\\.")}"`));
  }

  assert.match(methodology, /does not establish causation/i);
  assert.match(methodology, /curated, not exhaustive/i);
  assert.match(methodology, /not legal advice/i);
  assert.match(methodology, /Missing observations are not zero/i);
});
