import test from "node:test";
import assert from "node:assert/strict";
import { decodePolicyIdHash, formatPolicyDate } from "../src/ui-utils.js";

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
