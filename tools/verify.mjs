import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { DOMAIN_TAXONOMY } from "../src/policy-engine.js";

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
  "summary",
  "key_provisions",
  "affects",
  "related",
  "primary_source_url",
  "secondary_sources",
  "last_verified",
  "verification",
];
const allowedStatus = new Set([
  "In force",
  "Draft",
  "Proposed",
  "Amended",
  "Repealed",
  "Lapsed",
  "Unverified",
]);
const ids = new Set();
const failures = [];

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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(policy.date_enacted)) {
    failures.push(`${label}: date_enacted must be YYYY-MM-DD`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(policy.last_verified)) {
    failures.push(`${label}: last_verified must be YYYY-MM-DD`);
  }
  if (!Array.isArray(policy.key_provisions) || policy.key_provisions.length === 0) {
    failures.push(`${label}: key_provisions must be a non-empty array`);
  }
  if (!Array.isArray(policy.affects) || policy.affects.length === 0) {
    failures.push(`${label}: affects must be a non-empty array`);
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

if (releaseMode && (policies.length < 40 || policies.length > 60)) {
  failures.push(`v1 release requires 40–60 records; found ${policies.length}`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `VERIFY_DATA=PASS records=${policies.length} verified=${policies.filter(
      (policy) => policy.verification === "Verified",
    ).length}`,
  );
}
