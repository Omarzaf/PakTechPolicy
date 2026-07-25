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
```

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
