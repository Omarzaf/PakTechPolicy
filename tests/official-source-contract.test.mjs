import assert from "node:assert/strict";
import test from "node:test";
import {
  assertOfficialSources,
  collectOfficialSourceFailures,
} from "../tools/official-source-contract.mjs";

const validDataset = () => ({
  version: 1,
  as_of: "2026-07-26",
  scope_note: "A curated official-source directory.",
  sources: [
    {
      id: "example-source",
      title: "Example data",
      publisher: "Example institution",
      publisher_scope: "International",
      resource_type: "Dataset",
      topics: ["Connectivity & affordability"],
      what_it_covers: "A documented technology indicator.",
      pakistan_coverage: "Pakistan is included.",
      cadence: "Annual",
      latest_period: "2025",
      access_modes: ["CSV"],
      url: "https://example.com/data",
      last_checked: "2026-07-26",
      access_status: "Reachable",
      limitations: "Reference years can differ.",
    },
  ],
});

test("accepts a complete official-source directory", () => {
  assert.doesNotThrow(() => assertOfficialSources(validDataset()));
});

test("rejects unsafe, duplicate, and unsupported source metadata", () => {
  const dataset = validDataset();
  const duplicate = structuredClone(dataset.sources[0]);
  duplicate.id = dataset.sources[0].id;
  duplicate.publisher_scope = "Private";
  duplicate.topics = ["Unsupported topic"];
  duplicate.url = "javascript:alert(1)";
  dataset.sources.push(duplicate);

  const failures = collectOfficialSourceFailures(dataset);
  assert.ok(failures.some((failure) => failure.includes("duplicate id")));
  assert.ok(failures.some((failure) => failure.includes("publisher_scope")));
  assert.ok(failures.some((failure) => failure.includes("unsupported topic")));
  assert.ok(failures.some((failure) => failure.includes("valid HTTPS")));
});
