import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const researchDir = resolve(root, "research");
const outputFile = resolve(root, "data", "policies.json");
const decisionsFile = resolve(researchDir, "consolidation-decisions.json");
const packetNames = (await readdir(researchDir))
  .filter((name) => /^packet-[a-d]\.json$/.test(name))
  .toSorted();

if (packetNames.length !== 4) {
  throw new Error(`Expected four research packets; found ${packetNames.length}`);
}

const decisions = JSON.parse(await readFile(decisionsFile, "utf8"));
const unique = (values) => [...new Set(values.filter(Boolean))];
const candidates = new Map();

for (const packetName of packetNames) {
  const packet = JSON.parse(await readFile(resolve(researchDir, packetName), "utf8"));
  if (!Array.isArray(packet)) throw new TypeError(`${packetName} must contain an array`);
  for (const record of packet) {
    candidates.set(record.id, [
      ...(candidates.get(record.id) ?? []),
      { packet: packetName, record },
    ]);
  }
}

const policies = [];
for (const [id, entries] of candidates) {
  const decision = decisions[id];
  if (entries.length > 1 && !decision) {
    throw new Error(
      `${id} appears in ${entries.map(({ packet }) => packet).join(", ")} without a consolidation decision`,
    );
  }
  if (decision && !String(decision.reason ?? "").trim()) {
    throw new Error(`${id}: consolidation decision requires a reason`);
  }

  const preferred =
    entries.find(({ packet }) => packet === decision?.prefer_packet) ?? entries[0];
  if (decision?.prefer_packet && preferred.packet !== decision.prefer_packet) {
    throw new Error(`${id}: preferred packet ${decision.prefer_packet} does not contain the record`);
  }

  const records = entries.map(({ record }) => record);
  const merged = {
    ...preferred.record,
    domains: unique(records.flatMap(({ domains = [] }) => domains)),
    key_provisions: unique(records.flatMap(({ key_provisions = [] }) => key_provisions)),
    affects: unique(records.flatMap(({ affects = [] }) => affects)),
    related: unique(records.flatMap(({ related = [] }) => related)),
    secondary_sources: unique(
      records.flatMap(({ secondary_sources = [] }) => secondary_sources),
    ),
    ...(decision?.patch ?? {}),
  };
  policies.push(merged);
}

policies.sort(
  (a, b) =>
    String(b.date_enacted).localeCompare(String(a.date_enacted)) ||
    a.title.localeCompare(b.title),
);

await writeFile(outputFile, `${JSON.stringify(policies, null, 2)}\n`, "utf8");
console.log(
  `Consolidated ${policies.length} unique records from ${packetNames.join(", ")} with ${
    Object.keys(decisions).length
  } documented decisions`,
);
