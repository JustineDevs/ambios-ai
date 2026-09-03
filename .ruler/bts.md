# Better Fullstack Project Rules

This is a ambios-ai project created with Better Fullstack CLI.

## Project Structure

This is a monorepo with the following structure:

- **`apps/web/`** - Fullstack application (Next.js)

- **`packages-ai/api-ai/`** - Shared API logic and types
- **`packages-ai/auth-ai/`** - Authentication logic and utilities
- **`packages-ai/db-ai/`** - Database schema and utilities
- **`packages-ai/env-ai/`** - Shared environment variables and validation
- **`packages-ai/config-ai/`** - Shared TypeScript configuration
- **`packages-ai/infra-ai/`** - Infrastructure as code (Alchemy for Cloudflare)

## Available Scripts

- `pnpm run dev` - Start all apps in development mode
- `pnpm run build` - Build all apps
- `pnpm run lint` - Lint all packages
- `pnpm run typecheck` - Type check all packages

## Database Commands

All database operations should be run from the web workspace:

- `pnpm run db:push` - Push schema changes to database
- `pnpm run db:studio` - Open database studio
- `pnpm run db:generate` - Generate Drizzle files
- `pnpm run db:migrate` - Run database migrations

Database schema files are located in `apps/web/src/db/schema/`

## API Structure

- tRPC routers are in `packages-ai/api-ai/src-ai/routers-ai/`
- Client-side tRPC utils are in `apps/web/src/utils/trpc.ts`

## Project Configuration

This project includes a `bts.jsonc` configuration file that stores your Better Fullstack settings:

- Contains your selected stack configuration (database, ORM, backend, frontend, etc.)
- Used by the CLI to understand your project structure
- Safe to delete if not needed

## Key Points

- This is a Turborepo monorepo using pnpm workspaces
- Each app has its own `package.json` and dependencies
- Run commands from the root to execute across all workspaces
- Run workspace-specific commands with `pnpm run command-name`
- Turborepo handles build caching and parallel execution
- Git hooks are configured with Husky for pre-commit checks
