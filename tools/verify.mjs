import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { DOMAIN_TAXONOMY } from "../src/policy-engine.js";
import { collectIndicatorDatasetFailures } from "./indicator-contract.mjs";
import { assertV1RecordCount } from "./release-contract.mjs";

const root = resolve(import.meta.dirname, "..");
const fileFlagIndex = process.argv.indexOf("--file");
const requestedFile =
  fileFlagIndex >= 0 ? process.argv[fileFlagIndex + 1] : "data/policies.json";
if (!requestedFile) throw new Error("--file requires a path");
const dataPath = resolve(root, requestedFile);
if (dataPath !== root && !dataPath.startsWith(`${root}${sep}`)) {
  throw new Error("--file must stay inside the project");
}
const policies = JSON.parse(await readFile(dataPath, "utf8"));
const releaseMode = process.argv.includes("--release");
const required = [
  "id",
  "title",
  "short_name",
  "domains",
  "type",
  "issuing_body",
  "status",
  "date_enacted",
  "last_amended",
  "summary",
  "key_provisions",
  "affects",
  "related",
  "primary_source_url",
  "secondary_sources",
  "controversy",
  "last_verified",
  "verification",
];
if (releaseMode) required.push("date_precision", "last_amended_precision");
const allowedStatus = new Set([
  "In force",
  "Draft",
  "Proposed",
  "Amended",
  "Repealed",
  "Lapsed",
  "Unverified",
]);
const allowedType = new Set([
  "Act",
  "Bill",
  "Ordinance",
  "Rules",
  "Policy",
  "Regulation",
  "Directive",
  "Framework",
  "Guideline",
]);
const allowedPrecision = new Set(["day", "month", "year"]);
const ids = new Set();
const failures = [];
let indicatorCount = 0;
const isIsoDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ""))) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
};

for (const [index, policy] of policies.entries()) {
  const label = policy.id || `record ${index + 1}`;
  for (const key of required) {
    if (!(key in policy)) failures.push(`${label}: missing ${key}`);
  }
  if (ids.has(policy.id)) failures.push(`${label}: duplicate id`);
  ids.add(policy.id);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(policy.id ?? "")) {
    failures.push(`${label}: id must be a lowercase slug`);
  }
  if (!Array.isArray(policy.domains) || policy.domains.length === 0) {
    failures.push(`${label}: domains must be a non-empty array`);
  }
  for (const domain of policy.domains ?? []) {
    if (!DOMAIN_TAXONOMY.includes(domain)) failures.push(`${label}: invalid domain ${domain}`);
  }
  if (!allowedStatus.has(policy.status)) failures.push(`${label}: invalid status`);
  if (!allowedType.has(policy.type)) failures.push(`${label}: invalid type`);
  if (!["Verified", "Unverified"].includes(policy.verification)) {
    failures.push(`${label}: invalid verification`);
  }
  if (
    policy.verification === "Unverified" &&
    !["Unverified", "Draft", "Proposed", "Lapsed", "Repealed"].includes(policy.status)
  ) {
    failures.push(`${label}: unverified record cannot assert status ${policy.status}`);
  }
  if (
    policy.verification === "Verified" &&
    !/^https:\/\/.+/i.test(policy.primary_source_url)
  ) {
    failures.push(`${label}: verified record needs an HTTPS primary source`);
  }
  if (!isIsoDate(policy.date_enacted)) {
    failures.push(`${label}: date_enacted must be YYYY-MM-DD`);
  }
  if ("date_precision" in policy || releaseMode) {
    if (!allowedPrecision.has(policy.date_precision)) {
      failures.push(`${label}: invalid date_precision`);
    }
    if (policy.date_precision === "month" && !String(policy.date_enacted).endsWith("-01")) {
      failures.push(`${label}: month-precision date must use day 01`);
    }
    if (policy.date_precision === "year" && !String(policy.date_enacted).endsWith("-01-01")) {
      failures.push(`${label}: year-precision date must use month/day 01-01`);
    }
  }
  if (!isIsoDate(policy.last_verified)) {
    failures.push(`${label}: last_verified must be YYYY-MM-DD`);
  }
  if (!Array.isArray(policy.key_provisions) || policy.key_provisions.length === 0) {
    failures.push(`${label}: key_provisions must be a non-empty array`);
  }
  if (!Array.isArray(policy.affects) || policy.affects.length === 0) {
    failures.push(`${label}: affects must be a non-empty array`);
  }
  for (const key of ["related", "secondary_sources"]) {
    if (!Array.isArray(policy[key])) failures.push(`${label}: ${key} must be an array`);
  }
  if (
    policy.last_amended !== null &&
    !isIsoDate(policy.last_amended)
  ) {
    failures.push(`${label}: last_amended must be null or YYYY-MM-DD`);
  }
  if ("last_amended_precision" in policy || releaseMode) {
    if (policy.last_amended === null && policy.last_amended_precision !== null) {
      failures.push(`${label}: last_amended_precision must be null without a date`);
    }
    if (
      policy.last_amended !== null &&
      !allowedPrecision.has(policy.last_amended_precision)
    ) {
      failures.push(`${label}: invalid last_amended_precision`);
    }
    if (
      policy.last_amended_precision === "month" &&
      !String(policy.last_amended).endsWith("-01")
    ) {
      failures.push(`${label}: month-precision amendment must use day 01`);
    }
    if (
      policy.last_amended_precision === "year" &&
      !String(policy.last_amended).endsWith("-01-01")
    ) {
      failures.push(`${label}: year-precision amendment must use month/day 01-01`);
    }
  }
  if (policy.controversy !== null && typeof policy.controversy !== "string") {
    failures.push(`${label}: controversy must be null or a string`);
  }
  if (!String(policy.title ?? "").trim()) failures.push(`${label}: title is empty`);
  if (!String(policy.short_name ?? "").trim()) failures.push(`${label}: short_name is empty`);
  if (!String(policy.issuing_body ?? "").trim()) {
    failures.push(`${label}: issuing_body is empty`);
  }
  try {
    const source = new URL(policy.primary_source_url);
    if (source.protocol !== "https:") throw new Error("not HTTPS");
  } catch {
    failures.push(`${label}: primary_source_url must be a valid HTTPS URL`);
  }
  for (const sourceUrl of policy.secondary_sources ?? []) {
    try {
      const source = new URL(sourceUrl);
      if (source.protocol !== "https:") throw new Error("not HTTPS");
    } catch {
      failures.push(`${label}: invalid secondary source URL`);
    }
  }
  if (String(policy.summary ?? "").trim().length < 60) {
    failures.push(`${label}: summary is too short`);
  }
}

for (const policy of policies) {
  for (const relatedId of policy.related ?? []) {
    if (!ids.has(relatedId)) failures.push(`${policy.id}: unknown related id ${relatedId}`);
  }
}

if (releaseMode) {
  try {
    assertV1RecordCount(policies);
  } catch (error) {
    failures.push(error.message);
  }

  // Enforce the "Verified = reachable source" contract offline. Reachability is
  // measured by tools/check-sources.mjs and frozen in the committed audit; the
  // release gate does not hit the network, but it does refuse to ship a Verified
  // record unless matching, reachable evidence exists for its current URL. This
  // catches a record flipped to Verified, or a URL changed, without re-auditing.
  const auditPath = resolve(root, "research", "source-link-audit.json");
  try {
    const audit = JSON.parse(await readFile(auditPath, "utf8"));
    const evidenceById = new Map((audit.results ?? []).map((result) => [result.id, result]));
    for (const policy of policies) {
      if (policy.verification !== "Verified") continue;
      const evidence = evidenceById.get(policy.id);
      if (!evidence) {
        failures.push(`${policy.id}: no source-audit evidence for a Verified record`);
      } else if (evidence.url !== policy.primary_source_url) {
        failures.push(`${policy.id}: source-audit URL is stale; re-run check:sources`);
      } else if (!evidence.reachable) {
        failures.push(
          `${policy.id}: Verified record failed the source audit (HTTP ${evidence.http_code})`,
        );
      }
    }
  } catch (error) {
    failures.push(`source audit unavailable: ${error.message}`);
  }

  try {
    const indicatorData = JSON.parse(
      await readFile(resolve(root, "data", "policy-indicators.json"), "utf8"),
    );
    indicatorCount = indicatorData.indicators?.length ?? 0;
    failures.push(
      ...collectIndicatorDatasetFailures(
        indicatorData,
        new Set(policies.map((policy) => policy.id)),
      ),
    );
  } catch (error) {
    failures.push(`indicator dataset could not be read: ${error.message}`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `VERIFY_DATA=PASS records=${policies.length} verified=${policies.filter(
      (policy) => policy.verification === "Verified",
    ).length}${releaseMode ? ` indicators=${indicatorCount}` : ""}`,
  );
}
