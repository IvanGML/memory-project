# Interface Design for Testability

Good interfaces make testing natural.

**1. Accept dependencies; don't create them.**

```
// Testable — the gateway is passed in
function processOrder(order, paymentGateway) { … }

// Hard to test — the gateway is hard-wired
function processOrder(order) { const g = new StripeGateway(); … }
```

**2. Return results; don't produce side effects.**

```
// Testable — assert on the return value
function calculateDiscount(cart): Discount { … }

// Hard to test — mutation hidden in a void call
function applyDiscount(cart): void { cart.total -= discount; }
```

**3. Keep the surface area small.**

- Fewer methods → fewer tests.
- Fewer parameters → simpler setup.

A small, value-returning, dependency-injecting interface is the shape that
both tests and callers find easy to use.
