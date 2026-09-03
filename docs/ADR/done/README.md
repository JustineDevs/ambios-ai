# Completed ADRs

An ADR belongs here only when its decision matches the current architecture and its applicable implementation evidence is satisfied.

| Record | Completion basis |
| --- | --- |
| [ADR-001](./ADR(001).md) | WebMCP is the canonical browser-agent protocol; the deployed topology and 29-tool contract are recorded in [`webmcp/VERIFICATION.md`](../../../webmcp/VERIFICATION.md), with automated registration/evaluation coverage. |
| [ADR-013](./ADR(013).md) | The canonical WebMCP registry uses the `ambios.*` namespace; contract verification covers the registered tool names. |
| [ADR-014](./ADR(014).md) | The phased rollout is now the project roadmap and is reflected in `docs/ADR/ROADMAP.md`; deferred capabilities remain labeled rather than presented as live. |

Records still in [`../task/`](../task/) are intentionally not complete. Several contain explicit `BLOCKED`, `Proposed`, `Conditional`, or security-gated statuses, while ADR-002 and ADR-015 contain superseded hosting decisions. They must be updated and re-verified before moving here.
