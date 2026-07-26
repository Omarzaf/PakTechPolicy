# PakTechPolicy

A public, source-first directory of Pakistan technology policy. Version 1 is a
static dashboard with client-side search, faceted filters, a timeline, and
policy detail views. Accepted official datasets add an “On the ground” layer
without presenting correlation as proof that a policy caused an outcome. A
second-page Official Sources Hub consolidates reviewed Pakistani and
international institutional resources for technology governance and metrics.

The 2026-07-26 release contains 51 instruments across 12 domains. Forty-one
records link to official sources that passed the final source audit; ten are
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
pnpm verify
pnpm check:official-sources
pnpm dev
```

The build is dependency-free and writes the public site to `dist/`.

Local preview: `http://127.0.0.1:4173/`

Public deployment uses the verified `dist/` artifact through GitHub Pages. See
`docs/deployment.md`; source, research, and agent files are never deployed.

## Discovery loop

A continuous research loop crawls official sources, datasets, and civil-society
analysis for material that would make the directory more complete, more nuanced,
and easier for a non-lawyer to read. It queues findings for review and never
edits the dataset or the site itself.

```bash
/loop /discover
```

Findings land in `research/discovery/BACKLOG.md`. See
`research/discovery/README.md` for the lanes, the review commands, and how the
loop avoids repeating itself.

## Project structure

- `data/policies.json` — reviewed policy source of truth
- `data/policy-indicators.json` — accepted quantitative series and provenance
- `data/official-sources.json` — reviewed Official Sources Hub directory
- `docs/content-schema.md` — frozen v1 data contract and taxonomy
- `docs/indicator-methodology.md` — confidence and comparability rubric
- `docs/official-sources-schema.md` — Official Sources Hub data contract
- `docs/data-quality.md` — snapshot quality, caveats, and verification evidence
- `research/` — packet outputs and sourcing notes
- `research/discovery/` — the ongoing discovery loop: frontier, state, backlog
- `src/` — static application source
- `tests/` — data and interaction tests
- `tools/` — build and verification scripts
