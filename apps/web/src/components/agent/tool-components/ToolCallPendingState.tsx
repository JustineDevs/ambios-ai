"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/general-utils";

interface ToolCallPendingStateProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  children?: React.ReactNode;
}

function ShimmerBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md bg-gradient-to-r from-transparent via-foreground/[0.03] to-transparent dark:via-foreground/[0.06]",
        "animate-shimmer-bar bg-[length:200%_100%]",
        className,
      )}
    />
  );
}

export function ToolCallPendingState({
  icon: Icon,
  label,
  description,
  children,
}: ToolCallPendingStateProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border/30 bg-gradient-to-br from-background/80 via-muted/20 to-background/80 p-4 backdrop-blur-md dark:border-border/20 dark:from-background/60 dark:via-muted/10 dark:to-background/60">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent dark:from-primary/[0.04]" />

      <div className="relative space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground/[0.04] dark:bg-foreground/[0.08]">
            <Icon className="h-3.5 w-3.5 animate-pulse text-muted-foreground/70" />
          </div>
          <span className="font-medium text-muted-foreground/80 text-sm">{label}</span>
        </div>

        {description && <p className="pl-[34px] text-muted-foreground/50 text-xs">{description}</p>}

        {children ? (
          <div className="pl-[34px]">{children}</div>
        ) : (
          <div className="space-y-2.5 pl-[34px]">
            <ShimmerBar className="h-3 w-3/4" />
            <ShimmerBar className="h-3 w-1/2" />
            <ShimmerBar className="h-3 w-2/3" />
          </div>
        )}
      </div>
    </div>
  );
}
