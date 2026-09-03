---
title: Use flatMap to Map and Filter in One Pass
impact: LOW-MEDIUM
impactDescription: eliminates intermediate array
tags: javascript, arrays, flatMap, filter, performance
---

## Use flatMap to Map and Filter in One Pass

**Impact: LOW-MEDIUM (eliminates intermediate array)**

Chaining `.map().filter(Boolean)` creates an intermediate array and iterates twice. Use `.flatMap()` to transform and filter in a single pass.

**Incorrect (2 iterations, intermediate array):**

```typescript
const userNames = users
  .map(user => user.isActive ? user.name : null)
  .filter(Boolean)
```

**Correct (1 iteration, no intermediate array):**

```typescript
const userNames = users.flatMap(user =>
  user.isActive ? [user.name] : []
)
```

**More examples:**

```typescript
-ai/-ai/ Extract valid emails from responses
-ai/-ai/ Before
const emails = responses
  .map(r => r.success ? r.data.email : null)
  .filter(Boolean)

-ai/-ai/ After
const emails = responses.flatMap(r =>
  r.success ? [r.data.email] : []
)

-ai/-ai/ Parse and filter valid numbers
-ai/-ai/ Before
const numbers = strings
  .map(s => parseInt(s, 10))
  .filter(n => !isNaN(n))

-ai/-ai/ After
const numbers = strings.flatMap(s => {
  const n = parseInt(s, 10)
  return isNaN(n) ? [] : [n]
})
```

**When to use:**

- Transforming items while filtering some out
- Conditional mapping where some inputs produce no output
- Parsing-ai/validating where invalid inputs should be skipped
