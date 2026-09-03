# Verification protocol

## Candidate verification

For each finding, preserve the source location and the smallest reproducible scenario. A verifier must answer one of:

- `confirmed`: the scenario is demonstrated or directly entailed by code and the expected behavior is established.
- `plausible`: the scenario is reachable and not disproven; keep it open until a targeted check resolves it.
- `refuted`: a constructive invariant, test, or code path proves it impossible or already handled.

“Probably fine,” “typechecks,” and “not seen locally” are not refutations.

## Claim verification

Match evidence to the claim's environment and identity. Use this order:

1. Static source and configuration establish intended topology.
2. Unit/integration tests establish deterministic behavior.
3. Local runtime probes establish wiring and rendered behavior.
4. Deployment probes establish target-environment behavior.
5. Authenticated workflow evidence establishes identity, persistence, authorization, and audit behavior.

Record failed attempts too. A limitation is complete only when it states status, reason, affected capability, safe behavior, and next step.

## Re-inspection

After a repair, repeat the original inventory and the failure scenario. Then check adjacent callers and state transitions. Close the finding only when the original failure is gone and no newly introduced mismatch exists.
