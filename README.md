# PakTechPolicy

A public, source-first directory of Pakistan technology policy. Version 1 is a
static dashboard with client-side search, faceted filters, a timeline, and
policy detail views.

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

## Project structure

- `data/policies.json` — reviewed source of truth
- `docs/content-schema.md` — frozen v1 data contract and taxonomy
- `research/` — packet outputs and sourcing notes
- `src/` — static application source
- `tests/` — data and interaction tests
- `tools/` — build and verification scripts

