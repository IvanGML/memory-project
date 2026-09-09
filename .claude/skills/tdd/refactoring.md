# Refactor Candidates

After a green TDD cycle, look for:

- **Duplication** → extract a function/class.
- **Long methods** → break into private helpers (keep tests on the public
  interface).
- **Shallow modules** → combine or deepen (small interface, more behavior
  hidden inside).
- **Feature envy** → move logic to where the data lives.
- **Primitive obsession** → introduce value objects.
- **Existing code** that the new code reveals as problematic.

Rules:

- Refactor **only on green** — get all tests passing first, never refactor
  while red.
- Run the tests after **each** refactor step, not at the end.
- Refactoring changes structure, never behavior — if a test changes, it was
  not a refactor.
