import React from "react";
import { cn } from "@/lib/general-utils";

export interface MiniCardProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  width?: number;
  height?: number;
}

export const MiniCard = React.memo(
  ({ isActive, onClick, children, className, width = 180, height = 125 }: MiniCardProps) => {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group cursor-pointer transition-all duration-300",
          "hover:scale-[1.01] active:scale-[0.99]",
        )}
      >
        <div
          className={cn(
            "flex-shrink-0 transition-all duration-300",
            "bg-gradient-to-br from-muted/50 to-muted/30 dark:from-muted/30 dark:to-muted/20",
            "rounded-2xl border border-border/50 backdrop-blur-sm",
            "overflow-hidden shadow-sm",
            "group-hover:border-border/60 group-hover:from-muted/60 group-hover:to-muted/40 group-hover:shadow-md",
            "relative",
            isActive &&
              "border-[#FFA500] shadow-[0_0_0_1px_#FFA500,0_10px_15px_-3px_rgba(255,165,0,0.1),0_4px_6px_-4px_rgba(255,165,0,0.1)] ring-1 ring-[#FFA500]",
            className,
          )}
          style={{ width: `${width}px`, height: `${height}px` }}
        >
          <div className="relative flex h-full flex-col items-center justify-between px-3 pt-3 pb-3 leading-tight">
            {children}
          </div>
        </div>
      </button>
    );
  },
);

MiniCard.displayName = "MiniCard";

export interface StatusIndicatorProps {
  text: string;
  color: string;
  dotColor: string;
  animate?: boolean;
}

export const StatusIndicator = React.memo(
  ({ text, color, dotColor, animate = false }: StatusIndicatorProps) => {
    return (
      <div className="flex items-center gap-1">
        <span className={cn("flex items-center gap-1 font-semibold text-[9px]", color)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", dotColor, animate && "animate-pulse")} />
          {text}
        </span>
      </div>
    );
  },
);

StatusIndicator.displayName = "StatusIndicator";

export interface TriggerCardProps {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

export const TriggerCard = React.memo(({ isActive, onClick, icon }: TriggerCardProps) => {
  return (
    <button
      type="button"
      className={cn(
        "flex transform cursor-pointer flex-col items-center justify-center transition-all duration-300 ease-out",
        "group h-[125px]",
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
    >
      <div
        className={cn(
          "relative flex h-8 w-8 items-center justify-center rounded-full transition-all",
          "bg-gradient-to-br from-muted/50 to-muted/30 dark:from-muted/30 dark:to-muted/20",
          "border border-border/50 backdrop-blur-sm",
          "group-hover:border-border/60",
          isActive &&
            "border-[#FFA500] shadow-[0_0_0_1px_#FFA500,0_4px_6px_-2px_rgba(255,165,0,0.15)] ring-1 ring-[#FFA500]",
        )}
      >
        {icon}
      </div>
    </button>
  );
});

TriggerCard.displayName = "TriggerCard";
