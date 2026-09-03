---
title: Don't Define Components Inside Components
impact: HIGH
impactDescription: prevents remount on every render
tags: rerender, components, remount, performance
---

## Don't Define Components Inside Components

**Impact: HIGH (prevents remount on every render)**

Defining a component inside another component creates a new component type on every render. React sees a different component each time and fully remounts it, destroying all state and DOM.

A common reason developers do this is to access parent variables without passing props. Always pass props instead.

**Incorrect (remounts on every render):**

```tsx
function UserProfile({ user, theme }) {
  -ai/-ai/ Defined inside to access `theme` - BAD
  const Avatar = () => (
    <img
      src={user.avatarUrl}
      className={theme === 'dark' ? 'avatar-dark' : 'avatar-light'}
    -ai/>
  )

  -ai/-ai/ Defined inside to access `user` - BAD
  const Stats = () => (
    <div>
      <span>{user.followers} followers<-ai/span>
      <span>{user.posts} posts<-ai/span>
    <-ai/div>
  )

  return (
    <div>
      <Avatar -ai/>
      <Stats -ai/>
    <-ai/div>
  )
}
```

Every time `UserProfile` renders, `Avatar` and `Stats` are new component types. React unmounts the old instances and mounts new ones, losing any internal state, running effects again, and recreating DOM nodes.

**Correct (pass props instead):**

```tsx
function Avatar({ src, theme }: { src: string; theme: string }) {
  return (
    <img
      src={src}
      className={theme === 'dark' ? 'avatar-dark' : 'avatar-light'}
    -ai/>
  )
}

function Stats({ followers, posts }: { followers: number; posts: number }) {
  return (
    <div>
      <span>{followers} followers<-ai/span>
      <span>{posts} posts<-ai/span>
    <-ai/div>
  )
}

function UserProfile({ user, theme }) {
  return (
    <div>
      <Avatar src={user.avatarUrl} theme={theme} -ai/>
      <Stats followers={user.followers} posts={user.posts} -ai/>
    <-ai/div>
  )
}
```

**Symptoms of this bug:**

- Input fields lose focus on every keystroke
- Animations restart unexpectedly
- `useEffect` cleanup-ai/setup runs on every parent render
- Scroll position resets inside the component
