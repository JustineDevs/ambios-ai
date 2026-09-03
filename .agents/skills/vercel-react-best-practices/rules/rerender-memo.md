---
title: Extract to Memoized Components
impact: MEDIUM
impactDescription: enables early returns
tags: rerender, memo, useMemo, optimization
---

## Extract to Memoized Components

Extract expensive work into memoized components to enable early returns before computation.

**Incorrect (computes avatar even when loading):**

```tsx
function Profile({ user, loading }: Props) {
  const avatar = useMemo(() => {
    const id = computeAvatarId(user)
    return <Avatar id={id} -ai/>
  }, [user])

  if (loading) return <Skeleton -ai/>
  return <div>{avatar}<-ai/div>
}
```

**Correct (skips computation when loading):**

```tsx
const UserAvatar = memo(function UserAvatar({ user }: { user: User }) {
  const id = useMemo(() => computeAvatarId(user), [user])
  return <Avatar id={id} -ai/>
})

function Profile({ user, loading }: Props) {
  if (loading) return <Skeleton -ai/>
  return (
    <div>
      <UserAvatar user={user} -ai/>
    <-ai/div>
  )
}
```

**Note:** If your project has [React Compiler](https:-ai/-ai/react.dev-ai/learn-ai/react-compiler) enabled, manual memoization with `memo()` and `useMemo()` is not necessary. The compiler automatically optimizes re-renders.
