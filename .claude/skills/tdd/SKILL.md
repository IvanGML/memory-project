---
name: tdd
description: Test-driven development through a red-green-refactor loop — one failing test, minimal code to pass, refactor on green. Use when building a feature or fixing a bug test-first, when the user mentions TDD, red-green-refactor, tracer bullets, or integration tests, or when a test framework has been added to the project. Do not use while tests are out of scope for the MVP (see CLAUDE.md) unless the user asks.
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Test-Driven Development

Adapted from Matt Pocock's `tdd` skill
(<https://github.com/mattpocock/skills>, MIT) via the Cactus Blueprint Harness.

**Project note:** memory-project has no test framework today and the MVP plans
list tests as out of scope. This skill is kept for the moment that changes;
Vitest is the natural fit alongside Vite. Do not add a test framework because
this skill exists — add it when logic warrants it and the user agrees.

## Philosophy

Tests verify **behavior through public interfaces**, not implementation
details. Code can change entirely; good tests should not. A good test reads
like a specification ("intro is skipped when introSeen is set") and survives
refactors because it does not care about internal structure. A test that
breaks when you rename an internal function — with behavior unchanged — was
testing implementation. See [tests.md](tests.md) and [mocking.md](mocking.md).

## Anti-pattern: horizontal slices

**Do not write all the tests first, then all the implementation.** Bulk-written
tests verify *imagined* behavior — they test the shape of things, pass when
behavior breaks, and outrun what you actually know.

Slice vertically. One test → one implementation → repeat, each cycle responding
to what the last one taught you.

```
WRONG (horizontal):  RED: test1..5   then  GREEN: impl1..5
RIGHT (vertical):    test1→impl1, test2→impl2, test3→impl3, ...
```

## Workflow

### 1. Plan
- Use the project's vocabulary (sections, memories, gallery items, intro) so
  test names match the domain; respect the specs in `.claude/foundation/`.
- Confirm with the user: what the public interface should be, and **which
  behaviors matter most** — you cannot test everything.
- Design for [testability](interface-design.md) and [deep modules](deep-modules.md).
- List behaviors to test (not implementation steps); get approval.

### 2. Tracer bullet
Write ONE test for ONE behavior. `RED` (fails) → minimal code → `GREEN`
(passes). This proves the path end-to-end.

### 3. Incremental loop
For each remaining behavior: `RED` (next test fails) → minimal code → `GREEN`.
One test at a time. Only enough code to pass the current test. Do not
anticipate future tests.

### 4. Refactor (only on green)
After tests pass, look for [refactor candidates](refactoring.md): duplication,
shallow modules to deepen, what the new code reveals about the old. Run tests
after each step. **Never refactor while red.**

## Per-cycle checklist

```
[ ] Test describes behavior, not implementation
[ ] Test uses the public interface only
[ ] Test would survive an internal refactor
[ ] Code is minimal for this test
[ ] No speculative features added
```

## Never weaken the gate

If a test is red, fix the implementation. Do not edit the test, the ESLint or
TypeScript config, or the hooks to make it pass. Under `CLAUDE_VERIFY_LOCK=1`
the `protect-paths.sh` hook enforces this mechanically.
