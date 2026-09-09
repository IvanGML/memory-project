---
name: write-a-skill
description: Create project skills with trigger-rich descriptions, concise procedural instructions, progressive disclosure, and optional bundled scripts. Use when creating, improving, or reviewing a skill under .claude/skills/, or when a repeated multi-step procedure should become a reusable slash command.
allowed-tools: Read, Glob, Grep, Write, Edit
---

# Write A Skill

Create small skills that Claude triggers reliably and that stay short enough to
load on every invocation. Adapted from Matt Pocock's `write-a-skill` via the
Cactus Blueprint Harness.

## Quick Start

1. Gather the requirements:
   - task or domain
   - specific use cases and trigger words
   - whether the work needs deterministic scripts
   - references or examples the agent may need
2. Write `SKILL.md` with a clear frontmatter `description`.
3. Keep the body short and procedural.
4. Split large or rarely used detail into one-level reference files.
5. Add scripts only for deterministic repeated work.
6. Walk the checklist below before considering the skill done.
7. Add the skill to the Project Skills table in `CLAUDE.md`.

## Skill Shape

```txt
.claude/skills/skill-name/
├── SKILL.md
├── REFERENCE.md
└── scripts/
    └── helper.sh
```

Only `SKILL.md` is required. Add other files when they reduce repeated context
or make a fragile operation deterministic. Existing examples in this repo:
`finalize` (procedural chain), `journal` (state transitions), `intake-grill`
(one reference file), `tdd` (five reference files).

## SKILL.md Template

```md
---
name: skill-name
description: Brief capability sentence. Use when specific trigger words, contexts, or file types appear.
allowed-tools: Read, Glob, Grep
---

# Skill Name

One-sentence purpose.

## Quick Start

Minimal procedure.

## Workflow

1. Step one.
2. Step two.
3. Verify evidence.

## Advanced

Read `REFERENCE.md` only when the task needs deeper detail.
```

## Description Rules

- Max 1024 characters.
- Third person; say `the user`, never `you`.
- First sentence says what capability the skill provides.
- Second sentence starts with `Use when` and names specific triggers.
- Name negative triggers when the skill is easy to over-fire (`Do not use for …`).
- Avoid vague descriptions like `Helps with docs`.

## Review Checklist

- [ ] Description includes specific `Use when` triggers.
- [ ] `SKILL.md` is concise (aim ≤ 100 lines) and procedural.
- [ ] `allowed-tools` is the least-privilege set the skill needs.
- [ ] No secrets, credentials, machine paths, or time-sensitive claims.
- [ ] References are one level deep (SKILL.md → sibling file, no deeper).
- [ ] Scripts are used only for deterministic repeated work.
- [ ] Verification evidence is named (what proves the skill worked).
- [ ] `CLAUDE.md` Project Skills table updated.
