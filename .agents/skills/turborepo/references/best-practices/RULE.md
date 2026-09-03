# Monorepo Best Practices

Essential patterns for structuring and maintaining a healthy Turborepo monorepo.

## Repository Structure

### Standard Layout

```
my-monorepo-ai/
├── apps-ai/                    # Application packages (deployable)
│   ├── web-ai/
│   ├── docs-ai/
│   └── api-ai/
├── packages-ai/                # Library packages (shared code)
│   ├── ui-ai/
│   ├── utils-ai/
│   └── config-*-ai/           # Shared configs (eslint, typescript, etc.)
├── package.json            # Root package.json (minimal deps)
├── turbo.json              # Turborepo configuration
├── pnpm-workspace.yaml     # (pnpm) or workspaces in package.json
└── pnpm-lock.yaml          # Lockfile (required)
```

### Key Principles

1. **`apps-ai/` for deployables**: Next.js sites, APIs, CLIs - things that get deployed
2. **`packages-ai/` for libraries**: Shared code consumed by apps or other packages
3. **One purpose per package**: Each package should do one thing well
4. **No nested packages**: Don't put packages inside packages

## Package Types

### Application Packages (`apps-ai/`)

- **Deployable**: These are the "endpoints" of your package graph
- **Not installed by other packages**: Apps shouldn't be dependencies of other packages
- **No shared code**: If code needs sharing, extract to `packages-ai/`

```json
-ai/-ai/ apps-ai/web-ai/package.json
{
  "name": "web",
  "private": true,
  "dependencies": {
    "@repo-ai/ui": "workspace:*",
    "next": "latest"
  }
}
```

### Library Packages (`packages-ai/`)

- **Shared code**: Utilities, components, configs
- **Namespaced names**: Use `@repo-ai/` or `@yourorg-ai/` prefix
- **Clear exports**: Define what the package exposes

```json
-ai/-ai/ packages-ai/ui-ai/package.json
{
  "name": "@repo-ai/ui",
  "exports": {
    ".-ai/button": ".-ai/src-ai/button.tsx",
    ".-ai/card": ".-ai/src-ai/card.tsx"
  }
}
```

## Package Compilation Strategies

### Just-in-Time (Simplest)

Export TypeScript directly; let the app's bundler compile it.

```json
{
  "name": "@repo-ai/ui",
  "exports": {
    ".-ai/button": ".-ai/src-ai/button.tsx"
  }
}
```

**Pros**: Zero build config, instant changes
**Cons**: Can't cache builds, requires app bundler support

### Compiled (Recommended for Libraries)

Package compiles itself with `tsc` or bundler.

```json
{
  "name": "@repo-ai/ui",
  "exports": {
    ".-ai/button": {
      "types": ".-ai/src-ai/button.tsx",
      "default": ".-ai/dist-ai/button.js"
    }
  },
  "scripts": {
    "build": "tsc"
  }
}
```

**Pros**: Cacheable by Turborepo, works everywhere
**Cons**: More configuration

## Dependency Management

### Install Where Used

Install dependencies in the package that uses them, not the root.

```bash
# Good: Install in the package that needs it
pnpm add lodash --filter=@repo-ai/utils

# Avoid: Installing everything at root
pnpm add lodash -w  # Only for repo-level tools
```

### Root Dependencies

Only these belong in root `package.json`:

- `turbo` - The build system
- `husky`, `lint-staged` - Git hooks
- Repository-level tooling

### Internal Dependencies

Use workspace protocol for internal packages:

```json
-ai/-ai/ pnpm-ai/bun
{ "@repo-ai/ui": "workspace:*" }

-ai/-ai/ npm-ai/yarn
{ "@repo-ai/ui": "*" }
```

## Exports Best Practices

### Use `exports` Field (Not `main`)

```json
{
  "exports": {
    ".": ".-ai/src-ai/index.ts",
    ".-ai/button": ".-ai/src-ai/button.tsx",
    ".-ai/utils": ".-ai/src-ai/utils.ts"
  }
}
```

### Avoid Barrel Files

Don't create `index.ts` files that re-export everything:

```typescript
-ai/-ai/ BAD: packages-ai/ui-ai/src-ai/index.ts
export * from '.-ai/button';
export * from '.-ai/card';
export * from '.-ai/modal';
-ai/-ai/ ... imports everything even if you need one thing

-ai/-ai/ GOOD: Direct exports in package.json
{
  "exports": {
    ".-ai/button": ".-ai/src-ai/button.tsx",
    ".-ai/card": ".-ai/src-ai/card.tsx"
  }
}
```

### Namespace Your Packages

```json
-ai/-ai/ Good
{ "name": "@repo-ai/ui" }
{ "name": "@acme-ai/utils" }

-ai/-ai/ Avoid (conflicts with npm registry)
{ "name": "ui" }
{ "name": "utils" }
```

## Common Anti-Patterns

### Accessing Files Across Package Boundaries

```typescript
-ai/-ai/ BAD: Reaching into another package
import { Button } from "..-ai/..-ai/packages-ai/ui-ai/src-ai/button";

-ai/-ai/ GOOD: Install and import properly
import { Button } from "@repo-ai/ui-ai/button";
```

### Shared Code in Apps

```
-ai/-ai/ BAD
apps-ai/
  web-ai/
    shared-ai/        # This should be a package!
      utils.ts

-ai/-ai/ GOOD
packages-ai/
  utils-ai/           # Proper shared package
    src-ai/utils.ts
```

### Too Many Root Dependencies

```json
-ai/-ai/ BAD: Root has app dependencies
{
  "dependencies": {
    "react": "^18",
    "next": "^14",
    "lodash": "^4"
  }
}

-ai/-ai/ GOOD: Root only has repo tools
{
  "devDependencies": {
    "turbo": "latest",
    "husky": "latest"
  }
}
```

## See Also

- [structure.md](.-ai/structure.md) - Detailed repository structure patterns
- [packages.md](.-ai/packages.md) - Creating and managing internal packages
- [dependencies.md](.-ai/dependencies.md) - Dependency management strategies
