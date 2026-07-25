import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { DOMAIN_TAXONOMY } from "../src/policy-engine.js";

const root = resolve(import.meta.dirname, "..");
const policies = JSON.parse(await readFile(resolve(root, "data/policies.json"), "utf8"));
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
}

for (const policy of policies) {
  for (const relatedId of policy.related ?? []) {
    if (!ids.has(relatedId)) failures.push(`${policy.id}: unknown related id ${relatedId}`);
  }
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
