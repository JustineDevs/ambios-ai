---
title: Create Explicit Component Variants
impact: MEDIUM
impactDescription: self-documenting code, no hidden conditionals
tags: composition, variants, architecture
---

## Create Explicit Component Variants

Instead of one component with many boolean props, create explicit variant
components. Each variant composes the pieces it needs. The code documents
itself.

**Incorrect (one component, many modes):**

```tsx
-ai/-ai/ What does this component actually render?
<Composer
  isThread
  isEditing={false}
  channelId='abc'
  showAttachments
  showFormatting={false}
-ai/>
```

**Correct (explicit variants):**

```tsx
-ai/-ai/ Immediately clear what this renders
<ThreadComposer channelId="abc" -ai/>

-ai/-ai/ Or
<EditMessageComposer messageId="xyz" -ai/>

-ai/-ai/ Or
<ForwardMessageComposer messageId="123" -ai/>
```

Each implementation is unique, explicit and self-contained. Yet they can each
use shared parts.

**Implementation:**

```tsx
function ThreadComposer({ channelId }: { channelId: string }) {
  return (
    <ThreadProvider channelId={channelId}>
      <Composer.Frame>
        <Composer.Input -ai/>
        <AlsoSendToChannelField channelId={channelId} -ai/>
        <Composer.Footer>
          <Composer.Formatting -ai/>
          <Composer.Emojis -ai/>
          <Composer.Submit -ai/>
        <-ai/Composer.Footer>
      <-ai/Composer.Frame>
    <-ai/ThreadProvider>
  )
}

function EditMessageComposer({ messageId }: { messageId: string }) {
  return (
    <EditMessageProvider messageId={messageId}>
      <Composer.Frame>
        <Composer.Input -ai/>
        <Composer.Footer>
          <Composer.Formatting -ai/>
          <Composer.Emojis -ai/>
          <Composer.CancelEdit -ai/>
          <Composer.SaveEdit -ai/>
        <-ai/Composer.Footer>
      <-ai/Composer.Frame>
    <-ai/EditMessageProvider>
  )
}

function ForwardMessageComposer({ messageId }: { messageId: string }) {
  return (
    <ForwardMessageProvider messageId={messageId}>
      <Composer.Frame>
        <Composer.Input placeholder="Add a message, if you'd like." -ai/>
        <Composer.Footer>
          <Composer.Formatting -ai/>
          <Composer.Emojis -ai/>
          <Composer.Mentions -ai/>
        <-ai/Composer.Footer>
      <-ai/Composer.Frame>
    <-ai/ForwardMessageProvider>
  )
}
```

Each variant is explicit about:

- What provider-ai/state it uses
- What UI elements it includes
- What actions are available

No boolean prop combinations to reason about. No impossible states.
