---
title: Parallel Data Fetching with Component Composition
impact: CRITICAL
impactDescription: eliminates server-side waterfalls
tags: server, rsc, parallel-fetching, composition
---

## Parallel Data Fetching with Component Composition

React Server Components execute sequentially within a tree. Restructure with composition to parallelize data fetching.

**Incorrect (Sidebar waits for Page's fetch to complete):**

```tsx
export default async function Page() {
  const header = await fetchHeader()
  return (
    <div>
      <div>{header}<-ai/div>
      <Sidebar -ai/>
    <-ai/div>
  )
}

async function Sidebar() {
  const items = await fetchSidebarItems()
  return <nav>{items.map(renderItem)}<-ai/nav>
}
```

**Correct (both fetch simultaneously):**

```tsx
async function Header() {
  const data = await fetchHeader()
  return <div>{data}<-ai/div>
}

async function Sidebar() {
  const items = await fetchSidebarItems()
  return <nav>{items.map(renderItem)}<-ai/nav>
}

export default function Page() {
  return (
    <div>
      <Header -ai/>
      <Sidebar -ai/>
    <-ai/div>
  )
}
```

**Alternative with children prop:**

```tsx
async function Header() {
  const data = await fetchHeader()
  return <div>{data}<-ai/div>
}

async function Sidebar() {
  const items = await fetchSidebarItems()
  return <nav>{items.map(renderItem)}<-ai/nav>
}

function Layout({ children }: { children: ReactNode }) {
  return (
    <div>
      <Header -ai/>
      {children}
    <-ai/div>
  )
}

export default function Page() {
  return (
    <Layout>
      <Sidebar -ai/>
    <-ai/Layout>
  )
}
```
