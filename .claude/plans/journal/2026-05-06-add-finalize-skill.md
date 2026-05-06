# Add /finalize skill — post-implementation pipeline

**Date:** 2026-05-06
**Plan:** plan-add-finalize-skill
**Commits:** uncommitted at time of writing
**Status:** Done

## Why

CLAUDE.md Working Rule #3 named a post-implementation pipeline (offer reviewer → fix → lint → /journal → done) but as prose only — each session had to remember the order, and there was no automation. Two gates were missing: a typecheck step and a build step. The reviewer also ran before lint, an expensive-first ordering that wasted LLM calls on diffs that cheap gates would have rejected. The deliverable of a planned task was implicitly "working code"; the journal entry was an opt-in afterthought rather than a guaranteed handover artefact.

## What we built

A new `/finalize` skill at `.claude/skills/finalize/SKILL.md` orchestrating five gates in cost-ascending order with a fix-and-retry loop per gate: `npm run lint → npx tsc -b → pedantic-code-reviewer agent → npm run build → /journal → done`. Gate 3's reviewer auto-applies Critical and Major findings (then re-runs Gates 1+2 to confirm no regression) and surfaces Minor findings to the user for per-item judgement, with a hard cap of 2 reviewer reruns per invocation. Gate 5 invokes the existing `/journal` skill. The skill does not auto-commit — the user retains control over commit timing via `/commit`. CLAUDE.md Working Rule #3 was rewritten to name `/finalize` as the canonical path with the full five-gate sequence inline.

The skill was dogfooded on its own implementation. Gate 3 surfaced 1 Major (an a11y regression: the dove `<div>` had `role="img"` with an empty `aria-label`, replacing the previous decorative `<img alt="">`); auto-fixed by switching to `aria-hidden="true"`. Re-ran Gates 1+2 clean. All five gates passed; this entry is the chain's tail.

## Architecture impact

- New file: `.claude/skills/finalize/SKILL.md` (~120 lines markdown, no code surface).
- Modified: `CLAUDE.md` Working Rule #3 — replaces the 3-line pipeline prose with a block naming `/finalize`, listing the five gates inline, and stating the no-auto-commit rule.
- Implicit project-skill catalog (`/finalize`, `/journal`, `/commit`, `/coding-standards`) is now four entries; CLAUDE.md does not yet enumerate them.
- No new deps, no folder layout shifts, no settings changes (existing allowlist already covered `npx tsc *`, `npx vite *`, `npm`).

## Tradeoffs

- **Per-gate skills (`/lint`, `/typecheck`, `/build`) rejected** — gates are one-line npm commands; individual skills would be ceremony around `npm run X`. The orchestrator is the value-add.
- **Hooks alternative rejected** — a `Stop` hook nagging on dirty work without `/finalize` would be too noisy and can't reliably distinguish "task done" from "user paused". `/finalize` stays explicitly user-invoked.
- **Reviewer-first ordering rejected** — running the LLM reviewer before cheap automated gates wastes calls on diffs that lint or tsc would have rejected. Cost-ascending order is the correct default.
- **Strict gating in `/journal` rejected** — refusing to journal when gates haven't run would block mid-flight `Active` updates. `/journal` stays permissive; `/finalize` is the strict orchestrator.
- **Auto-commit rejected** — explicit commit timing preserved. `/finalize` produces a journal entry; the user decides when and how to commit.
- **Plan-file location fix carved out** — `/journal` only scans `.claude/plans/plan-*.md` while Claude Code plan-mode writes to `~/.claude/plans/<slug>.md`. Deferred to a separate plan rather than expanding `/finalize`'s scope.

## Known limitations / follow-ups

- **Plan-file location disconnect.** Active plans authored in Claude Code plan-mode are invisible to `/journal`. Workaround until the disconnect is fixed: author or copy plan files into `.claude/plans/`. This entry's plan was authored directly into the project location to dogfood the chain.
- **Co-mingled theme-toggle work in this commit.** The `/finalize` work landed alongside an unrelated theme/dark-mode plan (`~/.claude/plans/1-2-public-files-adaptive-frog.md`) whose journal entry is deferred until either the disconnect is fixed or the plan is copied into `.claude/plans/`. The git diff at the time of this entry contains both.
- **CLAUDE.md drift candidates surfaced but not applied** — six proposed additions (Project Skills index, hooks/components/utils row updates for the theme work, an SVG-mask gotcha note, and a known-limitation paragraph for the plan-file disconnect) were drafted in-session but deferred so the reviewer would have seen the changes. Apply before the theme-toggle journal entry lands.
- **Reviewer rerun cap (2).** If the reviewer flips its verdict on subjective findings between passes, the user needs a manual override path. Revisit after first 5 real runs.
- **No CI integration.** Pipeline is a developer-side discipline only; nothing on the CI side enforces it. If branch protection lands, the build gate is the natural integration point.
- **Reviewer Minor findings deferred (7).** Hover opacity nudge, `useTheme` initial source, no system/storage event listeners, dove alpha-channel assumption, terse `aria-label="Theme"`, `subagent_type` field verification, and `package-lock.json` churn — all explicitly deferred per session decisions and recorded here as the journal-of-record.