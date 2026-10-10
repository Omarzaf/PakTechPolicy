import test from "node:test";
import assert from "node:assert/strict";
import { matchAccessProtection, verifiedEvidenceFailures } from "../tools/release-contract.mjs";

const allowlist = {
  hosts: [
    {
      host: "www.sbp.org.pk",
      statuses: [403],
      rationale: "Bot challenge for scripted clients; page opens in a browser.",
      confirmed_in_browser: "2026-10-10",
      record_ids: ["sbp-record"],
    },
  ],
};

const policy = (id, url, verification = "Verified") => ({
  id,
  verification,
  primary_source_url: url,
});
const evidence = (id, url, extra) => ({ id, url, http_code: 200, reachable: true, ...extra });
const audit = (...results) => ({ results });

const SBP = "https://www.sbp.org.pk/circulars/x";
const blocked = { reachable: false, http_code: 403, access_protected: true };

test("reachable Verified evidence passes", () => {
  assert.deepEqual(
    verifiedEvidenceFailures([policy("a", "https://a.gov.pk/x")], audit(evidence("a", "https://a.gov.pk/x")), allowlist),
    [],
  );
});

test("access-protected evidence passes when host, status and record are allowlisted", () => {
  assert.deepEqual(
    verifiedEvidenceFailures([policy("sbp-record", SBP)], audit(evidence("sbp-record", SBP, blocked)), allowlist),
    [],
  );
});

test("access-protected evidence fails for a record not listed in the allowlist entry", () => {
  const failures = verifiedEvidenceFailures(
    [policy("other", SBP)],
    audit(evidence("other", SBP, blocked)),
    allowlist,
  );
  assert.equal(failures.length, 1);
  assert.match(failures[0], /other: Verified record failed the source audit/);
});

test("access-protected flag on an unlisted host still fails", () => {
  const url = "https://www.commerce.gov.pk/x";
  const failures = verifiedEvidenceFailures([policy("c", url)], audit(evidence("c", url, blocked)), allowlist);
  assert.equal(failures.length, 1);
});

test("allowlisted host with a non-allowlisted status still fails", () => {
  const failures = verifiedEvidenceFailures(
    [policy("sbp-record", SBP)],
    audit(evidence("sbp-record", SBP, { reachable: false, http_code: 404, access_protected: true })),
    allowlist,
  );
  assert.equal(failures.length, 1);
});

test("unflagged failure on an allowlisted host still fails", () => {
  const failures = verifiedEvidenceFailures(
    [policy("sbp-record", SBP)],
    audit(evidence("sbp-record", SBP, { reachable: false, http_code: 403 })),
    allowlist,
  );
  assert.equal(failures.length, 1);
});

test("missing and stale evidence still fail; Unverified records are ignored", () => {
  const failures = verifiedEvidenceFailures(
    [policy("m", "https://m.gov.pk/"), policy("s", "https://s.gov.pk/new"), policy("u", "https://u/", "Unverified")],
    audit(evidence("s", "https://s.gov.pk/old")),
    allowlist,
  );
  assert.deepEqual(failures, [
    "m: no source-audit evidence for a Verified record",
    "s: source-audit URL is stale; re-run check:sources",
  ]);
});

test("matchAccessProtection only matches allowlisted host and status, never reachability", () => {
  const hit = matchAccessProtection(SBP, 403, allowlist);
  assert.equal(hit.host, "www.sbp.org.pk");
  assert.equal(matchAccessProtection(SBP, 404, allowlist), null);
  assert.equal(matchAccessProtection("https://sbp.org.pk/x", 403, allowlist), null);
  assert.equal(matchAccessProtection("not a url", 403, allowlist), null);
});
