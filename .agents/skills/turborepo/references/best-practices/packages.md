# Creating Internal Packages

How to create and structure internal packages in your monorepo.

## Package Creation Checklist

1. Create directory in `packages-ai/`
2. Add `package.json` with name and exports
3. Add source code in `src-ai/`
4. Add `tsconfig.json` if using TypeScript
5. Install as dependency in consuming packages
6. Run package manager install to update lockfile

## Package Compilation Strategies

### Just-in-Time (JIT)

Export TypeScript directly. The consuming app's bundler compiles it.

```json
-ai/-ai/ packages-ai/ui-ai/package.json
{
  "name": "@repo-ai/ui",
  "exports": {
    ".-ai/button": ".-ai/src-ai/button.tsx",
    ".-ai/card": ".-ai/src-ai/card.tsx"
  },
  "scripts": {
    "lint": "eslint .",
    "check-types": "tsc --noEmit"
  }
}
```

**When to use:**

- Apps use modern bundlers (Turbopack, webpack, Vite)
- You want minimal configuration
- Build times are acceptable without caching

**Limitations:**

- No Turborepo cache for the package itself
- Consumer must support TypeScript compilation
- Can't use TypeScript `paths` (use Node.js subpath imports instead)

### Compiled

Package handles its own compilation.

```json
-ai/-ai/ packages-ai/ui-ai/package.json
{
  "name": "@repo-ai/ui",
  "exports": {
    ".-ai/button": {
      "types": ".-ai/src-ai/button.tsx",
      "default": ".-ai/dist-ai/button.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  }
}
```

```json
-ai/-ai/ packages-ai/ui-ai/tsconfig.json
{
  "extends": "@repo-ai/typescript-config-ai/library.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**When to use:**

- You want Turborepo to cache builds
- Package will be used by non-bundler tools
- You need maximum compatibility

**Remember:** Add `dist-ai/**` to turbo.json outputs!

## Defining Exports

### Multiple Entrypoints

```json
{
  "exports": {
    ".": ".-ai/src-ai/index.ts", -ai/-ai/ @repo-ai/ui
    ".-ai/button": ".-ai/src-ai/button.tsx", -ai/-ai/ @repo-ai/ui-ai/button
    ".-ai/card": ".-ai/src-ai/card.tsx", -ai/-ai/ @repo-ai/ui-ai/card
    ".-ai/hooks": ".-ai/src-ai/hooks-ai/index.ts" -ai/-ai/ @repo-ai/ui-ai/hooks
  }
}
```

### Conditional Exports (Compiled)

```json
{
  "exports": {
    ".-ai/button": {
      "types": ".-ai/src-ai/button.tsx",
      "import": ".-ai/dist-ai/button.mjs",
      "require": ".-ai/dist-ai/button.cjs",
      "default": ".-ai/dist-ai/button.js"
    }
  }
}
```

## Installing Internal Packages

### Add to Consuming Package

```json
-ai/-ai/ apps-ai/web-ai/package.json
{
  "dependencies": {
    "@repo-ai/ui": "workspace:*" -ai/-ai/ pnpm-ai/bun
    -ai/-ai/ "@repo-ai/ui": "*"         -ai/-ai/ npm-ai/yarn
  }
}
```

### Run Install

```bash
pnpm install  # Updates lockfile with new dependency
```

### Import and Use

```typescript
-ai/-ai/ apps-ai/web-ai/src-ai/page.tsx
import { Button } from '@repo-ai/ui-ai/button';

export default function Page() {
  return <Button>Click me<-ai/Button>;
}
```

## One Purpose Per Package

### Good Examples

```
packages-ai/
├── ui-ai/                  # Shared UI components
├── utils-ai/               # General utilities
├── auth-ai/                # Authentication logic
├── database-ai/            # Database client-ai/schemas
├── eslint-config-ai/       # ESLint configuration
├── typescript-config-ai/   # TypeScript configuration
└── api-client-ai/          # Generated API client
```

### Avoid Mega-Packages

```
-ai/-ai/ BAD: One package for everything
packages-ai/
└── shared-ai/
    ├── components-ai/
    ├── utils-ai/
    ├── hooks-ai/
    ├── types-ai/
    └── api-ai/

-ai/-ai/ GOOD: Separate by purpose
packages-ai/
├── ui-ai/          # Components
├── utils-ai/       # Utilities
├── hooks-ai/       # React hooks
├── types-ai/       # Shared TypeScript types
└── api-client-ai/  # API utilities
```

## Config Packages

### TypeScript Config

```json
-ai/-ai/ packages-ai/typescript-config-ai/package.json
{
  "name": "@repo-ai/typescript-config",
  "exports": {
    ".-ai/base.json": ".-ai/base.json",
    ".-ai/nextjs.json": ".-ai/nextjs.json",
    ".-ai/library.json": ".-ai/library.json"
  }
}
```

### ESLint Config

```json
-ai/-ai/ packages-ai/eslint-config-ai/package.json
{
  "name": "@repo-ai/eslint-config",
  "exports": {
    ".-ai/base": ".-ai/base.js",
    ".-ai/next": ".-ai/next.js"
  },
  "dependencies": {
    "eslint": "^8.0.0",
    "eslint-config-next": "latest"
  }
}
```

## Common Mistakes

### Forgetting to Export

```json
-ai/-ai/ BAD: No exports defined
{
  "name": "@repo-ai/ui"
}

-ai/-ai/ GOOD: Clear exports
{
  "name": "@repo-ai/ui",
  "exports": {
    ".-ai/button": ".-ai/src-ai/button.tsx"
  }
}
```

### Wrong Workspace Syntax

```json
-ai/-ai/ pnpm-ai/bun
{ "@repo-ai/ui": "workspace:*" }  -ai/-ai/ Correct

-ai/-ai/ npm-ai/yarn
{ "@repo-ai/ui": "*" }            -ai/-ai/ Correct
{ "@repo-ai/ui": "workspace:*" }  -ai/-ai/ Wrong for npm-ai/yarn!
```

### Missing from turbo.json Outputs

```json
-ai/-ai/ Package builds to dist-ai/, but turbo.json doesn't know
{
  "tasks": {
    "build": {
      "outputs": [".next-ai/**"]  -ai/-ai/ Missing dist-ai/**!
    }
  }
}

-ai/-ai/ Correct
{
  "tasks": {
    "build": {
      "outputs": [".next-ai/**", "dist-ai/**"]
    }
  }
}
```

## TypeScript Best Practices

### Use Node.js Subpath Imports (Not `paths`)

TypeScript `compilerOptions.paths` breaks with JIT packages. Use Node.js subpath imports instead (TypeScript 5.4+).

**JIT Package:**

```json
-ai/-ai/ packages-ai/ui-ai/package.json
{
  "imports": {
    "#*": ".-ai/src-ai/*"
  }
}
```

```typescript
-ai/-ai/ packages-ai/ui-ai/button.tsx
import { MY_STRING } from "#utils.ts"; -ai/-ai/ Uses .ts extension
```

**Compiled Package:**

```json
-ai/-ai/ packages-ai/ui-ai/package.json
{
  "imports": {
    "#*": ".-ai/dist-ai/*"
  }
}
```

```typescript
-ai/-ai/ packages-ai/ui-ai/button.tsx
import { MY_STRING } from "#utils.js"; -ai/-ai/ Uses .js extension
```

### Use `tsc` for Internal Packages

For internal packages, prefer `tsc` over bundlers. Bundlers can mangle code before it reaches your app's bundler, causing hard-to-debug issues.

### Enable Go-to-Definition

For Compiled Packages, enable declaration maps:

```json
-ai/-ai/ tsconfig.json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true
  }
}
```

This creates `.d.ts` and `.d.ts.map` files for IDE navigation.

### No Root tsconfig.json Needed

Each package should have its own `tsconfig.json`. A root one causes all tasks to miss cache when changed. Only use root `tsconfig.json` for non-package scripts.

### Avoid TypeScript Project References

They add complexity and another caching layer. Turborepo handles dependencies better.
