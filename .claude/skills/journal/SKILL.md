---
name: journal
description: Create or update the development-journal entry for the active plan, manage Status transitions, and maintain .claude/plans/INDEX.md. Run at plan completion, before declaring the task done.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

Maintain the project's append-only development journal. **CLAUDE.md is the snapshot; the journal is the timeline.** This skill creates or updates the journal entry for the *currently active plan* and keeps the index in sync.

## Core rules (do not violate)

1. **One entry per plan.** Never create a parallel entry while another is `Active`. If the user's request would imply two journals at once, ask which plan they're closing.
2. **Sealed is permanent.** A `Sealed` entry is never edited. If new context contradicts a sealed entry, write a *new* entry that references the old one in its `## Why` section.
3. **Brevity over completeness.** One page max per entry. If the entry is longer than the plan file, the entry is doing too much.
4. **First audience: the next session.** Optimize each entry for "what state is this project in and why?" — not for posterity, not for a stakeholder report.

---

## Step 1 — Detect mode

Run in parallel:

```bash
ls .claude/plans/plan-*.md 2>/dev/null
ls -t .claude/plans/journal/*.md 2>/dev/null | head -3
git log --oneline -10
git status --short
```

Decide which mode this invocation is in:

- **Update active entry** — if the newest journal entry is `Active` and its `Plan` field matches an existing `.claude/plans/plan-*.md` file. Edit in place.
- **Create new entry** — if no `Active` entry exists, or the newest entry's plan field references a different (older) plan. Generate a new file.
- **Seal (transition Done → Sealed)** — if the newest entry is `Done` and the user is invoking `/journal` again to finalize. Confirm with user, change `Status: Done` → `Status: Sealed`, never modify any other text.
- **No active plan** — if `.claude/plans/plan-*.md` does not exist and the newest entry is already `Sealed`: tell the user "no active plan; nothing to journal" and stop. Do not invent an entry.

---

## Step 2 — Gather context

Read the active plan file (`.claude/plans/plan-*.md`) and `git log --oneline -20`. Identify:

- The plan's title (becomes the entry title; truncate to ≤ 8 words).
- The 1–2 sentence problem statement (`## Why` source).
- The concrete artifacts produced (`## What we built` source).
- The deps/folders/conventions that changed (`## Architecture impact` source).
- Any "considered but rejected" alternatives (`## Tradeoffs` source).
- Any deferred work the plan called out (`## Known limitations` source).

If a section's content is below 80% confidence, ask the user inline rather than guessing. Never fabricate tradeoffs that weren't actually weighed.

---

## Step 3 — Slug + filename

Derive a kebab-case slug from the plan's title. Rules:

- ≤ 4 words.
- Drop articles (`a`, `the`), prepositions (`of`, `for`, `to`), and the project name.
- Verb-noun preferred (e.g. `establish-journal-system`, `add-admin-route`, `refactor-content-fetch`).

Filename: `.claude/plans/journal/YYYY-MM-DD-<slug>.md` using **today's date in UTC**. If a file with the same slug already exists for today, append a numeric disambiguator (`-2`).

---

## Step 4 — Write the entry

Copy `.claude/plans/TEMPLATE.md` as the starting structure. Fill the five sections from gathered context. Leave the trailing `<!-- Template usage notes -->` block out of new entries.

Initial Status defaults to `Active`. Transition rules:

- `Active` → `Done` when implementation lands and lint passes (the user signals this by saying "done" or by closing the plan).
- `Done` → `Sealed` when a *new* plan begins. The user confirms via `/journal` invocation.
- `Active` → `Partial` if the plan ships less than originally scoped; document what was deferred in `## Known limitations`.
- `Active` → `Reverted` if the work is rolled back; entry stays as a record of the dead-end.

Do **not** delete a `Reverted` or `Partial` entry — it's part of the timeline.

---

## Step 5 — Update INDEX.md

Open `.claude/plans/INDEX.md`. Insert the new entry's row at the top of the table, **above** the most recent existing row. Columns:

| Column | Source |
|---|---|
| Date | YYYY-MM-DD from filename |
| Title | linked text matching the entry's H1 |
| Status | current Status value |
| Plan | plan slug (filename without extension) or `N/A` for backfill |
| Commits | hash range, PR link, or `uncommitted` if pre-commit |

When the entry transitions `Done → Sealed` or `Active → Done`, update the Status column in the matching row. **Never modify a `Sealed` row's other columns.**

If creating a new entry while the previous newest is still `Active` or `Done`, the skill must surface this and ask: "Previous entry is not sealed. Seal it first, or proceed in parallel?" Default: seal first.

---

## Step 6 — Confirm

Print:

- The entry's path.
- The current Status.
- The INDEX.md row that was added or updated.
- A reminder of next steps (e.g. "Run `/journal` again when this plan ends to seal the entry.").

---

## Checklist

- [ ] Active plan detected (`.claude/plans/plan-*.md` exists), or "no active plan" path explicitly taken
- [ ] Mode chosen: Update / Create / Seal / No-op
- [ ] Filename follows `YYYY-MM-DD-<slug>.md`, slug is ≤ 4 words, kebab-case
- [ ] All five template sections present and non-empty
- [ ] Status is one of: `Active`, `Done`, `Sealed`, `Partial`, `Reverted`
- [ ] INDEX.md updated — row inserted at top (new) or Status column updated (transition)
- [ ] No `Sealed` entry was modified
- [ ] Entry length ≤ one page (rough rule: under ~80 lines)
- [ ] No fabricated tradeoffs — every "rejected alternative" was actually weighed in the conversation or the plan
