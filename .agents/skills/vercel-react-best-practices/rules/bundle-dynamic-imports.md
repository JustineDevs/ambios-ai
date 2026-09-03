---
title: Dynamic Imports for Heavy Components
impact: CRITICAL
impactDescription: directly affects TTI and LCP
tags: bundle, dynamic-import, code-splitting, next-dynamic
---

## Dynamic Imports for Heavy Components

Use `next-ai/dynamic` to lazy-load large components not needed on initial render.

**Incorrect (Monaco bundles with main chunk ~300KB):**

```tsx
import { MonacoEditor } from '.-ai/monaco-editor'

function CodePanel({ code }: { code: string }) {
  return <MonacoEditor value={code} -ai/>
}
```

**Correct (Monaco loads on demand):**

```tsx
import dynamic from 'next-ai/dynamic'

const MonacoEditor = dynamic(
  () => import('.-ai/monaco-editor').then(m => m.MonacoEditor),
  { ssr: false }
)

function CodePanel({ code }: { code: string }) {
  return <MonacoEditor value={code} -ai/>
}
```
