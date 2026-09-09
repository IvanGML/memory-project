---
name: intake-grill
description: Interview the user with structured clarification questions until shared understanding is reached, before any implementation. Use when a task adds new functionality, refactors several files, or arrives as a prompt without acceptance criteria (e.g. "fix the issue", "add search", "make it nicer"). Do not use for single-file point edits — those follow Working Rule 1 directly (1–5 sentence summary, then approval).
allowed-tools: Read, Glob, Grep, AskUserQuestion
---

# Intake Grill

Interview the user about every aspect of the task until shared understanding is
reached, then record the answers before writing a plan or changing code.
Adapted from Matt Pocock's `grill-me` skill via the Cactus Blueprint Harness.

## Quick Start

1. **Explore first.** Read `CLAUDE.md`, the relevant `.claude/foundation/*.md`
   spec, and the `src/` files the task touches. Answer for yourself everything
   the repo can answer. Ask only about gaps that change the task definition.
2. **Ask in rounds** with `AskUserQuestion`: up to 4 themed questions per call,
   2–4 options each, header ≤ 12 characters, recommended option first and
   labeled `(Recommended)`. Run rounds sequentially so each round resolves the
   branches the previous answers opened. 3–6 questions total is the norm.
3. **Record every answer** (see below) before writing validation or code.

## When It Runs — And When It Doesn't

Runs: new feature or section, refactor spanning several files, any prompt that
lacks an observable acceptance criterion, anything touching the MVP's explicit
out-of-scope list in `CLAUDE.md`.

Does not run: a point edit to one file, a typo, a rename, a change already fully
specified by an approved plan. Those follow Working Rule 1 as written.

## Cover Across The Rounds

- user problem and desired outcome (observable, not "better")
- affected section / component / user flow
- scope, non-goals, and protected areas (what must not change)
- acceptance criteria and observable behavior
- edge cases: empty content, missing assets, mobile, reduced motion, dark theme
- risk and whether the user wants to verify by hand before commit
- what is explicitly **not** needed now

## Done When

The grill is complete only when all conditions in [completion.md](completion.md)
hold. A waived condition must be recorded as an explicit assumption.

## Record The Answers

- **In plan mode:** add an `## Intake` section to the plan file with a table
  `| Question | Answer | Source |` where Source is `user`, `repo` (discovered,
  not asked), or `assumption`.
- **Outside plan mode:** fold the answers into the Working Rule 1 summary
  (1–5 sentences) and list assumptions explicitly before asking for approval.

If the user declines to answer, record the missing information as assumptions
and keep the change small.

## Attribution

Matt Pocock's `grill-me`:
https://github.com/mattpocock/skills/blob/main/skills/productivity/grill-me/SKILL.md
