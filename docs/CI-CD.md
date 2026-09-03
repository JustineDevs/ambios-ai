# CI/CD and release operations

## Pipeline map

```text
Pull request / push
        ↓
CI quality: install → lint → typecheck → tests → build → budget
        ↓
CI smoke: Worker + frontend → HTTP smoke → WebMCP → Chromium routes
        ↓
Security: dependency review + CodeQL + history secret scan
        ↓
Manual protected deployment
        ↓
Vercel Next.js → Cloudflare Hono Workers → HTTPS smoke
        ↓
Semantic-version tag → production gate → GitHub release artifact
```

## Workflows

| Workflow | Trigger | Purpose |
| --- | --- | --- |
| `ci.yml` | Pull requests and pushes to main/master | Quality, contracts, build, local HTTP smoke, WebMCP, Chromium E2E |
| `security.yml` | Pull requests, main/master, weekly | Dependency review, CodeQL, Gitleaks history scan |
| `deploy.yml` | Manual dispatch | Protected deployment of the Next.js app to Vercel followed by the Core and Connector Hono Workers, then HTTPS smoke checks |
| `release.yml` | `vMAJOR.MINOR.PATCH` tag or manual tag input | Version validation, gate, archive, GitHub release notes |

## Deployment controls

Configure `staging` and `production` GitHub Environments. Put Cloudflare credentials and resource IDs in environment secrets, restrict deployment branches/tags, and require reviewers for production. The workflow uses concurrency so two deployments to the same environment cannot run at once.

The deploy workflow is intentionally manual and requires protected environment secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, and the Cloudflare credentials/resource IDs. The canonical release path is: deploy `apps/web` through Vercel, deploy Core with `pnpm deploy:core`, deploy Connector with `pnpm deploy:connector`, then run HTTPS smoke checks. Do not treat a successful local build as deployment evidence.

## Versioning

The root `package.json` is the release version authority. Releases use semantic version tags:

- `v0.1.1` — compatible bug fix;
- `v0.2.0` — backward-compatible feature;
- `v1.0.0` — breaking contract or product change.

The release workflow fails when the tag and package version differ. Update `CHANGELOG.md` and migration notes in the same release change.

## Evidence and artifacts

CI retains build and smoke logs for seven days. Release artifacts contain a source archive and commit/tag manifest; the release archive receives a GitHub artifact attestation. Do not upload `.env`, `.env.local`, provider credentials, database dumps, or unredacted logs.

## Security basis

Workflow permissions are least-privilege by default. Dependency caches are for reproducible dependencies only; never place secrets in caches. GitHub Environments gate secrets until deployment protection passes. Release provenance is generated with GitHub’s artifact-attestation action and requires the release job’s short-lived OIDC and attestation permissions.

See [GitHub deployment environments](https://docs.github.com/en/actions/concepts/workflows-and-actions/deployment-environments), [dependency caching](https://docs.github.com/en/actions/concepts/workflows-and-actions/dependency-caching), and [artifact attestations](https://docs.github.com/en/actions/concepts/security/artifact-attestations).
