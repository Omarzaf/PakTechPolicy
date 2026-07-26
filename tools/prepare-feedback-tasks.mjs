import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ACCEPTANCE_LABEL = "accepted-for-improvement";
export const APPROVAL_LABEL = "skillopt-approved";
export const TASK_FORMAT = "skillopt_sleep.tasks.v1";
export const TARGET_SKILL_PATH =
  ".agents/skills/maintain-pak-tech-policy/SKILL.md";

const ISSUE_URL_PATTERN =
  /^https:\/\/github\.com\/Omarzaf\/PakTechPolicy\/issues\/(\d+)$/i;
const MAX_FIELD_LENGTH = 2_000;
const FIELD_ALIASES = new Map([
  ["affected page or record", "Affected page or record"],
  ["affected page / record", "Affected page or record"],
  ["feedback type", "Feedback type"],
  ["what did you observe", "Observation"],
  ["observation", "Observation"],
  ["proposed improvement", "Proposed improvement"],
  ["evidence url", "Evidence URL"],
  ["evidence link", "Evidence URL"],
  ["accessibility context", "Accessibility context"],
]);

function compactWhitespace(value) {
  return String(value ?? "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function sanitizeText(value, maxLength = MAX_FIELD_LENGTH) {
  return compactWhitespace(value)
    .replace(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      "[redacted email]",
    )
    .replace(
      /(?:\+?\d[\s().-]*)?(?:\d[\s().-]*){7,}\d/g,
      "[redacted phone]",
    )
    .replace(/(^|\s)@[A-Z0-9_-]+/gi, "$1[redacted handle]")
    .slice(0, maxLength);
}

function normalizedLabels(issue) {
  if (!Array.isArray(issue.labels)) return [];
  return issue.labels
    .map((label) => (typeof label === "string" ? label : label?.name))
    .filter(Boolean)
    .map((label) => String(label).trim().toLowerCase());
}

function parseIssueFields(body) {
  const fields = new Map();
  const pattern = /^###\s+(.+?)\s*\n([\s\S]*?)(?=^###\s+|\s*$)/gm;

  for (const match of String(body ?? "").matchAll(pattern)) {
    const key = match[1].trim().toLowerCase();
    const canonical = FIELD_ALIASES.get(key);
    if (!canonical) continue;
    const value = sanitizeText(match[2]);
    if (value && value !== "_No response_") fields.set(canonical, value);
  }

  return fields;
}

function assertApprovedIssue(issue) {
  if (!Number.isInteger(issue.number) || issue.number <= 0) {
    throw new TypeError("approved feedback issues need a positive integer number");
  }
  const urlMatch = String(issue.html_url ?? "").match(ISSUE_URL_PATTERN);
  if (!urlMatch || Number(urlMatch[1]) !== issue.number) {
    throw new TypeError(
      `issue ${issue.number}: html_url must be a matching Omarzaf/PakTechPolicy issue URL`,
    );
  }
  if (issue.pull_request) {
    throw new TypeError(`issue ${issue.number}: pull requests are not feedback issues`);
  }
  if (!sanitizeText(issue.title, 240)) {
    throw new TypeError(`issue ${issue.number}: title is required`);
  }
}

function issueToTask(issue, split) {
  const fields = parseIssueFields(issue.body);
  const title = sanitizeText(issue.title, 240);
  const type = fields.get("Feedback type") ?? "Approved public feedback";
  const contextLines = [
    `Issue: ${title}`,
    `Issue URL: ${issue.html_url}`,
    ...[...fields].map(([label, value]) => `${label}: ${value}`),
  ];

  return {
    id: `github-issue-${issue.number}`,
    project: "PakTechPolicy",
    intent: `Evaluate approved ${type.toLowerCase()} and prepare a verified, bounded improvement for PakTechPolicy.`,
    context_excerpt: contextLines.join("\n").slice(0, 8_000),
    system: "",
    attempted_solution: "",
    outcome: "unknown",
    reference_kind: "rubric",
    reference:
      "Identify the affected artifact, validate factual claims against primary or official evidence, preserve uncertainty, propose a bounded change with a regression check, and never auto-apply or publish the result.",
    judge: {},
    tags: [
      "public-feedback",
      ACCEPTANCE_LABEL,
      APPROVAL_LABEL,
      sanitizeText(type, 80)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "feedback",
    ],
    source_sessions: [`github-issue-${issue.number}`],
    split,
    origin: "real",
    derived_from: "",
  };
}

export function buildTasksPayload(input) {
  const issues = Array.isArray(input) ? input : input?.issues;
  if (!Array.isArray(issues)) {
    throw new TypeError("input must be an issue array or an object with an issues array");
  }

  const approved = issues
    .filter((issue) => {
      const labels = normalizedLabels(issue);
      return labels.includes(ACCEPTANCE_LABEL) && labels.includes(APPROVAL_LABEL);
    })
    .sort((left, right) => left.number - right.number);

  if (!approved.length) {
    throw new Error(
      `no issues carry both required labels: ${ACCEPTANCE_LABEL} and ${APPROVAL_LABEL}`,
    );
  }

  const numbers = new Set();
  for (const issue of approved) {
    assertApprovedIssue(issue);
    if (numbers.has(issue.number)) {
      throw new Error(`duplicate approved issue number ${issue.number}`);
    }
    numbers.add(issue.number);
  }

  return {
    format: TASK_FORMAT,
    project: "PakTechPolicy",
    transcript_source: "maintainer-approved GitHub issue export",
    n_sessions: approved.length,
    target_skill_path: TARGET_SKILL_PATH,
    reviewed: false,
    review_instructions:
      "Inspect and sanitize every task, verify evidence links, and set reviewed=true manually before any real SkillOpt backend run.",
    tasks: approved.map((issue, index) =>
      issueToTask(issue, approved.length > 1 && index === approved.length - 1 ? "val" : "train"),
    ),
  };
}

function parseArguments(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (!flag.startsWith("--")) throw new Error(`unexpected argument: ${flag}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value`);
    args.set(flag, value);
    index += 1;
  }
  if (!args.has("--input") || !args.has("--output")) {
    throw new Error(
      "usage: node tools/prepare-feedback-tasks.mjs --input <issues.json> --output <tasks.json>",
    );
  }
  return args;
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  const inputPath = resolve(args.get("--input"));
  const outputPath = resolve(args.get("--output"));
  const input = JSON.parse(await readFile(inputPath, "utf8"));
  const payload = buildTasksPayload(input);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(
    `Prepared ${payload.tasks.length} reviewed-candidate tasks at ${outputPath}; reviewed=false`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
