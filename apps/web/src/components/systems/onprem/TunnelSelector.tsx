"use client";

import type { TunnelConnection, TunnelTarget } from "@ambios-ai/shared";
import { FileText, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/general-utils";
import { getProtocolIcon, getProtocolLabel } from "@/lib/protocol-utils";

interface TunnelSelectorProps {
  tunnels: TunnelConnection[];
  selectedTunnel: TunnelConnection | null;
  selectedTarget: TunnelTarget | null;
  onSelectTunnel: (tunnel: TunnelConnection) => void;
  onSelectTarget: (target: TunnelTarget) => void;
  isLoading?: boolean;
}

export function TunnelSelector({
  tunnels,
  selectedTunnel,
  selectedTarget,
  onSelectTunnel,
  onSelectTarget,
  isLoading,
}: TunnelSelectorProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 w-full animate-pulse rounded-xl bg-muted/50" />
        <div className="h-24 w-full animate-pulse rounded-xl bg-muted/50" />
      </div>
    );
  }

  if (tunnels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
          <WifiOff className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 font-medium text-lg">No Gateways Connected</h3>
        <p className="mb-6 max-w-md text-muted-foreground text-sm">
          To connect to private data sources, deploy a Gateway Agent in your VPC, on-prem network,
          or any private environment.
        </p>
        <a
          href="/docs/guides/secure-gateway"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2",
            "bg-primary text-primary-foreground",
            "transition-colors hover:bg-primary/90",
            "font-medium text-sm",
          )}
        >
          <FileText className="h-4 w-4" />
          View Setup Guide
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tunnel Selection */}
      <div>
        <h3 className="mb-3 font-medium text-sm">Connected Gateways</h3>
        <div className="grid gap-3">
          {tunnels.map((tunnel) => (
            <button
              type="button"
              key={tunnel.id}
              onClick={() => onSelectTunnel(tunnel)}
              className={cn(
                "w-full rounded-xl p-4 text-left transition-all duration-200",
                "border",
                selectedTunnel?.id === tunnel.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border/50 bg-muted/30 hover:border-border hover:bg-muted/50",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    selectedTunnel?.id === tunnel.id ? "bg-primary/10" : "bg-muted",
                  )}
                >
                  <Wifi
                    className={cn(
                      "h-5 w-5",
                      selectedTunnel?.id === tunnel.id ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-medium text-sm">{tunnel.id}</h4>
                  <p className="text-muted-foreground text-xs">
                    {tunnel.targets.length} target{tunnel.targets.length !== 1 ? "s" : ""} available
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                  <span className="text-green-600 text-xs dark:text-green-400">Connected</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Target Selection */}
      {selectedTunnel && (
        <div className="fade-in-0 slide-in-from-top-2 animate-in duration-200">
          <h3 className="mb-3 font-medium text-sm">Select Target</h3>
          <div className="grid gap-2">
            {selectedTunnel.targets.map((target) => {
              const Icon = getProtocolIcon(target.protocol);
              return (
                <button
                  type="button"
                  key={target.name}
                  onClick={() => onSelectTarget(target)}
                  className={cn(
                    "w-full rounded-lg p-3 text-left transition-all duration-200",
                    "border",
                    selectedTarget?.name === target.name
                      ? "border-primary bg-primary/5"
                      : "border-border/30 bg-background hover:border-border/50 hover:bg-muted/30",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        selectedTarget?.name === target.name
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-sm">{target.name}</span>
                      {target.description && (
                        <span className="ml-2 text-muted-foreground text-xs">
                          — {target.description}
                        </span>
                      )}
                    </div>
                    <span className="rounded bg-muted px-2 py-0.5 text-muted-foreground text-xs">
                      {getProtocolLabel(target.protocol)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
