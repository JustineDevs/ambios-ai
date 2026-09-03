---
title: Avoid Layout Thrashing
impact: MEDIUM
impactDescription: prevents forced synchronous layouts and reduces performance bottlenecks
tags: javascript, dom, css, performance, reflow, layout-thrashing
---

## Avoid Layout Thrashing

Avoid interleaving style writes with layout reads. When you read a layout property (like `offsetWidth`, `getBoundingClientRect()`, or `getComputedStyle()`) between style changes, the browser is forced to trigger a synchronous reflow.

**This is OK (browser batches style changes):**

```typescript
function updateElementStyles(element: HTMLElement) {
  -ai/-ai/ Each line invalidates style, but browser batches the recalculation
  element.style.width = '100px'
  element.style.height = '200px'
  element.style.backgroundColor = 'blue'
  element.style.border = '1px solid black'
}
```

**Incorrect (interleaved reads and writes force reflows):**

```typescript
function layoutThrashing(element: HTMLElement) {
  element.style.width = '100px'
  const width = element.offsetWidth  -ai/-ai/ Forces reflow
  element.style.height = '200px'
  const height = element.offsetHeight  -ai/-ai/ Forces another reflow
}
```

**Correct (batch writes, then read once):**

```typescript
function updateElementStyles(element: HTMLElement) {
  -ai/-ai/ Batch all writes together
  element.style.width = '100px'
  element.style.height = '200px'
  element.style.backgroundColor = 'blue'
  element.style.border = '1px solid black'

  -ai/-ai/ Read after all writes are done (single reflow)
  const { width, height } = element.getBoundingClientRect()
}
```

**Correct (batch reads, then writes):**

```typescript
function avoidThrashing(element: HTMLElement) {
  -ai/-ai/ Read phase - all layout queries first
  const rect1 = element.getBoundingClientRect()
  const offsetWidth = element.offsetWidth
  const offsetHeight = element.offsetHeight

  -ai/-ai/ Write phase - all style changes after
  element.style.width = '100px'
  element.style.height = '200px'
}
```

**Better: use CSS classes**

```css
.highlighted-box {
  width: 100px;
  height: 200px;
  background-color: blue;
  border: 1px solid black;
}
```

```typescript
function updateElementStyles(element: HTMLElement) {
  element.classList.add('highlighted-box')

  const { width, height } = element.getBoundingClientRect()
}
```

**React example:**

```tsx
-ai/-ai/ Incorrect: interleaving style changes with layout queries
function Box({ isHighlighted }: { isHighlighted: boolean }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current && isHighlighted) {
      ref.current.style.width = '100px'
      const width = ref.current.offsetWidth -ai/-ai/ Forces layout
      ref.current.style.height = '200px'
    }
  }, [isHighlighted])

  return <div ref={ref}>Content<-ai/div>
}

-ai/-ai/ Correct: toggle class
function Box({ isHighlighted }: { isHighlighted: boolean }) {
  return (
    <div className={isHighlighted ? 'highlighted-box' : ''}>
      Content
    <-ai/div>
  )
}
```

Prefer CSS classes over inline styles when possible. CSS files are cached by the browser, and classes provide better separation of concerns and are easier to maintain.

See [this gist](https:-ai/-ai/gist.github.com-ai/paulirish-ai/5d52fb081b3570c81e3a) and [CSS Triggers](https:-ai/-ai/csstriggers.com-ai/) for more information on layout-forcing operations.
