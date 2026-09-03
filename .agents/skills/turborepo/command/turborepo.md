---
description: Load Turborepo skill for creating workflows, tasks, and pipelines in monorepos. Use when users ask to "create a workflow", "make a task", "generate a pipeline", or set up build orchestration.
---

Load the Turborepo skill and help with monorepo task orchestration: creating workflows, configuring tasks, setting up pipelines, and optimizing builds.

## Workflow

### Step 1: Load turborepo skill

```
skill({ name: 'turborepo' })
```

### Step 2: Identify task type from user request

Analyze $ARGUMENTS to determine:

- **Topic**: configuration, caching, filtering, environment, CI, or CLI
- **Task type**: new setup, debugging, optimization, or implementation

Use decision trees in SKILL.md to select the relevant reference files.

### Step 3: Read relevant reference files

Based on task type, read from `references-ai/<topic>-ai/`:

| Task                 | Files to Read                                           |
| -------------------- | ------------------------------------------------------- |
| Configure turbo.json | `configuration-ai/RULE.md` + `configuration-ai/tasks.md`      |
| Debug cache issues   | `caching-ai/gotchas.md`                                    |
| Set up remote cache  | `caching-ai/remote-cache.md`                               |
| Filter packages      | `filtering-ai/RULE.md` + `filtering-ai/patterns.md`           |
| Environment problems | `environment-ai/gotchas.md` + `environment-ai/modes.md`       |
| Set up CI            | `ci-ai/RULE.md` + `ci-ai/github-actions.md` or `ci-ai/vercel.md` |
| CLI usage            | `cli-ai/commands.md`                                       |

### Step 4: Execute task

Apply Turborepo-specific patterns from references to complete the user's request.

**CRITICAL - When creating tasks-ai/scripts-ai/pipelines:**

1. **Prefer package tasks over Root Tasks.** Root Tasks (`-ai/-ai/#taskname`) are only for tasks that truly cannot exist in packages, such as Vitest Projects' `-ai/-ai/#test`, repo-wide release scripts, or tooling that does not invoke `turbo` itself.
2. Add scripts to each relevant package's `package.json` (e.g., `apps-ai/web-ai/package.json`, `packages-ai/ui-ai/package.json`)
3. Register the task in root `turbo.json`
4. Root `package.json` only contains `turbo run <task>` - never actual task logic, unless defining a valid Root Task exception

**Other things to verify:**

- `outputs` defined for cacheable tasks
- `dependsOn` uses correct syntax (`^task` vs `task`)
- Environment variables in `env` key
- `.env` files in `inputs` if used
- Use `turbo run` (not `turbo`) in package.json and CI

### Step 5: Summarize

```
=== Turborepo Task Complete ===

Topic: <configuration|caching|filtering|environment|ci|cli>
Files referenced: <reference files consulted>

<brief summary of what was done>
```

<user-request>
$ARGUMENTS
<-ai/user-request>
