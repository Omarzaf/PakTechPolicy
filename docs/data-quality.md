# Version 1 data quality

Snapshot date: 2026-07-26

## Dataset and grain

The release contains one record per policy instrument, identified by a stable
`id`. Research produced 56 candidate records across four domain packets.
Consolidation resolved five duplicate instruments into 51 unique records.

| Measure | Result |
|---|---:|
| Unique policy instruments | 51 |
| Verified records with reachable official sources | 41 (80.4%) |
| Unverified records | 10 (19.6%) |
| Policy domains represented | 12 |
| Issuing bodies represented | 21 |
| Duplicate instruments resolved | 5 |
| Quantitative indicator families | 6 |
| Official Sources Hub resources | 30 |
| Hub links reachable by automated audit | 25 |
| Hub links manually opened but automation-limited | 5 |

`Verified` means the official primary URL was opened during research and passed
the final automated source audit. It does not mean that no later amendment,
judgment, notification, or implementation change exists.

## Checks performed

- Required fields, controlled enums, ISO dates, HTTPS source URLs, and arrays
- Explicit day/month/year precision so placeholder ISO values do not display as
  unsupported exact dates
- Unique stable IDs and valid `related` record references
- 40–60 record release-size contract
- Cross-packet duplicate detection and documented preferred-record decisions
- Primary-source HTTP status, final destination, content type, response size,
  and authentication-redirect rejection (network audit, run on demand via
  `check:sources`)
- Release-gate cross-check (offline): every `Verified` record must have matching,
  reachable evidence for its current URL in `research/source-link-audit.json`, so
  a record cannot ship as `Verified` after its URL changes without re-auditing
- Conservative status/verification alignment
- Search, filtering, sorting, aggregation, malformed-hash, date-safety, and
  release-gate tests
- Static build equivalence between source and published datasets
- Indicator schema, policy relationships, units, ordering, provisional/revised
  flags, source URLs, and comparability breaks
- Official Sources Hub schema, controlled topics, duplicate URLs, access modes,
  last-checked dates, limitations, and committed reachability evidence

Reproducible evidence lives in:

- `research/source-link-audit.json`
- `research/discovery/audits/002-datasets-link-audit.json`
- `research/official-sources-link-audit.json`
- `research/consolidation-report.json`
- `research/consolidation-decisions.json`
- `research/packet-*-notes.md`

## Findings and remediation

### High confidence: all currently Verified primary sources passed

All 41 records labeled `Verified` returned an acceptable official document or
instrument page in the final source audit. This removes the highest-risk failure
mode: presenting an inaccessible source as checked.

### Medium confidence: ten instruments remain deliberately Unverified

Ten records have inaccessible primary documents or unresolved current status.
They remain in the directory for research discoverability but use both
`verification: Unverified` and `status: Unverified`. Their summaries avoid
claiming current legal effect.

Affected records:

- `personal-data-protection-bill-2023`
- `sindh-transparency-rti-act-2016`
- `removal-blocking-online-content-rules-2021`
- `public-private-right-of-way-policy-directive-2020`
- `removal-blocking-online-content-rules-2020`
- `citizens-protection-online-harm-rules-2020`
- `ecommerce-policy-pakistan-2019`
- `broadband-quality-of-service-regulations-2014`
- `punjab-transparency-rti-act-2013`
- `pakistan-telecommunication-rules-2000`

The remediation is narrow: locate a working official instrument URL and
reconfirm current status before changing either field to a more definitive
value.

### Medium confidence: source freshness is a snapshot, not continuous monitoring

Version 1 has no automated ingestion or legal-change monitor. `last_verified`
captures the review date, and the visible interface calls the data a curated
snapshot. A future refresh should rerun source auditing and recheck status
against official catalogs before publication.

### Official Sources Hub: reachable does not mean comparable

The Hub contains 30 curated official resources checked on 26 July 2026. Twenty-five
returned acceptable content to the automated audit. Five opened during web
review but returned HTTP 403 or 404 to the automated checker; those cards are
visibly marked `Limited` and explain the automated-check limitation.

The Hub is not a completeness claim. Each card records what the source covers,
its Pakistan relevance, stated cadence, latest period, access mode, and a
limitation. Links do not become dashboard metrics until their measures,
reference periods, units, revisions, and methodology are separately reviewed.

## Intended use

The dataset is suitable for source discovery, policy-landscape exploration, and
research triage. It is not a substitute for the official instrument, a complete
legal history, or legal advice.
