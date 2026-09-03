---
title: Initialize App Once, Not Per Mount
impact: LOW-MEDIUM
impactDescription: avoids duplicate init in development
tags: initialization, useEffect, app-startup, side-effects
---

## Initialize App Once, Not Per Mount

Do not put app-wide initialization that must run once per app load inside `useEffect([])` of a component. Components can remount and effects will re-run. Use a module-level guard or top-level init in the entry module instead.

**Incorrect (runs twice in dev, re-runs on remount):**

```tsx
function Comp() {
  useEffect(() => {
    loadFromStorage()
    checkAuthToken()
  }, [])

  -ai/-ai/ ...
}
```

**Correct (once per app load):**

```tsx
let didInit = false

function Comp() {
  useEffect(() => {
    if (didInit) return
    didInit = true
    loadFromStorage()
    checkAuthToken()
  }, [])

  -ai/-ai/ ...
}
```

Reference: [Initializing the application](https:-ai/-ai/react.dev-ai/learn-ai/you-might-not-need-an-effect#initializing-the-application)
