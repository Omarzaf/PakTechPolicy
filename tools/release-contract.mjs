export function assertV1RecordCount(policies) {
  if (!Array.isArray(policies)) {
    throw new TypeError("data/policies.json must contain an array");
  }
  if (policies.length < 40 || policies.length > 60) {
    throw new RangeError(`v1 release requires 40–60 policy records; found ${policies.length}`);
  }
}
