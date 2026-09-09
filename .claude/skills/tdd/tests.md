# Good and Bad Tests

Examples are illustrative (shown in a TypeScript-like syntax); the principles
are language-agnostic.

## Good tests

**Integration-style** — exercise real code paths through public APIs.

```
test("user can checkout with valid cart", async () => {
  const cart = createCart();
  cart.add(product);
  const result = await checkout(cart, paymentMethod);
  expect(result.status).toBe("confirmed");
});
```

- Tests behavior callers care about, through the public API only.
- Describes WHAT, not HOW. One logical assertion per test.
- Survives internal refactors.

## Bad tests

**Implementation-detail tests** — coupled to internal structure.

```
test("checkout calls paymentService.process", async () => {
  const mock = mockOf(paymentService);
  await checkout(cart, payment);
  expect(mock.process).toHaveBeenCalledWith(cart.total);   // asserts HOW
});
```

Red flags: mocking internal collaborators; testing private methods; asserting
on call counts/order; the test name describes HOW; the test breaks on a
behavior-preserving refactor.

**Verify through the interface, not around it:**

```
// BAD: bypasses the interface
test("createUser saves to database", async () => {
  await createUser({ name: "Alice" });
  const row = await db.query("SELECT * FROM users WHERE name = ?", ["Alice"]);
  expect(row).toBeDefined();
});

// GOOD: observable through the interface
test("createUser makes the user retrievable", async () => {
  const user = await createUser({ name: "Alice" });
  expect((await getUser(user.id)).name).toBe("Alice");
});
```
