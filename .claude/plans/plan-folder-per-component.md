# Plan: folder-per-component layout in `src/`

## Context

Today every component folder is flat: `components/ui/` holds 14 files (7 `.tsx` + 7 `.module.scss`), `components/auth/` holds 17, `sections/` holds 13. The user wants each component's `.tsx` and `.module.scss` pair wrapped in its own folder (`Button/Button.tsx` + `Button/Button.module.scss`) so the file explorer shows units, not a pile. Exploration confirmed the move is tooling-safe: nothing in ESLint/tsconfig/Vite/hooks/lint-staged/`settings.json` hard-codes folders under `src/`; no SCSS `@use`/`@import` between modules; no barrels; no path aliases. Only relative TS import specifiers (~72 cross-folder) and a few docs need to change.

## Intake (decisions taken with the user)

| Question | Decision |
|---|---|
| Import style | **No barrels.** `Button/Button.tsx`, imported as `'../ui/Button/Button'`. Keeps the "no `index.ts`" convention; grep finds one path. |
| Single-use content components (`MemoryCard`, `GalleryImage`, `Lightbox`) | **Move into `components/ui/`.** `components/memory/` and `components/gallery/` disappear. `ui/` is redefined as "all presentational components", not "reused primitives". |
| `components/auth/` | **Flat, one folder per component**; `errorText.ts` stays a loose helper file. |
| Non-component layers (`src/auth/`, `hooks/`, `lib/`, `content/`, `types/`, `pages/`) | **Untouched.** |

Rule that results: *every React component file `X.tsx` lives in a folder `X/` together with its `X.module.scss` (if any). Helpers (`.ts`) and layer folders stay flat. No `index.ts`.*

## Target tree

```
src/
  App.tsx  main.tsx  index.css  vite-env.d.ts         (unchanged)
  auth/  content/  hooks/  lib/  types/  assets/       (unchanged)
  pages/HomePage.tsx                                   (unchanged location, imports rewritten)
  sections/
    AboutSection/    AboutSection.tsx    AboutSection.module.scss
    FilmSection/     FilmSection.tsx     FilmSection.module.scss
    FinalSection/    FinalSection.tsx    FinalSection.module.scss
    GallerySection/  GallerySection.tsx  GallerySection.module.scss
    HeroSection/     HeroSection.tsx     HeroSection.module.scss
    IntroOverlay/    IntroOverlay.tsx    IntroOverlay.module.scss
    MemoriesSection/ MemoriesSection.tsx MemoriesSection.module.scss
  components/
    ui/
      Button/        Button.tsx        Button.module.scss
      GalleryImage/  GalleryImage.tsx  GalleryImage.module.scss     ← from components/gallery/
      Lightbox/      Lightbox.tsx      Lightbox.module.scss         ← from components/gallery/
      MemoryCard/    MemoryCard.tsx    MemoryCard.module.scss       ← from components/memory/
      Modal/         Modal.tsx         Modal.module.scss            (ModalHeader/Body/Footer stay named exports inside Modal.tsx)
      NavArrow/      NavArrow.tsx      NavArrow.module.scss
      Reveal/        Reveal.tsx        Reveal.module.scss
      SectionLabel/  SectionLabel.tsx  SectionLabel.module.scss
      TextField/     TextField.tsx     TextField.module.scss
      ThemeToggle/   ThemeToggle.tsx   ThemeToggle.module.scss
    auth/
      AuthCta/        AuthCta.tsx        AuthCta.module.scss
      AuthModal/      AuthModal.tsx                          (no scss)
      AuthNote/       AuthNote.tsx       AuthNote.module.scss
      AuthSwitch/     AuthSwitch.tsx     AuthSwitch.module.scss
      LoginForm/      LoginForm.tsx      LoginForm.module.scss
      PendingNotice/  PendingNotice.tsx  PendingNotice.module.scss
      RegisterForm/   RegisterForm.tsx   RegisterForm.module.scss
      SignOutButton/  SignOutButton.tsx  SignOutButton.module.scss
      errorText.ts                                            (loose helper, unchanged)
```

24 component folders created; `components/memory/` and `components/gallery/` removed.

## Steps

### 1. Move files with `git mv` (history preserved as renames)

One `git mv` per file, e.g.

```
git mv src/components/ui/Button.tsx          src/components/ui/Button/Button.tsx
git mv src/components/ui/Button.module.scss  src/components/ui/Button/Button.module.scss
git mv src/components/memory/MemoryCard.tsx  src/components/ui/MemoryCard/MemoryCard.tsx
git mv src/sections/HeroSection.tsx          src/sections/HeroSection/HeroSection.tsx
```

Same pattern for all 24 components listed above (`mkdir` the folder first; `git mv` does not create parents). `git status` must afterwards show renames (`R`), not delete+add — check with `git diff --stat -M HEAD` after staging.

### 2. Rewrite import specifiers

`./X.module.scss` imports (~28) stay as-is because SCSS moves with its component. Every other relative import in a moved file gains one `../`, and every importer of a moved component gains the `/X/X` folder segment. Patterns:

**Inside moved `components/ui/*/X.tsx` and `components/auth/*/X.tsx`** (now 3 levels deep):
- `'../../lib/utils'` → `'../../../lib/utils'`
- `'../../hooks/useTheme'` → `'../../../hooks/useTheme'`
- `'../../types/content'` → `'../../../types/content'`
- `'../../auth/…'` → `'../../../auth/…'` (AuthModal, LoginForm, RegisterForm, SignOutButton, and `errorText.ts` is NOT moved so it keeps `'../../auth/validators'`)
- `'../ui/Button'` → `'../../ui/Button/Button'`; `'../ui/Modal'` → `'../../ui/Modal/Modal'`; `'../ui/TextField'` → `'../../ui/TextField/TextField'`
- sibling auth components: `'./LoginForm'` → `'../LoginForm/LoginForm'`, `'./AuthSwitch'` → `'../AuthSwitch/AuthSwitch'`, `'./AuthNote'` → `'../AuthNote/AuthNote'`, `'./AuthModal'` → `'../AuthModal/AuthModal'`, `'./errorText'` → `'../errorText'`

**Inside moved `sections/*/X.tsx`** (now 2 levels deep):
- `'../lib/utils'` → `'../../lib/utils'`; `'../types/content'` → `'../../types/content'`
- `'../components/ui/Reveal'` → `'../../components/ui/Reveal/Reveal'` (same for `SectionLabel`, `NavArrow`)
- `'../components/memory/MemoryCard'` → `'../../components/ui/MemoryCard/MemoryCard'`
- `'../components/gallery/GalleryImage'` → `'../../components/ui/GalleryImage/GalleryImage'`; `Lightbox` likewise
- `'../components/auth/AuthCta'` → `'../../components/auth/AuthCta/AuthCta'`

**`src/pages/HomePage.tsx`** (not moved):
- `'../sections/HeroSection'` → `'../sections/HeroSection/HeroSection'` (×7 sections incl. `IntroOverlay`)
- `'../components/ui/ThemeToggle'` → `'../components/ui/ThemeToggle/ThemeToggle'`
- `'../components/auth/SignOutButton'` → `'../components/auth/SignOutButton/SignOutButton'`

Files touched for imports: all 7 sections, all 10 `ui/*` components except `Modal.tsx`/`SectionLabel.tsx` (they import only their own scss), all 8 `auth/*` components, `HomePage.tsx`. `App.tsx`, `main.tsx`, `src/auth/*`, `hooks/`, `lib/`, `content/`, `types/` untouched.

Do it by hand per file (24 + 1 files, ~72 specifiers); `npx tsc -b` is the checker for any miss.

### 3. Update docs that describe the tree

- **`CLAUDE.md`**
  - "Folder layout (`src/`)" table: `sections/` row → note folder-per-section; `components/ui/` row → list all 10 folders, redefine as "all presentational components — generic primitives *and* content units (`MemoryCard`, `GalleryImage`, `Lightbox`); the split against `auth/` is by feature, not by reuse count"; `components/<feature>/` row → now only `auth/`, list its 8 folders + `errorText.ts`; drop `memory/` and `gallery/`.
  - Add to **Conventions**: "**Folder per component.** Every component `X.tsx` lives in `X/` next to its `X.module.scss`; import the file, not the folder (`'../ui/Button/Button'`). No `index.ts` barrels. Helpers (`.ts`) and layer folders (`auth/`, `hooks/`, `lib/`, `content/`, `types/`) stay flat."
  - Update the two literal paths `src/components/ui/ThemeToggle.tsx` (Styling section) and any `components/gallery`/`components/memory` mention.
- **`.claude/skills/commit/SKILL.md`** scope-mapping table (lines ~96–114): exact-file rows become folder globs (`src/sections/HeroSection/**` → `hero`, etc.); `src/components/memory/**` → `src/components/ui/MemoryCard/**` → `memories`; `src/components/gallery/**` → `src/components/ui/{GalleryImage,Lightbox}/**` → `gallery`, placed **before** the `src/components/ui/**` → `ui` catch-all so domain scope wins.
- **`.claude/agents/pedantic-code-reviewer.md`** lines ~24–41: tree description is already stale (`useLocalStorageFlag.ts`, `src/types.ts`); rewrite to match the new layout so the reviewer does not flag the new structure as drift.
- `.claude/skills/coding-standards/skill.md` (`components/Button.tsx` naming example) is the cross-project baseline; **leave it** — CLAUDE.md is the project layer that overrides it, and the new Conventions bullet does so explicitly.
- Historical plan/journal entries (`plan-auth-public-private-split.md`) are sealed; do not edit.

### 4. Journal + finalize

- Copy this plan to `.claude/plans/plan-folder-per-component.md` (the `/journal` skill only scans `.claude/plans/plan-*.md`).
- Run `/finalize` (lint → tsc → reviewer → build → `/journal`). Journal entry slug: `2026-09-12-folder-per-component`; record the rejected alternatives (barrels, `index.tsx`, section-colocation for MemoryCard, nested auth tree, `@/` alias) and that `ui/` was deliberately redefined.
- Commit (via `/commit`, not auto): `refactor(global): move each component into its own folder` — code moves, import rewrites and the CLAUDE.md/skill/agent doc updates in one commit per Working Rule 4.

## Verification

1. `git status` — only renames plus modified importers; no stray untracked copies; `components/memory/` and `components/gallery/` gone.
2. `npm run lint` — clean (`react-refresh/only-export-components` unaffected: no new exports introduced).
3. `npx tsc -b` — clean; this is the authoritative catch for any missed specifier (unresolved module errors point at the file).
4. `npm run build` — clean; confirms Vite resolves the SCSS modules at their new paths.
5. `npm run dev`, open `/` → intro → hero → auth modal (login / register / pending views render, Button/TextField/Modal styles present); log in → `/memory` → scroll all sections, memories carousel with `MemoryCard`, gallery tiles + lightbox, theme toggle, sign out. Visual check confirms no `.module.scss` decoupled from its component (a missing class would render unstyled).
6. `gate.sh` Stop hook re-runs lint + tsc automatically at turn end.

## Explicitly not needed now

Path aliases (`@/`), barrel files, restructuring `src/auth/`, renaming `components/ui/` to `components/`, sub-grouping inside `ui/` (primitives vs content), tests.
