export function assertV1RecordCount(policies) {
  if (!Array.isArray(policies)) {
    throw new TypeError("data/policies.json must contain an array");
  }
  if (policies.length < 40 || policies.length > 60) {
    throw new RangeError(`v1 release requires 40–60 policy records; found ${policies.length}`);
  }
}

// Access-protection allowlist (research/access-protection-allowlist.json):
// hosts that serve bot challenges to scripted clients but were opened and
// checked in a real browser. A match never makes a URL "reachable"; it only
// lets the release gate accept an explicitly flagged, browser-confirmed record.
export function matchAccessProtection(url, httpCode, allowlist) {
  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    return null;
  }
  return (
    (allowlist?.hosts ?? []).find(
      (entry) => entry.host === host && (entry.statuses ?? []).includes(httpCode),
    ) ?? null
  );
}

export function verifiedEvidenceFailures(policies, audit, allowlist) {
  const failures = [];
  const evidenceById = new Map((audit?.results ?? []).map((result) => [result.id, result]));
  for (const policy of policies) {
    if (policy.verification !== "Verified") continue;
    const evidence = evidenceById.get(policy.id);
    if (!evidence) {
      failures.push(`${policy.id}: no source-audit evidence for a Verified record`);
    } else if (evidence.url !== policy.primary_source_url) {
      failures.push(`${policy.id}: source-audit URL is stale; re-run check:sources`);
    } else if (!evidence.reachable) {
      const entry =
        evidence.access_protected === true
          ? matchAccessProtection(evidence.url, evidence.http_code, allowlist)
          : null;
      if (!entry || !(entry.record_ids ?? []).includes(policy.id)) {
        failures.push(
          `${policy.id}: Verified record failed the source audit (HTTP ${evidence.http_code})`,
        );
      }
    }
  }
  return failures;
}
