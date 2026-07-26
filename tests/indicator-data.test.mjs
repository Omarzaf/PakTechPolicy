import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { assertIndicatorDataset } from "../tools/indicator-contract.mjs";

const indicatorDataset = JSON.parse(
  await readFile(new URL("../data/policy-indicators.json", import.meta.url), "utf8"),
);
const policies = JSON.parse(
  await readFile(new URL("../data/policies.json", import.meta.url), "utf8"),
);

const supportedFormats = new Set([
  "integer",
  "decimal",
  "percent",
  "usd",
  "pkr-billion",
]);

const expectedTargets = new Map([
  [
    "pta-broadband-subscribers-penetration-series",
    [
      "telecommunications-policy-2015",
      "national-broadband-policy-2021-draft",
      "universal-service-fund-amendment-rules-2023",
    ],
  ],
  [
    "pta-mobile-broadband-data-usage-series",
    ["telecommunications-policy-2015", "national-broadband-policy-2021-draft"],
  ],
  [
    "pta-unlawful-url-processing-blocking-snapshots",
    ["peca-2016", "removal-blocking-online-content-rules-2021", "peca-amendment-2025"],
  ],
  [
    "sbp-retail-payments-by-channel-series",
    [
      "payment-systems-electronic-fund-transfers-act-2007",
      "electronic-money-institutions-regulations-2019",
      "digital-banks-framework-2022",
    ],
  ],
  [
    "sbp-raast-volume-value-series",
    ["payment-systems-electronic-fund-transfers-act-2007", "digital-banks-framework-2022"],
  ],
  [
    "wdi-ict-service-exports-pakistan",
    ["software-development-export-strategy-2023-2027", "digital-pakistan-policy-2018"],
  ],
]);
const expectedConfidence = new Map([
  ["pta-broadband-subscribers-penetration-series", "medium"],
  ["pta-mobile-broadband-data-usage-series", "medium"],
  ["pta-unlawful-url-processing-blocking-snapshots", "low"],
  ["sbp-retail-payments-by-channel-series", "high"],
  ["sbp-raast-volume-value-series", "high"],
  ["wdi-ict-service-exports-pakistan", "low"],
]);

test("normalized indicator data is fully sourced, internally consistent, and policy-linked", () => {
  const knownPolicyIds = new Set(policies.map(({ id }) => id));
  assert.doesNotThrow(() => assertIndicatorDataset(indicatorDataset, knownPolicyIds));

  assert.equal(indicatorDataset.version, 1);
  assert.equal(indicatorDataset.as_of, "2026-07-25");
  assert.equal(indicatorDataset.indicators.length, 6);

  const ids = indicatorDataset.indicators.map(({ id }) => id);
  assert.equal(new Set(ids).size, 6, "indicator ids must be unique");
  assert.deepEqual(new Set(ids), new Set(expectedTargets.keys()));

  for (const indicator of indicatorDataset.indicators) {
    for (const field of [
      "id",
      "title",
      "summary",
      "cadence",
      "lag",
      "confidence",
      "latest_period",
      "methodology_note",
      "risks",
    ]) {
      assert.equal(typeof indicator[field], "string", `${indicator.id}: ${field}`);
      assert.ok(indicator[field].trim(), `${indicator.id}: ${field} must be non-empty`);
    }

    assert.deepEqual(indicator.policy_ids, expectedTargets.get(indicator.id));
    assert.equal(indicator.confidence, expectedConfidence.get(indicator.id));
    assert.ok(indicator.policy_ids.every((id) => knownPolicyIds.has(id)));
    assert.ok(Array.isArray(indicator.sources) && indicator.sources.length > 0);

    for (const source of indicator.sources) {
      assert.equal(source.accessed, "2026-07-25");
      assert.equal(new URL(source.url).protocol, "https:");
      for (const field of ["title", "publisher", "locator"]) {
        assert.equal(typeof source[field], "string");
        assert.ok(source[field].trim(), `${indicator.id}: source ${field}`);
      }
    }

    assert.ok(Array.isArray(indicator.groups) && indicator.groups.length > 0);
    for (const group of indicator.groups) {
      assert.ok(group.id && group.label && group.unit);
      assert.ok(supportedFormats.has(group.format));
      assert.equal(typeof group.comparison_allowed, "boolean");
      assert.ok(Array.isArray(group.series) && group.series.length > 0);

      for (const series of group.series) {
        assert.ok(series.id && series.label);
        assert.ok(Array.isArray(series.observations) && series.observations.length > 0);
        const periods = series.observations.map(({ period }) => period);
        assert.equal(new Set(periods).size, periods.length);
        assert.deepEqual(periods, [...periods].sort());

        for (const observation of series.observations) {
          assert.ok(observation.period && observation.label);
          assert.equal(typeof observation.value, "number");
          assert.ok(Number.isFinite(observation.value));
          assert.equal(typeof observation.provisional, "boolean");
          assert.equal(typeof observation.revised, "boolean");
          if ("note" in observation) assert.equal(typeof observation.note, "string");
        }
      }
    }
  }

  const blocking = indicatorDataset.indicators.find(
    ({ id }) => id === "pta-unlawful-url-processing-blocking-snapshots",
  );
  assert.ok(blocking);
  assert.ok(
    blocking.groups.every(({ comparison_allowed }) => comparison_allowed === false),
    "PTA processed-for-blocking and blocked snapshots must remain incomparable",
  );
});
