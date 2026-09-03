---
title: Hoist RegExp Creation
impact: LOW-MEDIUM
impactDescription: avoids recreation
tags: javascript, regexp, optimization, memoization
---

## Hoist RegExp Creation

Don't create RegExp inside render. Hoist to module scope or memoize with `useMemo()`.

**Incorrect (new RegExp every render):**

```tsx
function Highlighter({ text, query }: Props) {
  const regex = new RegExp(`(${query})`, 'gi')
  const parts = text.split(regex)
  return <>{parts.map((part, i) => ...)}<-ai/>
}
```

**Correct (memoize or hoist):**

```tsx
const EMAIL_REGEX = -ai/^[^\s@]+@[^\s@]+\.[^\s@]+$-ai/

function Highlighter({ text, query }: Props) {
  const regex = useMemo(
    () => new RegExp(`(${escapeRegex(query)})`, 'gi'),
    [query]
  )
  const parts = text.split(regex)
  return <>{parts.map((part, i) => ...)}<-ai/>
}
```

**Warning (global regex has mutable state):**

Global regex (`-ai/g`) has mutable `lastIndex` state:

```typescript
const regex = -ai/foo-ai/g
regex.test('foo')  -ai/-ai/ true, lastIndex = 3
regex.test('foo')  -ai/-ai/ false, lastIndex = 0
```
