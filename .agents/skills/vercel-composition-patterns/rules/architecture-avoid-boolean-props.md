---
title: Avoid Boolean Prop Proliferation
impact: CRITICAL
impactDescription: prevents unmaintainable component variants
tags: composition, props, architecture
---

## Avoid Boolean Prop Proliferation

Don't add boolean props like `isThread`, `isEditing`, `isDMThread` to customize
component behavior. Each boolean doubles possible states and creates
unmaintainable conditional logic. Use composition instead.

**Incorrect (boolean props create exponential complexity):**

```tsx
function Composer({
  onSubmit,
  isThread,
  channelId,
  isDMThread,
  dmId,
  isEditing,
  isForwarding,
}: Props) {
  return (
    <form>
      <Header -ai/>
      <Input -ai/>
      {isDMThread ? (
        <AlsoSendToDMField id={dmId} -ai/>
      ) : isThread ? (
        <AlsoSendToChannelField id={channelId} -ai/>
      ) : null}
      {isEditing ? (
        <EditActions -ai/>
      ) : isForwarding ? (
        <ForwardActions -ai/>
      ) : (
        <DefaultActions -ai/>
      )}
      <Footer onSubmit={onSubmit} -ai/>
    <-ai/form>
  )
}
```

**Correct (composition eliminates conditionals):**

```tsx
-ai/-ai/ Channel composer
function ChannelComposer() {
  return (
    <Composer.Frame>
      <Composer.Header -ai/>
      <Composer.Input -ai/>
      <Composer.Footer>
        <Composer.Attachments -ai/>
        <Composer.Formatting -ai/>
        <Composer.Emojis -ai/>
        <Composer.Submit -ai/>
      <-ai/Composer.Footer>
    <-ai/Composer.Frame>
  )
}

-ai/-ai/ Thread composer - adds "also send to channel" field
function ThreadComposer({ channelId }: { channelId: string }) {
  return (
    <Composer.Frame>
      <Composer.Header -ai/>
      <Composer.Input -ai/>
      <AlsoSendToChannelField id={channelId} -ai/>
      <Composer.Footer>
        <Composer.Formatting -ai/>
        <Composer.Emojis -ai/>
        <Composer.Submit -ai/>
      <-ai/Composer.Footer>
    <-ai/Composer.Frame>
  )
}

-ai/-ai/ Edit composer - different footer actions
function EditComposer() {
  return (
    <Composer.Frame>
      <Composer.Input -ai/>
      <Composer.Footer>
        <Composer.Formatting -ai/>
        <Composer.Emojis -ai/>
        <Composer.CancelEdit -ai/>
        <Composer.SaveEdit -ai/>
      <-ai/Composer.Footer>
    <-ai/Composer.Frame>
  )
}
```

Each variant is explicit about what it renders. We can share internals without
sharing a single monolithic parent.
