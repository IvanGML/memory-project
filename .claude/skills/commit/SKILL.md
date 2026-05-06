---
name: commit
description: Create a git commit for the current task — stages only files changed in this conversation, formats message per the conventional-commit rules enforced by commitlint at the repo root
allowed-tools: Bash, Read, Glob, Grep
---

Create a git commit for the current task. No push. No `Co-Authored-By` line.

Must comply with `commitlint.config.js` at the repo root:

- Format: `type(scope): description` (with optional `#id` after the colon)
- Types: `feat`, `fix`, `refactor`, `style`, `docs`, `chore`, `build`, `ci`, `perf`
- Scopes: `home`, `admin`, `intro`, `hero`, `about`, `film`, `memories`, `gallery`, `final`, `content`, `ui`, `hooks`, `lib`, `types`, `global`, `deps`, `config`, `i18n`, `assets`
- Subject: lowercase, imperative, no trailing period, header ≤ 100 chars
- **Scope is required** (`scope-empty: never`).

If a needed scope isn't on the list, **add it to `commitlint.config.js` deliberately** in a separate `chore(config)` commit — never invent ad-hoc scopes.

---

## Step 1 — Gather state

Run in parallel:

```bash
git status --short
git log --oneline -5
git rev-parse --abbrev-ref HEAD
ls .claude/plans/plan-*.md 2>/dev/null
ls -t .claude/plans/journal/*.md 2>/dev/null | head -1
```

---

## Step 2 — Journal recheck (soft warn, never blocks)

Before staging, sanity-check that the development journal isn't lagging behind the work being committed.

Logic:

- **No active plan** (`.claude/plans/plan-*.md` absent) → skip recheck, proceed to Step 3.
- **Active plan exists**, then look at the newest entry under `.claude/plans/journal/`:
  - **Newest entry's Status is `Sealed`** → no warning; this is likely a follow-up commit on a finalized plan, proceed.
  - **Newest entry is `Active` or `Done` AND its `Plan` field references the same active plan** → no warning, proceed.
  - **No entry, or newest entry's `Plan` references an older/different plan** → soft warn:

    > "Active plan `<plan-slug>` has no current journal entry. Run `/journal` first to capture this work, or confirm to skip [continue / abort]."

This step **never blocks** — the user can confirm and proceed. Their choice is recorded in the conversation; if they skip repeatedly, that's a signal the rule needs review, not a hook to harden.

---

## Step 3 — Resolve commit type and (optional) ticket ID

### 3a — Parse branch name (optional)

Memory-project has no strict branching convention today. If the current branch happens to follow `<name>/<type>/<id>` or `<type>/<id>` (e.g. `ivan/feat/42`, `fix/17`), parse it:

| Branch type segment | Commit type |
|---|---|
| `fix` / `bug` / `bugs` / `hotfix` | `fix` |
| `feat` / `feature` | `feat` |
| `refactor` | `refactor` |
| `style` | `style` |
| `perf` | `perf` |
| `docs` | `docs` |
| `chore` / `config` | `chore` |
| `task` | Ambiguous — infer from changes |

If the **last segment** is a plain integer, treat it as the ticket ID. Otherwise there is no ticket ID — that's fine, the format allows commits without one.

### 3b — Type from changes (always sanity-check)

Regardless of branch, verify the type against the actual diff:

- New functionality / new files → `feat`
- Bug fix → `fix`
- Code restructuring without behavior change → `refactor`
- Formatting / whitespace / inline-style cleanups → `style`
- Doc-only changes (CLAUDE.md, README, plan files, comments) → `docs`
- Tooling / Husky / commitlint / eslint / vite config / `.claude/` skills+agents → `chore`
- Build script changes (`scripts.build`, `tsconfig`) → `build`
- CI changes (`.github/workflows/`) → `ci`
- Perf-only changes → `perf`

If the branch type and the diff disagree, trust the diff. If still unclear, **ask the user** — never guess.

---

## Step 4 — Resolve scope

Map staged file paths to a scope. Use the **single most specific** scope that covers all changes; if changes span multiple areas, fall back to a wider scope (`global` for the whole app, `config` for tooling).

| Path pattern | Scope |
|---|---|
| `src/pages/HomePage.tsx` | `home` |
| `src/pages/admin/**`, `src/components/admin/**` | `admin` |
| `src/sections/IntroOverlay.tsx` | `intro` |
| `src/sections/HeroSection.tsx` | `hero` |
| `src/sections/AboutSection.tsx` | `about` |
| `src/sections/FilmSection.tsx` | `film` |
| `src/sections/MemoriesSection.tsx`, `src/components/memory/**` | `memories` |
| `src/sections/GallerySection.tsx`, `src/components/gallery/**` | `gallery` |
| `src/sections/FinalSection.tsx` | `final` |
| `src/content/**`, `public/content.json` | `content` |
| `src/components/ui/**` | `ui` |
| `src/hooks/**` | `hooks` |
| `src/lib/**` | `lib` |
| `src/types/**` | `types` |
| `src/assets/**`, `public/assets/**` | `assets` |
| `public/locales/**` (future) | `i18n` |
| `package.json` (dependency-only changes) | `deps` |
| `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `commitlint.config.js`, `.husky/**`, `package.json` (scripts only) | `config` |
| `src/App.tsx`, `src/main.tsx`, `src/index.css` | `global` |
| Changes spanning **3+ scopes** above | `global` |
| `.claude/**` | see Step 5 shortcut |
| `CLAUDE.md`, `README.md` | `global` (with type `docs`) |

**Tiebreakers:**
- Mixed `package.json` edits (deps **and** scripts in one commit) → use `deps`.
- Two scopes touched → use the **dominant** one (more files / larger diff). Three or more → `global`.

If the scope cannot be confidently determined, **ask the user** — never guess.

---

## Step 5 — Stage files

Stage **only** the files you modified in this conversation. Never use `git add -A` or `git add .`.

```bash
git add <file1> <file2> ...
```

Rules:
- Do not stage files you did not touch in this task.
- Do not stage anything that could contain secrets.
- If `git status` shows unrelated modified files alongside your changes, leave them unstaged.
- If a plan file was created in `.claude/plans/` during this conversation, stage it alongside the code changes.
- **Drift-check rule:** if the change is architecture-significant (new dep, new layer, new top-level folder, removed convention), check whether `CLAUDE.md` needs an update and stage it in the same commit.

**Never stage these files** (always exclude, even if modified):
- Anything under `dist/`
- `.env`, `.env.*` (except `.env.example` if it ever exists)
- `node_modules/`

---

## Step 6 — Compose commit message

### 6a — Claude-config-only shortcut

If **all** staged files are under `.claude/` (skills, agents, settings, plans-only) and none are application code or `CLAUDE.md`:

- Message: `docs(global): update claude skills and configuration` (or more specific, e.g. `docs(global): update commit skill to project convention`)
- If the current branch is `main` and CI exists, append ` [skip ci]`
- **Skip Step 2/3 type-and-scope inference** — type is `docs`, scope is `global`.

If only `CLAUDE.md` is staged: `docs(global): update claude.md` (or more specific, e.g. `docs(global): document commit convention`).

### 6b — Standard commits

Format: `type(scope): description` — or `type(scope): #id description` if a ticket id is known.

Rules:
- **Lowercase** — type, scope, and description all start lowercase
- **Imperative mood** — "add", "fix", "update", not "added", "fixes", "updated"
- **No trailing period**
- **No capitalized first letter** in description
- **Total header ≤ 100 characters**
- Ticket ID, when used, follows the colon+space, prefixed with `#`

Examples:

```
feat(memories): pause auto-advance on swipe
fix(gallery): close lightbox on Escape inside text input
refactor(content): split useContent error path
chore(deps): bump @tanstack/react-query to 5.x
chore(config): tighten commitlint scope-enum
docs(global): document commit convention in claude.md
fix(memories): #42 respect prefers-reduced-motion in carousel
```

---

## Step 7 — Commit

**Never include a `Co-Authored-By` line.**

Use a heredoc so newlines and special characters survive intact:

```bash
git commit -m "$(cat <<'EOF'
type(scope): description
EOF
)"
```

If Husky's `commit-msg` hook rejects the message, fix the message and create a **NEW** commit — don't `--amend` after a hook rejection (the commit didn't actually happen, so `--amend` would modify the **previous** commit). **Never** pass `--no-verify` to bypass hooks; investigate and fix the rule violation instead.

If the `pre-commit` hook (lint-staged) fails on lint errors, fix the lint errors, re-stage the affected files, and retry the commit.

---

## Step 8 — Confirm

Run `git log --oneline -1` and report the commit hash and message to the user.

---

## Checklist

- [ ] Journal recheck completed — entry exists for the active plan, or skip explicitly confirmed by the user
- [ ] Type matches commitlint `type-enum` (`feat`, `fix`, `refactor`, `style`, `docs`, `chore`, `build`, `ci`, `perf`)
- [ ] Scope matches commitlint `scope-enum` and is the most specific that covers all changes
- [ ] If a needed scope was missing, a separate `chore(config)` commit added it before this one — not invented ad-hoc
- [ ] Ticket ID resolved from branch or conversation context if applicable; omitted otherwise — never guessed
- [ ] Only files touched in this conversation are staged — no secrets, no unrelated changes (include `.claude/plans/` plan file if created this session; include `CLAUDE.md` if architecture drifted)
- [ ] Message is lowercase, imperative, ≤ 100 chars, no trailing period
- [ ] Husky `commit-msg` hook (commitlint) accepted the message
- [ ] Husky `pre-commit` hook (lint-staged on staged `*.{ts,tsx}`) passed
- [ ] No `Co-Authored-By` line
- [ ] Commit hash confirmed
