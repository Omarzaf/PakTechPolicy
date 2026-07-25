import test from "node:test";
import assert from "node:assert/strict";
import {
  aggregateByDomain,
  aggregateByYear,
  countActiveFilters,
  filterPolicies,
  getIndexStats,
} from "../src/policy-engine.js";

const policies = [
  {
    id: "alpha-2024",
    title: "Alpha Digital Policy",
    short_name: "Alpha",
    domains: ["National digital strategy", "AI & emerging tech"],
    type: "Policy",
    issuing_body: "Ministry A",
    status: "In force",
    date_enacted: "2024-06-01",
    summary: "Creates a national artificial intelligence strategy.",
    key_provisions: ["Strategy"],
    affects: ["Government"],
    verification: "Verified",
    last_verified: "2026-07-24",
  },
  {
    id: "beta-2022",
    title: "Beta Payments Rules",
    short_name: "Beta",
    domains: ["Fintech & digital payments"],
    type: "Rules",
    issuing_body: "Regulator B",
    status: "Draft",
    date_enacted: "2022-01-05",
    summary: "Sets requirements for payment providers.",
    key_provisions: ["Licensing"],
    affects: ["Payment providers"],
    verification: "Unverified",
    last_verified: "2026-07-25",
  },
];

test("filters across query, domain, status, body, and year", () => {
  assert.deepEqual(
    filterPolicies(policies, {
      query: "artificial strategy",
      domain: "AI & emerging tech",
      status: "In force",
      issuingBody: "Ministry A",
      year: "2024",
      sort: "newest",
    }).map(({ id }) => id),
    ["alpha-2024"],
  );
});

test("sorts newest, oldest, and title", () => {
  assert.deepEqual(
    filterPolicies(policies, { sort: "newest" }).map(({ id }) => id),
    ["alpha-2024", "beta-2022"],
  );
  assert.deepEqual(
    filterPolicies(policies, { sort: "oldest" }).map(({ id }) => id),
    ["beta-2022", "alpha-2024"],
  );
  assert.deepEqual(
    filterPolicies([...policies].reverse(), { sort: "title" }).map(({ id }) => id),
    ["alpha-2024", "beta-2022"],
  );
});

test("aggregates domains and years without double counting records within a domain", () => {
  const domains = aggregateByDomain(policies);
  assert.equal(
    domains.find(({ domain }) => domain === "National digital strategy").count,
    1,
  );
  assert.deepEqual(aggregateByYear(policies), [
    { year: "2022", count: 1 },
    { year: "2024", count: 1 },
  ]);
});

test("calculates index metrics and active filters", () => {
  assert.deepEqual(getIndexStats(policies), {
    total: 2,
    verified: 1,
    domains: 3,
    issuingBodies: 2,
    latestVerification: "2026-07-25",
  });
  assert.equal(countActiveFilters({ query: "AI", domain: "", year: "2024" }), 2);
});
