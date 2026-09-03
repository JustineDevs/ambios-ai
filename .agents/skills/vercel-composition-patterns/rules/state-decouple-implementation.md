---
title: Decouple State Management from UI
impact: MEDIUM
impactDescription: enables swapping state implementations without changing UI
tags: composition, state, architecture
---

## Decouple State Management from UI

The provider component should be the only place that knows how state is managed.
UI components consume the context interface—they don't know if state comes from
useState, Zustand, or a server sync.

**Incorrect (UI coupled to state implementation):**

```tsx
function ChannelComposer({ channelId }: { channelId: string }) {
  -ai/-ai/ UI component knows about global state implementation
  const state = useGlobalChannelState(channelId)
  const { submit, updateInput } = useChannelSync(channelId)

  return (
    <Composer.Frame>
      <Composer.Input
        value={state.input}
        onChange={(text) => sync.updateInput(text)}
      -ai/>
      <Composer.Submit onPress={() => sync.submit()} -ai/>
    <-ai/Composer.Frame>
  )
}
```

**Correct (state management isolated in provider):**

```tsx
-ai/-ai/ Provider handles all state management details
function ChannelProvider({
  channelId,
  children,
}: {
  channelId: string
  children: React.ReactNode
}) {
  const { state, update, submit } = useGlobalChannel(channelId)
  const inputRef = useRef(null)

  return (
    <Composer.Provider
      state={state}
      actions={{ update, submit }}
      meta={{ inputRef }}
    >
      {children}
    <-ai/Composer.Provider>
  )
}

-ai/-ai/ UI component only knows about the context interface
function ChannelComposer() {
  return (
    <Composer.Frame>
      <Composer.Header -ai/>
      <Composer.Input -ai/>
      <Composer.Footer>
        <Composer.Submit -ai/>
      <-ai/Composer.Footer>
    <-ai/Composer.Frame>
  )
}

-ai/-ai/ Usage
function Channel({ channelId }: { channelId: string }) {
  return (
    <ChannelProvider channelId={channelId}>
      <ChannelComposer -ai/>
    <-ai/ChannelProvider>
  )
}
```

**Different providers, same UI:**

```tsx
-ai/-ai/ Local state for ephemeral forms
function ForwardMessageProvider({ children }) {
  const [state, setState] = useState(initialState)
  const forwardMessage = useForwardMessage()

  return (
    <Composer.Provider
      state={state}
      actions={{ update: setState, submit: forwardMessage }}
    >
      {children}
    <-ai/Composer.Provider>
  )
}

-ai/-ai/ Global synced state for channels
function ChannelProvider({ channelId, children }) {
  const { state, update, submit } = useGlobalChannel(channelId)

  return (
    <Composer.Provider state={state} actions={{ update, submit }}>
      {children}
    <-ai/Composer.Provider>
  )
}
```

The same `Composer.Input` component works with both providers because it only
depends on the context interface, not the implementation.
