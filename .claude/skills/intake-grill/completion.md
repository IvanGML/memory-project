# Done When — Full Criteria

The grill is complete only when all five conditions hold. A waived condition
must be recorded as an explicit assumption in the plan's `## Intake` table (or
in the Working Rule 1 summary outside plan mode).

1. **The desired outcome is unambiguous** — not "improve the gallery" but
   "gallery tiles keep their aspect ratio on viewports under 400px."
2. **At least one testable acceptance criterion exists** — observable, binary,
   checkable in `npm run dev` or by the build; not "it feels smoother."
3. **Risk and hand-verification need are explicitly discussed** — the user has
   said whether they want to look at it before commit, not defaulted.
4. **Domain edge cases have been surfaced** — empty `content.json` arrays,
   missing assets, mobile layout, `prefers-reduced-motion`, dark theme —
   even if each is resolved as out of scope.
5. **What is explicitly not needed now is named** — the cheapest guard against
   scope creep; write it into the plan's non-goals.
