    ---
name: finalize
description: Run the post-implementation gate chain for the current task — lint → typecheck → pedantic-code-reviewer → build → /journal. Each gate has a fix-and-retry loop. Run after a planned set of changes is implemented and before declaring the task done.
allowed-tools: Bash, Read, Edit, Write, Glob, Grep, Agent, Skill, TaskCreate, TaskUpdate, TaskList
---

The end-of-task orchestrator. Run after a planned set of changes is implemented. Goal: ship working code **and** a journal entry in one command, with no skipped gates.

## Core rules (do not violate)

1. **Gate order is fixed.** lint → tsc → reviewer → build → journal. Cheap fail-fast first; the LLM-driven reviewer runs only after automated gates are green.
2. **One gate at a time.** Don't advance until the current gate passes.
3. **Fix-and-retry per gate.** If a gate fails, fix at the source, re-run that gate. Move on only when clean. Do not silence errors with `--no-verify`, `// @ts-ignore`, or `eslint-disable` unless the user explicitly approves.
4. **Reviewer auto-policy.** Critical and Major findings: apply the fix, then re-run gates 1–2 to confirm no regression. Minor findings: surface to the user as a numbered list, the user decides per-item.
5. **Never declare done** before `/journal` records the entry.

---

## Step 1 — Pre-flight

Run in parallel:

```bash
git status --short
git diff --stat HEAD
ls .claude/plans/plan-*.md 2>/dev/null
```

If the working tree is clean against `HEAD` (no staged or unstaged changes, no untracked files of interest), stop with: *"Nothing to finalize — working tree is clean against HEAD."*

If `.claude/plans/plan-*.md` is missing, warn but continue: the journal step will surface the gap. (Plan-file location detection is a known limitation; see CLAUDE.md.)

---

## Step 2 — Gate 1: Lint

```bash
npm run lint
```

- **Clean** → advance.
- **Errors** → fix at the source. Use `npx eslint --fix <path>` for auto-fixable rules; edit by hand for the rest. Re-run `npm run lint`. Loop until clean.

---

## Step 3 — Gate 2: Typecheck

```bash
npx tsc -b
```

- **Clean** → advance.
- **Errors** → fix at the source (real types, not `any`/`@ts-ignore`). Re-run. Loop until clean.

This is intentionally separate from the build's `tsc -b` step: it gives faster feedback and isolates type errors from bundler errors.

---

## Step 4 — Gate 3: Pedantic Code Reviewer

Capture the diff context, then invoke the agent:

```bash
git diff HEAD > /tmp/finalize-review-diff.patch
git diff --stat HEAD
```

```ts
Agent({
  subagent_type: "pedantic-code-reviewer",
  description: "Post-implementation review",
  prompt: "Review the diff in /tmp/finalize-review-diff.patch (also reachable via `git diff HEAD`). Apply your standard severity buckets: Critical, Major, Minor. Focus on architectural/logic/design issues that lint and tsc cannot catch."
})
```

When the agent returns:

- **Critical** → fix immediately. After fixes, re-run **Gate 1 (lint)** and **Gate 2 (tsc)** to confirm no regression.
- **Major** → fix immediately. Re-run Gates 1–2.
- **Minor** → present to the user as a numbered list. For each, ask `[fix / defer]`. Apply the fixes the user picks; record the deferred items in the eventual journal entry's *Known limitations*.
- After substantial Major fixes, optionally re-invoke the reviewer **once** for a confirmation pass. Cap reviewer reruns at 2 to avoid loops.

---

## Step 5 — Gate 4: Build

```bash
npm run build
```

This runs `tsc -b && vite build` per `package.json`. Build catches what lint+tsc miss: asset path typos, CSS-Module class references through `typescript-plugin-css-modules`, runtime imports, env variables.

- **Clean** → advance.
- **Errors** → fix at the source, re-run. Loop until clean.

---

## Step 6 — Gate 5: Journal

```ts
Skill({ skill: "journal" })
```

The `/journal` skill handles its own create / update / seal logic per its frontmatter rules. If it reports *"no active plan; nothing to journal,"* surface the gap to the user and ask how to proceed (typically: copy the active plan into `.claude/plans/plan-*.md` then re-run, or accept the gap and finalize without a journal entry).

---

## Step 7 — Confirm

Print a final summary:

- Each gate's outcome (pass / failed-then-fixed) and rough time taken.
- Reviewer finding counts: `Critical: N (fixed), Major: N (fixed), Minor: N (M fixed, K deferred)`.
- The journal entry path (or "skipped — no active plan").
- A reminder: the work is now ready to commit (`/commit` skill, not auto-invoked by `/finalize`).

---

## Checklist

- [ ] Pre-flight ran; working tree had changes to finalize
- [ ] Gate 1 (lint) ended green
- [ ] Gate 2 (tsc) ended green
- [ ] Gate 3 (reviewer) ran; Critical + Major auto-applied; Minor surfaced for user judgment
- [ ] Gate 4 (build) ended green
- [ ] Gate 5 (journal) produced or updated an entry, or the gap was surfaced
- [ ] No skipped gates, no `--no-verify`, no silenced errors without explicit user approval
- [ ] Final summary printed

---

## Known limitations

- **Plan-file location.** `/journal` looks only at `.claude/plans/plan-*.md`. Plans authored via Claude Code plan-mode live at `~/.claude/plans/<slug>.md` and are invisible to `/journal`. Until that disconnect is fixed in a separate plan, plans must be authored or copied into `.claude/plans/` for `/finalize` to chain into a journal entry cleanly.
- **No auto-commit.** `/finalize` does **not** call `/commit`. The user retains control over commit timing and message.
- **Reviewer rerun cap.** Hard cap of 2 reviewer passes per `/finalize` invocation to prevent loops on subjective findings.
