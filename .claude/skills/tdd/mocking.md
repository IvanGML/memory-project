# When to Mock

Mock at **system boundaries only**:

- External APIs (payment, email, …)
- Databases (sometimes — prefer a real test DB)
- Time / randomness
- File system (sometimes)

Do **not** mock your own classes, internal collaborators, or anything you
control. Mocking internals couples the test to implementation.

## Designing for mockability

**1. Inject dependencies — don't create them internally.**

```
// Easy to mock
function processPayment(order, paymentClient) {
  return paymentClient.charge(order.total);
}

// Hard to mock
function processPayment(order) {
  const client = new StripeClient(env.STRIPE_KEY);
  return client.charge(order.total);
}
```

**2. Prefer SDK-style interfaces over one generic fetcher.**

```
// GOOD: each function is independently mockable
const api = {
  getUser: (id) => fetch(`/users/${id}`),
  createOrder: (data) => fetch("/orders", { method: "POST", body: data }),
};

// BAD: the mock needs conditional logic to know what to return
const api = { fetch: (endpoint, options) => fetch(endpoint, options) };
```

The SDK shape means each mock returns one specific result, no branching in
test setup, and it is visible which boundary calls a test exercises.
