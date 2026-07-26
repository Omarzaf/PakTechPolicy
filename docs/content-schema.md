# Version 1 content contract

The `data/policies.json` file is an array of records with this shape:

```json
{
  "id": "peca-2016",
  "title": "Prevention of Electronic Crimes Act, 2016",
  "short_name": "PECA",
  "domains": ["Cybercrime & online speech"],
  "type": "Act",
  "issuing_body": "Parliament of Pakistan",
  "status": "In force",
  "date_enacted": "2016-08-18",
  "date_precision": "day",
  "last_amended": null,
  "last_amended_precision": null,
  "summary": "A neutral, plain-language summary.",
  "key_provisions": ["A concise provision."],
  "affects": ["Citizens", "Platforms"],
  "related": [],
  "primary_source_url": "https://example.gov.pk/document.pdf",
  "secondary_sources": [],
  "controversy": null,
  "last_verified": "2026-07-25",
  "verification": "Verified"
}
```

## Controlled values

`domains` uses one or more of:

1. Cybercrime & online speech
2. Data protection & privacy
3. Telecom regulation
4. Internet governance & access
5. National digital strategy
6. Cybersecurity
7. Cloud & data localisation
8. AI & emerging tech
9. Fintech & digital payments
10. IT industry & exports
11. E-commerce
12. Access to information

`type` uses `Act`, `Bill`, `Ordinance`, `Rules`, `Policy`, `Regulation`,
`Directive`, `Framework`, or `Guideline`.

`status` uses `In force`, `Draft`, `Proposed`, `Amended`, `Repealed`, `Lapsed`,
or `Unverified`.

`verification` uses `Verified` or `Unverified`. A record is `Verified` only
when its official primary source was opened and checked during research.

`date_precision` uses `day`, `month`, or `year` and controls how
`date_enacted` is displayed. `last_amended_precision` uses the same values and
must be `null` when `last_amended` is `null`. ISO dates retain sortable machine
values without implying precision that the source does not establish.

## Research rules

- Prefer official government, regulator, central-bank, or parliamentary pages.
- Use the instrument's publication, assent, notification, or introduction date.
- If only the year is known, use `YYYY-01-01` and explain the precision issue in
  the packet sourcing note.
- Keep summaries descriptive and avoid legal conclusions.
- Do not infer current legal effect from an old source. Use `Unverified` where
  current status cannot be established.
- `verification_note` may record a current source or status problem when the
  public explanation is necessary; it must be non-empty text when present.
- Never invent a missing URL, provision, date, relationship, or status.

## Policy indicator contract

Accepted quantitative evidence lives separately in
`data/policy-indicators.json`. The top-level object has `version`, `as_of`, and
an `indicators` array. Each indicator:

- targets one or more existing policy ids;
- records cadence, publication lag, latest period, confidence, methodology,
  and interpretation risks;
- cites at least one official HTTPS source with an access date and exact
  locator such as an API path or PDF table and page;
- groups only observations that share a unit and display format;
- marks every observation as provisional, revised, or neither; and
- sets `comparison_allowed` to `false` when definitions changed enough that a
  connecting trend line would mislead.

The release contract rejects unknown policy ids, unsafe source URLs, duplicate
or unsorted periods, unsupported units, and nonnumeric values. The UI always
labels these measurements as contextual evidence rather than causal effects.
The confidence rubric and comparison rules are documented in
`docs/indicator-methodology.md`.

## Official source directory

The dedicated Official Sources Hub reads `data/official-sources.json`. Each
record identifies the exact official publisher, Pakistan or international
scope, resource type, controlled topics, Pakistan coverage, stated cadence,
latest period, access modes, direct HTTPS URL, last-checked date, access status,
and a public limitation.

The full contract is documented in `docs/official-sources-schema.md`. Release
validation also requires matching evidence in
`research/official-sources-link-audit.json`; an automated-check limitation is
published as `Limited`, never silently treated as reachable.
