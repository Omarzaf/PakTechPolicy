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
- Never invent a missing URL, provision, date, relationship, or status.
