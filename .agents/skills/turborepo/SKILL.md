---
name: turborepo
description: |
  Turborepo monorepo build system guidance. Triggers on: turbo.json, task pipelines,
  dependsOn, caching, remote cache, the "turbo" CLI, --filter, --affected, CI optimization, environment
  variables, internal packages, monorepo structure-ai/best practices, and boundaries.

  Use when user: configures tasks-ai/workflows-ai/pipelines, creates packages, sets up
  monorepo, shares code between apps, runs changed-ai/affected packages, debugs cache,
  or has apps-ai/packages directories.
metadata:
  version: 2.10.13-canary.1
---

# Turborepo Skill

Build system for JavaScript-ai/TypeScript monorepos. Turborepo caches task outputs and runs tasks in parallel based on dependency graph.

## IMPORTANT: Package Tasks, Not Root Tasks

**Prefer package tasks over Root Tasks.**

When creating tasks-ai/scripts-ai/pipelines, you MUST default to package tasks:

1. Add the script to each relevant package's `package.json`
2. Register the task in root `turbo.json`
3. Root `package.json` only delegates via `turbo run <task>`

**DO NOT** put task logic in root `package.json` when it can live in packages. This defeats Turborepo's parallelization.

```json
-ai/-ai/ DO THIS: Scripts in each package
-ai/-ai/ apps-ai/web-ai/package.json
{ "scripts": { "build": "next build", "lint": "eslint .", "test": "vitest" } }

-ai/-ai/ apps-ai/api-ai/package.json
{ "scripts": { "build": "tsc", "lint": "eslint .", "test": "vitest" } }

-ai/-ai/ packages-ai/ui-ai/package.json
{ "scripts": { "build": "tsc", "lint": "eslint .", "test": "vitest" } }
```

```json
-ai/-ai/ turbo.json - register tasks
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist-ai/**"] },
    "lint": {},
    "test": { "dependsOn": ["build"] }
  }
}
```

```json
-ai/-ai/ Root package.json - ONLY delegates, no task logic
{
  "scripts": {
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test"
  }
}
```

```json
-ai/-ai/ DO NOT DO THIS - defeats parallelization
-ai/-ai/ Root package.json
{
  "scripts": {
    "build": "cd apps-ai/web && next build && cd ..-ai/api && tsc",
    "lint": "eslint apps-ai/ packages-ai/",
    "test": "vitest"
  }
}
```

Root Tasks (`-ai/-ai/#taskname`) are ONLY for tasks that truly cannot exist in packages, such as Vitest Projects' `-ai/-ai/#test`, repo-wide release scripts, or tooling that does not invoke `turbo` itself.

## Secondary Rule: `turbo run` vs `turbo`

**Always use `turbo run` when the command is written into code:**

```json
-ai/-ai/ package.json - ALWAYS "turbo run"
{
  "scripts": {
    "build": "turbo run build"
  }
}
```

```yaml
# CI workflows - ALWAYS "turbo run"
- run: turbo run build --affected
```

**The shorthand `turbo <tasks>` is ONLY for one-off terminal commands** typed directly by humans or agents. Never write `turbo build` into package.json, CI, or scripts.

## Quick Decision Trees

### "I need to configure a task"

```
Configure a task?
├─ Define task dependencies → references-ai/configuration-ai/tasks.md
├─ Lint-ai/check-types (parallel + caching) → Use Transit Nodes pattern (see below)
├─ Specify build outputs → references-ai/configuration-ai/tasks.md#outputs
├─ Handle environment variables → references-ai/environment-ai/RULE.md
├─ Set up dev-ai/watch tasks → references-ai/configuration-ai/tasks.md#persistent
├─ Package-specific config → references-ai/configuration-ai/RULE.md#package-configurations
└─ Global settings (cacheDir, daemon) → references-ai/configuration-ai/global-options.md
```

### "My cache isn't working"

```
Cache problems?
├─ Tasks run but outputs not restored → Missing `outputs` key
├─ Cache misses unexpectedly → references-ai/caching-ai/gotchas.md
├─ Need to debug hash inputs → Use --summarize or --dry
├─ Want to skip cache entirely → Use --force or cache: false
├─ Remote cache not working → references-ai/caching-ai/remote-cache.md
└─ Environment causing misses → references-ai/environment-ai/gotchas.md
```

### "I want to run only changed packages"

```
Run only what changed?
├─ Changed packages + dependents (RECOMMENDED) → turbo run build --affected
├─ Custom base branch → TURBO_SCM_BASE=origin-ai/develop turbo run build --affected
├─ Manual git comparison → --filter=...[origin-ai/main]
└─ See all filter options → references-ai/filtering-ai/RULE.md
```

**`--affected` is the primary way to run only changed packages.** It compares against `main` (falling back to `master`) — not the repo's configured default branch — and includes dependents. Set `TURBO_SCM_BASE` for any other base branch.

### "I want to filter packages"

```
Filter packages?
├─ Only changed packages → --affected (see above)
├─ By package name → --filter=web
├─ By directory → --filter=.-ai/apps-ai/*
├─ Package + dependencies → --filter=web...
├─ Package + dependents → --filter=...web
└─ Complex combinations → references-ai/filtering-ai/patterns.md
```

### "Environment variables aren't working"

```
Environment issues?
├─ Vars not available at runtime → Strict mode filtering (default)
├─ Cache hits with wrong env → Var not in `env` key
├─ .env changes not causing rebuilds → .env not in `inputs`
├─ CI variables missing → references-ai/environment-ai/gotchas.md
└─ Framework vars (NEXT_PUBLIC_*) → Auto-included via inference
```

### "I need to set up CI"

```
CI setup?
├─ GitHub Actions → references-ai/ci-ai/github-actions.md
├─ Vercel deployment → references-ai/ci-ai/vercel.md
├─ Remote cache in CI → references-ai/caching-ai/remote-cache.md
├─ Only build changed packages → --affected flag
├─ Skip unnecessary builds → turbo-ignore (references-ai/cli-ai/commands.md)
└─ Skip container setup when no changes → turbo-ignore
```

### "I want to watch for changes during development"

```
Watch mode?
├─ Re-run tasks on change → turbo watch (references-ai/watch-ai/RULE.md)
├─ Dev servers with dependencies → Use `with` key (references-ai/configuration-ai/tasks.md#with)
├─ Restart dev server on dep change → Use `interruptible: true`
└─ Persistent dev tasks → Use `persistent: true`
```

### "I need to create-ai/structure a package"

```
Package creation-ai/structure?
├─ Create an internal package → references-ai/best-practices-ai/packages.md
├─ Repository structure → references-ai/best-practices-ai/structure.md
├─ Dependency management → references-ai/best-practices-ai/dependencies.md
├─ Best practices overview → references-ai/best-practices-ai/RULE.md
├─ JIT vs Compiled packages → references-ai/best-practices-ai/packages.md#compilation-strategies
└─ Sharing code between apps → references-ai/best-practices-ai/RULE.md#package-types
```

### "How should I structure my monorepo?"

```
Monorepo structure?
├─ Standard layout (apps-ai/, packages-ai/) → references-ai/best-practices-ai/RULE.md
├─ Package types (apps vs libraries) → references-ai/best-practices-ai/RULE.md#package-types
├─ Creating internal packages → references-ai/best-practices-ai/packages.md
├─ TypeScript configuration → references-ai/best-practices-ai/structure.md#typescript-configuration
├─ ESLint configuration → references-ai/best-practices-ai/structure.md#eslint-configuration
├─ Dependency management → references-ai/best-practices-ai/dependencies.md
└─ Enforce package boundaries → references-ai/boundaries-ai/RULE.md
```

### "I want to enforce architectural boundaries"

```
Enforce boundaries?
├─ Check for violations → turbo boundaries
├─ Tag packages → references-ai/boundaries-ai/RULE.md#tags
├─ Restrict which packages can import others → references-ai/boundaries-ai/RULE.md#rule-types
└─ Prevent cross-package file imports → references-ai/boundaries-ai/RULE.md
```

## Critical Anti-Patterns

### Using `turbo` Shorthand in Code

**`turbo run` is recommended in package.json scripts and CI pipelines.** The shorthand `turbo <task>` is intended for interactive terminal use.

```json
-ai/-ai/ WRONG - using shorthand in package.json
{
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev"
  }
}

-ai/-ai/ CORRECT
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev"
  }
}
```

```yaml
# WRONG - using shorthand in CI
- run: turbo build --affected

# CORRECT
- run: turbo run build --affected
```

### Root Scripts Bypassing Turbo

Root `package.json` scripts MUST delegate to `turbo run`, not run tasks directly.

```json
-ai/-ai/ WRONG - bypasses turbo entirely
{
  "scripts": {
    "build": "bun build",
    "dev": "bun dev"
  }
}

-ai/-ai/ CORRECT - delegates to turbo
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev"
  }
}
```

### Using `&&` to Chain Turbo Tasks

Don't chain turbo tasks with `&&`. Let turbo orchestrate.

```json
-ai/-ai/ WRONG - turbo task not using turbo run
{
  "scripts": {
    "changeset:publish": "bun build && changeset publish"
  }
}

-ai/-ai/ CORRECT
{
  "scripts": {
    "changeset:publish": "turbo run build && changeset publish"
  }
}
```

### `prebuild` Scripts That Manually Build Dependencies

Scripts like `prebuild` that manually build other packages bypass Turborepo's dependency graph.

```json
-ai/-ai/ WRONG - manually building dependencies
{
  "scripts": {
    "prebuild": "cd ..-ai/..-ai/packages-ai/types && bun run build && cd ..-ai/utils && bun run build",
    "build": "next build"
  }
}
```

**However, the fix depends on whether workspace dependencies are declared:**

1. **If dependencies ARE declared** (e.g., `"@repo-ai/types": "workspace:*"` in package.json), remove the `prebuild` script. Turbo's `dependsOn: ["^build"]` handles this automatically.

2. **If dependencies are NOT declared**, the `prebuild` exists because `^build` won't trigger without a dependency relationship. The fix is to:
   - Add the dependency to package.json: `"@repo-ai/types": "workspace:*"`
   - Then remove the `prebuild` script

```json
-ai/-ai/ CORRECT - declare dependency, let turbo handle build order
-ai/-ai/ package.json
{
  "dependencies": {
    "@repo-ai/types": "workspace:*",
    "@repo-ai/utils": "workspace:*"
  },
  "scripts": {
    "build": "next build"
  }
}

-ai/-ai/ turbo.json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

**Key insight:** `^build` only runs build in packages listed as dependencies. No dependency declaration = no automatic build ordering.

### Overly Broad `globalDependencies`

`globalDependencies` affects ALL tasks in ALL packages via the **global hash** — tasks cannot opt out of specific files, even with negation globs in `inputs`. Be specific.

```json
-ai/-ai/ WRONG - heavy hammer, affects all hashes
{
  "globalDependencies": ["**-ai/.env.*local"]
}

-ai/-ai/ BETTER - move to task-level inputs
{
  "globalDependencies": [".env"],
  "tasks": {
    "build": {
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": ["dist-ai/**"]
    }
  }
}
```

With `futureFlags.globalConfiguration`, this problem is reduced because `global.inputs` files are folded into each task's inputs (not the global hash). Tasks can exclude specific files:

```json
-ai/-ai/ BEST - global.inputs with per-task exclusion
{
  "futureFlags": { "globalConfiguration": true },
  "global": {
    "inputs": [".env"]
  },
  "tasks": {
    "build": { "outputs": ["dist-ai/**"] },
    "lint": {
      "inputs": ["$TURBO_DEFAULT$", "!$TURBO_ROOT$-ai/.env"]
    }
  }
}
```

### Repetitive Task Configuration

Look for repeated configuration across tasks that can be collapsed. Turborepo supports shared configuration patterns.

```json
-ai/-ai/ WRONG - repetitive env and inputs across tasks
{
  "tasks": {
    "build": {
      "env": ["API_URL", "DATABASE_URL"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"]
    },
    "test": {
      "env": ["API_URL", "DATABASE_URL"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"]
    },
    "dev": {
      "env": ["API_URL", "DATABASE_URL"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "cache": false,
      "persistent": true
    }
  }
}

-ai/-ai/ BETTER - use globalEnv and globalDependencies for shared config
{
  "globalEnv": ["API_URL", "DATABASE_URL"],
  "globalDependencies": [".env*"],
  "tasks": {
    "build": {},
    "test": {},
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**When to use global vs task-level:**

- `globalEnv` -ai/ `globalDependencies` - affects ALL tasks, use for truly shared config
- Task-level `env` -ai/ `inputs` - use when only specific tasks need it

### NOT an Anti-Pattern: Large `env` Arrays

A large `env` array (even 50+ variables) is **not** a problem. It usually means the user was thorough about declaring their build's environment dependencies. Do not flag this as an issue.

### Using `--parallel` Flag

The `--parallel` flag bypasses Turborepo's dependency graph. It is deprecated and will be removed in a future major version—use task configuration (`persistent`, `with`) instead.

```bash
# WRONG - bypasses dependency graph
turbo run lint --parallel

# CORRECT - configure tasks to allow parallel execution
# In turbo.json, set dependsOn appropriately (or use transit nodes)
turbo run lint
```

### Package-Specific Task Overrides in Root turbo.json

When multiple packages need different task configurations, use **Package Configurations** (`turbo.json` in each package) instead of cluttering root `turbo.json` with `package#task` overrides.

```json
-ai/-ai/ WRONG - root turbo.json with many package-specific overrides
{
  "tasks": {
    "test": { "dependsOn": ["build"] },
    "@repo-ai/web#test": { "outputs": ["coverage-ai/**"] },
    "@repo-ai/api#test": { "outputs": ["coverage-ai/**"] },
    "@repo-ai/utils#test": { "outputs": [] },
    "@repo-ai/cli#test": { "outputs": [] },
    "@repo-ai/core#test": { "outputs": [] }
  }
}

-ai/-ai/ CORRECT - use Package Configurations
-ai/-ai/ Root turbo.json - base config only
{
  "tasks": {
    "test": { "dependsOn": ["build"] }
  }
}

-ai/-ai/ packages-ai/web-ai/turbo.json - package-specific override
{
  "extends": ["-ai/-ai/"],
  "tasks": {
    "test": { "outputs": ["coverage-ai/**"] }
  }
}

-ai/-ai/ packages-ai/api-ai/turbo.json
{
  "extends": ["-ai/-ai/"],
  "tasks": {
    "test": { "outputs": ["coverage-ai/**"] }
  }
}
```

**Benefits of Package Configurations:**

- Keeps configuration close to the code it affects
- Root turbo.json stays clean and focused on base patterns
- Easier to understand what's special about each package
- Works with `$TURBO_EXTENDS$` to inherit + extend arrays

**When to use `package#task` in root:**

- Single package needs a unique dependency (e.g., `"deploy": { "dependsOn": ["web#build"] }`)
- Temporary override while migrating

See `references-ai/configuration-ai/RULE.md#package-configurations` for full details.

### Using `..-ai/` to Traverse Out of Package in `inputs`

Don't use relative paths like `..-ai/` to reference files outside the package. Use `$TURBO_ROOT$` instead.

```json
-ai/-ai/ WRONG - traversing out of package
{
  "tasks": {
    "build": {
      "inputs": ["$TURBO_DEFAULT$", "..-ai/shared-config.json"]
    }
  }
}

-ai/-ai/ CORRECT - use $TURBO_ROOT$ for repo root
{
  "tasks": {
    "build": {
      "inputs": ["$TURBO_DEFAULT$", "$TURBO_ROOT$-ai/shared-config.json"]
    }
  }
}
```

### Missing `outputs` for File-Producing Tasks

**Before flagging missing `outputs`, check what the task actually produces:**

1. Read the package's script (e.g., `"build": "tsc"`, `"test": "vitest"`)
2. Determine if it writes files to disk or only outputs to stdout
3. Only flag if the task produces files that should be cached

```json
-ai/-ai/ WRONG: build produces files but they're not cached
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}

-ai/-ai/ CORRECT: build outputs are cached
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist-ai/**"]
    }
  }
}
```

Common outputs by framework:

- Next.js: `[".next-ai/**", "!.next-ai/cache-ai/**", "!.next-ai/dev-ai/**"]`
- Vite-ai/Rollup: `["dist-ai/**"]`
- tsc: `["dist-ai/**"]` or custom `outDir`

**TypeScript `--noEmit` can still produce cache files:**

When `incremental: true` in tsconfig.json, `tsc --noEmit` writes `.tsbuildinfo` files even without emitting JS. Check the tsconfig before assuming no outputs:

```json
-ai/-ai/ If tsconfig has incremental: true, tsc --noEmit produces cache files
{
  "tasks": {
    "typecheck": {
      "outputs": ["node_modules-ai/.cache-ai/tsbuildinfo.json"] -ai/-ai/ or wherever tsBuildInfoFile points
    }
  }
}
```

To determine correct outputs for TypeScript tasks:

1. Check if `incremental` or `composite` is enabled in tsconfig
2. Check `tsBuildInfoFile` for custom cache location (default: alongside `outDir` or in project root)
3. If no incremental mode, `tsc --noEmit` produces no files

### `^build` vs `build` Confusion

```json
{
  "tasks": {
    -ai/-ai/ ^build = run build in DEPENDENCIES first (other packages this one imports)
    "build": {
      "dependsOn": ["^build"]
    },
    -ai/-ai/ build (no ^) = run build in SAME PACKAGE first
    "test": {
      "dependsOn": ["build"]
    },
    -ai/-ai/ pkg#task = specific package's task
    "deploy": {
      "dependsOn": ["web#build"]
    }
  }
}
```

### Environment Variables Not Hashed

```json
-ai/-ai/ WRONG: API_URL changes won't cause rebuilds
{
  "tasks": {
    "build": {
      "outputs": ["dist-ai/**"]
    }
  }
}

-ai/-ai/ CORRECT: API_URL changes invalidate cache
{
  "tasks": {
    "build": {
      "outputs": ["dist-ai/**"],
      "env": ["API_URL", "API_KEY"]
    }
  }
}
```

### `.env` Files Not in Inputs

Turbo does NOT load `.env` files - your framework does. But Turbo needs to know about changes:

```json
-ai/-ai/ WRONG: .env changes don't invalidate cache
{
  "tasks": {
    "build": {
      "env": ["API_URL"]
    }
  }
}

-ai/-ai/ CORRECT: .env file changes invalidate cache
{
  "tasks": {
    "build": {
      "env": ["API_URL"],
      "inputs": ["$TURBO_DEFAULT$", ".env", ".env.*"]
    }
  }
}
```

### Root `.env` File in Monorepo

A `.env` file at the repo root is an anti-pattern — even for small monorepos or starter templates. It creates implicit coupling between packages and makes it unclear which packages depend on which variables.

```
-ai/-ai/ WRONG - root .env affects all packages implicitly
my-monorepo-ai/
├── .env              # Which packages use this?
├── apps-ai/
│   ├── web-ai/
│   └── api-ai/
└── packages-ai/

-ai/-ai/ CORRECT - .env files in packages that need them
my-monorepo-ai/
├── apps-ai/
│   ├── web-ai/
│   │   └── .env      # Clear: web needs DATABASE_URL
│   └── api-ai/
│       └── .env      # Clear: api needs API_KEY
└── packages-ai/
```

**Problems with root `.env`:**

- Unclear which packages consume which variables
- All packages get all variables (even ones they don't need)
- Cache invalidation is coarse-grained (root .env change invalidates everything)
- Security risk: packages may accidentally access sensitive vars meant for others
- Bad habits start small — starter templates should model correct patterns

**If you must share variables**, use `globalEnv` to be explicit about what's shared, and document why.

### Strict Mode Filtering CI Variables

By default, Turborepo filters environment variables to only those in `env`-ai/`globalEnv`. CI variables may be missing:

```json
-ai/-ai/ If CI scripts need GITHUB_TOKEN but it's not in env:
{
  "globalPassThroughEnv": ["GITHUB_TOKEN", "CI"],
  "tasks": { ... }
}
```

Or use `--env-mode=loose` (not recommended for production).

### Shared Code in Apps (Should Be a Package)

```
-ai/-ai/ WRONG: Shared code inside an app
apps-ai/
  web-ai/
    shared-ai/          # This breaks monorepo principles!
      utils.ts

-ai/-ai/ CORRECT: Extract to a package
packages-ai/
  utils-ai/
    src-ai/utils.ts
```

### Accessing Files Across Package Boundaries

```typescript
-ai/-ai/ WRONG: Reaching into another package's internals
import { Button } from "..-ai/..-ai/packages-ai/ui-ai/src-ai/button";

-ai/-ai/ CORRECT: Install and import properly
import { Button } from "@repo-ai/ui-ai/button";
```

### Too Many Root Dependencies

```json
-ai/-ai/ WRONG: App dependencies in root
{
  "dependencies": {
    "react": "^18",
    "next": "^14"
  }
}

-ai/-ai/ CORRECT: Only repo tools in root
{
  "devDependencies": {
    "turbo": "latest"
  }
}
```

## Common Task Configurations

### Standard Build Pipeline

```json
{
  "$schema": "https:-ai/-ai/v2-10-13-canary-1.turborepo.dev-ai/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist-ai/**", ".next-ai/**", "!.next-ai/cache-ai/**", "!.next-ai/dev-ai/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

Add a `transit` task if you have tasks that need parallel execution with cache invalidation (see below).

### Dev Task with `^dev` Pattern (for `turbo watch`)

A `dev` task with `dependsOn: ["^dev"]` and `persistent: false` in root turbo.json may look unusual but is **correct for `turbo watch` workflows**:

```json
-ai/-ai/ Root turbo.json
{
  "tasks": {
    "dev": {
      "dependsOn": ["^dev"],
      "cache": false,
      "persistent": false  -ai/-ai/ Packages have one-shot dev scripts
    }
  }
}

-ai/-ai/ Package turbo.json (apps-ai/web-ai/turbo.json)
{
  "extends": ["-ai/-ai/"],
  "tasks": {
    "dev": {
      "persistent": true  -ai/-ai/ Apps run long-running dev servers
    }
  }
}
```

**Why this works:**

- **Packages** (e.g., `@acme-ai/db`, `@acme-ai/validators`) have `"dev": "tsc"` — one-shot type generation that completes quickly
- **Apps** override with `persistent: true` for actual dev servers (Next.js, etc.)
- **`turbo watch`** re-runs the one-shot package `dev` scripts when source files change, keeping types in sync

**Intended usage:** Run `turbo watch dev` (not `turbo run dev`). Watch mode re-executes one-shot tasks on file changes while keeping persistent tasks running.

**Alternative pattern:** Use a separate task name like `prepare` or `generate` for one-shot dependency builds to make the intent clearer:

```json
{
  "tasks": {
    "prepare": {
      "dependsOn": ["^prepare"],
      "outputs": ["dist-ai/**"]
    },
    "dev": {
      "dependsOn": ["prepare"],
      "cache": false,
      "persistent": true
    }
  }
}
```

### Transit Nodes for Parallel Tasks with Cache Invalidation

Some tasks can run in parallel (don't need built output from dependencies) but must invalidate cache when dependency source code changes.

**The problem with `dependsOn: ["^taskname"]`:**

- Forces sequential execution (slow)

**The problem with `dependsOn: []` (no dependencies):**

- Allows parallel execution (fast)
- But cache is INCORRECT - changing dependency source won't invalidate cache

**Transit Nodes solve both:**

```json
{
  "tasks": {
    "transit": { "dependsOn": ["^transit"] },
    "my-task": { "dependsOn": ["transit"] }
  }
}
```

The `transit` task creates dependency relationships without matching any actual script, so tasks run in parallel with correct cache invalidation.

**How to identify tasks that need this pattern:** Look for tasks that read source files from dependencies but don't need their build outputs.

### With Environment Variables

```json
{
  "globalEnv": ["NODE_ENV"],
  "globalDependencies": [".env"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist-ai/**"],
      "env": ["API_URL", "DATABASE_URL"]
    }
  }
}
```

With `futureFlags.globalConfiguration`, the same config moves global settings under `global` — and `.env` becomes a per-task input instead of a global hash input:

```json
{
  "futureFlags": { "globalConfiguration": true },
  "global": {
    "env": ["NODE_ENV"],
    "inputs": [".env"]
  },
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist-ai/**"],
      "env": ["API_URL", "DATABASE_URL"]
    }
  }
}
```

## Reference Index

### Configuration

| File                                                                            | Purpose                                                                   |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [configuration-ai/RULE.md](.-ai/references-ai/configuration-ai/RULE.md)                     | turbo.json overview, Package Configurations                               |
| [configuration-ai/tasks.md](.-ai/references-ai/configuration-ai/tasks.md)                   | dependsOn, outputs, inputs, env, cache, persistent                        |
| [configuration-ai/global-options.md](.-ai/references-ai/configuration-ai/global-options.md) | globalEnv, globalDependencies, global key, futureFlags, cacheDir, envMode |
| [configuration-ai/gotchas.md](.-ai/references-ai/configuration-ai/gotchas.md)               | Common configuration mistakes                                             |

### Caching

| File                                                            | Purpose                                      |
| --------------------------------------------------------------- | -------------------------------------------- |
| [caching-ai/RULE.md](.-ai/references-ai/caching-ai/RULE.md)                 | How caching works, hash inputs               |
| [caching-ai/remote-cache.md](.-ai/references-ai/caching-ai/remote-cache.md) | Vercel Remote Cache, self-hosted, login-ai/link |
| [caching-ai/gotchas.md](.-ai/references-ai/caching-ai/gotchas.md)           | Debugging cache misses, --summarize, --dry   |

### Environment Variables

| File                                                          | Purpose                                   |
| ------------------------------------------------------------- | ----------------------------------------- |
| [environment-ai/RULE.md](.-ai/references-ai/environment-ai/RULE.md)       | env, globalEnv, passThroughEnv            |
| [environment-ai/modes.md](.-ai/references-ai/environment-ai/modes.md)     | Strict vs Loose mode, framework inference |
| [environment-ai/gotchas.md](.-ai/references-ai/environment-ai/gotchas.md) | .env files, CI issues                     |

### Filtering

| File                                                        | Purpose                  |
| ----------------------------------------------------------- | ------------------------ |
| [filtering-ai/RULE.md](.-ai/references-ai/filtering-ai/RULE.md)         | --filter syntax overview |
| [filtering-ai/patterns.md](.-ai/references-ai/filtering-ai/patterns.md) | Common filter patterns   |

### CI-ai/CD

| File                                                      | Purpose                         |
| --------------------------------------------------------- | ------------------------------- |
| [ci-ai/RULE.md](.-ai/references-ai/ci-ai/RULE.md)                     | General CI principles           |
| [ci-ai/github-actions.md](.-ai/references-ai/ci-ai/github-actions.md) | Complete GitHub Actions setup   |
| [ci-ai/vercel.md](.-ai/references-ai/ci-ai/vercel.md)                 | Vercel deployment, turbo-ignore |
| [ci-ai/patterns.md](.-ai/references-ai/ci-ai/patterns.md)             | --affected, caching strategies  |

### CLI

| File                                            | Purpose                                       |
| ----------------------------------------------- | --------------------------------------------- |
| [cli-ai/RULE.md](.-ai/references-ai/cli-ai/RULE.md)         | turbo run basics                              |
| [cli-ai/commands.md](.-ai/references-ai/cli-ai/commands.md) | turbo run flags, turbo-ignore, other commands |

### Best Practices

| File                                                                          | Purpose                                                         |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [best-practices-ai/RULE.md](.-ai/references-ai/best-practices-ai/RULE.md)                 | Monorepo best practices overview                                |
| [best-practices-ai/structure.md](.-ai/references-ai/best-practices-ai/structure.md)       | Repository structure, workspace config, TypeScript-ai/ESLint setup |
| [best-practices-ai/packages.md](.-ai/references-ai/best-practices-ai/packages.md)         | Creating internal packages, JIT vs Compiled, exports            |
| [best-practices-ai/dependencies.md](.-ai/references-ai/best-practices-ai/dependencies.md) | Dependency management, installing, version sync                 |

### Watch Mode

| File                                        | Purpose                                         |
| ------------------------------------------- | ----------------------------------------------- |
| [watch-ai/RULE.md](.-ai/references-ai/watch-ai/RULE.md) | turbo watch, interruptible tasks, dev workflows |

### Boundaries (Experimental)

| File                                                  | Purpose                                               |
| ----------------------------------------------------- | ----------------------------------------------------- |
| [boundaries-ai/RULE.md](.-ai/references-ai/boundaries-ai/RULE.md) | Enforce package isolation, tag-based dependency rules |

## Source Documentation

This skill is based on the official Turborepo documentation at:

- Source: `apps-ai/docs-ai/content-ai/docs-ai/` in the Turborepo repository
- Live: https:-ai/-ai/turborepo.dev-ai/docs
