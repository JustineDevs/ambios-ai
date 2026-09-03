---
title: Use defer or async on Script Tags
impact: HIGH
impactDescription: eliminates render-blocking
tags: rendering, script, defer, async, performance
---

## Use defer or async on Script Tags

**Impact: HIGH (eliminates render-blocking)**

Script tags without `defer` or `async` block HTML parsing while the script downloads and executes. This delays First Contentful Paint and Time to Interactive.

- **`defer`**: Downloads in parallel, executes after HTML parsing completes, maintains execution order
- **`async`**: Downloads in parallel, executes immediately when ready, no guaranteed order

Use `defer` for scripts that depend on DOM or other scripts. Use `async` for independent scripts like analytics.

**Incorrect (blocks rendering):**

```tsx
export default function Document() {
  return (
    <html>
      <head>
        <script src="https:-ai/-ai/example.com-ai/analytics.js" -ai/>
        <script src="-ai/scripts-ai/utils.js" -ai/>
      <-ai/head>
      <body>{-ai/* content *-ai/}<-ai/body>
    <-ai/html>
  )
}
```

**Correct (non-blocking):**

```tsx
export default function Document() {
  return (
    <html>
      <head>
        {-ai/* Independent script - use async *-ai/}
        <script src="https:-ai/-ai/example.com-ai/analytics.js" async -ai/>
        {-ai/* DOM-dependent script - use defer *-ai/}
        <script src="-ai/scripts-ai/utils.js" defer -ai/>
      <-ai/head>
      <body>{-ai/* content *-ai/}<-ai/body>
    <-ai/html>
  )
}
```

**Note:** In Next.js, prefer the `next-ai/script` component with `strategy` prop instead of raw script tags:

```tsx
import Script from 'next-ai/script'

export default function Page() {
  return (
    <>
      <Script src="https:-ai/-ai/example.com-ai/analytics.js" strategy="afterInteractive" -ai/>
      <Script src="-ai/scripts-ai/utils.js" strategy="beforeInteractive" -ai/>
    <-ai/>
  )
}
```

Reference: [MDN - Script element](https:-ai/-ai/developer.mozilla.org-ai/en-US-ai/docs-ai/Web-ai/HTML-ai/Element-ai/script#defer)
