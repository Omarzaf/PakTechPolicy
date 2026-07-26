import assert from "node:assert/strict";
import test from "node:test";
import {
  filterOfficialSources,
  getOfficialSourceStats,
  uniqueSourceValues,
} from "../src/source-engine.js";

const sources = [
  {
    title: "Pakistan connectivity",
    publisher: "National regulator",
    publisher_scope: "Pakistan",
    resource_type: "Dashboard",
    topics: ["Connectivity & affordability"],
    what_it_covers: "Broadband subscribers",
    pakistan_coverage: "Pakistan",
    limitations: "Subscriptions are not people.",
    access_modes: ["Web"],
  },
  {
    title: "Global payments",
    publisher: "International institution",
    publisher_scope: "International",
    resource_type: "Dataset",
    topics: ["Digital economy & payments"],
    what_it_covers: "Digital payment use",
    pakistan_coverage: "Pakistan included",
    limitations: "Survey estimates.",
    access_modes: ["CSV"],
  },
];

test("filters official sources across search and facets", () => {
  assert.equal(filterOfficialSources(sources, { query: "broadband" }).length, 1);
  assert.equal(
    filterOfficialSources(sources, { topic: "Digital economy & payments" }).length,
    1,
  );
  assert.equal(filterOfficialSources(sources, { publisherScope: "Pakistan" }).length, 1);
  assert.equal(filterOfficialSources(sources, { resourceType: "Dataset" }).length, 1);
});

test("calculates source hub facets and headline metrics", () => {
  assert.deepEqual(uniqueSourceValues(sources, "resource_type"), ["Dashboard", "Dataset"]);
  assert.deepEqual(getOfficialSourceStats(sources), {
    total: 2,
    pakistan: 1,
    international: 1,
    publishers: 2,
  });
});
