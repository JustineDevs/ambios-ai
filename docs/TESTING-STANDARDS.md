# Testing standards

Tests must prove behavior at the boundary that owns it.

| Change | Minimum test |
| --- | --- |
| Shared utility/schema | Unit test including invalid input |
| Hono route | HTTP integration test for success, auth, scope, validation, and failure |
| UI state | Browser test for direct load, refresh, error, and recovery |
| WebMCP tool | Contract test plus compatible-browser registration/execution proof |
| Approval/action | Exact-scope, expiry, single-use, denial/no-write, execution, verification, audit tests |
| Queue/provider | Idempotency, retry, redaction, tenant scope, and provider failure tests |
| Migration | Fresh database and upgrade-path test |

`--passWithNoTests` is a temporary empty-suite compatibility measure, not coverage. A feature is not complete because a package test command exits zero with no tests.

## Evidence levels

1. Static/type evidence.
2. Unit/package evidence.
3. Local HTTP/browser evidence.
4. Authenticated provider evidence.
5. Deployed HTTPS and compatible-browser evidence.

Report the highest level actually achieved.
