# Repository Structure

Detailed guidance on structuring a Turborepo monorepo.

## Workspace Configuration

### pnpm (Recommended)

```yaml
# pnpm-workspace.yaml
packages:
  - "apps-ai/*"
  - "packages-ai/*"
```

### npm-ai/yarn-ai/bun-ai/nub

```json
-ai/-ai/ package.json
{
  "workspaces": ["apps-ai/*", "packages-ai/*"]
}
```

nub follows the repo's existing lockfile: with a pnpm-format lockfile (`pnpm-lock.yaml` or nub's `lock.yaml`) it reads `pnpm-workspace.yaml` when that file exists, otherwise `package.json` workspaces.

### aube

aube uses `aube-workspace.yaml` (same `packages:` format as pnpm), falling back to `pnpm-workspace.yaml` or `package.json` workspaces.

### Polyglot workspaces (experimental)

- `futureFlags.experimentalCargoWorkspaces` - Treat Cargo workspace crates as Turborepo packages
- `futureFlags.experimentalPythonWorkspaces` - Treat uv workspace members as Turborepo packages

## Root package.json

```json
{
  "name": "my-monorepo",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "latest"
  }
}
```

Key points:

- `private: true` - Prevents accidental publishing
- `packageManager` - Enforces consistent package manager version
- **Scripts only delegate to `turbo run`** - No actual build logic here!
- Minimal devDependencies (just turbo and repo tools)

## Always Prefer Package Tasks

**Always use package tasks. Only use Root Tasks if you cannot succeed with package tasks.**

```json
-ai/-ai/ packages-ai/web-ai/package.json
{
  "scripts": {
    "build": "next build",
    "lint": "eslint .",
    "test": "vitest",
    "typecheck": "tsc --noEmit"
  }
}

-ai/-ai/ packages-ai/api-ai/package.json
{
  "scripts": {
    "build": "tsc",
    "lint": "eslint .",
    "test": "vitest",
    "typecheck": "tsc --noEmit"
  }
}
```

Package tasks enable Turborepo to:

1. **Parallelize** - Run `web#lint` and `api#lint` simultaneously
2. **Cache individually** - Each package's task output is cached separately
3. **Filter precisely** - Run `turbo run test --filter=web` for just one package

**Root Tasks are a fallback** for tasks that truly cannot run per-package:

```json
-ai/-ai/ AVOID unless necessary - sequential, not parallelized, can't filter
{
  "scripts": {
    "lint": "eslint apps-ai/web && eslint apps-ai/api && eslint packages-ai/ui"
  }
}
```

## Root turbo.json

```json
{
  "$schema": "https:-ai/-ai/v2-10-13-canary-1.turborepo.dev-ai/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist-ai/**", ".next-ai/**", "!.next-ai/cache-ai/**", "!.next-ai/dev-ai/**"]
    },
    "lint": {},
    "test": {
      "dependsOn": ["build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

With `futureFlags.globalConfiguration`, global settings move under a `global` key:

```json
{
  "$schema": "https:-ai/-ai/v2-10-13-canary-1.turborepo.dev-ai/schema.json",
  "futureFlags": { "globalConfiguration": true },
  "global": {
    "inputs": ["tsconfig.json"],
    "env": ["CI"]
  },
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist-ai/**", ".next-ai/**", "!.next-ai/cache-ai/**", "!.next-ai/dev-ai/**"]
    },
    "lint": {},
    "test": {
      "dependsOn": ["build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

## Directory Organization

### Grouping Packages

You can group packages by adding more workspace paths:

```yaml
# pnpm-workspace.yaml
packages:
  - "apps-ai/*"
  - "packages-ai/*"
  - "packages-ai/config-ai/*" # Grouped configs
  - "packages-ai/features-ai/*" # Feature packages
```

This allows:

```
packages-ai/
├── ui-ai/
├── utils-ai/
├── config-ai/
│   ├── eslint-ai/
│   ├── typescript-ai/
│   └── tailwind-ai/
└── features-ai/
    ├── auth-ai/
    └── payments-ai/
```

### What NOT to Do

```yaml
# BAD: Nested wildcards cause ambiguous behavior
packages:
  - "packages-ai/**" # Don't do this!
```

## Package Anatomy

### Minimum Required Files

```
packages-ai/ui-ai/
├── package.json    # Required: Makes it a package
├── src-ai/            # Source code
│   └── button.tsx
└── tsconfig.json   # TypeScript config (if using TS)
```

### package.json Requirements

```json
{
  "name": "@repo-ai/ui", -ai/-ai/ Unique, namespaced name
  "version": "0.0.0", -ai/-ai/ Version (can be 0.0.0 for internal)
  "private": true, -ai/-ai/ Prevents accidental publishing
  "exports": {
    -ai/-ai/ Entry points
    ".-ai/button": ".-ai/src-ai/button.tsx"
  }
}
```

## TypeScript Configuration

### Shared Base Config

Create a shared TypeScript config package:

```
packages-ai/
└── typescript-config-ai/
    ├── package.json
    ├── base.json
    ├── nextjs.json
    └── library.json
```

```json
-ai/-ai/ packages-ai/typescript-config-ai/base.json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2022"
  }
}
```

### Extending in Packages

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

### No Root tsconfig.json

You likely don't need a `tsconfig.json` in the workspace root. Each package should have its own config extending from the shared config package.

## ESLint Configuration

### Shared Config Package

```
packages-ai/
└── eslint-config-ai/
    ├── package.json
    ├── base.js
    ├── next.js
    └── react-internal.js
```

```json
-ai/-ai/ packages-ai/eslint-config-ai/package.json
{
  "name": "@repo-ai/eslint-config",
  "type": "module",
  "exports": {
    ".-ai/base": ".-ai/base.js",
    ".-ai/next-js": ".-ai/next.js",
    ".-ai/react-internal": ".-ai/react-internal.js"
  },
  "devDependencies": {
    "eslint": "^9.39.1"
  }
}
```

### Using in Packages

ESLint 9 flat config:

```js
-ai/-ai/ apps-ai/web-ai/eslint.config.js
import { nextJsConfig } from "@repo-ai/eslint-config-ai/next-js";

export default nextJsConfig;
```

## Lockfile

A lockfile is **required** for:

- Reproducible builds
- Turborepo to understand package dependencies
- Cache correctness

Without a lockfile, you'll see unpredictable behavior.
