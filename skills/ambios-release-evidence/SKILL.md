---
name: ambios-release-evidence
description: Judge and improve release readiness across code quality, security, deployment topology, artifact size, live routes, authenticated workflows, and public claims. Use before calling an AmbiOS change production-ready.
metadata:
  short-description: Adversarial release gates with evidence receipts
---

# Release evidence

Read [package-contract.md](../_shared/package-contract.md), [verification-protocol.md](../_shared/references/verification-protocol.md), [release-gates.md](references/release-gates.md), and [evidence-record.md](references/evidence-record.md). Judge claims at the environment where they are made; downgrade source-only and local-only claims.

## Gate pipeline

1. Establish release identity, commit, target environment, deployment URLs, configuration names, and scope. Never print secret values.
2. Run independent gates for build, security, contract, runtime/deployment, workflow, UX, and artifacts. Record command/interaction, environment, timestamp, result, artifact, and limitation.
3. Roast claims and gaps: a green build is not a live route; a screenshot is not auth or persistence; a connected account is not resource authority; a registered tool is not deployed authenticated tool use.
4. Repair confirmed blockers at source or label the capability `unsupported`, `unverified`, `planned`, or `blocked` with safe behavior and a next step.
5. Re-run affected gates, then perform a final gap sweep. Return exactly one decision: `pass`, `pass-with-explicit-limitations`, `unsupported`, or `blocked`.

## Mandatory gates

Typecheck, lint, tests, production build, secret scan, runtime-boundary scan, OpenAPI alignment, auth/scope checks, route smoke, authenticated browser workflow, worker artifact measurement, and public-claim review. Consequential workflows must prove exact approval binding, denial no-write, execution verification, audit persistence, and cross-surface consistency.

## Required result

Produce the gate report, evidence record, deployment identifiers, artifact sizes, claim downgrades, unsupported capability list, and limitations using [output-schema.json](references/output-schema.json). Never call an implementation production-ready when a required gate is only `implemented`.
