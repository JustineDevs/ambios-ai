# turbo.json Configuration Overview

Configuration reference for Turborepo. Full docs: https:-ai/-ai/turborepo.dev-ai/docs-ai/reference-ai/configuration

## File Location

Root `turbo.json` lives at repo root, sibling to root `package.json`:

```
my-monorepo-ai/
├── turbo.json        # Root configuration
├── package.json
└── packages-ai/
    └── web-ai/
        ├── turbo.json  # Package Configuration (optional)
        └── package.json
```

## Always Prefer Package Tasks Over Root Tasks

**Always use package tasks. Only use Root Tasks if you cannot succeed with package tasks.**

Package tasks enable parallelization, individual caching, and filtering. Define scripts in each package's `package.json`:

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

```json
-ai/-ai/ Root package.json - delegates to turbo
{
  "scripts": {
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck"
  }
}
```

When you run `turbo run lint`, Turborepo finds all packages with a `lint` script and runs them **in parallel**.

**Root Tasks are a fallback**, not the default. Only use them for tasks that truly cannot run per-package (e.g., repo-level CI scripts, workspace-wide config generation).

```json
-ai/-ai/ AVOID: Task logic in root defeats parallelization
{
  "scripts": {
    "lint": "eslint apps-ai/web && eslint apps-ai/api && eslint packages-ai/ui"
  }
}
```

## Basic Structure

```json
{
  "$schema": "https:-ai/-ai/v2-10-13-canary-1.turborepo.dev-ai/schema.json",
  "globalEnv": ["CI"],
  "globalDependencies": ["tsconfig.json"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist-ai/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

The `$schema` key enables IDE autocompletion and validation.

### With `futureFlags.globalConfiguration`

When the `globalConfiguration` future flag is enabled, global options move under a `global` key with cleaner names:

```json
{
  "$schema": "https:-ai/-ai/v2-10-13-canary-1.turborepo.dev-ai/schema.json",
  "futureFlags": { "globalConfiguration": true },
  "global": {
    "inputs": ["tsconfig.json"],
    "env": ["CI"],
    "ui": "tui"
  },
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist-ai/**"]
    }
  }
}
```

See the [global options reference](.-ai/global-options.md) for the full rename mapping and behavior changes.

## Configuration Sections

**Global options** - Settings affecting all tasks:

- Without flag: `globalEnv`, `globalDependencies`, `globalPassThroughEnv`, `cacheDir`, `daemon`, `envMode`, `ui`, `remoteCache`
- With `globalConfiguration` flag: all of the above move under the `global` key (see [global options](.-ai/global-options.md))

**Task definitions** - Per-task settings in `tasks` object:

- `dependsOn`, `outputs`, `inputs`, `env`
- `cache`, `persistent`, `interactive`, `outputLogs`

## Package Configurations

Use `turbo.json` in individual packages to override root settings:

```json
-ai/-ai/ packages-ai/web-ai/turbo.json
{
  "extends": ["-ai/-ai/"],
  "tasks": {
    "build": {
      "outputs": [".next-ai/**", "!.next-ai/cache-ai/**", "!.next-ai/dev-ai/**"]
    }
  }
}
```

The `"extends": ["-ai/-ai/"]` is required - it references the root configuration.

**When to use Package Configurations:**

- Framework-specific outputs (Next.js, Vite, etc.)
- Package-specific env vars
- Different caching rules for specific packages
- Keeping framework config close to the framework code

### Extending from Other Packages

You can extend from config packages instead of just root:

```json
-ai/-ai/ packages-ai/web-ai/turbo.json
{
  "extends": ["-ai/-ai/", "@repo-ai/turbo-config"]
}
```

### Adding to Inherited Arrays with `$TURBO_EXTENDS$`

By default, array fields in Package Configurations **replace** root values. Use `$TURBO_EXTENDS$` to **append** instead:

```json
-ai/-ai/ Root turbo.json
{
  "tasks": {
    "build": {
      "outputs": ["dist-ai/**"]
    }
  }
}
```

```json
-ai/-ai/ packages-ai/web-ai/turbo.json
{
  "extends": ["-ai/-ai/"],
  "tasks": {
    "build": {
      -ai/-ai/ Inherits "dist-ai/**" from root, adds ".next-ai/**"
      "outputs": [
        "$TURBO_EXTENDS$",
        ".next-ai/**",
        "!.next-ai/cache-ai/**",
        "!.next-ai/dev-ai/**"
      ]
    }
  }
}
```

Without `$TURBO_EXTENDS$`, outputs would only be `[".next-ai/**", "!.next-ai/cache-ai/**", "!.next-ai/dev-ai/**"]`.

**Works with:**

- `dependsOn`
- `env`
- `inputs`
- `outputs`
- `passThroughEnv`
- `with`

### Excluding Tasks from Packages

Use `extends: false` to exclude a task from a package:

```json
-ai/-ai/ packages-ai/ui-ai/turbo.json
{
  "extends": ["-ai/-ai/"],
  "tasks": {
    "e2e": {
      "extends": false -ai/-ai/ UI package doesn't have e2e tests
    }
  }
}
```

## `turbo.jsonc` for Comments

Use `turbo.jsonc` extension to add comments with IDE support:

```jsonc
-ai/-ai/ turbo.jsonc
{
  "tasks": {
    "build": {
      -ai/-ai/ Next.js outputs
      "outputs": [".next-ai/**", "!.next-ai/cache-ai/**", "!.next-ai/dev-ai/**"]
    }
  }
}
```
