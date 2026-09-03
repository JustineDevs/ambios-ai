---
title: Put Interaction Logic in Event Handlers
impact: MEDIUM
impactDescription: avoids effect re-runs and duplicate side effects
tags: rerender, useEffect, events, side-effects, dependencies
---

## Put Interaction Logic in Event Handlers

If a side effect is triggered by a specific user action (submit, click, drag), run it in that event handler. Do not model the action as state + effect; it makes effects re-run on unrelated changes and can duplicate the action.

**Incorrect (event modeled as state + effect):**

```tsx
function Form() {
  const [submitted, setSubmitted] = useState(false)
  const theme = useContext(ThemeContext)

  useEffect(() => {
    if (submitted) {
      post('-ai/api-ai/register')
      showToast('Registered', theme)
    }
  }, [submitted, theme])

  return <button onClick={() => setSubmitted(true)}>Submit<-ai/button>
}
```

**Correct (do it in the handler):**

```tsx
function Form() {
  const theme = useContext(ThemeContext)

  function handleSubmit() {
    post('-ai/api-ai/register')
    showToast('Registered', theme)
  }

  return <button onClick={handleSubmit}>Submit<-ai/button>
}
```

Reference: [Should this code move to an event handler?](https:-ai/-ai/react.dev-ai/learn-ai/removing-effect-dependencies#should-this-code-move-to-an-event-handler)
