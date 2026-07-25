# Discovery loop

A continuous research loop that crawls the internet for sources and datasets
that would make the dashboard more advanced, more nuanced, and easier for an
everyday person to understand.

The loop **researches and queues. It does not change the dashboard.** Every pass
writes to `research/discovery/` only. You decide what gets built.

## Running it

Continuous, self-paced — it keeps going until you stop it:

```bash
/loop /discover
```

A single pass:

```bash
/discover
```

A single pass in a lane you choose:

```bash
/discover datasets
```

## The four lanes

Passes rotate through these so the dashboard improves on every front, not just
whichever one is easiest that day.

| Lane | Looking for | Makes the dashboard |
|---|---|---|
| `instruments` | Missing policies, amendments, status changes, working URLs for the nine `Unverified` records | More complete and less stale |
| `datasets` | Quantitative series — connectivity, payments, shutdowns, takedowns, exports | More advanced: shows whether a policy changed anything |
| `plain-language` | "What this means for you" framing, glossary, who-is-affected, comparable laws | Easier to understand |
| `context` | Litigation, committee proceedings, civil-society critique | More nuanced than the state's own account |

## Reviewing what it finds

`BACKLOG.md` is generated and ranked. Read it, then record decisions:

```bash
node tools/discovery.mjs accept <proposal-id> --note "why"
```

```bash
node tools/discovery.mjs reject <proposal-id> --note "why"
```

```bash
node tools/discovery.mjs done <proposal-id>
```

Accepted proposals are your build queue. Nothing enters `data/policies.json`
until you accept it and it passes the existing `pnpm verify` and
`pnpm check:sources` gates.

Ranking is `(everyday-person value × confidence × official-source bonus) ÷ effort`.
It orders the queue; it is not a quality judgement, and a low score on a
high-integrity finding is a signal about effort, not worth.

## Commands

```bash
node tools/discovery.mjs plan            # next iteration's assignment
node tools/discovery.mjs stats           # coverage across lanes
node tools/discovery.mjs known --grep x  # is this already in the directory?
node tools/discovery.mjs check --file p  # do the evidence URLs resolve?
node tools/discovery.mjs ingest p        # validate, record, regenerate backlog
node tools/discovery.mjs backlog         # regenerate BACKLOG.md
```

## Files

- `frontier.json` — the crawl frontier: source registry per lane. Iterations
  append newly discovered targets here. Targets become eligible again after
  their lane's `recheck_after_days`.
- `state.json` — the ledger: iteration count, lane rotation, targets explored
  with dates, queries already run, URLs seen, proposal ids used. This is what
  stops iteration 12 from rediscovering what iteration 3 found.
- `proposals/NNN-lane.json` — one packet per pass, append-only.
- `audits/` — link-check results per packet.
- `decisions.json` — your accept/reject/done record.
- `BACKLOG.md` — generated. Do not hand-edit.

## Why it does not repeat itself

Every pass reads `state.json` before searching and writes back to it after.
Queries already run are shown in the plan and excluded by convention; frontier
targets carry an explored-on date and only resurface after their recheck window;
proposal ids are globally unique and the validator rejects reuse. Coverage
therefore accumulates instead of resetting.
