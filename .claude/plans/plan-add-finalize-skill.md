# Plan — Add `/finalize` Skill (Post-Implementation Pipeline)

## Context

CLAUDE.md Working Rule #3 names a post-implementation pipeline (`Implement → offer pedantic-code-reviewer → fix → npm run lint → /journal → done`), but it has three problems:

1. **Prose only, not enforced.** Each session must remember the order; nothing automates the chain.
2. **Missing gates.** No typecheck (`tsc -b`) and no build (`vite build`) — the Vite bundle catches asset path issues, CSS-Module class references, and runtime imports that lint+tsc miss.
3. **Wrong order for cost.** The reviewer (LLM call) is more expensive than lint and tsc. It should run *after* the cheap gates, not before.

The user wants a single `/finalize` command that runs all five gates in cost-ascending order (cheap fail-fast first, journal last) with a fix-and-retry loop per gate, so the deliverable of any planned task is **working feature + journal entry, in one command**.

Outcome: a new skill orchestrates the chain; CLAUDE.md Working Rule #3 names it as the canonical path.

---

## Architecture Decisions

| Decision | Choice | Why |
|---|---|---|
| Skill name | `/finalize` | Clear end-of-task semantic; verb form matches `/commit`, `/journal`. |
| Skill location | `.claude/skills/finalize/SKILL.md` | Matches existing skill convention (kebab dir, `SKILL.md`). |
| Gate order | lint → tsc → reviewer → build → journal | Cheap fail-fast first; reviewer is the only judgment-heavy gate; build last so it validates everything together; journal records the result. |
| Fix-and-retry behavior | Per-gate loop until clean, then advance | Each gate is a checkpoint. Don't carry failures forward. |
| Reviewer auto-fix policy | Critical + Major: auto-apply. Minor: ask user. | Matches existing CLAUDE.md Working Rule #3 wording; preserves user judgment on style/nitpick calls. |
| Reviewer invocation | `Agent` tool with `subagent_type: pedantic-code-reviewer`, passing `git diff HEAD` context | The agent is already remote-capable (per its frontmatter) and accepts diff context. |
| Journal handoff | Call `/journal` as the last gate, accept its current behavior | Per user direction (#3 answer): the plan-file detection disconnect (`~/.claude/plans/` vs `.claude/plans/`) is **a separate future plan**. |
| Plan-file location for *this* plan | `.claude/plans/plan-add-finalize-skill.md` (project-local) | So `/finalize` can dogfood itself end-to-end on its own implementation: when run, `/journal` will detect this plan. |
| Tooling permissions | Reuse existing `.claude/settings.local.json` allowlist | Already permits `npx tsc *`, `npx vite *`, `npm` — no settings changes needed. |
| Commit scope | `config` (existing scope) | Per `commitlint.config.js` valid scopes; the new skill is project infrastructure. |

---

## Files to Create / Modify

### 1. `.claude/skills/finalize/SKILL.md` — new

Full draft (mirrors the structure of `journal/SKILL.md`):

```markdown
---
name: finalize
description: Run the post-implementation gate chain for an active plan: lint, typecheck, pedantic-code-reviewer, build, /journal. Each gate has a fix-and-retry loop; /finalize stops at the first unrecoverable failure and surfaces the issue.
allowed-tools: Bash, Read, Edit, Write, Glob, Grep, Agent, Skill, TaskCreate, TaskUpdate, TaskList
---

The end-of-task orchestrator. Run after a planned set of changes is implemented.
Goal: ship working code AND a journal entry in one command, with no skipped gates.

## Core rules

1. **Gate order is fixed.** lint → tsc → reviewer → build → journal. Cheap fail-fast first.
2. **One gate at a time.** Don't advance until the current gate is green.
3. **Fix-and-retry loop per gate.** If a gate fails, fix the issue, re-run that gate. Move on only when clean.
4. **Reviewer auto-policy:** Critical + Major findings are fixed automatically; Minor findings are surfaced and the user decides per-item.
5. **Never declare done** before /journal records the entry.

## Step 1 — Pre-flight

Run in parallel:

    git status --short
    git diff --stat HEAD

If there are no changes to evaluate, stop with: "Nothing to finalize — working tree is clean against HEAD."

## Step 2 — Gate 1: Lint

    npm run lint

If clean: advance.
If not: report errors, attempt fixes (auto-fixable ones via `npx eslint --fix <file>`,
manual edits otherwise), re-run. Loop until clean.

## Step 3 — Gate 2: Typecheck

    npx tsc -b

If clean: advance.
If errors: fix at the source (don't suppress with `// @ts-ignore` unless the user
explicitly approves), re-run. Loop until clean.

## Step 4 — Gate 3: Pedantic Code Reviewer

Invoke the agent via:

    Agent({
      subagent_type: "pedantic-code-reviewer",
      description: "Post-implementation review",
      prompt: "<git diff HEAD>\n\nReview the changes above. Apply your standard severity buckets (Critical, Major, Minor)."
    })

When the agent returns its findings:

- For each **Critical** or **Major** issue: apply the fix immediately, then re-run gates 1 and 2 to confirm the fix didn't regress them.
- For **Minor** issues: present them to the user as a numbered list and ask which to fix vs defer.
- After fixes are applied, optionally re-invoke the reviewer for a confirmation pass *only* if Major architectural changes were made.

## Step 5 — Gate 4: Build

    npm run build

This runs `tsc -b && vite build` per `package.json`.
If clean: advance.
If failures (asset paths, CSS Module class refs, runtime imports): fix at the source,
re-run. Loop until clean.

## Step 6 — Gate 5: Journal

Invoke the existing `/journal` skill via `Skill({ skill: "journal" })`.
The skill handles its own create/update/seal logic. If it reports "no active plan,"
note the limitation and ask the user how they want to record the work
(this is the known gap with plan-mode files in `~/.claude/plans/`).

## Step 7 — Confirm

Print:
- Each gate's pass/fail and time taken.
- Number of reviewer findings auto-applied vs user-deferred.
- The journal entry path.
- A reminder that the plan can now be marked complete and a commit prepared.

## Checklist

- [ ] All five gates ran in order: lint, tsc, reviewer, build, journal
- [ ] Each gate ended green before the next started
- [ ] Reviewer Critical + Major findings were applied
- [ ] Reviewer Minor findings were surfaced to the user
- [ ] /journal produced or updated an entry
- [ ] No skipped gates, no `--no-verify`, no `// @ts-ignore` without user approval
```

### 2. `CLAUDE.md` — rewrite Working Rule #3

Replace the existing block with:

```markdown
3. **Post-Implementation pipeline.** After completing a planned set of changes, run `/finalize` (`.claude/skills/finalize/SKILL.md`). It runs five gates in cost-ascending order with a fix-and-retry loop per gate:

   `npm run lint → npx tsc -b → pedantic-code-reviewer agent → npm run build → /journal → done`

   The reviewer (`.claude/agents/pedantic-code-reviewer.md`) catches architectural/logic/design issues automated tools can't see — Critical and Major findings are auto-fixed; Minor: user decides. `/journal` is the human-readable handover gate — it writes or updates the journal entry for the active plan so the next session inherits context. **Never declare done before all five gates pass.**
```

### 3. Files NOT touched

- `.claude/skills/journal/SKILL.md` — unchanged. The plan-file-location disconnect (`~/.claude/plans/` vs `.claude/plans/`) is left for a separate future plan, per user direction.
- `.claude/agents/pedantic-code-reviewer.md` — unchanged. Already produces Critical/Major/Minor categories.
- `.claude/settings.local.json` — unchanged. Existing allowlist covers `npx tsc *`, `npx vite *`, `npm`.
- `commitlint.config.js` — unchanged. Use `config` scope for the implementation commit.

---

## Verification

This plan can be verified end-to-end in one shot **by running `/finalize` on its own implementation** — that's the dogfood loop:

1. After implementing the new skill + CLAUDE.md edit, invoke `/finalize`.
2. Gate 1 — `npm run lint`: passes (no new TS files; SKILL.md is markdown).
3. Gate 2 — `npx tsc -b`: passes (no source changes).
4. Gate 3 — pedantic-code-reviewer: review focuses on the SKILL.md content and CLAUDE.md rewrite. Likely Minor findings only (wording, ordering nits).
5. Gate 4 — `npm run build`: passes (no source changes).
6. Gate 5 — `/journal`: detects this plan at `.claude/plans/plan-add-finalize-skill.md`, writes a new entry titled "Add /finalize skill" with Status `Done`, and inserts the row in `INDEX.md`. The previous entry (`1-yes-2-on-misty-giraffe`, currently `Done`) gets sealed first per the skill's parallel-entry rule.

If any gate fails, the failure is the bug — fix and re-run.

---

## Known Limitations / Out of Scope

- **Plan-file location disconnect.** `/journal` only scans `.claude/plans/plan-*.md`. Claude Code plan-mode writes to `~/.claude/plans/<slug>.md`. For now, project plans must be authored or copied into `.claude/plans/` for `/journal` (and therefore `/finalize`) to detect them. Fixing this is a **separate future plan**.
- **No hook integration.** Could add a `Stop` hook in `.claude/settings.json` that nags if work is dirty without `/finalize`. Skipped — too noisy, can't reliably distinguish "task done" from "user paused".
- **Per-gate skills (`/lint`, `/typecheck`, `/build`).** Rejected — gates are one-line npm commands. The orchestrator is the value-add; individual gate skills would be ceremony around `npm run X`.
- **Reviewer rerun policy.** Currently optional after Major fixes. If repeat reruns become noisy in practice, add a hard cap (e.g., max 2 reviewer passes).
- **Auto-commit.** `/finalize` does NOT call `/commit` automatically. The user retains explicit control over commit timing and message.

---

## Effort Estimate

- New skill file: ~120 lines of markdown.
- CLAUDE.md edit: ~6 lines replaced.
- No code, no test surface, no dep changes.
- Implementation should take under 10 minutes; the first `/finalize` run on this plan is itself the test.
