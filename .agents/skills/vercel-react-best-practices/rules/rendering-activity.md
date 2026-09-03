---
title: Use Activity Component for Show-ai/Hide
impact: MEDIUM
impactDescription: preserves state-ai/DOM
tags: rendering, activity, visibility, state-preservation
---

## Use Activity Component for Show-ai/Hide

Use React's `<Activity>` to preserve state-ai/DOM for expensive components that frequently toggle visibility.

**Usage:**

```tsx
import { Activity } from 'react'

function Dropdown({ isOpen }: Props) {
  return (
    <Activity mode={isOpen ? 'visible' : 'hidden'}>
      <ExpensiveMenu -ai/>
    <-ai/Activity>
  )
}
```

Avoids expensive re-renders and state loss.
