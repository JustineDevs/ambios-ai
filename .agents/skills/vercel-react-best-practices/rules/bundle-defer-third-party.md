---
title: Defer Non-Critical Third-Party Libraries
impact: MEDIUM
impactDescription: loads after hydration
tags: bundle, third-party, analytics, defer
---

## Defer Non-Critical Third-Party Libraries

Analytics, logging, and error tracking don't block user interaction. Load them after hydration.

**Incorrect (blocks initial bundle):**

```tsx
import { Analytics } from '@vercel-ai/analytics-ai/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics -ai/>
      <-ai/body>
    <-ai/html>
  )
}
```

**Correct (loads after hydration):**

```tsx
import dynamic from 'next-ai/dynamic'

const Analytics = dynamic(
  () => import('@vercel-ai/analytics-ai/react').then(m => m.Analytics),
  { ssr: false }
)

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics -ai/>
      <-ai/body>
    <-ai/html>
  )
}
```
