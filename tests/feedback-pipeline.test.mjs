import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  ACCEPTANCE_LABEL,
  APPROVAL_LABEL,
  buildTasksPayload,
  sanitizeText,
  TARGET_SKILL_PATH,
  TASK_FORMAT,
} from "../tools/prepare-feedback-tasks.mjs";

const fixture = JSON.parse(
  await readFile(new URL("./fixtures/feedback-issues.json", import.meta.url), "utf8"),
);

test("exports only maintainer-approved issues with an explicit human-review gate", () => {
  const payload = buildTasksPayload(fixture);

  assert.equal(payload.format, TASK_FORMAT);
  assert.equal(payload.target_skill_path, TARGET_SKILL_PATH);
  assert.equal(payload.reviewed, false);
  assert.equal(payload.n_sessions, 2);
  assert.deepEqual(
    payload.tasks.map(({ id }) => id),
    ["github-issue-101", "github-issue-102"],
  );
  assert.deepEqual(
    payload.tasks.map(({ split }) => split),
    ["train", "val"],
  );
  assert.ok(payload.tasks.every(({ tags }) => tags.includes(APPROVAL_LABEL)));
  assert.ok(payload.tasks.every(({ tags }) => tags.includes(ACCEPTANCE_LABEL)));
});

test("redacts obvious contact details from untrusted issue text", () => {
  const payload = buildTasksPayload(fixture);
  const serialized = JSON.stringify(payload);

  assert.doesNotMatch(serialized, /researcher@example\.com/);
  assert.doesNotMatch(serialized, /202\D*555\D*0199/);
  assert.match(serialized, /\[redacted email\]/);
  assert.match(serialized, /\[redacted phone\]/);
  assert.equal(
    sanitizeText("Ask @maintainer via person@example.com"),
    "Ask [redacted handle] via [redacted email]",
  );
});

test("rejects approved entries that are not canonical repository issues", () => {
  const untrusted = {
    issues: [
      {
        number: 9,
        html_url: "https://example.com/issues/9",
        title: "External payload",
        labels: [ACCEPTANCE_LABEL, APPROVAL_LABEL],
      },
    ],
  };

  assert.throws(
    () => buildTasksPayload(untrusted),
    /Omarzaf\/PakTechPolicy issue URL/,
  );
});

test("refuses to produce a task file when no issue passed maintainer review", () => {
  assert.throws(
    () =>
      buildTasksPayload({
        issues: [
          {
            number: 1,
            html_url: "https://github.com/Omarzaf/PakTechPolicy/issues/1",
            title: "Pending",
            labels: ["product-feedback"],
          },
        ],
      }),
    /no issues carry both required labels/,
  );
});

test("requires acceptance as well as explicit SkillOpt approval", () => {
  assert.throws(
    () =>
      buildTasksPayload({
        issues: [
          {
            number: 2,
            html_url: "https://github.com/Omarzaf/PakTechPolicy/issues/2",
            title: "Only optimizer-approved",
            labels: [APPROVAL_LABEL],
          },
        ],
      }),
    /both required labels/,
  );
});
