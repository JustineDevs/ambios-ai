# Release judge modes

| Mode | Gates | Decision use |
| --- | --- | --- |
| `focused` | Affected gate groups plus dependencies | Patch or local candidate |
| `standard` | Build, security, contract, runtime, UX, and artifact gates | Normal release |
| `exhaustive` | Standard plus authenticated production workflow and public claim sweep | Security, architecture, or public launch |

Evidence is environment-scoped. A local result cannot close a deployed claim, and a deployed result cannot close a changed working tree until the commit identity matches.
