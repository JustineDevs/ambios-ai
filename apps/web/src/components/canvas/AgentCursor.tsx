"use client";

import { MousePointer2 } from "lucide-react";
import { motion } from "motion/react";
import type { AgentCursor as AgentCursorState } from "@/lib/canvas/types";

export function AgentCursor({ x, y, state }: AgentCursorState) {
  return (
    <motion.div
      aria-label={`AmbiOS AI cursor: ${state}`}
      className="pointer-events-none absolute z-20 flex items-center gap-1.5 text-primary"
      animate={{ left: x, top: y }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
    >
      <MousePointer2 className="size-4 fill-primary" aria-hidden="true" />
      <span className="rounded-full border bg-background/90 px-2 py-0.5 font-medium text-[10px] shadow-sm">
        AmbiOS AI
      </span>
      {state !== "idle" && (
        <span className="size-2 animate-pulse rounded-full bg-primary" aria-hidden="true" />
      )}
    </motion.div>
  );
}
