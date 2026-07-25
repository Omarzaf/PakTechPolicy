import test from "node:test";
import assert from "node:assert/strict";
import { assertV1RecordCount } from "../tools/release-contract.mjs";

test("rejects empty and undersized v1 releases", () => {
  assert.throws(() => assertV1RecordCount([]), /40–60/);
  assert.throws(() => assertV1RecordCount(Array(39).fill({})), /40–60/);
});

test("accepts the documented v1 range and rejects oversized releases", () => {
  assert.doesNotThrow(() => assertV1RecordCount(Array(40).fill({})));
  assert.doesNotThrow(() => assertV1RecordCount(Array(60).fill({})));
  assert.throws(() => assertV1RecordCount(Array(61).fill({})), /40–60/);
});
