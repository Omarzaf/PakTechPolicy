import { spawn } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const discoveryDir = resolve(root, "research/discovery");
const proposalsDir = resolve(discoveryDir, "proposals");
const auditsDir = resolve(discoveryDir, "audits");
const statePath = resolve(discoveryDir, "state.json");
const frontierPath = resolve(discoveryDir, "frontier.json");
const decisionsPath = resolve(discoveryDir, "decisions.json");
const backlogPath = resolve(discoveryDir, "BACKLOG.md");
const policiesPath = resolve(root, "data/policies.json");

const LANES = ["instruments", "datasets", "plain-language", "context"];
const KINDS = [
  "new-record",
  "record-update",
  "dataset-integration",
  "ui-feature",
  "explainer",
  "controversy-note",
];
const VALUE = { high: 3, medium: 2, low: 1 };
const CONFIDENCE = { high: 3, medium: 2, low: 1 };
const EFFORT = { S: 1, M: 2, L: 3 };
const DECISIONS = ["proposed", "accepted", "rejected", "done"];

const insideRoot = (path) => path === root || path.startsWith(`${root}${sep}`);
const readJson = async (path, fallback) => {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT" && fallback !== undefined) return fallback;
    throw error;
  }
};
const writeJson = (path, value) =>
  writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ""));
const isSlug = (value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value ?? ""));
const today = () => new Date().toISOString().slice(0, 10);
const daysBetween = (from, to) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
const flag = (name, fallback = null) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
};

const score = (proposal) => {
  const value = VALUE[proposal.everyday_person_value] ?? 1;
  const confidence = CONFIDENCE[proposal.confidence] ?? 1;
  const effort = EFFORT[proposal.effort] ?? 3;
  const official = (proposal.evidence ?? []).some((item) => item.official) ? 1.25 : 1;
  return Math.round(((value * confidence * official) / effort) * 100) / 100;
};

const loadProposalFiles = async () => {
  let names = [];
  try {
    names = (await readdir(proposalsDir)).filter((name) => name.endsWith(".json")).sort();
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const files = [];
  for (const name of names) {
    files.push({ name, ...(await readJson(resolve(proposalsDir, name))) });
  }
  return files;
};

const allProposals = async () => {
  const files = await loadProposalFiles();
  return files.flatMap((file) =>
    (file.proposals ?? []).map((proposal) => ({
      ...proposal,
      lane: proposal.lane ?? file.lane,
      source_file: file.name,
      iteration: file.iteration,
    })),
  );
};

/* ---------------------------------------------------------------- plan --- */

const plan = async () => {
  const [state, frontier, policies, decisions, proposals] = await Promise.all([
    readJson(statePath),
    readJson(frontierPath),
    readJson(policiesPath),
    readJson(decisionsPath, {}),
    allProposals(),
  ]);

  const requested = flag("--lane");
  if (requested && !LANES.includes(requested)) {
    throw new Error(`Unknown lane ${requested}. Use one of: ${LANES.join(", ")}`);
  }
  const rotation = state.lane_rotation ?? LANES;
  const lastIndex = rotation.indexOf(state.last_lane);
  const lane = requested ?? rotation[(lastIndex + 1) % rotation.length];
  const iteration = (state.iteration ?? 0) + 1;
  const laneState = state.explored?.[lane] ?? { targets_done: [], queries: [] };
  const laneFrontier = frontier.lanes[lane];
  const recheckAfter = laneFrontier.recheck_after_days ?? 30;

  const done = new Map(
    (laneState.targets_done ?? []).map((entry) =>
      typeof entry === "string" ? [entry, null] : [entry.id, entry.at],
    ),
  );
  const staleness = (target) => {
    if (!done.has(target.id)) return { state: "unexplored", age: null };
    const at = done.get(target.id);
    if (!at) return { state: "explored", age: null };
    const age = daysBetween(at, today());
    return { state: age >= recheckAfter ? "due-recheck" : "explored", age };
  };

  const ranked = laneFrontier.targets
    .map((target) => ({ ...target, ...staleness(target) }))
    .filter((target) => target.state !== "explored");

  const laneProposals = proposals.filter((proposal) => proposal.lane === lane);
  const open = laneProposals.filter(
    (proposal) => (decisions[proposal.id]?.status ?? "proposed") === "proposed",
  );

  const unverified = policies
    .filter((policy) => policy.verification === "Unverified")
    .map((policy) => policy.id);

  const lines = [];
  lines.push(`ITERATION ${iteration} — lane: ${lane}`);
  lines.push("");
  lines.push(`Objective: ${laneFrontier.objective}`);
  lines.push(`Why it matters: ${laneFrontier.makes_dashboard}`);
  lines.push("");
  lines.push(`## Targets to work (recheck window ${recheckAfter}d)`);
  if (ranked.length === 0) {
    lines.push(
      "  (frontier exhausted for this lane — find new targets and append them to frontier.json)",
    );
  }
  for (const target of ranked.slice(0, 6)) {
    const marker = target.state === "due-recheck" ? `recheck, ${target.age}d old` : "new";
    lines.push(`  - [${target.id}] ${target.label} (${marker})`);
    if (target.url) lines.push(`      ${target.url}`);
  }
  lines.push("");
  lines.push(`## Already-run queries in this lane (${laneState.queries?.length ?? 0}) — do not repeat`);
  for (const query of (laneState.queries ?? []).slice(-15)) lines.push(`  - ${query}`);
  lines.push("");
  lines.push(`## Dedupe context`);
  lines.push(`  ${policies.length} records already in data/policies.json.`);
  lines.push(`  Run: node tools/discovery.mjs known --grep <term>   to test any candidate.`);
  lines.push(`  ${unverified.length} records still Unverified: ${unverified.join(", ")}`);
  lines.push(
    `  ${open.length} open proposals in this lane: ${open.map((p) => p.id).join(", ") || "none"}`,
  );
  lines.push("");
  lines.push(`## Write findings to`);
  lines.push(
    `  research/discovery/proposals/${String(iteration).padStart(3, "0")}-${lane}.json`,
  );
  lines.push("");
  lines.push(`## Then`);
  lines.push(
    `  node tools/discovery.mjs check --file research/discovery/proposals/${String(iteration).padStart(3, "0")}-${lane}.json`,
  );
  lines.push(
    `  node tools/discovery.mjs ingest research/discovery/proposals/${String(iteration).padStart(3, "0")}-${lane}.json`,
  );
  console.log(lines.join("\n"));
};

/* --------------------------------------------------------------- known --- */

const known = async () => {
  const policies = await readJson(policiesPath);
  const term = flag("--grep");
  if (!term) throw new Error("known requires --grep <term>");
  const needle = term.toLowerCase();
  const hits = policies.filter((policy) =>
    [policy.id, policy.title, policy.short_name, policy.issuing_body]
      .join(" ")
      .toLowerCase()
      .includes(needle),
  );
  if (hits.length === 0) {
    console.log(`NO_MATCH "${term}" — not currently in the directory`);
    return;
  }
  for (const hit of hits) {
    console.log(
      `${hit.id}\t${hit.status}/${hit.verification}\tlast_verified=${hit.last_verified}\t${hit.title}`,
    );
  }
};

/* --------------------------------------------------------------- check --- */

const checkUrl = (url) =>
  new Promise((complete) => {
    const started = Date.now();
    const child = spawn("curl", [
      "-L",
      "-sS",
      "-o",
      "/dev/null",
      "--max-time",
      "25",
      "-A",
      "Mozilla/5.0 (compatible; PakTechPolicy-discovery/1.0)",
      "-w",
      "%{http_code}\t%{content_type}\t%{url_effective}\t%{size_download}",
      url,
    ]);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("close", (exitCode) => {
      const [statusValue, contentType = "", finalUrl = "", sizeValue = "0"] = stdout
        .trim()
        .split("\t");
      const httpCode = Number.parseInt(statusValue, 10) || 0;
      const sizeBytes = Number.parseInt(sizeValue, 10) || 0;
      const supportedContent =
        /^(application\/pdf|text\/html|application\/json|text\/csv|application\/octet-stream|binary\/octet-stream|application\/msword|application\/vnd\.(openxmlformats|ms-excel))/i.test(
          contentType,
        );
      const authenticationRedirect =
        /(?:\/|[?&])(login|sign-?in|auth)(?:\/|[?&#=]|$)/i.test(finalUrl);
      complete({
        url,
        final_url: finalUrl || null,
        http_code: httpCode,
        content_type: contentType || null,
        size_bytes: sizeBytes,
        reachable:
          httpCode >= 200 &&
          httpCode < 300 &&
          supportedContent &&
          !authenticationRedirect &&
          sizeBytes >= 512,
        elapsed_ms: Date.now() - started,
        exit_code: exitCode,
        error: stderr.trim() || null,
      });
    });
  });

const check = async () => {
  const filePath = flag("--file");
  let urls = process.argv.slice(3).filter((argument) => /^https?:\/\//i.test(argument));
  let label = "adhoc";
  if (filePath) {
    const path = resolve(root, filePath);
    if (!insideRoot(path)) throw new Error("--file must stay inside the project");
    const packet = await readJson(path);
    label = filePath.split("/").pop().replace(/\.json$/, "");
    urls = [
      ...new Set(
        (packet.proposals ?? []).flatMap((proposal) =>
          (proposal.evidence ?? []).map((item) => item.url),
        ),
      ),
    ];
  }
  if (urls.length === 0) throw new Error("check needs --file <packet> or one or more URLs");

  const results = [];
  const concurrency = 6;
  for (let index = 0; index < urls.length; index += concurrency) {
    results.push(...(await Promise.all(urls.slice(index, index + concurrency).map(checkUrl))));
  }
  const reachable = results.filter((result) => result.reachable).length;

  await mkdir(auditsDir, { recursive: true });
  await writeJson(resolve(auditsDir, `${label}-link-audit.json`), {
    checked_at: new Date().toISOString(),
    url_count: results.length,
    reachable_count: reachable,
    results,
  });

  for (const result of results) {
    console.log(
      `${result.reachable ? "OK  " : "FAIL"} ${result.http_code} ${result.content_type ?? "-"} ${result.url}`,
    );
  }
  console.log(`DISCOVERY_LINKS urls=${results.length} reachable=${reachable}`);
  if (reachable !== results.length) process.exitCode = 1;
};

/* -------------------------------------------------------------- ingest --- */

const validate = (packet, { policyIds, knownProposalIds }) => {
  const failures = [];
  const require = (condition, message) => {
    if (!condition) failures.push(message);
  };

  require(Number.isInteger(packet.iteration) && packet.iteration > 0, "iteration must be a positive integer");
  require(LANES.includes(packet.lane), `lane must be one of ${LANES.join(", ")}`);
  require(isIsoDate(packet.explored_on), "explored_on must be YYYY-MM-DD");
  require(Array.isArray(packet.queries) && packet.queries.length > 0, "queries must be a non-empty array");
  require(Array.isArray(packet.targets_explored), "targets_explored must be an array");
  require(Array.isArray(packet.dead_ends), "dead_ends must be an array");
  require(Array.isArray(packet.proposals), "proposals must be an array");

  const seen = new Set();
  for (const [index, proposal] of (packet.proposals ?? []).entries()) {
    const label = proposal.id || `proposal ${index + 1}`;
    require(isSlug(proposal.id), `${label}: id must be a lowercase slug`);
    require(!knownProposalIds.has(proposal.id), `${label}: id already used in an earlier iteration`);
    require(!seen.has(proposal.id), `${label}: duplicate id inside this packet`);
    seen.add(proposal.id);
    require(String(proposal.title ?? "").trim().length > 0, `${label}: title is empty`);
    require(KINDS.includes(proposal.kind), `${label}: kind must be one of ${KINDS.join(", ")}`);
    require(!proposal.lane || LANES.includes(proposal.lane), `${label}: invalid lane`);
    require(Array.isArray(proposal.targets), `${label}: targets must be an array`);
    for (const target of proposal.targets ?? []) {
      require(policyIds.has(target), `${label}: targets unknown record id ${target}`);
    }
    require(String(proposal.what ?? "").trim().length >= 40, `${label}: what is too short`);
    require(
      String(proposal.why_it_helps ?? "").trim().length >= 40,
      `${label}: why_it_helps is too short`,
    );
    require(
      proposal.everyday_person_value in VALUE,
      `${label}: everyday_person_value must be high|medium|low`,
    );
    require(proposal.confidence in CONFIDENCE, `${label}: confidence must be high|medium|low`);
    require(proposal.effort in EFFORT, `${label}: effort must be S|M|L`);
    require(
      String(proposal.implementation_sketch ?? "").trim().length >= 20,
      `${label}: implementation_sketch is too short`,
    );
    require(
      Array.isArray(proposal.evidence) && proposal.evidence.length > 0,
      `${label}: evidence must be a non-empty array`,
    );
    for (const item of proposal.evidence ?? []) {
      require(/^https:\/\/.+/i.test(item?.url ?? ""), `${label}: evidence needs an HTTPS url`);
      require(String(item?.title ?? "").trim().length > 0, `${label}: evidence needs a title`);
      require(
        String(item?.publisher ?? "").trim().length > 0,
        `${label}: evidence needs a publisher`,
      );
      require(isIsoDate(item?.accessed), `${label}: evidence needs accessed YYYY-MM-DD`);
      require(typeof item?.official === "boolean", `${label}: evidence needs official true/false`);
    }
    if (proposal.kind === "new-record" || proposal.kind === "record-update") {
      require(
        (proposal.evidence ?? []).some((item) => item.official),
        `${label}: ${proposal.kind} requires at least one official source`,
      );
    }
  }
  return failures;
};

const ingest = async () => {
  const filePath = process.argv[3];
  if (!filePath) throw new Error("ingest requires a packet path");
  const path = resolve(root, filePath);
  if (!insideRoot(path)) throw new Error("packet path must stay inside the project");

  const [packet, state, policies, existing] = await Promise.all([
    readJson(path),
    readJson(statePath),
    readJson(policiesPath),
    allProposals(),
  ]);

  const knownProposalIds = new Set([
    ...(state.proposal_ids ?? []),
    ...existing.filter((p) => p.source_file !== filePath.split("/").pop()).map((p) => p.id),
  ]);
  const failures = validate(packet, {
    policyIds: new Set(policies.map((policy) => policy.id)),
    knownProposalIds,
  });
  if (failures.length) {
    console.error(failures.join("\n"));
    process.exitCode = 1;
    return;
  }

  const laneState = state.explored[packet.lane] ?? { targets_done: [], queries: [] };
  const doneById = new Map(
    (laneState.targets_done ?? []).map((entry) =>
      typeof entry === "string" ? [entry, { id: entry, at: packet.explored_on }] : [entry.id, entry],
    ),
  );
  for (const targetId of packet.targets_explored ?? []) {
    doneById.set(targetId, { id: targetId, at: packet.explored_on });
  }
  laneState.targets_done = [...doneById.values()];
  laneState.queries = [...new Set([...(laneState.queries ?? []), ...packet.queries])];
  state.explored[packet.lane] = laneState;

  state.iteration = Math.max(state.iteration ?? 0, packet.iteration);
  state.last_lane = packet.lane;
  state.seen_urls = [
    ...new Set([
      ...(state.seen_urls ?? []),
      ...packet.proposals.flatMap((proposal) =>
        (proposal.evidence ?? []).map((item) => item.url),
      ),
    ]),
  ];
  state.proposal_ids = [
    ...new Set([...(state.proposal_ids ?? []), ...packet.proposals.map((p) => p.id)]),
  ];

  await writeJson(statePath, state);
  await renderBacklog();
  console.log(
    `DISCOVERY_INGEST iteration=${packet.iteration} lane=${packet.lane} proposals=${packet.proposals.length} targets=${packet.targets_explored.length} total_open=${state.proposal_ids.length}`,
  );
};

/* -------------------------------------------------------------- review --- */

const review = async (status) => {
  const id = process.argv[3];
  if (!id) throw new Error(`${status} requires a proposal id`);
  const proposals = await allProposals();
  if (!proposals.some((proposal) => proposal.id === id)) {
    throw new Error(`No proposal with id ${id}`);
  }
  const decisions = await readJson(decisionsPath, {});
  decisions[id] = { status, at: today(), note: flag("--note") ?? null };
  await writeJson(decisionsPath, decisions);
  await renderBacklog();
  console.log(`DISCOVERY_REVIEW ${id} -> ${status}`);
};

/* ------------------------------------------------------------- backlog --- */

const renderBacklog = async () => {
  const [proposals, decisions, state] = await Promise.all([
    allProposals(),
    readJson(decisionsPath, {}),
    readJson(statePath),
  ]);

  const enriched = proposals
    .map((proposal) => ({
      ...proposal,
      score: score(proposal),
      status: decisions[proposal.id]?.status ?? "proposed",
      note: decisions[proposal.id]?.note ?? null,
    }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  const open = enriched.filter((proposal) => proposal.status === "proposed");
  const lines = [];
  lines.push("# Discovery backlog");
  lines.push("");
  lines.push(
    "Generated by `node tools/discovery.mjs backlog`. Do not edit by hand — edit the packets in `proposals/` or record a decision with `accept` / `reject`.",
  );
  lines.push("");
  lines.push(
    `Iterations run: ${state.iteration ?? 0} · proposals: ${enriched.length} · open: ${open.length} · accepted: ${
      enriched.filter((p) => p.status === "accepted").length
    } · done: ${enriched.filter((p) => p.status === "done").length}`,
  );
  lines.push("");
  lines.push(
    "Score = (everyday-person value × confidence × official-source bonus) ÷ effort. It ranks what to build next; it is not a quality judgement.",
  );
  lines.push("");

  const table = (rows) => {
    const out = ["| Score | Lane | Kind | Effort | Proposal |", "|---:|---|---|:-:|---|"];
    for (const row of rows) {
      out.push(
        `| ${row.score.toFixed(2)} | ${row.lane} | ${row.kind} | ${row.effort} | **${row.id}** — ${row.title} |`,
      );
    }
    return out;
  };

  for (const [heading, status] of [
    ["Open", "proposed"],
    ["Accepted — ready to build", "accepted"],
    ["Done", "done"],
    ["Rejected", "rejected"],
  ]) {
    const rows = enriched.filter((proposal) => proposal.status === status);
    if (rows.length === 0) continue;
    lines.push(`## ${heading} (${rows.length})`);
    lines.push("");
    lines.push(...table(rows));
    lines.push("");
  }

  if (open.length) {
    lines.push("## Detail — open proposals");
    lines.push("");
    for (const proposal of open) {
      lines.push(`### ${proposal.id} — ${proposal.title}`);
      lines.push("");
      lines.push(
        `\`${proposal.kind}\` · lane \`${proposal.lane}\` · score ${proposal.score.toFixed(2)} · effort ${proposal.effort} · confidence ${proposal.confidence} · everyday value ${proposal.everyday_person_value} · from iteration ${proposal.iteration}`,
      );
      lines.push("");
      if (proposal.targets?.length) {
        lines.push(`Affects: ${proposal.targets.map((t) => `\`${t}\``).join(", ")}`);
        lines.push("");
      }
      lines.push(`**What.** ${proposal.what}`);
      lines.push("");
      lines.push(`**Why it helps.** ${proposal.why_it_helps}`);
      lines.push("");
      lines.push(`**How to build it.** ${proposal.implementation_sketch}`);
      lines.push("");
      if (proposal.risks) {
        lines.push(`**Risks.** ${proposal.risks}`);
        lines.push("");
      }
      lines.push("**Evidence.**");
      lines.push("");
      for (const item of proposal.evidence ?? []) {
        lines.push(
          `- [${item.title}](${item.url}) — ${item.publisher}${item.official ? " (official)" : ""}, accessed ${item.accessed}`,
        );
      }
      lines.push("");
    }
  }

  await writeFile(backlogPath, `${lines.join("\n")}\n`, "utf8");
  return enriched;
};

/* --------------------------------------------------------------- stats --- */

const stats = async () => {
  const [state, frontier, proposals, decisions] = await Promise.all([
    readJson(statePath),
    readJson(frontierPath),
    allProposals(),
    readJson(decisionsPath, {}),
  ]);
  console.log(`iterations=${state.iteration ?? 0} last_lane=${state.last_lane ?? "none"}`);
  for (const lane of LANES) {
    const total = frontier.lanes[lane].targets.length;
    const done = (state.explored[lane]?.targets_done ?? []).length;
    const laneProposals = proposals.filter((proposal) => proposal.lane === lane);
    console.log(
      `  ${lane.padEnd(15)} frontier ${String(done).padStart(2)}/${total}  queries ${String(
        (state.explored[lane]?.queries ?? []).length,
      ).padStart(3)}  proposals ${laneProposals.length}`,
    );
  }
  const byStatus = {};
  for (const proposal of proposals) {
    const status = decisions[proposal.id]?.status ?? "proposed";
    byStatus[status] = (byStatus[status] ?? 0) + 1;
  }
  console.log(
    `proposals total=${proposals.length} ${DECISIONS.map((s) => `${s}=${byStatus[s] ?? 0}`).join(" ")}`,
  );
};

/* ---------------------------------------------------------------- main --- */

const commands = {
  plan,
  known,
  check,
  ingest,
  stats,
  backlog: async () => {
    const enriched = await renderBacklog();
    console.log(`DISCOVERY_BACKLOG proposals=${enriched.length} -> research/discovery/BACKLOG.md`);
  },
  accept: () => review("accepted"),
  reject: () => review("rejected"),
  done: () => review("done"),
};

const command = process.argv[2];
if (!command || !(command in commands)) {
  console.error(`Usage: node tools/discovery.mjs <${Object.keys(commands).join("|")}>`);
  process.exitCode = 1;
} else {
  await mkdir(proposalsDir, { recursive: true });
  await commands[command]();
}
