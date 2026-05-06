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
| `components/ui/` | `Reveal`, `SectionLabel`, `NavArrow` | Generic primitives — reusable anywhere. |
| `components/<feature>/` | `memory/MemoryCard`, `gallery/GalleryImage`, `gallery/Lightbox` | Domain-scoped components co-located by feature. |
| `content/` | `queryClient.ts`, `useContent.ts` | Data layer — the seam between Query cache and the rest of the app. |
| `hooks/` | `useLocalStorageFlag.ts` | Custom hooks. |
| `lib/utils.ts` | `clamp`, `easeOut`, `INTRO_SEEN_KEY`, `cn`, `cssVars` | Non-React helpers + class-name and CSS-variable utilities. |
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

**Type safety.** `typescript-plugin-css-modules` registered in `tsconfig.app.json` gives editor autocomplete and unknown-class warnings; an ambient `declare module '*.module.scss'` in `src/vite-env.d.ts` covers `tsc -b`. **The editor must use the workspace TypeScript** (VS Code/Cursor: "Use Workspace Version") for the plugin to activate.

**Class naming.** Write class names in `camelCase` directly inside `.module.scss` (e.g. `.navArrow`, `.playButton`) so they import as `styles.navArrow` with no `localsConvention` config.

Theme switching uses `data-theme` attribute on `<html>` per Design Foundation §11 (planned, not yet wired). When implementing, set CSS variables under `[data-theme="dark"]` in `index.css`, persist preference in localStorage via `useLocalStorageFlag`.

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

## Environment Configuration

Vite convention. Files at repo root:

- `.env` — committed defaults shared by all environments
- `.env.development` — `npm run dev`
- `.env.production` — `npm run build`
- `.env.staging` — staged builds (when added)
- `.env.local`, `.env.<mode>.local` — **never committed** (Vite gitignores by default)

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
- `.claude/plans/TEMPLATE.md` — the 5-section template, shared by all entries
- `.claude/plans/journal/<YYYY-MM-DD>-<slug>.md` — one entry per plan-mode session

The journal answers questions CLAUDE.md cannot: rejected alternatives, dead ends, the date a decision was made, what the project looked like before. **CLAUDE.md is the snapshot; the journal is the timeline.**

Write entries via the `/journal` skill (`.claude/skills/journal/SKILL.md`). The rule: **one entry per plan**, sealed when the next plan starts. Sealed entries are never edited — if new context contradicts an old entry, write a new entry that references the old one.

## Working Rules

> Baseline coding conventions: `.claude/skills/coding-standards/skill.md`. The rules below are the project-specific layer that augments it.

1. **Mandatory Interaction.** Before any code change, summarize understanding in 1–5 sentences. For code modification, file creation, refactor, or command execution: describe the change (files, what, risk) and request explicit approval before acting. Exception: edits inside an already-approved plan are pre-approved at the file-list level shown in the plan — no per-file re-confirmation needed.

2. **Problem-Solving Approach.** Apply KISS / YAGNI / DRY / SOLID. When several strong approaches exist, present them all with tradeoffs so the user can choose. If confidence is below 90%, state assumptions and propose clarifying questions before implementing.

3. **Post-Implementation Review pipeline.** After completing a planned set of changes:
   `Implement → offer pedantic-code-reviewer agent → fix Critical & Major → defer-or-fix Minor (user decides) → npm run lint → /journal → done.`
   The reviewer (`.claude/agents/pedantic-code-reviewer.md`) catches architectural/logic/design issues lint can't see. **Lint is the final automated gate**; **`/journal` is the human-readable handover gate** — it writes or updates the journal entry for the active plan so the next session inherits context. Never declare done before both gates pass.

4. **CLAUDE.md drift check.** After any architecture-significant change (new dep, new layer, new top-level folder, removed convention, new pattern), propose CLAUDE.md updates as part of the same commit. The reviewer should flag drift; if the doc is silently lying about reality, treat it as a Major issue.

5. **Confidence Level always.** Every Claude message in this repo ends with:
   `Current Confidence: X% — short reason`
   This applies regardless of mode (plan / auto / normal) and regardless of message size. For confidence < 90%: include the key assumptions and the cheapest way to raise confidence (a file to read, a question to answer, a command to run).

## What's intentionally out of scope (per the MVP plans)

Authentication · admin panel · user-generated content · multi-language UI · real video player (today's `playing` flag only swaps caption text) · timeline · tests · React Query Devtools · theme switcher UI · routing.

Frontend Spec §15 lists the future extensions; introducing any of them without aligning with the planning docs first will break the project's "content over interface" philosophy.