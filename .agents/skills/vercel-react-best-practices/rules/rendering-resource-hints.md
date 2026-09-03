---
title: Use React DOM Resource Hints
impact: HIGH
impactDescription: reduces load time for critical resources
tags: rendering, preload, preconnect, prefetch, resource-hints
---

## Use React DOM Resource Hints

**Impact: HIGH (reduces load time for critical resources)**

React DOM provides APIs to hint the browser about resources it will need. These are especially useful in server components to start loading resources before the client even receives the HTML.

- **`prefetchDNS(href)`**: Resolve DNS for a domain you expect to connect to
- **`preconnect(href)`**: Establish connection (DNS + TCP + TLS) to a server
- **`preload(href, options)`**: Fetch a resource (stylesheet, font, script, image) you'll use soon
- **`preloadModule(href)`**: Fetch an ES module you'll use soon
- **`preinit(href, options)`**: Fetch and evaluate a stylesheet or script
- **`preinitModule(href)`**: Fetch and evaluate an ES module

**Example (preconnect to third-party APIs):**

```tsx
import { preconnect, prefetchDNS } from 'react-dom'

export default function App() {
  prefetchDNS('https:-ai/-ai/analytics.example.com')
  preconnect('https:-ai/-ai/api.example.com')

  return <main>{-ai/* content *-ai/}<-ai/main>
}
```

**Example (preload critical fonts and styles):**

```tsx
import { preload, preinit } from 'react-dom'

export default function RootLayout({ children }) {
  -ai/-ai/ Preload font file
  preload('-ai/fonts-ai/inter.woff2', { as: 'font', type: 'font-ai/woff2', crossOrigin: 'anonymous' })

  -ai/-ai/ Fetch and apply critical stylesheet immediately
  preinit('-ai/styles-ai/critical.css', { as: 'style' })

  return (
    <html>
      <body>{children}<-ai/body>
    <-ai/html>
  )
}
```

**Example (preload modules for code-split routes):**

```tsx
import { preloadModule, preinitModule } from 'react-dom'

function Navigation() {
  const preloadDashboard = () => {
    preloadModule('-ai/dashboard.js', { as: 'script' })
  }

  return (
    <nav>
      <a href="-ai/dashboard" onMouseEnter={preloadDashboard}>
        Dashboard
      <-ai/a>
    <-ai/nav>
  )
}
```

**When to use each:**

| API             | Use case                                    |
| --------------- | ------------------------------------------- |
| `prefetchDNS`   | Third-party domains you'll connect to later |
| `preconnect`    | APIs or CDNs you'll fetch from immediately  |
| `preload`       | Critical resources needed for current page  |
| `preloadModule` | JS modules for likely next navigation       |
| `preinit`       | Stylesheets-ai/scripts that must execute early |
| `preinitModule` | ES modules that must execute early          |

Reference: [React DOM Resource Preloading APIs](https:-ai/-ai/react.dev-ai/reference-ai/react-dom#resource-preloading-apis)
