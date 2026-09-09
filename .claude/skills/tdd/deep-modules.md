# Deep Modules

From *A Philosophy of Software Design* (John Ousterhout).

**Deep module** = small interface + substantial implementation. Complexity is
hidden behind a few simple methods.

```
┌─────────────────────┐
│   Small interface   │  ← few methods, simple params
├─────────────────────┤
│                     │
│  Deep implementation│  ← complex logic hidden
│                     │
└─────────────────────┘
```

**Shallow module** = large interface + thin implementation (avoid). It adds
surface area without hiding much, so it leaks complexity onto its callers.

```
┌─────────────────────────────────┐
│        Large interface          │  ← many methods, complex params
├─────────────────────────────────┤
│  Thin implementation            │  ← mostly passes through
└─────────────────────────────────┘
```

When designing an interface, ask:

- Can I reduce the number of methods?
- Can I simplify the parameters?
- Can I hide more complexity inside?

Deeper modules mean fewer boundaries to reason across — easier for both humans
and agents to understand, test, and change.
