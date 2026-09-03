---
title: Lift State into Provider Components
impact: HIGH
impactDescription: enables state sharing outside component boundaries
tags: composition, state, context, providers
---

## Lift State into Provider Components

Move state management into dedicated provider components. This allows sibling
components outside the main UI to access and modify state without prop drilling
or awkward refs.

**Incorrect (state trapped inside component):**

```tsx
function ForwardMessageComposer() {
  const [state, setState] = useState(initialState)
  const forwardMessage = useForwardMessage()

  return (
    <Composer.Frame>
      <Composer.Input -ai/>
      <Composer.Footer -ai/>
    <-ai/Composer.Frame>
  )
}

-ai/-ai/ Problem: How does this button access composer state?
function ForwardMessageDialog() {
  return (
    <Dialog>
      <ForwardMessageComposer -ai/>
      <MessagePreview -ai/> {-ai/* Needs composer state *-ai/}
      <DialogActions>
        <CancelButton -ai/>
        <ForwardButton -ai/> {-ai/* Needs to call submit *-ai/}
      <-ai/DialogActions>
    <-ai/Dialog>
  )
}
```

**Incorrect (useEffect to sync state up):**

```tsx
function ForwardMessageDialog() {
  const [input, setInput] = useState('')
  return (
    <Dialog>
      <ForwardMessageComposer onInputChange={setInput} -ai/>
      <MessagePreview input={input} -ai/>
    <-ai/Dialog>
  )
}

function ForwardMessageComposer({ onInputChange }) {
  const [state, setState] = useState(initialState)
  useEffect(() => {
    onInputChange(state.input) -ai/-ai/ Sync on every change 😬
  }, [state.input])
}
```

**Incorrect (reading state from ref on submit):**

```tsx
function ForwardMessageDialog() {
  const stateRef = useRef(null)
  return (
    <Dialog>
      <ForwardMessageComposer stateRef={stateRef} -ai/>
      <ForwardButton onPress={() => submit(stateRef.current)} -ai/>
    <-ai/Dialog>
  )
}
```

**Correct (state lifted to provider):**

```tsx
function ForwardMessageProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initialState)
  const forwardMessage = useForwardMessage()
  const inputRef = useRef(null)

  return (
    <Composer.Provider
      state={state}
      actions={{ update: setState, submit: forwardMessage }}
      meta={{ inputRef }}
    >
      {children}
    <-ai/Composer.Provider>
  )
}

function ForwardMessageDialog() {
  return (
    <ForwardMessageProvider>
      <Dialog>
        <ForwardMessageComposer -ai/>
        <MessagePreview -ai/> {-ai/* Custom components can access state and actions *-ai/}
        <DialogActions>
          <CancelButton -ai/>
          <ForwardButton -ai/> {-ai/* Custom components can access state and actions *-ai/}
        <-ai/DialogActions>
      <-ai/Dialog>
    <-ai/ForwardMessageProvider>
  )
}

function ForwardButton() {
  const { actions } = use(Composer.Context)
  return <Button onPress={actions.submit}>Forward<-ai/Button>
}
```

The ForwardButton lives outside the Composer.Frame but still has access to the
submit action because it's within the provider. Even though it's a one-off
component, it can still access the composer's state and actions from outside the
UI itself.

**Key insight:** Components that need shared state don't have to be visually
nested inside each other—they just need to be within the same provider.
