# PakTechPolicy

A public, source-first directory of Pakistan technology policy. Version 1 is a
static dashboard with client-side search, faceted filters, a timeline, and
policy detail views.

The 2026-07-25 snapshot contains 51 instruments across 12 domains. Forty-two
records link to official sources that passed the final source audit; nine are
visibly marked `Unverified`.

## Editorial contract

- Every published record links to an official primary source.
- Neutral summaries describe the instrument; they do not provide legal advice.
- Records that cannot be verified are visibly marked `Unverified`.
- `last_verified` records when the source and metadata were last reviewed.

## Local commands

```bash
pnpm build
pnpm test
pnpm dev
pnpm check:sources   # network audit of primary sources -> research/source-link-audit.json
pnpm verify          # offline release gate against the committed audit
```

Some official hosts return HTTP 403 bot challenges to scripted checks while
serving the document to a browser. Those hosts are listed, with the statuses,
a rationale, the browser-confirmation date and the exact record ids, in
`research/access-protection-allowlist.json`. The source audit still records
such URLs as `reachable: false`, adding `access_protected: true`; the release
gate accepts a `Verified` record in that state only when its host, status and
record id are all allowlisted. Any other failure still fails the release.

The build is dependency-free and writes the public site to `dist/`.

Local preview: `http://127.0.0.1:4173/`

## Project structure

- `data/policies.json` — reviewed source of truth
- `docs/content-schema.md` — frozen v1 data contract and taxonomy
- `docs/data-quality.md` — snapshot quality, caveats, and verification evidence
- `research/` — packet outputs and sourcing notes
- `src/` — static application source
- `tests/` — data and interaction tests
- `tools/` — build and verification scripts
