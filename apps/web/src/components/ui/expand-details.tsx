"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, CircleAlert, Loader2 } from "lucide-react";
import { type ReactNode, useState } from "react";

export type ExpandDetailsStatus = "ready" | "processing" | "attention";

export default function ExpandDetails({
  status = "ready",
  title = "Context",
  details = [],
}: {
  status?: ExpandDetailsStatus;
  title?: string;
  details?: Array<{ label: string; value: ReactNode }>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const StatusIcon =
    status === "processing" ? Loader2 : status === "attention" ? CircleAlert : Check;
  const statusLabel =
    status === "processing"
      ? "Context is processing"
      : status === "attention"
        ? "Context needs attention"
        : "Context is ready";

  return (
    <div className="relative flex size-9 shrink-0 items-center justify-center">
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 8, scale: 0.96, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className="absolute right-0 bottom-full z-50 mb-2 w-64 origin-bottom-right rounded-xl border border-border/70 bg-background/95 p-3 shadow-xl backdrop-blur-xl"
            role="dialog"
            aria-label="Context details"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="font-medium text-foreground text-sm">{title}</span>
              <span className="text-[11px] text-muted-foreground">{statusLabel}</span>
            </div>
            <div className="grid gap-2">
              {details.map((detail) => (
                <div key={detail.label} className="flex items-center justify-between gap-4 text-xs">
                  <span className="text-muted-foreground">{detail.label}</span>
                  <span className="truncate font-medium text-foreground">{detail.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={statusLabel}
        aria-label={isOpen ? "Close composer context" : "Open composer context"}
        aria-expanded={isOpen}
        whileTap={{ scale: 0.94 }}
        className="flex size-9 items-center justify-center rounded-full border border-border/70 bg-background/95 text-muted-foreground shadow-sm backdrop-blur-xl transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          className={
            "flex size-7 items-center justify-center rounded-full" +
            (status === "ready"
              ? "bg-emerald-500/15 text-emerald-600"
              : status === "processing"
                ? "bg-amber-500/15 text-amber-600"
                : "bg-destructive/15 text-destructive")
          }
        >
          <StatusIcon className={status === "processing" ? "size-4 animate-spin" : "size-4"} />
        </span>
        {isOpen && <ChevronDown className="sr-only" />}
      </motion.button>
    </div>
  );
}
