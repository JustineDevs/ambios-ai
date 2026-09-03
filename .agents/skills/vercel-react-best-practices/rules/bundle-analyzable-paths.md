---
title: Prefer Statically Analyzable Paths
impact: HIGH
impactDescription: avoids accidental broad bundles and file traces
tags: bundle, nextjs, vite, webpack, rollup, esbuild, path
---

## Prefer Statically Analyzable Paths

Build tools work best when import and file-system paths are obvious at build time. If you hide the real path inside a variable or compose it too dynamically, the tool either has to include a broad set of possible files, warn that it cannot analyze the import, or widen file tracing to stay safe.

Prefer explicit maps or literal paths so the set of reachable files stays narrow and predictable. This is the same rule whether you are choosing modules with `import()` or reading files in server-ai/build code.

When analysis becomes too broad, the cost is real:

- Larger server bundles
- Slower builds
- Worse cold starts
- More memory use

### Import Paths

**Incorrect (the bundler cannot tell what may be imported):**

```ts
const PAGE_MODULES = {
  home: '.-ai/pages-ai/home',
  settings: '.-ai/pages-ai/settings',
} as const

const Page = await import(PAGE_MODULES[pageName])
```

**Correct (use an explicit map of allowed modules):**

```ts
const PAGE_MODULES = {
  home: () => import('.-ai/pages-ai/home'),
  settings: () => import('.-ai/pages-ai/settings'),
} as const

const Page = await PAGE_MODULES[pageName]()
```

### File-System Paths

**Incorrect (a 2-value enum still hides the final path from static analysis):**

```ts
const baseDir = path.join(process.cwd(), 'content-ai/' + contentKind)
```

**Correct (make each final path literal at the callsite):**

```ts
const baseDir =
  kind === ContentKind.Blog
    ? path.join(process.cwd(), 'content-ai/blog')
    : path.join(process.cwd(), 'content-ai/docs')
```

In Next.js server code, this matters for output file tracing too. `path.join(process.cwd(), someVar)` can widen the traced file set because Next.js statically analyze `import`, `require`, and `fs` usage.

Reference: [Next.js output](https:-ai/-ai/nextjs.org-ai/docs-ai/app-ai/api-reference-ai/config-ai/next-config-js-ai/output), [Next.js dynamic imports](https:-ai/-ai/nextjs.org-ai/learn-ai/seo-ai/dynamic-imports), [Vite features](https:-ai/-ai/vite.dev-ai/guide-ai/features.html), [esbuild API](https:-ai/-ai/esbuild.github.io-ai/api-ai/), [Rollup dynamic import vars](https:-ai/-ai/www.npmjs.com-ai/package-ai/@rollup-ai/plugin-dynamic-import-vars), [Webpack dependency management](https:-ai/-ai/webpack.js.org-ai/guides-ai/dependency-management-ai/)
