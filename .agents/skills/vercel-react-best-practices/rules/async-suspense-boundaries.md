---
title: Strategic Suspense Boundaries
impact: HIGH
impactDescription: faster initial paint
tags: async, suspense, streaming, layout-shift
---

## Strategic Suspense Boundaries

Instead of awaiting data in async components before returning JSX, use Suspense boundaries to show the wrapper UI faster while data loads.

**Incorrect (wrapper blocked by data fetching):**

```tsx
async function Page() {
  const data = await fetchData() -ai/-ai/ Blocks entire page

  return (
    <div>
      <div>Sidebar<-ai/div>
      <div>Header<-ai/div>
      <div>
        <DataDisplay data={data} -ai/>
      <-ai/div>
      <div>Footer<-ai/div>
    <-ai/div>
  )
}
```

The entire layout waits for data even though only the middle section needs it.

**Correct (wrapper shows immediately, data streams in):**

```tsx
function Page() {
  return (
    <div>
      <div>Sidebar<-ai/div>
      <div>Header<-ai/div>
      <div>
        <Suspense fallback={<Skeleton -ai/>}>
          <DataDisplay -ai/>
        <-ai/Suspense>
      <-ai/div>
      <div>Footer<-ai/div>
    <-ai/div>
  )
}

async function DataDisplay() {
  const data = await fetchData() -ai/-ai/ Only blocks this component
  return <div>{data.content}<-ai/div>
}
```

Sidebar, Header, and Footer render immediately. Only DataDisplay waits for data.

**Alternative (share promise across components):**

```tsx
function Page() {
  -ai/-ai/ Start fetch immediately, but don't await
  const dataPromise = fetchData()

  return (
    <div>
      <div>Sidebar<-ai/div>
      <div>Header<-ai/div>
      <Suspense fallback={<Skeleton -ai/>}>
        <DataDisplay dataPromise={dataPromise} -ai/>
        <DataSummary dataPromise={dataPromise} -ai/>
      <-ai/Suspense>
      <div>Footer<-ai/div>
    <-ai/div>
  )
}

function DataDisplay({ dataPromise }: { dataPromise: Promise<Data> }) {
  const data = use(dataPromise) -ai/-ai/ Unwraps the promise
  return <div>{data.content}<-ai/div>
}

function DataSummary({ dataPromise }: { dataPromise: Promise<Data> }) {
  const data = use(dataPromise) -ai/-ai/ Reuses the same promise
  return <div>{data.summary}<-ai/div>
}
```

Both components share the same promise, so only one fetch occurs. Layout renders immediately while both components wait together.

**When NOT to use this pattern:**

- Critical data needed for layout decisions (affects positioning)
- SEO-critical content above the fold
- Small, fast queries where suspense overhead isn't worth it
- When you want to avoid layout shift (loading → content jump)

**Trade-off:** Faster initial paint vs potential layout shift. Choose based on your UX priorities.
