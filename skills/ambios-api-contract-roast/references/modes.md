# API roast modes

| Mode | Operation coverage | Candidate budget | Verification |
| --- | --- | --- | --- |
| `focused` | Named operation and callers | Up to 8 | Contract test plus targeted auth/error probes |
| `standard` | Entire contract and discovered routes | Up to 6 per roast lane | Contract, unit/integration, smoke, and re-inspection |
| `exhaustive` | Contract, routes, clients, MCP, workers, deployment rewrites | Up to 8 per lane plus gap sweep | Full operation matrix and authenticated mutation proof |

Never hide an untestable operation behind a green static match. Mark it `unsupported` with a stable code and safe next step when implementation is unavailable.
