# Contributing

Thank you for helping make the Pakistan Technology Policy Index more accurate,
legible, and useful. Contributions are reviewed for evidence quality,
accessibility, privacy, and consistency with the project's visible-uncertainty
contract.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Before you start

- Use the structured [data-correction form](https://github.com/Omarzaf/PakTechPolicy/issues/new?template=data-correction.yml)
  for a policy, indicator, or source error.
- Use the [product-feedback form](https://github.com/Omarzaf/PakTechPolicy/issues/new?template=product-feedback.yml)
  for interface, accessibility, or workflow ideas.
- Open an issue before a substantial schema, taxonomy, visual-system, or
  methodology change.
- Report security issues privately under [SECURITY.md](SECURITY.md).

GitHub issues and pull requests are public. Do not include sensitive or
personally identifying information.

## Evidence standards

A proposed policy correction should:

1. identify the stable record ID and affected field;
2. link to an official primary source whenever one is available;
3. distinguish publication date, effective date, amendment date, and reference
   period;
4. preserve uncertainty when current legal status is unresolved; and
5. update provenance or audit evidence rather than silently changing a claim.

An accessible URL is not, by itself, evidence that an instrument is current.
Secondary sources can help locate primary evidence but should not replace it
without an explicit documented reason.

Indicator changes must preserve units, denominators, reference periods,
revision status, definition breaks, and the rule that association does not
establish causation.

## Local setup

Use Node.js 24 and the pnpm version pinned in `package.json`.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm test
pnpm verify
pnpm build
```

The two network source audits are deliberate, separate checks:

```bash
pnpm check:sources
pnpm check:official-sources
```

## Make a focused change

1. Create a branch from the current default branch.
2. Keep generated output and unrelated formatting out of the change.
3. Add or update tests for behavior, data contracts, and regressions.
4. For interface work, test keyboard navigation, focus visibility, reduced
   motion, responsive layouts, readable text, and meaningful labels.
5. Run the release commands and inspect the built `dist/` artifact.
6. Open a pull request using the repository template.

Do not modify a verification label, legal status, source date, or indicator
series without documenting the evidence behind it.

## Pull-request expectations

A reviewable pull request explains:

- the reader-facing problem and the chosen fix;
- affected records, routes, or components;
- primary evidence and any remaining uncertainty;
- exact commands run and their results;
- accessibility and privacy impact;
- screenshots for visible changes; and
- release-note wording when public behavior or data changes.

Maintainers may request a narrower change, stronger primary evidence, or an
explicit limitation before merging.

## Feedback and AI-assisted improvement

Feedback first needs the evidence-checked `accepted-for-improvement` decision.
A maintainer must then deliberately add the separate `skillopt-approved` label
before it can be exported into the project's SkillOpt review workflow. Exported
text is sanitized and reviewed by a human. Generated proposals never apply
themselves; they return through normal pull-request, verification, and release
review. See [docs/feedback-loop.md](docs/feedback-loop.md).

## Contribution licensing

Unless you explicitly state otherwise, code contributions you submit are
licensed under MIT, and original data or documentation contributions are
licensed under CC BY 4.0, consistent with this repository's license files.
Do not contribute material you do not have the right to share.
