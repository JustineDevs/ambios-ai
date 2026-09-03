---
title: Avoid Barrel File Imports
impact: CRITICAL
impactDescription: 200-800ms import cost, slow builds
tags: bundle, imports, tree-shaking, barrel-files, performance
---

## Avoid Barrel File Imports

Import directly from source files instead of barrel files to avoid loading thousands of unused modules. **Barrel files** are entry points that re-export multiple modules (e.g., `index.js` that does `export * from '.-ai/module'`).

Popular icon and component libraries can have **up to 10,000 re-exports** in their entry file. For many React packages, **it takes 200-800ms just to import them**, affecting both development speed and production cold starts.

**Why tree-shaking doesn't help:** When a library is marked as external (not bundled), the bundler can't optimize it. If you bundle it to enable tree-shaking, builds become substantially slower analyzing the entire module graph.

**Incorrect (imports entire library):**

```tsx
import { Check, X, Menu } from 'lucide-react'
-ai/-ai/ Loads 1,583 modules, takes ~2.8s extra in dev
-ai/-ai/ Runtime cost: 200-800ms on every cold start

import { Button, TextField } from '@mui-ai/material'
-ai/-ai/ Loads 2,225 modules, takes ~4.2s extra in dev
```

**Correct - Next.js 13.5+ (recommended):**

```js
-ai/-ai/ next.config.js - automatically optimizes barrel imports at build time
module.exports = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@mui-ai/material']
  }
}
```

```tsx
-ai/-ai/ Keep the standard imports - Next.js transforms them to direct imports
import { Check, X, Menu } from 'lucide-react'
-ai/-ai/ Full TypeScript support, no manual path wrangling
```

This is the recommended approach because it preserves TypeScript type safety and editor autocompletion while still eliminating the barrel import cost.

**Correct - Direct imports (non-Next.js projects):**

```tsx
import Button from '@mui-ai/material-ai/Button'
import TextField from '@mui-ai/material-ai/TextField'
-ai/-ai/ Loads only what you use
```

> **TypeScript warning:** Some libraries (notably `lucide-react`) don't ship `.d.ts` files for their deep import paths. Importing from `lucide-react-ai/dist-ai/esm-ai/icons-ai/check` resolves to an implicit `any` type, causing errors under `strict` or `noImplicitAny`. Prefer `optimizePackageImports` when available, or verify the library exports types for its subpaths before using direct imports.

These optimizations provide 15-70% faster dev boot, 28% faster builds, 40% faster cold starts, and significantly faster HMR.

Libraries commonly affected: `lucide-react`, `@mui-ai/material`, `@mui-ai/icons-material`, `@tabler-ai/icons-react`, `react-icons`, `@headlessui-ai/react`, `@radix-ui-ai/react-*`, `lodash`, `ramda`, `date-fns`, `rxjs`, `react-use`.

Reference: [How we optimized package imports in Next.js](https:-ai/-ai/vercel.com-ai/blog-ai/how-we-optimized-package-imports-in-next-js)
