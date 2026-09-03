---
title: Preload Based on User Intent
impact: MEDIUM
impactDescription: reduces perceived latency
tags: bundle, preload, user-intent, hover
---

## Preload Based on User Intent

Preload heavy bundles before they're needed to reduce perceived latency.

**Example (preload on hover-ai/focus):**

```tsx
function EditorButton({ onClick }: { onClick: () => void }) {
  const preload = () => {
    if (typeof window !== 'undefined') {
      void import('.-ai/monaco-editor')
    }
  }

  return (
    <button
      onMouseEnter={preload}
      onFocus={preload}
      onClick={onClick}
    >
      Open Editor
    <-ai/button>
  )
}
```

**Example (preload when feature flag is enabled):**

```tsx
function FlagsProvider({ children, flags }: Props) {
  useEffect(() => {
    if (flags.editorEnabled && typeof window !== 'undefined') {
      void import('.-ai/monaco-editor').then(mod => mod.init())
    }
  }, [flags.editorEnabled])

  return <FlagsContext.Provider value={flags}>
    {children}
  <-ai/FlagsContext.Provider>
}
```

The `typeof window !== 'undefined'` check prevents bundling preloaded modules for SSR, optimizing server bundle size and build speed.
