# Adopt CSS Modules + SCSS for component styling

**Date:** 2026-05-06
**Plan:** 1-yes-2-on-misty-giraffe
**Commits:** uncommitted at time of writing
**Status:** Done

## Why

The MVP shipped with inline `style={}` blocks on every component (12 of 16 `.tsx` files). JSX bodies were dominated by style objects; hover and animation states had leaked into a global `index.css` that used `!important` solely to out-specificity inline styles; and the planned `data-theme="dark"` switcher (Design Foundation §11) had nowhere clean to put tokens. Component bodies were noisy, the global CSS was a code smell driven by the styling choice itself, and there was no path forward for theming.

## What we built

A one-PR migration to **CSS Modules + SCSS, co-located per component, with type safety from day one**. Every component now has a sibling `Component.module.scss`, imported as `import styles from './Component.module.scss'`. SCSS via `sass-embedded` (devDep). 13 new `.module.scss` files; all 12 components with inline styles converted; every `!important` hack removed. Two helpers added to `lib/utils.ts`: `cn(...parts)` for conditional class composition and `cssVars(vars)` for the dynamic-value bridge — CSS variables passed via `style={cssVars({...})}` and consumed in SCSS via `var(--x)`. Single-use `@keyframes` (`replaySpin`, `scrollHintPulse`, `fadeIn`) co-located with their owning module. `index.css` shrank to design tokens, resets, `::selection`, and a reserved placeholder for `[data-theme="dark"]`.

A side fix during pedantic review: `GalleryImage` was refactored to own its own `<button>` root, eliminating a fragile cross-module hover dependency that the original `GallerySection` → `GalleryImage` split had introduced.

## Architecture impact

- New devDeps: `sass-embedded`, `typescript-plugin-css-modules`.
- New file: `src/vite-env.d.ts` with ambient `declare module '*.module.scss'` so `tsc -b` accepts the imports.
- Modified: `src/lib/utils.ts` (added `cn`, `cssVars`); `tsconfig.app.json` (registered the TS plugin); `src/index.css` (stripped to tokens + resets); CLAUDE.md (Styling section rewritten end-to-end, folder table updated, UI Libraries wording corrected).
- New convention: per-component `Component.module.scss` co-located with `Component.tsx`; class names in `camelCase`; dynamic values via CSS custom properties, never inline `style={...}` for static values.
- No behavioral change to public site UI; build size identical (CSS bundle 11.57 kB / 3.16 kB gzip).

## Tradeoffs

- **Tailwind / UnoCSS rejected** — atomic utility classNames reproduce the inline-style "verbose JSX" pain that prompted the migration. Strengths (fast iteration on dense UI) don't apply to a 7-section content-first site.
- **vanilla-extract / Panda CSS / StyleX rejected** — type-safe styles-as-TS pay off at design-system scale or with multiple frontend devs. Overkill for ~10 components and one author. Worth revisiting when admin lands.
- **Runtime CSS-in-JS (Emotion, styled-components) rejected** — runtime cost, React-18 streaming friction, ecosystem moving off it since 2023.
- **`sass-embedded` chosen over `sass`** — faster on incremental HMR, prebuilt Windows binaries, single dep.
- **`typed-scss-modules` (CLI-checked exact class names) rejected** — generates `.d.ts` files into git status; `typescript-plugin-css-modules` (IDE) + ambient declaration covers the practical need at this scale.
- **`clsx` rejected** — six-line in-house `cn()` covers every conditional case; honors "minimal deps" guardrail.
- **Native CSS nesting rejected** — capable in 2026, but SCSS nesting was the user preference. Consistency over purity.
- **Renaming `index.css` → `index.scss` rejected** — file uses no SCSS features; rename would be cosmetic.
- **Light/dark theme deferred** — explicitly carved out as the next plan; this migration just preserves the contract for it.

## Known limitations / follow-ups

- **Light/dark theme + bottom-right toggle** — placeholder reserved in `index.css`; the next plan implements the global theme service and switcher button.
- **`prefers-reduced-motion`** — pre-existing gap; not introduced here, but every motion site was touched, so it's the natural moment to address it next time animations are revisited.
- **Latent grid-row-end on tall gallery items** — original code applied `gridRowEnd: 'span 2'` to a button nested inside `Reveal`, which means the directive never reached the actual grid item. Migration preserved that behavior (now `&.tall` on the same nested element). Real fix requires either eliminating the `Reveal` wrapper around gallery tiles or moving the modifier to the Reveal's root.
- **Class-deletion silent failure** — if a class is removed from a `.module.scss` but the TS still references `styles.x`, the build won't fail (ambient decl returns `string`); the IDE plugin is the only guard. Worth documenting if it bites.
