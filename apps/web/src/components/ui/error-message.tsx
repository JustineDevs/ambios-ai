"use client";

import { AlertCircle } from "lucide-react";
import { memo, type ReactNode, useMemo } from "react";

interface ErrorMessageProps {
  /** Optional title/heading for the error */
  title?: string;
  /** The error message content - can be string or ReactNode */
  message: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Max height for the message area (default: "max-h-40") */
  maxHeight?: string;
  /** Truncate string messages to this length (only applies to string messages) */
  truncateAt?: number;
}

/**
 * Unified error message component for displaying errors in a non-alarming way.
 * Uses neutral/muted styling to avoid scaring users with expected errors.
 */
export const ErrorMessage = memo(function ErrorMessage({
  title,
  message,
  className = "",
  maxHeight = "max-h-40",
  truncateAt,
}: ErrorMessageProps) {
  const displayMessage = useMemo(() => {
    if (truncateAt && typeof message === "string" && message.length > truncateAt) {
      return `${message.slice(0, truncateAt)}...`;
    }
    return message;
  }, [message, truncateAt]);

  return (
    <div
      className={`flex items-start gap-2 overflow-hidden rounded-md border border-border p-3 ${className}`}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="min-w-0 flex-1">
        {title && <div className="mb-1 font-medium text-sm">{title}</div>}
        <div className={`overflow-y-auto break-words text-foreground/80 text-sm ${maxHeight}`}>
          {displayMessage}
        </div>
      </div>
    </div>
  );
});
