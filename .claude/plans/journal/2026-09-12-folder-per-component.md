# Folder per component in `src/`

**Date:** 2026-09-12
**Plan:** plan-folder-per-component
**Commits:** uncommitted at time of writing
**Status:** Done

## Why
`components/ui/` held 14 loose files, `components/auth/` 17, `sections/` 13 — every `X.tsx` next to its `X.module.scss` in one flat list, so the explorer showed a pile rather than units. `components/memory/` and `components/gallery/` each held one or two components. The user asked for a folder per component so that the pair `Button.tsx` + `Button.module.scss` reads as one thing, and for the same treatment across sections and the auth UI. Exploration confirmed the move was tooling-safe: nothing under ESLint / tsconfig / Vite / hooks / lint-staged / `settings.json` hard-codes folders under `src/`, no SCSS `@use`/`@import` between modules, no barrels, no aliases.

## What we built
- **24 component folders** via `git mv` (48 renames, history preserved): 7 in `sections/<Name>/`, 10 in `components/ui/<Name>/`, 8 in `components/auth/<Name>/`. `components/memory/` and `components/gallery/` are gone.
- **`MemoryCard`, `GalleryImage`, `Lightbox` moved into `components/ui/`** by explicit user decision. `ui/` is therefore redefined in CLAUDE.md as "all presentational components — primitives *and* content units"; the split against `components/auth/` is by feature, not by reuse count.
- **~72 relative import specifiers rewritten** in 25 files (all sections, all `ui/*` and `auth/*` components, `HomePage.tsx`). `./X.module.scss` imports untouched — SCSS travelled with its component. Diff inside `src/` is import lines only; the reviewer confirmed zero behavioural drift.
- **Docs**: CLAUDE.md folder table + new *Folder per component* convention; `.claude/skills/commit/SKILL.md` scope table rewritten to folder globs (domain rows for `MemoryCard` / `GalleryImage` / `Lightbox` placed before the `ui/**` catch-all, plus a previously missing `auth` row); `.claude/agents/pedantic-code-reviewer.md` tree description rewritten (it still described inline styles, no router, `useLocalStorageFlag.ts`).

## Architecture impact
No new deps. New convention (CLAUDE.md → Conventions): *every component `X.tsx` lives in `X/` beside its `X.module.scss`; import the file, not the folder (`'../ui/Button/Button'`); no `index.ts` barrels; helpers (`.ts`) and layer folders (`auth/`, `hooks/`, `lib/`, `content/`, `types/`, `pages/`) stay flat.* This overrides the `components/Button.tsx` example in the baseline coding-standards skill, which was left unchanged as the cross-project layer.

## Tradeoffs
- **Barrel `index.ts` per folder** — shorter imports (`'../ui/Button'`) but ~25 re-export files, a new convention, and an unverified interaction with `react-refresh/only-export-components`. Rejected for KISS; the duplicated segment `Button/Button` is the accepted cost.
- **`index.tsx` as the component file** — short imports, no extra file, but a dozen identical editor tabs and the `.tsx`/`.scss` pair no longer shares a name. Rejected.
- **Colocating `MemoryCard` under `sections/MemoriesSection/`** (and gallery pieces under `GallerySection/`) — the recommended option; would have kept `ui/` as "reused primitives". The user preferred one home for all presentational components; `ui/` was redefined instead.
- **Nested auth tree** (`AuthCta/AuthModal/LoginForm/…`) — mirrors ownership but 4 levels deep and `../../../../ui/...` paths without aliases. Flat per-component folders chosen.
- **Merging `components/auth/` into `src/auth/`** — would blur "auth/ is logic only, no UI". Rejected.

**Explicitly not needed now:** path aliases (`@/`), barrels, restructuring `src/auth/`, renaming `components/ui/` to `components/`, sub-grouping inside `ui/` (primitives vs content), tests.

## Known limitations / follow-ups
- Reviewer Minor (informational, no action): the `auth` scope row in the commit skill is a substantive addition riding along with a path-rename doc update; recorded here so nobody hunts for a dedicated auth-tooling commit.
- The `/journal` plan-file limitation still applies: this plan was authored in plan mode at `~/.claude/plans/` and copied to `.claude/plans/plan-folder-per-component.md` by hand.
- Sealed journal entries (`2026-05-06-genesis.md`) still name the old flat paths — intentionally untouched.
