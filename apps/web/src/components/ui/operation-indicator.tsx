"use client";

import { Check, CircleAlert, X } from "lucide-react";
import { ThinkingOrb } from "@/components/animation/thinking-orbs";
import { cn } from "@/lib/general-utils";

export type OperationStatus = string;

type OrbState =
  | "working"
  | "searching"
  | "solving"
  | "listening"
  | "connecting"
  | "weaving"
  | "composing"
  | "breathing"
  | "shaping";

const ORB_STATE_BY_STATUS: Record<string, OrbState> = {
  loading: "breathing",
  thinking: "solving",
  context_gathered: "searching",
  proposed: "solving",
  policy_evaluated: "listening",
  awaiting_approval: "listening",
  pending: "connecting",
  queued: "connecting",
  connecting: "connecting",
  syncing: "weaving",
  retrying: "composing",
  running: "working",
  executing: "working",
  working: "working",
  verifying: "shaping",
};

function normalize(status: string) {
  return status.trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
}

function terminalIcon(status: string) {
  const normalized = normalize(status);
  if (["succeeded", "success", "completed", "connected", "ready"].includes(normalized)) {
    return Check;
  }
  if (["failed", "error", "denied", "cancelled", "expired"].includes(normalized)) {
    return normalized === "failed" || normalized === "error" ? CircleAlert : X;
  }
  return null;
}

export function operationOrbState(status: OperationStatus): OrbState | null {
  return ORB_STATE_BY_STATUS[normalize(status)] ?? null;
}

export function OperationIndicator({
  status,
  label,
  size = 20,
  showLabel = true,
  className,
}: {
  status: OperationStatus;
  label?: string;
  size?: 20 | 64;
  showLabel?: boolean;
  className?: string;
}) {
  const normalized = normalize(status);
  const orbState = operationOrbState(status);
  const Icon = terminalIcon(status);
  const accessibleLabel = label ?? status;

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-muted-foreground text-xs", className)}
      role="status"
      aria-label={accessibleLabel}
    >
      {orbState ? (
        <ThinkingOrb state={orbState} size={size} aria-label={accessibleLabel} />
      ) : Icon ? (
        <Icon
          aria-hidden="true"
          className={cn(
            "size-4",
            ["succeeded", "success", "completed", "connected", "ready"].includes(normalized)
              ? "text-emerald-500"
              : "text-destructive",
          )}
        />
      ) : (
        <span aria-hidden="true" className="size-2 rounded-full bg-muted-foreground/50" />
      )}
      {showLabel && <span>{label ?? status}</span>}
    </span>
  );
}
