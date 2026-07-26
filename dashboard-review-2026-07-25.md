# PakTechPolicy Dashboard — Formation Review & Handoff

**Date:** 2026-07-25
**Reviewer:** Claude (Opus 4.8)
**Project reviewed:** `/Users/omar/Downloads/Claude/PakTechPolicy`
**Purpose:** Step-by-step review of how the dashboard was built, for the next agent to pick up. Findings are ranked; the top three are the ones worth fixing first.

---

## Status update (2026-07-26)

Resolved since the review (committed on `feat/pak-tech-policy-v1`):

- **#3 timeline sort bug** — FIXED (`de1345b`). Timeline forces chronological order; title sort resets on entering the view. Verified: broken year headers 10 → 0.
- **#6 source-audit not enforced at release** — FIXED (`70d829b`). `verify --release` now cross-checks the committed `source-link-audit.json` **offline**: a `Verified` record cannot ship unless matching, reachable evidence exists for its current URL. Proven to fail a stale URL. Docs updated to describe the two-tier model.
- **#2 validator asymmetry** — FIXED (`70d829b`). Month-precision `last_amended` now must use day `01`.
- **#5 no verification filter** — FIXED (`926553b`). Added a Verification facet (Source checked / Needs review) with URL sync, active-filter chip, and clear-all. Verified in-browser: 42 verified / 9 unverified / 51 total; deep-link `?verification=` restores correctly.

Still open: **#4** (no-JS degradation), **#1** (status/verification tangle), plus the nits and **#7** (not deployed). #1 and #4 are the invasive ones — get an explicit go-ahead before starting them. See "Suggested next-agent order of work" at the bottom.

---

## How this review was done (so the next agent can trust/redo it)

Ran the project's own tooling and cross-checked its claims against the data:

- `node --test` → **8/8 pass**
- `node tools/verify.mjs --release` → `VERIFY_DATA=PASS records=51 verified=42`
- `node tools/build.mjs` → builds 51 records to `dist/`
- `node tools/consolidate.mjs` → regenerated `data/policies.json` **byte-for-byte identical** to the committed version (pipeline is reproducible). This left `research/consolidation-report.json` with a fresher `generated_at` timestamp — **the user chose to leave that as-is**, so the working tree has that one modified file. Not a defect.
- Data integrity check: 51 records, 42 `verification:Verified` / 9 `Unverified`, `status:Unverified` also = 9 (1:1), 12 distinct domains, 21 issuing bodies, **no duplicate ids**, **no broken `related` refs**.
- Consolidation math: 4 packets = 56 candidates → 51 unique, exactly **5 cross-packet duplicates**; matches `docs/data-quality.md`.
- Stored source audit (`research/source-link-audit.json`) is internally consistent with current data: all 42 Verified ids present, `reachable:true`, URLs match.
- **Live** spot-check of 11 Verified source URLs (every 4th) → all `200` + real PDF content. The "no unsourced claims" premise currently holds.

**Bottom line:** the project is genuinely well-engineered (dependency-free, reproducible, tested). The issues below sit on top of a solid base — none of them are "the data is fake" problems.

---

## Findings by pipeline step (ranked)

### TOP 3 TO FIX FIRST

**#3 — Timeline year-headers break under non-chronological sort (real bug).**
`src/app.js` `timelineCard` (~line 205–212) derives year headings by comparing each item to its *neighbor* in the array. But the sort control (Newest / Oldest / **Title A–Z**) remains active in Timeline view and reorders that same array. Switch to Timeline while "Title A–Z" is selected and year headers scatter/duplicate instead of grouping. **Reachable:** 10 of 19 enactment years hold >1 record.
*Fix:* force a chronological sort when `view === "timeline"` (or hide/disable the sort control in that view).

**#4 — No progressive enhancement; the public page renders broken without JS.**
`src/index.html` ships literal `—` placeholders in the metric band, "Loading policy records…", and empty chart/results containers, all filled only by `app.js`. If the module fails or JS is off, a visitor sees a broken-looking page; `<noscript>` only appends a small note and doesn't hide the dead placeholders. For a "genuinely public" civic resource this is a robustness gap.
*Fix:* server-render a minimal record list / real metric numbers into the static HTML at build time, or at least make the no-JS state degrade cleanly.

**#6 — Reachability audit is NOT wired into the release gate.**
`docs/data-quality.md` says Verified records "passed the final automated source audit," implying it runs at release. It doesn't: `pnpm verify` (`tools/verify.mjs`) only checks that a Verified record's `primary_source_url` is *syntactically* HTTPS — never that it resolves. Reachability lives only in `tools/check-sources.mjs`, run manually, frozen in `research/source-link-audit.json`. Link rot will silently turn "Verified" badges into lies with nothing catching it. (Live sample passes *today*, so it's currently truthful.)
*Fix:* either run `check-sources.mjs` as part of the release gate, or soften the doc wording to match what the gate actually enforces ("last audited on <date>", not "passes the release audit").

### SCHEMA / VALIDATOR

**#1 — `status` and `verification` are conceptually tangled.**
`"Unverified"` is both a `verification` value *and* a member of the `status` enum. Status should be *legal* state; verification is a *data-quality* axis. Because they're merged: the Status filter lists "Unverified" as if it were a legal status, and `verify.mjs` (lines ~88–93) must force every unverified record's status into a narrow allow-list to keep the two fields consistent. One concept double-encoded across two fields = maintenance trap.

**#2 — Validator asymmetry for `last_amended` (latent).**
`tools/verify.mjs` checks a *month*-precision `date_enacted` ends in `-01` (line ~107) but the parallel `last_amended` block (lines ~132–148) only checks the *year* case, not month. A month-precision `last_amended` of `2020-05-15` would slip through. No current record trips it.

### FEATURE / PLAN GAPS

**#5 — No verification filter.** You can filter by domain/status/body/year but not by the project's headline axis — "source-checked only." Plan only asked for status filtering (delivered), so this is a feature gap, not a broken promise — but it's the one filter the whole premise argues for.

**#7 — Not actually deployed.** Plan success criterion: *"genuinely public (static hosting, no login)."* Delivered artifact is local-preview only (`README`: `http://127.0.0.1:4173/`). No Artifact/Vercel deploy. A stated v1 success criterion is unmet. (Plan source: `/Users/omar/Downloads/Claude/Reports/pakistan-tech-policy-dashboard-plan-2026-07-25.md`.)

### MINOR NITS

- `metric-domains` hardcodes `12` in HTML and falls back to `|| DOMAIN_TAXONOMY.length` in `app.js` — masks a real "0 domains loaded" failure instead of surfacing it.
- Year-chart labels use `year.slice(2)` → ambiguous 2-digit years (`00` = 2000).
- `tools/verify-site.mjs` needs a running preview server and isn't part of `pnpm verify`, so the release path never exercises the actually-served site (the preview-server portion just reports "unavailable" when run standalone).

---

## Verified-good (don't re-litigate)

- Consolidation is reproducible and math-consistent.
- Data integrity: ids unique, `related` refs valid, enums clean, 42/9 verified split accurate.
- XSS hygiene in `app.js` (`escapeHtml` + `safeUrl` everywhere) and `ui-utils.js` date/hash guards are solid; tests cover hostile inputs.
- `serve.mjs` blocks path traversal (resolves + `startsWith(root)` check).
- Genuinely dependency-free — `node_modules` holds only pnpm bookkeeping; `dist/` and `node_modules/` are gitignored.

## Suggested next-agent order of work

Findings #3, #6, #2, and #5 are done (see Status update at top). What remains:

1. **#1 status/verification tangle** — schema pass. Separate legal status from the
   data-quality flag; drop `Unverified` from the `status` enum, drive the badge and
   the (now-shipped) Verification filter off `verification` only. Touches `data/policies.json`,
   `tools/verify.mjs`, the docs, and the Status dropdown. Invasive — get a nod first.
2. **#4 no-JS degradation** — render real metric numbers + a minimal record list into the
   static HTML at build time so the page isn't broken placeholders without JS. Touches
   `tools/build.mjs` + `src/index.html`. Invasive — get a nod first.
3. **#7 deploy** — ship to an Artifact or Vercel so the "genuinely public" criterion is met.
4. **Nits** — `metric-domains` `|| 12` fallback masks a 0-domains failure; year labels show
   ambiguous 2-digit years; `verify-site.mjs` isn't part of `pnpm verify`.

### Working-tree / environment notes for whoever picks this up
- Branch: `feat/pak-tech-policy-v1`. Nothing has been pushed.
- `research/consolidation-report.json` shows a harmless `generated_at` timestamp drift
  (from a reproducibility check the owner chose to leave) — not a defect, don't chase it.
- A local preview server may still be running on `http://127.0.0.1:4173/` (serves live from `dist/`).
