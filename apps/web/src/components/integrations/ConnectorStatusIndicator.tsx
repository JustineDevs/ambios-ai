"use client";

import { Check, Circle, Clock3, Lock, Minus, RefreshCw } from "lucide-react";
import { OperationIndicator } from "@/components/ui/operation-indicator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/general-utils";

export type ConnectorStatus = "connected" | "pending" | "roadmap" | "not-connected";

const STATUS = {
  connected: { label: "Connected", dot: "bg-emerald-500", ring: "ring-emerald-500/20" },
  pending: {
    label: "Connection pending",
    dot: "bg-amber-500 animate-pulse",
    ring: "ring-amber-500/20",
  },
  roadmap: {
    label: "Planned connector",
    dot: "bg-muted-foreground/50",
    ring: "ring-muted-foreground/10",
  },
  "not-connected": {
    label: "Not connected",
    dot: "bg-muted-foreground/50",
    ring: "ring-muted-foreground/10",
  },
} satisfies Record<ConnectorStatus, { label: string; dot: string; ring: string }>;

export function ConnectorStatusIndicator({
  status,
  onClick,
  detailsLabel,
  onRefresh,
  loading = false,
}: {
  status: ConnectorStatus;
  onClick?: () => void;
  detailsLabel?: string;
  onRefresh?: () => void;
  loading?: boolean;
}) {
  const config = STATUS[status];
  const Icon = loading
    ? RefreshCw
    : status === "connected"
      ? Check
      : status === "pending"
        ? Clock3
        : status === "roadmap"
          ? Minus
          : Circle;
  const control = (
    <span
      role="img"
      aria-label={
        loading
          ? "Refreshing connection"
          : (detailsLabel ?? (onClick ? `${config.label} · view details` : config.label))
      }
      className={cn(
        "relative inline-flex size-7 items-center justify-center rounded-full ring-1",
        config.ring,
      )}
    >
      {loading || status === "pending" ? (
        <OperationIndicator
          status={loading ? "connecting" : "pending"}
          label={loading ? "Refreshing connection" : config.label}
          showLabel={false}
          size={20}
        />
      ) : (
        <Icon aria-hidden="true" className="size-3.5 transition-all duration-300" />
      )}
      <span
        aria-hidden="true"
        className={cn(
          "absolute size-2 rounded-full opacity-0 transition-opacity",
          config.dot,
          !loading && "opacity-100",
        )}
      />
    </span>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {onRefresh || onClick ? (
            <button
              type="button"
              aria-label={
                loading
                  ? "Refreshing connection"
                  : onRefresh
                    ? `${config.label} · refresh and sync`
                    : (detailsLabel ?? `${config.label} · view details`)
              }
              onClick={onRefresh ?? onClick}
              disabled={loading}
              className="relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {control}
            </button>
          ) : (
            control
          )}
        </TooltipTrigger>
        <TooltipContent>
          {loading
            ? "Refreshing connection"
            : onRefresh
              ? `${config.label} · refresh and sync`
              : onClick
                ? (detailsLabel ?? `${config.label} · view details`)
                : config.label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ConnectorLockIndicator() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="img"
            aria-label="Connector locked until supported"
            className="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground/70 ring-1 ring-muted-foreground/10"
          >
            <Lock aria-hidden="true" className="size-3.5" />
          </span>
        </TooltipTrigger>
        <TooltipContent>Available in a future connector phase</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
