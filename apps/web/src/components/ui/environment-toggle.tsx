"use client";
import { useEnvironment } from "@/app/environment-context";
import { cn } from "@/lib/general-utils";

interface EnvironmentToggleProps {
  className?: string;
}

export function EnvironmentToggle({ className }: EnvironmentToggleProps) {
  const { mode, setMode, hasMultiEnvSystems, isLoading } = useEnvironment();

  // Don't render if org doesn't have multi-env systems
  if (isLoading || !hasMultiEnvSystems) {
    return null;
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg p-0.5",
        "border border-border/50 bg-muted/50",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setMode("prod")}
        className={cn(
          "rounded-md px-2.5 py-1 font-medium text-xs transition-all duration-150",
          mode === "prod"
            ? "border border-green-200 bg-green-100 text-green-700 shadow-sm dark:border-green-800/50 dark:bg-green-900/30 dark:text-green-300"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Prod
      </button>
      <button
        type="button"
        onClick={() => setMode("dev")}
        className={cn(
          "rounded-md px-2.5 py-1 font-medium text-xs transition-all duration-150",
          mode === "dev"
            ? "border border-orange-200 bg-orange-100 text-orange-700 shadow-sm dark:border-orange-800/50 dark:bg-orange-900/30 dark:text-orange-300"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Dev
      </button>
    </div>
  );
}
