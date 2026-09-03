# Governed delivery modes

| Mode | Discovery | Verification | Use |
| --- | --- | --- | --- |
| `focused` | One owner lane plus direct callers | Targeted tests and local re-inspection | One bounded root cause |
| `standard` | Six independent lanes, deduped register | Tests, build, runtime smoke, relevant browser flow | Normal cross-layer change |
| `exhaustive` | Six lanes plus gap sweep and boundary audit | Full matrix, deployment probes, authenticated workflow | Security, architecture, or release claim |

The caller may narrow the surface, never the acceptance bar for consequential mutations. If an environment or credential is absent, record `blocked` or `unsupported`; do not invent evidence.

Each phase records input scope, commands/interactions, artifacts, failures, and its exit condition.
