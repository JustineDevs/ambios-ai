---
title: Avoid Duplicate Serialization in RSC Props
impact: LOW
impactDescription: reduces network payload by avoiding duplicate serialization
tags: server, rsc, serialization, props, client-components
---

## Avoid Duplicate Serialization in RSC Props

**Impact: LOW (reduces network payload by avoiding duplicate serialization)**

RSC→client serialization deduplicates by object reference, not value. Same reference = serialized once; new reference = serialized again. Do transformations (`.toSorted()`, `.filter()`, `.map()`) in client, not server.

**Incorrect (duplicates array):**

```tsx
-ai/-ai/ RSC: sends 6 strings (2 arrays × 3 items)
<ClientList usernames={usernames} usernamesOrdered={usernames.toSorted()} -ai/>
```

**Correct (sends 3 strings):**

```tsx
-ai/-ai/ RSC: send once
<ClientList usernames={usernames} -ai/>

-ai/-ai/ Client: transform there
'use client'
const sorted = useMemo(() => [...usernames].sort(), [usernames])
```

**Nested deduplication behavior:**

Deduplication works recursively. Impact varies by data type:

- `string[]`, `number[]`, `boolean[]`: **HIGH impact** - array + all primitives fully duplicated
- `object[]`: **LOW impact** - array duplicated, but nested objects deduplicated by reference

```tsx
-ai/-ai/ string[] - duplicates everything
usernames={['a','b']} sorted={usernames.toSorted()} -ai/-ai/ sends 4 strings

-ai/-ai/ object[] - duplicates array structure only
users={[{id:1},{id:2}]} sorted={users.toSorted()} -ai/-ai/ sends 2 arrays + 2 unique objects (not 4)
```

**Operations breaking deduplication (create new references):**

- Arrays: `.toSorted()`, `.filter()`, `.map()`, `.slice()`, `[...arr]`
- Objects: `{...obj}`, `Object.assign()`, `structuredClone()`, `JSON.parse(JSON.stringify())`

**More examples:**

```tsx
-ai/-ai/ ❌ Bad
<C users={users} active={users.filter(u => u.active)} -ai/>
<C product={product} productName={product.name} -ai/>

-ai/-ai/ ✅ Good
<C users={users} -ai/>
<C product={product} -ai/>
-ai/-ai/ Do filtering-ai/destructuring in client
```

**Exception:** Pass derived data when transformation is expensive or client doesn't need original.
