import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { assertOfficialSources } from "../tools/official-source-contract.mjs";

const dataset = JSON.parse(
  await readFile(new URL("../data/official-sources.json", import.meta.url), "utf8"),
);

test("published source hub data is official, current, and internally consistent", () => {
  assert.doesNotThrow(() => assertOfficialSources(dataset));
  assert.equal(dataset.version, 1);
  assert.equal(dataset.as_of, "2026-07-26");
  assert.ok(dataset.sources.length >= 20);
  assert.ok(dataset.sources.some(({ publisher_scope }) => publisher_scope === "Pakistan"));
  assert.ok(dataset.sources.some(({ publisher_scope }) => publisher_scope === "International"));

  for (const source of dataset.sources) {
    assert.equal(source.last_checked, dataset.as_of);
    assert.ok(["Reachable", "Limited"].includes(source.access_status));
    assert.match(source.url, /^https:\/\//);
    assert.ok(source.limitations.length >= 40, `${source.id}: limitations are too short`);
  }
});
