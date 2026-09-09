# <feature title>

**Date:** YYYY-MM-DD
**Plan:** <plan slug, or "N/A — backfill">
**Commits:** <hash range, PR link, or "uncommitted at time of writing">
**Status:** Active | Done | Sealed | Partial | Reverted

## Why
The problem this addressed, in 3–5 sentences. What state was the project in, what couldn't be done, what prompted the work?

## What we built
The decision — what was added/removed/changed and why this won. Concrete, not aspirational.

## Architecture impact
New deps · new layers · new/removed conventions. Cross-references to CLAUDE.md sections that changed in the same commit.

## Tradeoffs
What we chose against, and why this won. Capture rejected alternatives so future readers don't relitigate them.

**Explicitly not needed now:** the things the intake ruled out of scope on purpose, so nobody adds them "while we're here".

## Known limitations / follow-ups
What we deliberately didn't do; pointers to future plans or open issues.

### Prevention
Mistakes hit during this plan (red lint/tsc/build, reviewer Critical/Major findings, hook blocks, wrong assumptions) and what the next session should check to avoid repeating each one. One line per item: `symptom → check`. Omit the section only if nothing went wrong.

---

<!--
Template usage notes (delete this block in real entries):

- Status semantics:
  - Active   — plan still in flight; entry will be updated as work proceeds.
  - Done     — implementation complete, awaiting /journal finalization.
  - Sealed   — finalized; never edited again. New context goes into a new entry that references this one.
  - Partial  — shipped less than originally planned; document what's deferred.
  - Reverted — work was rolled back; entry stays as a record of the dead-end.
- One entry per plan. Don't create parallel entries while one is Active.
- Brevity over completeness. One page max. If it's longer than the plan file, the entry is doing too much.
- First audience: the next session trying to answer "what state is this project in and why?"
-->
