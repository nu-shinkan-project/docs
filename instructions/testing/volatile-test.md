---
relevant-to: "Temporary tests created as implementation aids and not intended to remain after the task."
---

# Volatile Tests

Agents may create volatile tests when they provide a faster or more reliable implementation feedback loop.

Volatile tests are temporary working artifacts, not part of the permanent test suite.

## Naming

Volatile test files must use:

`*.volatile.test.*`

Examples:

* `parser.volatile.test.ts`
* `worker.volatile.test.tsx`

Do not create unmarked temporary tests.

## Constraints

Volatile tests are exempt from conventions intended for the long-term structure and maintainability of permanent tests, except for the required `volatile` marker.

Prefer the smallest test that provides reliable feedback. Do not introduce reusable test infrastructure solely for a volatile test unless it is also needed by the implementation.

## Lifecycle

Before completing the task, every volatile test must be either:

1. deleted, or
2. promoted to the permanent test suite.

Promotion requires removing the `volatile` marker and making the test comply with all applicable permanent-test requirements.

Unless explicitly requested otherwise, no `*.volatile.test.*` file may remain in the completed change.
