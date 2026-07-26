import test from "node:test";
import assert from "node:assert/strict";
import {
  assertIndicatorDataset,
  collectIndicatorDatasetFailures,
} from "../tools/indicator-contract.mjs";

const validDataset = () => ({
  version: 1,
  as_of: "2026-07-25",
  indicators: [
    {
      id: "example-series",
      title: "Example series",
      policy_ids: ["example-policy"],
      summary: "A compact example used to exercise the release contract.",
      cadence: "Annual",
      lag: "Six months",
      confidence: "high",
      latest_period: "2025",
      methodology_note: "The publisher reports one observation per year.",
      risks: "Association with a policy date does not establish causation.",
      sources: [
        {
          title: "Example source",
          publisher: "Example publisher",
          url: "https://example.com/data.json",
          accessed: "2026-07-25",
          locator: "JSON API, value field",
        },
      ],
      groups: [
        {
          id: "total",
          label: "Total",
          unit: "transactions",
          format: "integer",
          comparison_allowed: true,
          series: [
            {
              id: "all",
              label: "All transactions",
              observations: [
                {
                  period: "2024",
                  label: "2024",
                  value: 10,
                  provisional: false,
                  revised: false,
                },
                {
                  period: "2025",
                  label: "2025",
                  value: 12,
                  provisional: true,
                  revised: false,
                  note: "Provisional",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
});

test("accepts a sourced indicator dataset with known policy targets", () => {
  assert.doesNotThrow(() =>
    assertIndicatorDataset(validDataset(), new Set(["example-policy"])),
  );
});

test("rejects unknown targets, unsafe sources, and unsorted observations", () => {
  const dataset = validDataset();
  dataset.indicators[0].sources[0].url = "http://example.com/data.json";
  dataset.indicators[0].groups[0].series[0].observations.reverse();
  dataset.indicators[0].groups[0].series[0].observations[0].revised = true;

  const failures = collectIndicatorDatasetFailures(
    dataset,
    new Set(["different-policy"]),
  );

  assert.ok(failures.some((failure) => failure.includes("unknown policy id")));
  assert.ok(failures.some((failure) => failure.includes("valid HTTPS")));
  assert.ok(failures.some((failure) => failure.includes("strictly ascending")));
  assert.ok(failures.some((failure) => failure.includes("both provisional and revised")));
});
