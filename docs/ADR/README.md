# ADR index and process

Architecture Decision Records explain decisions that are expensive, security-sensitive, or hard to reverse.

Use the [ADR template](./templates/ADR-template.md), choose the next number, link affected code and tests, and mark the record `Proposed`, `Accepted`, `Superseded`, or `Rejected`. Do not edit an accepted decision silently; create a successor ADR.

Completed records live in `docs/ADR/done/`; active, proposed, blocked, or superseded records remain in `docs/ADR/task/`. Older records may describe target or historical architecture; confirm them against [FEATURE-STATUS.md](../FEATURE-STATUS.md) and the current code before relying on them. A record must not move to `done/` merely because its prose is comprehensive: its decision must match the current architecture and its applicable implementation/evidence must be satisfied.
