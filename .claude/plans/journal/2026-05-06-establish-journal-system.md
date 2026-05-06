# Establish development-journal system

**Date:** 2026-05-06
**Plan:** plan-it-first-majestic-shamir (Memory Project — Development Journal System)
**Commits:** uncommitted at time of writing
**Status:** Sealed

## Why

CLAUDE.md captures *what the project is right now*. The five MVP specs in `.claude/foundation/` capture *forward-looking intent*. Neither captures *how the project arrived at its current state* — the rejected alternatives, the dates of decisions, the dead ends that don't show up in the source tree. After three substantial in-session changes (architecture refactor, Husky/commitlint adoption, commit-skill rewrite) it became clear that "why we made decision X" was already starting to fade from this conversation, and would be unreachable from the next session. A structured engineering-journal pattern (ADRs, by another name) was needed.

## What we built

A four-part journal system rooted at `.claude/plans/`:

1. `.claude/plans/INDEX.md` — newest-first index table linking every entry. Maintained by `/journal`.
2. `.claude/plans/TEMPLATE.md` — 5-section template (Why / What we built / Architecture impact / Tradeoffs / Known limitations) with documented Status semantics (Active · Done · Sealed · Partial · Reverted). Lives at the `plans/` root (not under `journal/`) so it sits alongside the index, not the entries.
3. `.claude/plans/journal/<YYYY-MM-DD>-<slug>.md` — one entry per plan-mode session, sealed when the next plan starts. Backfilled with `2026-05-06-genesis.md` so the timeline has a starting anchor.
4. `.claude/skills/journal/SKILL.md` — new skill that creates or updates the active entry, manages Status transitions, and updates INDEX.md.

Pipeline integration: CLAUDE.md Working Rule 3 (Post-Implementation Review) extended to `Implement → review → fix → lint → /journal → done`. The `commit` skill received a new Step 2 (Journal recheck) that soft-warns when an active plan exists with no current journal entry.

CLAUDE.md drift fixed in the same change: Project Intent paragraph now points to `.claude/foundation/` (where the user moved the MVP specs) instead of the original `.claude/plans/`.

## Architecture impact

- New folder: `.claude/plans/journal/`
- New skill: `.claude/skills/journal/SKILL.md`
- Modified: `CLAUDE.md` (drift fix on line 9; new `## Development Journal` section between `## UI Libraries` and `## Working Rules`; Working Rule 3 pipeline updated)
- Modified: `.claude/skills/commit/SKILL.md` (Step 2 inserted, subsequent steps renumbered, checklist extended)
- No source code touched; lint and build unaffected.

## Tradeoffs

- **One entry per plan, not per commit.** Plans are the natural unit (3–10 commits each); per-commit entries would shred the narrative. Per-PR was rejected because PRs don't exist in this single-developer setup yet.
- **Soft-warn recheck in `commit` skill, not hard block.** Hard block would force ceremony on small follow-up commits inside an unsealed plan. Soft warn keeps the rule alive without becoming an obstacle. The user explicitly chose this severity level.
- **Skill named `/journal`, not `/seal`.** Names the artifact, not the action. The user chose this even though `/seal` more precisely captures the "lock history" semantic.
- **Genesis backfill, not pure-clean start.** Pure clean leaves a cliff for future readers; full backfill is dishonest because the original plan files are gone. One thin retroactive entry, clearly labeled `Sealed (backfill)`, anchors the timeline without pretending we wrote it in the moment.
- **INDEX format: a single table.** A grouped-by-month or grouped-by-area structure was considered and rejected as premature — at this scale, a flat newest-first list is enough.

## Known limitations / follow-ups

- Bootstrap chicken-and-egg: this very entry was hand-authored during the same session that created the `/journal` skill. Future entries will exercise the skill in earnest.
- INDEX.md merge conflicts could appear if parallel branches both add entries. Today the project is single-developer; revisit if/when collaborators join.
- The `/journal` skill does not auto-detect "what was built" — it relies on the active plan file and recent `git log/status`. If the user runs `/journal` long after implementation, accuracy degrades.
- No automated check that all of the template's mandatory sections are filled. The skill prompts; rule violations are caught by reviewer pass + reading discipline.
- The skill assumes one active plan at a time. Concurrent unrelated work in the same conversation isn't modeled.
