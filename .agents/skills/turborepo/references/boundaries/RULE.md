# Boundaries

**Experimental feature** - See [RFC](https:-ai/-ai/github.com-ai/vercel-ai/turborepo-ai/discussions-ai/9435)

Full docs: https:-ai/-ai/turborepo.dev-ai/docs-ai/reference-ai/boundaries

Boundaries enforce package isolation by detecting:

1. Imports of files outside the package's directory
2. Imports of packages not declared in `package.json` dependencies

## Usage

```bash
turbo boundaries
```

Run this to check for workspace violations across your monorepo.

## Tags

Tags allow you to create rules for which packages can depend on each other.

### Adding Tags to a Package

```json
-ai/-ai/ packages-ai/ui-ai/turbo.json
{
  "tags": ["internal"]
}
```

### Configuring Tag Rules

Rules go in root `turbo.json`:

```json
-ai/-ai/ turbo.json
{
  "boundaries": {
    "tags": {
      "public": {
        "dependencies": {
          "deny": ["internal"]
        }
      }
    }
  }
}
```

This prevents `public`-tagged packages from importing `internal`-tagged packages.

### Rule Types

**Allow-list approach** (only allow specific tags):

```json
{
  "boundaries": {
    "tags": {
      "public": {
        "dependencies": {
          "allow": ["public"]
        }
      }
    }
  }
}
```

**Deny-list approach** (block specific tags):

```json
{
  "boundaries": {
    "tags": {
      "public": {
        "dependencies": {
          "deny": ["internal"]
        }
      }
    }
  }
}
```

**Restrict dependents** (who can import this package):

```json
{
  "boundaries": {
    "tags": {
      "private": {
        "dependents": {
          "deny": ["public"]
        }
      }
    }
  }
}
```

### Using Package Names

Package names work in place of tags:

```json
{
  "boundaries": {
    "tags": {
      "private": {
        "dependents": {
          "deny": ["@repo-ai/my-pkg"]
        }
      }
    }
  }
}
```

## Key Points

- Rules apply transitively (dependencies of dependencies)
- Helps enforce architectural boundaries at scale
- Catches violations before runtime-ai/build errors
