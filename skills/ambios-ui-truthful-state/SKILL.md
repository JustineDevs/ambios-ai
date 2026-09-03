---
name: ambios-ui-truthful-state
description: Audit and repair real rendered routes, layouts, components, accessibility, and asynchronous workflow states so visible UI matches canonical backend state. Use for page drift, overflow, primitives, browser interactions, or truthful status work.
metadata:
  short-description: Browser-proven UI layout and state repair
---

# UI truthful state

Read [package-contract.md](../_shared/package-contract.md), [verification-protocol.md](../_shared/references/verification-protocol.md), [state-matrix.md](references/state-matrix.md), and [layout-rules.md](references/layout-rules.md). Source inspection is hypothesis; the rendered browser is the evidence surface.

## Pipeline

1. Inventory routes, layouts, dynamic segments, callers, shared primitives, and state owners. Confirm the canonical API and state transitions before changing markup.
2. Drive each route at desktop and mobile sizes: direct URL, refresh, internal navigation, back/forward, auth boundary, keyboard focus, long content, overlays, and retry. Capture console/network errors and screenshots for visual claims.
3. Roast independently for route reachability, sizing/overflow, responsive layout, component contracts, accessibility/focus, async states, and backend truthfulness. Record concrete interaction → observed failure.
4. Repair the root layout/component/state owner. Avoid permanent redundant chrome: plan, tools, evidence, approval, queue, attachments, and recovery appear when relevant to the active workflow.
5. Verify loading, ready, empty, setup, mapping, blocked, unauthorized, provider failure, dependency failure, unsupported, approval, executing, verifying, partial, failed, and success states where applicable. Each explains what happened, why, impact, what still works, next action, and retry safety.
6. Re-run the route matrix after repair and write the receipt. A screenshot cannot prove persistence, authorization, execution, or audit truth.

## Layout invariants

No fixed-height clipping, page-level overflow trap, unbounded drawer, unreachable close/escape path, invisible focus, unnamed icon control, or status text derived only from optimistic client state. Preserve primary task visibility and progressive disclosure.

## Required result

Produce the route/state/layout matrix, root causes, changed components, browser interactions, console/network evidence, accessibility notes, and limitations using [output-schema.json](references/output-schema.json).
