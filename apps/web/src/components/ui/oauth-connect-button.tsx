"use client";

import { findTemplateForSystem, systemOptions } from "@ambios-ai/shared";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/general-utils";
import { SystemIcon } from "./system-icon";

interface OAuthConnectButtonProps {
  system: {
    id?: string;
    name?: string;
    url?: string;
    icon?: string | null;
    templateName?: string;
  };
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  connected?: boolean;
  className?: string;
}

export function OAuthConnectButton({
  system,
  onClick,
  disabled = false,
  loading = false,
  connected = false,
  className,
}: OAuthConnectButtonProps) {
  const templateMatch = findTemplateForSystem(system);
  const templateLabel = templateMatch
    ? systemOptions.find((opt) => opt.value === templateMatch.key)?.label
    : undefined;
  const systemName = templateLabel || system.name || system.id || "service";
  const accentStyle = undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading || connected}
      style={!connected && !disabled ? accentStyle : undefined}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-5 py-3 transition-all duration-200",
        connected
          ? "border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
          : [
              "!bg-neutral-200/80 dark:!bg-white/10",
              "border border-border/60 shadow-md backdrop-blur-sm",
              "text-foreground/90 dark:text-foreground/95",
              "cursor-pointer hover:-translate-y-[1px] hover:border-border/80 hover:from-muted/80 hover:to-muted/50 hover:shadow-lg",
              "active:translate-y-[1px] active:shadow-sm",
            ],
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed",
        !connected && "disabled:opacity-50",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl",
          connected ? "bg-green-100 dark:bg-green-900/50" : "border border-border/50 bg-muted/60",
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-inherit opacity-80" />
        ) : connected ? (
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : (
          <SystemIcon system={system} size={16} />
        )}
      </div>
      <div className="flex min-w-0 flex-col items-start">
        <span
          className={cn(
            "flex items-center gap-2 font-semibold text-sm",
            connected && "text-green-700 dark:text-green-300",
          )}
        >
          {loading ? (
            <span>Connecting...</span>
          ) : connected ? (
            <span>Connected to {systemName}</span>
          ) : (
            <span>Connect to {systemName}</span>
          )}
        </span>
        <span
          className={cn(
            "text-[12px]",
            connected ? "text-green-600/70 dark:text-green-400/70" : "opacity-[0.85]",
          )}
        >
          {connected ? "Authentication successful" : "Click here to connect"}
        </span>
      </div>
    </button>
  );
}
