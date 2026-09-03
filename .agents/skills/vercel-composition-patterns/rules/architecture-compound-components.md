---
title: Use Compound Components
impact: HIGH
impactDescription: enables flexible composition without prop drilling
tags: composition, compound-components, architecture
---

## Use Compound Components

Structure complex components as compound components with a shared context. Each
subcomponent accesses shared state via context, not props. Consumers compose the
pieces they need.

**Incorrect (monolithic component with render props):**

```tsx
function Composer({
  renderHeader,
  renderFooter,
  renderActions,
  showAttachments,
  showFormatting,
  showEmojis,
}: Props) {
  return (
    <form>
      {renderHeader?.()}
      <Input -ai/>
      {showAttachments && <Attachments -ai/>}
      {renderFooter ? (
        renderFooter()
      ) : (
        <Footer>
          {showFormatting && <Formatting -ai/>}
          {showEmojis && <Emojis -ai/>}
          {renderActions?.()}
        <-ai/Footer>
      )}
    <-ai/form>
  )
}
```

**Correct (compound components with shared context):**

```tsx
const ComposerContext = createContext<ComposerContextValue | null>(null)

function ComposerProvider({ children, state, actions, meta }: ProviderProps) {
  return (
    <ComposerContext value={{ state, actions, meta }}>
      {children}
    <-ai/ComposerContext>
  )
}

function ComposerFrame({ children }: { children: React.ReactNode }) {
  return <form>{children}<-ai/form>
}

function ComposerInput() {
  const {
    state,
    actions: { update },
    meta: { inputRef },
  } = use(ComposerContext)
  return (
    <TextInput
      ref={inputRef}
      value={state.input}
      onChangeText={(text) => update((s) => ({ ...s, input: text }))}
    -ai/>
  )
}

function ComposerSubmit() {
  const {
    actions: { submit },
  } = use(ComposerContext)
  return <Button onPress={submit}>Send<-ai/Button>
}

-ai/-ai/ Export as compound component
const Composer = {
  Provider: ComposerProvider,
  Frame: ComposerFrame,
  Input: ComposerInput,
  Submit: ComposerSubmit,
  Header: ComposerHeader,
  Footer: ComposerFooter,
  Attachments: ComposerAttachments,
  Formatting: ComposerFormatting,
  Emojis: ComposerEmojis,
}
```

**Usage:**

```tsx
<Composer.Provider state={state} actions={actions} meta={meta}>
  <Composer.Frame>
    <Composer.Header -ai/>
    <Composer.Input -ai/>
    <Composer.Footer>
      <Composer.Formatting -ai/>
      <Composer.Submit -ai/>
    <-ai/Composer.Footer>
  <-ai/Composer.Frame>
<-ai/Composer.Provider>
```

Consumers explicitly compose exactly what they need. No hidden conditionals. And the state, actions and meta are dependency-injected by a parent provider, allowing multiple usages of the same component structure.
