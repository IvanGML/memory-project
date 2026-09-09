# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project intent

A single-page memorial site for Лариса Сомова (Larisa Somova). The product goal is **emotional immersion, not task completion** — "the user should feel like they are entering a memory space." Content-first, minimal UI, Russian-language, mobile-first.

The five MVP specs in `.claude/foundation/` are the source of truth for design intent. Read them before any substantial UI change:

- `Application Skeleton (MVP).md` — component tree
- `Frontend Specification (MVP).md` — scope and explicit out-of-scope
- `Design Foundation (MVP).md` — typography, color tokens, theming strategy, i18n strategy
- `UX Flow (MVP).md` — emotional rhythm and per-section UX
- `MemoryCard UX and UI Specification.md` — the core content unit

## Commands

```bash
npm run dev       # Vite dev server on http://localhost:5173/
npm run build     # tsc -b && vite build
npm run lint      # ESLint (flat config)
npm run preview   # serve the production build
```

ESLint does not read `.gitignore`: any vendored or scratch folder containing TypeScript must be added to `globalIgnores` in `eslint.config.js`, or `npm run lint` will scan it and fail.

No test suite exists yet. Don't add one casually — the planning docs treat tests as out-of-scope for MVP.

## Architecture

**SPA, no router.** Frontend Spec §3 explicitly forbids multi-page routing for MVP. The whole experience is one vertical scroll. `src/App.tsx` is just a `QueryClientProvider` shell around `pages/HomePage.tsx`, which composes the seven page sections.

**Static-content backend.** There is no API. `public/content.json` holds every piece of dynamic content (name, years, about paragraphs, memories, gallery items, final lines, all UI strings under `content.ui`). It is fetched once at boot through `src/content/useContent.ts` (TanStack Query, `staleTime: Infinity`, `refetchOnWindowFocus: false`). When a real backend lands, only `useContent.ts` changes.

**State lives where it's used.** Almost no shared state exists. Carousel index, lightbox index, video-playing flag — all local to their section. The only persisted flag is `introSeen` in localStorage, owned by `hooks/useLocalStorageFlag.ts`. **Do not introduce Zustand/Redux/Jotai/MobX** unless a concrete cross-tree need appears (e.g. theme switcher, admin edit-mode, auth).

### Folder layout (`src/`)

| Folder | Contains | Notes |
|---|---|---|
| `pages/` | `HomePage.tsx` | Owns intro lifecycle, hero visibility, and section composition. New routes (e.g. `AdminPage`) would land here. |
| `sections/` | 7 page-level blocks (Hero, About, Film, Memories, Gallery, Final, IntroOverlay) | Used **once** each. Distinct from `components/`. |
| `components/ui/` | `Reveal`, `SectionLabel`, `NavArrow`, `ThemeToggle` | Generic primitives — reusable anywhere. `ThemeToggle` is rendered at `HomePage` level outside `<main>`, gated on `!introVisible`. |
| `components/<feature>/` | `memory/MemoryCard`, `gallery/GalleryImage`, `gallery/Lightbox` | Domain-scoped components co-located by feature. |
| `content/` | `queryClient.ts`, `useContent.ts` | Data layer — the seam between Query cache and the rest of the app. |
| `hooks/` | `useLocalStorageFlag.ts`, `useTheme.ts` | Custom hooks. `useTheme` reads/writes `documentElement.dataset.theme` and persists to `localStorage['memorial:theme']`; the value is pre-resolved by an inline IIFE in `index.html` to avoid FOUC. |
| `lib/utils.ts` | `clamp`, `easeOut`, `INTRO_SEEN_KEY`, `THEME_KEY`, `cn`, `cssVars` | Non-React helpers + class-name and CSS-variable utilities. localStorage keys live here under the `memorial:` namespace. |
| `types/content.ts` | `Content`, `Memory`, `GalleryItem`, `FALLBACK` | Shared TS types. |
| `assets/` | empty (`.gitkeep`) | For **Vite-imported** assets. Content photos do **not** belong here. |

### Where assets live

- **`public/assets/`** holds `dove.png`, `hero.jpg`, gallery JPEGs — anything URL-referenced from `content.json`. Vite serves them as-is.
- **`public/`** holds `favicon.svg` and `icons.svg` (sprite).
- **`src/assets/`** is reserved for future bundled imports (e.g. `import logo from '../assets/logo.svg'`). Empty today because every SVG in components is inlined.

Moving content photos into `src/assets/` would require rewriting every URL in `content.json` to a Vite import — don't do it.

## Styling

**CSS Modules + SCSS, co-located per component.** Every component has a sibling `Component.module.scss`, imported as `import styles from './Component.module.scss'` and applied with `className={styles.x}`. SCSS via `sass-embedded` (devDep). SCSS-style nesting only — native CSS nesting is not used, for consistency.

`src/index.css` is the **only** global stylesheet. It contains tokens (`:root` CSS custom properties), the `*` box-sizing reset, `html`/`body`/`main` resets, the `button { font-family: inherit }` rule, `::selection`, and a reserved spot for the future `[data-theme="dark"]` block. **Do not add component styles, hover rules, keyframes, or media queries to `index.css`** — they belong in the relevant `.module.scss`.

**Class composition.** Use `cn()` from `lib/utils.ts` for conditional classes (e.g. `cn(styles.tile, img.tall && styles.tall)`).

**Dynamic styles.** Boolean toggles → modifier class via `cn()` (e.g. `&.visible`, `&.active`). Computed values (animation frame state, layout offsets, aspect ratios, prop-driven delays) → CSS custom properties via `cssVars()` from `lib/utils.ts` (e.g. `style={cssVars({ '--reveal-delay': delay + 'ms' })}`). SCSS reads them via `var(--reveal-delay, 0ms)`. **Pass length/angle units inside the JS string** (`${px}px`, `${deg}deg`) — React does not auto-suffix custom properties. Never write inline `style={{ ... }}` for static values.

**Keyframes** are co-located with the component that owns them. CSS Modules scopes `@keyframes` names automatically; `animation:` references inside the same module pick up the scoped name. Do not add new global keyframes to `index.css`.

**SVG icons used as `mask-image` must be filled white.** Default `mask-mode: match-source` reads luminance for SVG sources, so a black-filled SVG renders as fully transparent in Firefox and Chrome 120+. PNGs work either way (raster sources read alpha). The displayed colour of a masked icon is controlled by `background-color` on the host element — `var(--text)` for theme-aware icons. Examples: `public/icons/sun.svg`, `public/icons/moon.svg`.

**Type safety.** `typescript-plugin-css-modules` registered in `tsconfig.app.json` gives editor autocomplete and unknown-class warnings; an ambient `declare module '*.module.scss'` in `src/vite-env.d.ts` covers `tsc -b`. **The editor must use the workspace TypeScript** (VS Code/Cursor: "Use Workspace Version") for the plugin to activate.

**Class naming.** Write class names in `camelCase` directly inside `.module.scss` (e.g. `.navArrow`, `.playButton`) so they import as `styles.navArrow` with no `localsConvention` config.

Theme switching uses the `data-theme` attribute on `<html>` per Design Foundation §11. The attribute is set before React mounts by an inline IIFE in `index.html` (reads `localStorage['memorial:theme']`, falls back to `prefers-color-scheme`) — this prevents a flash-of-wrong-theme on first paint. Once mounted, `src/hooks/useTheme.ts` owns the in-app state and toggle. Dark-token values live under `[data-theme="dark"]` in `index.css`. The floating toggle button (`src/components/ui/ThemeToggle.tsx`) is rendered at the `HomePage` level outside `<main>` and gated on `!introVisible` so it does not appear during the intro/dove animation; its `z-index: 40` sits below the lightbox (`z-index: 50`), so the lightbox correctly overlays it.

## Conventions

- **No path aliases.** `tsconfig.app.json` and `vite.config.ts` define none — all imports are relative.
- **PascalCase** for component files, **camelCase** for hooks (`useX.ts`) and utilities.
- **Default export** for components, **named exports** for hooks and utils.
- **i18n boundary:** all user-visible UI text comes from `content.ui.*` with a Russian inline fallback (`content.ui.skipIntro ?? 'пропустить'`). Do not hardcode Russian (or English) directly in components. Dynamic content (memories, gallery, etc.) comes from the typed top-level fields, not `ui`.
- **`react-hooks/set-state-in-effect`** is enforced (eslint-plugin-react-hooks v7). If you find yourself writing `useEffect(() => setX(...), [y])`, derive `x` at `useState` initialization instead.

## Commit Convention

Enforced by Husky `commit-msg` hook running commitlint (`commitlint.config.js`). Every commit must follow:

```
type(scope): description
```

- **Types:** `feat`, `fix`, `refactor`, `style`, `docs`, `chore`, `build`, `ci`, `perf`
- **Scopes (granular):**
  - Section/page level: `home`, `admin`, `intro`, `hero`, `about`, `film`, `memories`, `gallery`, `final`
  - Layer level: `content`, `ui`, `hooks`, `lib`, `types`
  - Cross-cutting: `global`, `deps`, `config`, `i18n`, `assets`
- **Subject rules:** imperative, first word lowercase, no trailing period, header ≤ 100 chars. Mid-sentence capitals are allowed for code identifiers and proper names (e.g. `useContent`, `Escape`); banned cases are sentence-case starts, Title Case, PascalCase, and ALL CAPS.
- **Scope is required** (`scope-empty: never`). If a needed scope isn't in the list, add it to `commitlint.config.js` deliberately — never invent ad-hoc scopes.
- Optional ticket id may be inserted after the colon: `feat(memories): #123 pause auto-advance`.

Examples:
```
feat(memories): pause auto-advance on swipe
fix(gallery): close lightbox on Escape inside text input
refactor(content): split useContent error path
chore(deps): bump @tanstack/react-query
```

Pre-commit also runs `lint-staged` (eslint --fix on staged `*.{ts,tsx}`).

## Guardrails (hooks + permissions)

Deterministic boundaries that do not depend on the prompt. Defined in `.claude/settings.json` (committed) and `.claude/hooks/*.sh`. Adapted from the Cactus Blueprint Harness; the analysis and rationale are in the journal entry for `plan-adopt-harness-guardrails`.

**Permissions** (`settings.json`): `allow` covers read-only git, the routine local git mutations (`add`, `commit`, `switch`, `stash push/pop`), the npm/npx gate commands, file listing/search, and `curl` against localhost only. `ask` covers anything that touches a remote or discards work: `git push`, rebase, `git checkout --`, `branch -D`, `stash drop/clear`, every `npm install` variant, `npx husky`. `deny` covers reading `.env.local` / `.env.*.local` / key material / `secrets/`, editing `package-lock.json` and `.github/workflows/`, `rm -rf`, force-push, `git reset --hard`, `git clean`, `sudo`. Deny and ask apply in every permission mode, including `auto`.

**`protect-paths.sh`** — `PreToolUse` on `Edit|Write|MultiEdit|NotebookEdit|Bash`. Blocks (exit 2, reason on stderr) writes to the same protected set *and* the shell equivalents per-tool rules cannot see: `cat .env.local`, `tee package-lock.json`, `> .env.local`, `cp x secrets/`, `rm -rf` in any flag spelling, `find -delete`, force-push (incl. `git -C`), `reset --hard`, `clean -f`, `curl | sh`. With `CLAUDE_VERIFY_LOCK=1` it also locks the gate that judges the agent — `eslint.config.js`, `tsconfig*.json`, `commitlint.config.js`, `package.json`, `.husky/`, `.claude/hooks/`, `.claude/settings.json`, test files — against Edit/Write, `sed -i`, and cp/mv/tee. Set the lock only for unattended runs; interactively these files stay editable.

**`gate.sh`** — `Stop` hook. When Claude ends a turn with changed `.ts/.tsx/.js`, `tsconfig*.json` or `package*.json` in the working tree it runs `npm run lint` then `npx tsc -b` (~4 s). Red blocks the stop with the failure tail; Claude fixes and tries again, at most `CLAUDE_GATE_MAX` (3) times per chain, then the stop is released with a warning. Clean tree, `.md`/`.scss`-only changes, and plan mode cost nothing. `CLAUDE_GATE=0` disables it. It does **not** run `npm run build` — that stays in `/finalize`.

**Tests:** `bash .claude/hooks/test-hooks.sh` pipes synthetic payloads (Windows-style paths included) through both hooks and asserts exit codes. Run it after any hook or pattern change.

**Gotchas:**
- Hooks are bash and need Git Bash. They are wired in *shell form* (`bash "${CLAUDE_PROJECT_DIR}/.claude/hooks/x.sh"`). Never switch to exec form (`"command": "bash", "args": [...]`) — on this machine `bash` on the Windows PATH is WSL, not Git Bash.
- Hooks match command **text**, not semantics. A heredoc or commit message containing `rm -rf`, `secrets/`, `credentials` or `.env.local` is blocked. Write such text to a file instead of inlining it.
- `.gitattributes` forces LF on `*.sh`, `.claude/hooks/*` and `.husky/*` because `core.autocrlf=true` would otherwise break the shebangs. The exec bit is set in the index via `git update-index --chmod=+x` (NTFS has none).
- Windows paths arrive as `D:\proj\file`; the hooks normalise to `/` and match case-insensitively before comparing.

## Environment Configuration

Vite convention. Files at repo root:

- `.env` — committed defaults shared by all environments
- `.env.development` — `npm run dev`
- `.env.production` — `npm run build`
- `.env.staging` — staged builds (when added)
- `.env.local`, `.env.<mode>.local` — **never committed** (Vite gitignores by default). These are the only env files the guardrails protect: `Read`/`Edit` deny rules and `protect-paths.sh` block them; `.env` and `.env.<mode>` stay editable because they hold committed defaults.

**Variables exposed to the client must be prefixed `VITE_`.** Read them via `import.meta.env.VITE_X`. Anything without the prefix stays server/build-time only.

Current variables: **none.** Likely future additions when needed:
- `VITE_CONTENT_URL` — if `content.json` moves off `public/` to a CDN
- `VITE_API_BASE` — when admin gets a backend
- analytics / error-reporting keys (e.g. `VITE_SENTRY_DSN`)

When adding a variable: declare it in `.env`, document it here, and read it at the data layer (`src/content/`) — never inline in section components.

## UI Libraries

**Status today: none, intentionally.** Frontend Spec §11 ("minimal dependencies") and Design Foundation §10 ("no heavy styling") forbid a UI library on the public side. All controls are hand-rolled with CSS Modules + SCSS over the CSS-variable token set in `index.css`.

**Guardrail for the future:** if a UI library is added, it must be used **only inside `pages/admin/**` and `components/admin/**`** — never in `pages/HomePage.tsx`, `sections/*`, or the public `components/*` tree. The two visual languages must not bleed.

Shortlist when admin starts (decide then, not now):
- **Mantine** — comprehensive, batteries-included forms/tables/modals. Lowest effort.
- **shadcn/ui** — copy-paste primitives over Tailwind. Type-safe, you own the code.

## Development Journal

Append-only history of *why* the project got to its current state. Lives at:

- `.claude/plans/INDEX.md` — chronological index of all entries, newest at the top
- `.claude/plans/TEMPLATE.md` — the 5-section template, shared by all entries. Includes a `### Prevention` subsection (mistakes hit during the plan → what to check next time) and an **Explicitly not needed now** line under Tradeoffs.
- `.claude/plans/journal/<YYYY-MM-DD>-<slug>.md` — one entry per plan-mode session
- `.claude/plans/SESSION-HANDOFF-TEMPLATE.md` — template for `.claude/plans/session-handoff.md`, the mid-plan continuation bridge. Write it when a session stops in the middle of a plan (context budget, end of day, blocked question); its **Exact Next Step** must be executable by a fresh session without re-deriving anything. `/journal` reads it and deletes it when the plan closes. The journal records *why*; the handoff records *what to do next*.

The journal answers questions CLAUDE.md cannot: rejected alternatives, dead ends, the date a decision was made, what the project looked like before. **CLAUDE.md is the snapshot; the journal is the timeline.**

Write entries via the `/journal` skill (`.claude/skills/journal/SKILL.md`). The rule: **one entry per plan**, sealed when the next plan starts. Sealed entries are never edited — if new context contradicts an old entry, write a new entry that references the old one.

**Known limitation:** the `/journal` skill only scans `.claude/plans/plan-*.md`. Plans authored via Claude Code plan-mode land at `~/.claude/plans/<slug>.md` and are invisible to `/journal` (and therefore `/finalize`'s journal gate). Until that's resolved (separate planned work), author or copy plan files into the project's `.claude/plans/` location.

## Project Skills

Custom slash commands live in `.claude/skills/`. Run them by invoking the slash command (e.g. `/finalize`).

| Skill | Purpose |
|---|---|
| `/finalize` | Post-implementation gate chain: lint → tsc → pedantic-code-reviewer → build → /journal. Always run before declaring a planned task complete. |
| `/journal` | Create / update / seal the development-journal entry for the active plan. Looks for `.claude/plans/plan-*.md` (see Known Limitations above). Called automatically as the last gate of `/finalize`. |
| `/commit` | Create a conventional-commit-formatted commit for current work. Validates against `commitlint.config.js`. Never auto-run by `/finalize`. |
| `/coding-standards` | Baseline coding conventions referenced by Working Rules. |
| `/intake-grill` | Structured clarification before implementation: explore the repo first, then ≤4 questions per `AskUserQuestion` round, recommended option first, five completion criteria in `completion.md`. Triggers: new feature, multi-file refactor, prompt without acceptance criteria. Not for point edits. |
| `/write-a-skill` | How to author a new skill under `.claude/skills/`: trigger-rich `Use when` description, short procedural body, one-level references, review checklist. |
| `/tdd` | Red-green-refactor loop with reference notes on good tests, mocking at boundaries, interface design, deep modules. Dormant until a test framework lands (tests are MVP out-of-scope). |

Custom agent: `.claude/agents/pedantic-code-reviewer.md` — invoked from `/finalize` Gate 3 with the current `git diff HEAD`.

## Working Rules

> Baseline coding conventions: `.claude/skills/coding-standards/skill.md`. The rules below are the project-specific layer that augments it.

1. **Mandatory Interaction.** Before any code change, summarize understanding in 1–5 sentences. For code modification, file creation, refactor, or command execution: describe the change (files, what, risk) and request explicit approval before acting. Exception: edits inside an already-approved plan are pre-approved at the file-list level shown in the plan — no per-file re-confirmation needed.

   **Method for non-trivial tasks:** when the task adds new functionality, refactors several files, or arrives without acceptance criteria, run `/intake-grill` first — explore the repo for discoverable answers, then ask in rounds of ≤4 questions via `AskUserQuestion` with the recommended option first, until the five criteria in `.claude/skills/intake-grill/completion.md` hold. Record answers in the plan's `## Intake` table (or in the 1–5 sentence summary outside plan mode). Point edits to one file skip the grill and follow the rule as written above.

2. **Problem-Solving Approach.** Apply KISS / YAGNI / DRY / SOLID. When several strong approaches exist, present them all with tradeoffs so the user can choose. If confidence is below 90%, state assumptions and propose clarifying questions before implementing.

3. **Post-Implementation pipeline.** After completing a planned set of changes, run `/finalize` (`.claude/skills/finalize/SKILL.md`). It runs five gates in cost-ascending order with a fix-and-retry loop per gate:

   `npm run lint → npx tsc -b → pedantic-code-reviewer agent → npm run build → /journal → done`

   The reviewer (`.claude/agents/pedantic-code-reviewer.md`) catches architectural/logic/design issues automated tools can't see — Critical and Major findings are auto-applied (with a Gate 1+2 re-run to confirm no regression); Minor findings are surfaced for the user to decide per-item. `/journal` is the human-readable handover gate — it writes or updates the journal entry for the active plan so the next session inherits context. **Never declare done before all five gates pass.** `/finalize` does not auto-commit; commit timing remains explicit (use `/commit`).

   The `gate.sh` Stop hook (see Guardrails) re-runs lint + tsc automatically whenever a turn ends with code changes. It is a safety net under `/finalize`, not a replacement: it does not run the reviewer, the build, or the journal.

4. **CLAUDE.md drift check.** After any architecture-significant change (new dep, new layer, new top-level folder, removed convention, new pattern), propose CLAUDE.md updates as part of the same commit. The reviewer should flag drift; if the doc is silently lying about reality, treat it as a Major issue.

5. **Confidence Level always.** Every Claude message in this repo ends with:
   `Current Confidence: X% — short reason`
   This applies regardless of mode (plan / auto / normal) and regardless of message size. For confidence < 90%: include the key assumptions and the cheapest way to raise confidence (a file to read, a question to answer, a command to run).

## What's intentionally out of scope (per the MVP plans)

Authentication · admin panel · user-generated content · multi-language UI · real video player (today's `playing` flag only swaps caption text) · timeline · tests · React Query Devtools · routing.

Frontend Spec §15 lists the future extensions; introducing any of them without aligning with the planning docs first will break the project's "content over interface" philosophy.