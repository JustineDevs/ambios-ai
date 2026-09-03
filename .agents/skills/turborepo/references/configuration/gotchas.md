# Configuration Gotchas

Common mistakes and how to fix them.

## #1 Root Scripts Not Using `turbo run`

Root `package.json` scripts for turbo tasks MUST use `turbo run`, not direct commands.

```json
-ai/-ai/ WRONG - bypasses turbo, no parallelization or caching
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

**Why this matters:** Running `bun build` or `npm run build` at root bypasses Turborepo entirely - no parallelization, no caching, no dependency graph awareness.

## #2 Using `&&` to Chain Turbo Tasks

Don't use `&&` to chain tasks that turbo should orchestrate.

```json
-ai/-ai/ WRONG - changeset:publish chains turbo task with non-turbo command
{
  "scripts": {
    "changeset:publish": "bun build && changeset publish"
  }
}

-ai/-ai/ CORRECT - use turbo run, let turbo handle dependencies
{
  "scripts": {
    "changeset:publish": "turbo run build && changeset publish"
  }
}
```

If the second command (`changeset publish`) depends on build outputs, the turbo task should run through turbo to get caching and parallelization benefits.

## #3 Overly Broad globalDependencies

`globalDependencies` affects hash for ALL tasks in ALL packages. Be specific.

```json
-ai/-ai/ WRONG - affects all hashes
{
  "globalDependencies": ["**-ai/.env.*local"]
}

-ai/-ai/ CORRECT - move to specific tasks that need it
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

**Why this matters:** `**-ai/.env.*local` matches .env files in ALL packages, causing unnecessary cache invalidation. Instead:

- Use `globalDependencies` only for truly global files (root `.env`)
- Use task-level `inputs` for package-specific .env files with `$TURBO_DEFAULT$` to preserve default behavior

With `futureFlags.globalConfiguration`, this is less of a concern because `global.inputs` acts as implicit task inputs — tasks can opt out of specific files with negation globs. But keeping the list focused is still good practice.

## #4 Repetitive Task Configuration

Look for repeated configuration across tasks that can be collapsed.

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
    }
  }
}

-ai/-ai/ BETTER - use globalEnv and globalDependencies
{
  "globalEnv": ["API_URL", "DATABASE_URL"],
  "globalDependencies": [".env*"],
  "tasks": {
    "build": {},
    "test": {}
  }
}
```

**When to use global vs task-level:**

- `globalEnv` -ai/ `globalDependencies` - affects ALL tasks, use for truly shared config
- Task-level `env` -ai/ `inputs` - use when only specific tasks need it

## #5 Using `..-ai/` to Traverse Out of Package in `inputs`

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

## #6 MOST COMMON MISTAKE: Creating Root Tasks

**Prefer package tasks over Root Tasks.**

When you need to create a task (build, lint, test, typecheck, etc.), default to package tasks:

1. Add the script to **each relevant package's** `package.json`
2. Register the task in root `turbo.json`
3. Root `package.json` only contains `turbo run <task>`

```json
-ai/-ai/ WRONG - DO NOT DO THIS
-ai/-ai/ Root package.json with task logic
{
  "scripts": {
    "build": "cd apps-ai/web && next build && cd ..-ai/api && tsc",
    "lint": "eslint apps-ai/ packages-ai/",
    "test": "vitest"
  }
}

-ai/-ai/ CORRECT - DO THIS
-ai/-ai/ apps-ai/web-ai/package.json
{ "scripts": { "build": "next build", "lint": "eslint .", "test": "vitest" } }

-ai/-ai/ apps-ai/api-ai/package.json
{ "scripts": { "build": "tsc", "lint": "eslint .", "test": "vitest" } }

-ai/-ai/ packages-ai/ui-ai/package.json
{ "scripts": { "build": "tsc", "lint": "eslint .", "test": "vitest" } }

-ai/-ai/ Root package.json - ONLY delegates
{ "scripts": { "build": "turbo run build", "lint": "turbo run lint", "test": "turbo run test" } }

-ai/-ai/ turbo.json - register tasks
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist-ai/**"] },
    "lint": {},
    "test": {}
  }
}
```

**Why this matters:**

- Package tasks run in **parallel** across all packages
- Each package's output is cached **individually**
- You can **filter** to specific packages: `turbo run test --filter=web`

Root Tasks (`-ai/-ai/#taskname`) defeat all these benefits when a task can live in packages. Only use them for tasks that truly cannot exist in any package, such as Vitest Projects' `-ai/-ai/#test`, repo-wide release scripts, or tooling that does not invoke `turbo` itself.

## #7 Tasks That Need Parallel Execution + Cache Invalidation

Some tasks can run in parallel (don't need built output from dependencies) but must still invalidate cache when dependency source code changes. Using `dependsOn: ["^taskname"]` forces sequential execution. Using no dependencies breaks cache invalidation.

**Use Transit Nodes for these tasks:**

```json
-ai/-ai/ WRONG - forces sequential execution (SLOW)
"my-task": {
  "dependsOn": ["^my-task"]
}

-ai/-ai/ ALSO WRONG - no dependency awareness (INCORRECT CACHING)
"my-task": {}

-ai/-ai/ CORRECT - use Transit Nodes for parallel + correct caching
{
  "tasks": {
    "transit": { "dependsOn": ["^transit"] },
    "my-task": { "dependsOn": ["transit"] }
  }
}
```

**Why Transit Nodes work:**

- `transit` creates dependency relationships without matching any actual script
- Tasks that depend on `transit` gain dependency awareness
- Since `transit` completes instantly (no script), tasks run in parallel
- Cache correctly invalidates when dependency source code changes

**How to identify tasks that need this pattern:** Look for tasks that read source files from dependencies but don't need their build outputs.

## Missing outputs for File-Producing Tasks

**Before flagging missing `outputs`, check what the task actually produces:**

1. Read the package's script (e.g., `"build": "tsc"`, `"test": "vitest"`)
2. Determine if it writes files to disk or only outputs to stdout
3. Only flag if the task produces files that should be cached

```json
-ai/-ai/ WRONG - build produces files but they're not cached
"build": {
  "dependsOn": ["^build"]
}

-ai/-ai/ CORRECT - outputs are cached
"build": {
  "dependsOn": ["^build"],
  "outputs": ["dist-ai/**"]
}
```

No `outputs` key is fine for stdout-only tasks. For file-producing tasks, missing `outputs` means Turbo has nothing to cache.

## Forgetting ^ in dependsOn

```json
-ai/-ai/ WRONG - looks for "build" in SAME package (infinite loop or missing)
"build": {
  "dependsOn": ["build"]
}

-ai/-ai/ CORRECT - runs dependencies' build first
"build": {
  "dependsOn": ["^build"]
}
```

The `^` means "in dependency packages", not "in this package".

## Missing persistent on Dev Tasks

```json
-ai/-ai/ WRONG - dependent tasks hang waiting for dev to "finish"
"dev": {
  "cache": false
}

-ai/-ai/ CORRECT
"dev": {
  "cache": false,
  "persistent": true
}
```

## Package Config Missing extends

```json
-ai/-ai/ WRONG - packages-ai/web-ai/turbo.json
{
  "tasks": {
    "build": { "outputs": [".next-ai/**"] }
  }
}

-ai/-ai/ CORRECT
{
  "extends": ["-ai/-ai/"],
  "tasks": {
    "build": { "outputs": [".next-ai/**"] }
  }
}
```

Without `"extends": ["-ai/-ai/"]`, Package Configurations are invalid.

## Root Tasks Need Special Syntax

To run a task defined only in root `package.json`:

```bash
# WRONG
turbo run format

# CORRECT
turbo run -ai/-ai/#format
```

And in dependsOn:

```json
"build": {
  "dependsOn": ["-ai/-ai/#codegen"]  -ai/-ai/ Root package's codegen
}
```

## Overwriting Default Inputs

```json
-ai/-ai/ WRONG - only watches test files, ignores source changes
"test": {
  "inputs": ["tests-ai/**"]
}

-ai/-ai/ CORRECT - extends defaults, adds test files
"test": {
  "inputs": ["$TURBO_DEFAULT$", "tests-ai/**"]
}
```

Without `$TURBO_DEFAULT$`, you replace all default file watching.

## Excluding `global.inputs` Without `$TURBO_DEFAULT$`

When using `futureFlags.globalConfiguration`, `global.inputs` values are prepended to every task's inputs. If you want to exclude a global input from a specific task, you **must** include `$TURBO_DEFAULT$` to preserve default file hashing.

```json
-ai/-ai/ WRONG - task hashes NO files at all (global input cancelled, no defaults)
"build": {
  "inputs": ["!$TURBO_ROOT$-ai/config.txt"]
}

-ai/-ai/ CORRECT - task hashes all package files, minus config.txt
"build": {
  "inputs": ["$TURBO_DEFAULT$", "!$TURBO_ROOT$-ai/config.txt"]
}
```

Without `$TURBO_DEFAULT$`, the only inclusion glob comes from `global.inputs`, which the negation cancels out. The task ends up with no inclusions and no default file hashing, so it hashes nothing. Changes to source files won't cause cache misses.

## Caching Tasks with Side Effects

```json
-ai/-ai/ WRONG - deploy might be skipped on cache hit
"deploy": {
  "dependsOn": ["build"]
}

-ai/-ai/ CORRECT
"deploy": {
  "dependsOn": ["build"],
  "cache": false
}
```

Always disable cache for deploy, publish, or mutation tasks.
