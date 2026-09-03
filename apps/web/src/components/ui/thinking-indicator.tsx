"use client";

import { OperationIndicator } from "@/components/ui/operation-indicator";

type IndicatorState = "thinking" | "working" | "searching" | "connecting" | "approval";

interface ThinkingIndicatorProps {
  text?: string;
  state?: IndicatorState;
  size?: number;
  className?: string;
}

export function ThinkingIndicator({
  text = "Thinking",
  state = "thinking",
  size = 20,
  className,
}: ThinkingIndicatorProps) {
  return (
    <OperationIndicator
      status={state}
      label={text ? `${text}…` : undefined}
      size={size === 64 ? 64 : 20}
      className={className}
    />
  );
}
