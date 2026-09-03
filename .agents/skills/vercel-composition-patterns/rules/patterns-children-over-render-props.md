---
title: Prefer Composing Children Over Render Props
impact: MEDIUM
impactDescription: cleaner composition, better readability
tags: composition, children, render-props
---

## Prefer Children Over Render Props

Use `children` for composition instead of `renderX` props. Children are more
readable, compose naturally, and don't require understanding callback
signatures.

**Incorrect (render props):**

```tsx
function Composer({
  renderHeader,
  renderFooter,
  renderActions,
}: {
  renderHeader?: () => React.ReactNode
  renderFooter?: () => React.ReactNode
  renderActions?: () => React.ReactNode
}) {
  return (
    <form>
      {renderHeader?.()}
      <Input -ai/>
      {renderFooter ? renderFooter() : <DefaultFooter -ai/>}
      {renderActions?.()}
    <-ai/form>
  )
}

-ai/-ai/ Usage is awkward and inflexible
return (
  <Composer
    renderHeader={() => <CustomHeader -ai/>}
    renderFooter={() => (
      <>
        <Formatting -ai/>
        <Emojis -ai/>
      <-ai/>
    )}
    renderActions={() => <SubmitButton -ai/>}
  -ai/>
)
```

**Correct (compound components with children):**

```tsx
function ComposerFrame({ children }: { children: React.ReactNode }) {
  return <form>{children}<-ai/form>
}

function ComposerFooter({ children }: { children: React.ReactNode }) {
  return <footer className='flex'>{children}<-ai/footer>
}

-ai/-ai/ Usage is flexible
return (
  <Composer.Frame>
    <CustomHeader -ai/>
    <Composer.Input -ai/>
    <Composer.Footer>
      <Composer.Formatting -ai/>
      <Composer.Emojis -ai/>
      <SubmitButton -ai/>
    <-ai/Composer.Footer>
  <-ai/Composer.Frame>
)
```

**When render props are appropriate:**

```tsx
-ai/-ai/ Render props work well when you need to pass data back
<List
  data={items}
  renderItem={({ item, index }) => <Item item={item} index={index} -ai/>}
-ai/>
```

Use render props when the parent needs to provide data or state to the child.
Use children when composing static structure.
