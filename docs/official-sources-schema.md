# Official sources schema

`data/official-sources.json` is the reviewed source of truth for the public
Official Sources Hub. It is deliberately separate from policy records and
indicator observations.

The top-level object contains:

- `version`: schema version, currently `1`
- `as_of`: date every published link was last checked
- `scope_note`: explicit statement that the directory is curated, not exhaustive
- `sources`: reviewed source records

Every source records:

- a stable slug `id`, exact resource `title`, and official `publisher`;
- whether the publisher is Pakistani or international;
- resource type, controlled topics, access modes, and direct HTTPS URL;
- what the resource covers and how Pakistan appears in it;
- stated cadence and latest available period, without inventing either;
- last-checked date and access status; and
- a visible limitation or comparability warning.

The release validator rejects duplicate ids or URLs, unsupported topics,
non-HTTPS links, missing provenance fields, and malformed dates. A separate
link audit records reachability; reachability alone does not establish that the
resource is complete, current, comparable, or methodologically suitable.
