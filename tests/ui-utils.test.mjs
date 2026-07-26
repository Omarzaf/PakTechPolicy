import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  decodePolicyIdHash,
  formatIndicatorValue,
  formatPolicyDate,
  getLatestObservation,
  getSparklinePoints,
  isIndicatorPayload,
} from "../src/ui-utils.js";

const indicatorPayload = JSON.parse(
  await readFile(new URL("../data/policy-indicators.json", import.meta.url), "utf8"),
);

test("formats valid policy dates and rejects hostile or impossible values", () => {
  assert.equal(formatPolicyDate("2025-01-29"), "29 Jan 2025");
  assert.equal(formatPolicyDate("2023-05-01", { precision: "month" }), "May 2023");
  assert.equal(formatPolicyDate("2023-01-01", { precision: "year" }), "2023");
  assert.equal(formatPolicyDate('"><img src=x onerror=alert(1)>'), "Date unavailable");
  assert.equal(formatPolicyDate("not-a-date"), "Date unavailable");
  assert.equal(formatPolicyDate("2025-02-31"), "Date unavailable");
});

test("decodes valid policy hashes without throwing on malformed input", () => {
  assert.equal(decodePolicyIdHash("#policy=peca-2016"), "peca-2016");
  assert.equal(decodePolicyIdHash("#policy=%E0%A4%A"), null);
  assert.equal(decodePolicyIdHash("#directory"), null);
  assert.equal(decodePolicyIdHash("#policy=<script>"), null);
});

test("formats indicator values for their documented units", () => {
  assert.equal(formatIndicatorValue(1234.6, "integer"), "1,235");
  assert.equal(formatIndicatorValue(12.345, "decimal"), "12.35");
  assert.equal(formatIndicatorValue(57.2, "percent"), "57.2%");
  assert.equal(formatIndicatorValue(1250000, "usd"), "US$1,250,000");
  assert.equal(formatIndicatorValue(42.5, "pkr-billion"), "PKR 42.5 bn");
  assert.equal(formatIndicatorValue("not a number", "decimal"), "Not available");
});

test("returns the last usable observation as the current observation", () => {
  const observations = [
    { period: "Q1", value: 4 },
    { period: "Q2", value: null },
    { period: "Q3", value: 6, provisional: true },
  ];
  assert.deepEqual(getLatestObservation(observations), observations[2]);
  assert.equal(getLatestObservation([{ period: "Q1", value: null }]), null);
  assert.equal(getLatestObservation(null), null);
});

test("generates bounded sparkline points for varied, flat, and empty data", () => {
  assert.deepEqual(getSparklinePoints([]), []);
  assert.deepEqual(getSparklinePoints(null), []);

  const points = getSparklinePoints(
    [{ value: 2 }, { value: 6 }],
    { width: 100, height: 40, padding: 5 },
  );
  assert.deepEqual(points, [
    { value: 2, x: 5, y: 35 },
    { value: 6, x: 95, y: 5 },
  ]);

  const flatPoints = getSparklinePoints([{ value: 3 }, { value: 3 }]);
  assert.equal(flatPoints.length, 2);
  assert.ok(flatPoints.every((point) => point.y === 36));

  const sharedScalePoints = getSparklinePoints([{ value: 50 }, { value: 75 }], {
    width: 100,
    height: 40,
    padding: 5,
    minValue: 0,
    maxValue: 100,
  });
  assert.deepEqual(sharedScalePoints, [
    { value: 50, x: 5, y: 20 },
    { value: 75, x: 95, y: 12.5 },
  ]);
});

test("accepts the released indicator payload and rejects unsafe runtime data", () => {
  assert.equal(isIndicatorPayload(indicatorPayload), true);
  assert.equal(isIndicatorPayload(null), false);

  const unsafePayload = structuredClone(indicatorPayload);
  unsafePayload.indicators[0].sources[0].url = "javascript:alert(1)";
  assert.equal(isIndicatorPayload(unsafePayload), false);

  const conflictedPayload = structuredClone(indicatorPayload);
  const observation = conflictedPayload.indicators[0].groups[0].series[0].observations[0];
  observation.provisional = true;
  observation.revised = true;
  assert.equal(isIndicatorPayload(conflictedPayload), false);
});
