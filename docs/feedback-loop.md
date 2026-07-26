# Public feedback and improvement loop

Public feedback should make the index more accurate and usable without allowing
untrusted text, unsupported claims, or automated suggestions to bypass editorial
review.

## Lifecycle

```text
Public issue
  → evidence and privacy check
  → maintainer decision
  → accepted-for-improvement label
  → focused pull request
  → tests, source review, and human QA
  → merge and release note
  → released label
```

1. **Intake:** Readers use the structured data-correction or product-feedback
   form. Security and conduct reports use a private channel.
2. **Triage:** A maintainer checks scope, duplicates, sensitive information,
   reproducibility, and whether linked evidence is official and relevant.
3. **Decision:** The issue receives one of `needs-evidence`,
   `accepted-for-improvement`, or `declined`. Only a maintainer applies
   `accepted-for-improvement`.
4. **Implementation:** A focused branch and pull request preserve the issue link,
   evidence, uncertainty, verification results, accessibility review, and a
   reader-facing release note.
5. **Release:** After merge and public-artifact verification, the issue receives
   `released` and a link to the deployed change.

Labels describe workflow state; they do not establish that a factual claim is
correct.

## Evidence review

For data corrections, reviewers should:

- identify the exact record and field;
- open the official source and confirm publisher, document, and destination;
- separate publication, effective, amendment, and reference dates;
- check for superseding instruments or definition changes;
- preserve `Unverified` when evidence cannot support a stronger label; and
- update committed audit evidence when a verified URL or claim changes.

For product feedback, reviewers should reproduce the task on the affected route
and record the browser, viewport, input method, and assistive technology when
relevant. A proposal should solve the reported reader problem without obscuring
provenance or uncertainty.

## Human-reviewed SkillOpt handoff

SkillOpt is an optional proposal generator for improving the project-scoped
maintainer skill. It is not an issue bot and never edits the product from public
feedback.

An accepted issue does not enter SkillOpt by default. Only issues carrying both
`accepted-for-improvement` and the separate maintainer-only
`skillopt-approved` label may be included in a local export. Before the export
is used:

1. remove names, handles, contact details, tokens, private URLs, and unrelated
   issue discussion;
2. retain only the minimum observation, accepted evidence, desired outcome, and
   public issue reference needed to evaluate an improvement;
3. confirm the local input preserves the `skillopt-approved` label, then run the
   repository's deterministic converter:

   ```bash
   node tools/prepare-feedback-tasks.mjs \
     --input reviewed-feedback.json \
     --output /tmp/paktechpolicy-feedback-tasks.json
   ```

4. inspect the generated `skillopt_sleep.tasks.v1` file; it intentionally starts
   with `reviewed: false`;
5. set `reviewed: true` only after a human confirms the whole file is sanitized,
   accurate, and suitable for model processing; and
6. begin with a mock dry run against
   `.agents/skills/maintain-pak-tech-policy/SKILL.md`.

The SkillOpt runner is installed outside this repository. A maintainer supplies
its reviewed local path and invokes `dry-run --backend mock` first. A real run
requires a separate explicit decision. Any staged proposal must be read as an
untrusted draft, compared with baseline behavior, and returned through the same
pull-request and release gates.

The following are prohibited:

- exporting all public issues or comments automatically;
- treating labels, votes, or model scores as factual validation;
- sending unreviewed public text to an optimizer;
- auto-adopting a staged skill;
- letting a skill modify policy data, publish a release, or contact a reporter
  without explicit human action; and
- placing generated task files, feedback exports, or model artifacts in the
  public `dist/` artifact.

## Release record

Each accepted feedback change should leave a traceable chain:

- originating issue;
- supporting official evidence or reproducible product observation;
- pull request and verification results;
- commit or release identifier;
- public URL checked after deployment; and
- concise release note describing what changed and any remaining limitation.

This audit trail lets readers see how feedback influenced the index while
keeping editorial responsibility with the maintainer.
