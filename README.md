# Pakistan Technology Policy Index

A public, source-first directory for exploring Pakistan's technology-policy
landscape. The index combines policy instruments, contextual indicators, and a
curated Official Sources Hub without treating a reachable link as proof that a
law is current or that a policy caused an outcome.

**Public site:** [omarzaf.github.io/PakTechPolicy](https://omarzaf.github.io/PakTechPolicy/)

The 26 July 2026 snapshot contains 51 instruments across 12 domains. Forty-one
records link to official sources that passed the release audit; ten remain
visibly marked `Unverified`.

## What you can do

- Search and filter policies by domain, instrument type, status, verification,
  date, and issuing body.
- Inspect source-backed policy details and related contextual indicators.
- Browse 30 reviewed Pakistani and international official resources.
- See verification state, source limitations, date precision, and comparison
  caveats where they matter.
- Download the same machine-readable datasets used by the interface.

Read the public [methodology and limitations](https://omarzaf.github.io/PakTechPolicy/methodology.html)
or inspect the repository's [data-quality evidence](docs/data-quality.md).

## Editorial and trust contract

- Every `Verified` policy record links to an audited official primary source.
- Neutral summaries support discovery; they are not legal advice.
- Records without sufficient current evidence stay visibly `Unverified`.
- `last_verified` records when the source and metadata were last reviewed.
- Policy records, indicators, and source discovery remain separate evidence
  layers with separate checks.
- The index is a dated research snapshot, not continuous legal monitoring.

The project is independently maintained by Muhammad Umar Zafar as a
public-interest research resource. It is not affiliated with, sponsored by, or
endorsed by the institutions whose sources or marks appear here. No external
project funding or material conflict has been declared for this release.
Material future funding or conflicts should be disclosed in release notes.

There is no fixed update schedule. Corrections are reviewed against official
evidence and can be released between broader dated snapshots.

## Run locally

Requirements: Node.js 24 and the pnpm version pinned in `package.json`.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm build
pnpm dev
```

The local preview defaults to `http://127.0.0.1:4173/`. The dependency-free
build writes the public artifact to `dist/`.

## Verify a release

```bash
pnpm test
pnpm verify
pnpm build
pnpm check:sources
pnpm check:official-sources
```

The two source checks make outbound requests and should be run deliberately.
`pnpm verify` is the offline release gate. Before publication, serve the exact
`dist/` artifact and run `pnpm verify:site` plus desktop, mobile, keyboard, and
visual review. See [deployment documentation](docs/deployment.md).

## Report a correction or idea

- [Suggest a data correction](https://github.com/Omarzaf/PakTechPolicy/issues/new?template=data-correction.yml)
- [Share product or accessibility feedback](https://github.com/Omarzaf/PakTechPolicy/issues/new?template=product-feedback.yml)
- [Report a security vulnerability privately](https://github.com/Omarzaf/PakTechPolicy/security/advisories/new)

GitHub issues are public and require a GitHub account. Do not include private,
sensitive, or personally identifying information. A strong correction names
the affected page or record, explains the proposed change, and links to
official evidence.

Maintainers review feedback through an evidence check, an explicit
`accepted-for-improvement` decision, a pull request, verification, and a release
note. A separate maintainer-only `skillopt-approved` label is required before
sanitized feedback can be exported for AI-assisted workflow review. Public
feedback never changes the site automatically. The complete process is
documented in [docs/feedback-loop.md](docs/feedback-loop.md).

## Contribute

Start with [CONTRIBUTING.md](CONTRIBUTING.md) and the
[Code of Conduct](CODE_OF_CONDUCT.md). Small fixes are welcome. Substantial
changes should begin with an issue so evidence expectations and scope are clear.
Pull requests must preserve visible uncertainty, source provenance, keyboard
access, and public-artifact privacy.

## Project map

- `data/policies.json` — reviewed policy source of truth
- `data/policy-indicators.json` — accepted quantitative series and provenance
- `data/official-sources.json` — reviewed Official Sources Hub directory
- `docs/content-schema.md` — frozen v1 data contract and taxonomy
- `docs/indicator-methodology.md` — confidence and comparability rubric
- `docs/official-sources-schema.md` — Official Sources Hub data contract
- `docs/data-quality.md` — snapshot quality, caveats, and verification evidence
- `research/` — source packets, audit evidence, and discovery notes
- `src/` — static application source
- `tests/` — data, accessibility, and interaction contracts
- `tools/` — build, research, and verification scripts

The optional discovery loop queues official-source findings in
`research/discovery/BACKLOG.md`; it never edits the dataset or site
automatically. See [research/discovery/README.md](research/discovery/README.md).

## Privacy

The project sets no accounts, forms, cookies, analytics, advertising trackers,
or project-controlled server-side collection. GitHub Pages and external links
may process ordinary requests under their own infrastructure and privacy
practices.

## Licensing and attribution

- Source code is licensed under the [MIT License](LICENSE).
- Original data compilation and original documentation are licensed under
  [Creative Commons Attribution 4.0 International](LICENSE-DATA-DOCS.md).
- Official names, documents, logos, and other third-party marks remain the
  property of their respective owners. They are excluded from the project
  licenses, used for identification, and do not imply endorsement.

To cite the dataset, use [CITATION.cff](CITATION.cff). Because policy status and
source availability change, include the release date or commit used.
