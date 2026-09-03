"use client";

import * as SheetPrimitive from "@radix-ui/react-dialog";
import { GraduationCap, Info, X } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { AgentType } from "@/lib/agent/agent-kind";
import {
  AGENT_SUMMARIES,
  APPROVAL_LABELS,
  type ApprovalMode,
  getGroupedToolsForAgent,
} from "@/lib/agent/agent-tools/tool-metadata";
import { cn } from "@/lib/general-utils";
import { useAgentContext } from "./AgentContextProvider";

const APPROVAL_STYLES: Record<ApprovalMode, string> = {
  auto: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  approval_after: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  approval_before: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
};

interface AgentCapabilitiesProps {
  agentType: AgentType;
  triggerClassName?: string;
  compact?: boolean;
}

export function AgentCapabilities({
  agentType,
  triggerClassName,
  compact = false,
}: AgentCapabilitiesProps) {
  const summary = AGENT_SUMMARIES[agentType];
  const { loadedSkills } = useAgentContext();
  const groups = useMemo(
    () => getGroupedToolsForAgent(agentType, loadedSkills),
    [agentType, loadedSkills],
  );
  const toolCount = useMemo(() => groups.reduce((acc, g) => acc + g.tools.length, 0), [groups]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center rounded-xl transition-all duration-200",
            "text-muted-foreground/70 hover:text-foreground",
            "border border-border/40 bg-muted/30 hover:border-border/60 hover:bg-muted/60",
            compact ? "h-7 w-7" : "h-9 w-9",
            triggerClassName,
          )}
          title="Agent capabilities"
          aria-label="Open agent capabilities"
        >
          <Info className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </button>
      </SheetTrigger>
      <SheetPortal>
        <SheetOverlay className="data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-background/30 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=open]:animate-in" />
        <SheetPrimitive.Content
          className={cn(
            "fixed inset-y-0 right-0 z-50 h-full w-[380px] sm:max-w-[380px]",
            "overflow-y-auto p-6 shadow-lg",
            "bg-background",
            "border-border/50 border-l",
            "transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
            "data-[state=closed]:animate-out data-[state=open]:animate-in",
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
          )}
        >
          <SheetPrimitive.Close className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
          <SheetHeader className="border-border/30 border-b pb-4">
            <SheetTitle className="font-semibold text-base">{summary?.title ?? "Agent"}</SheetTitle>
            <SheetDescription className="text-muted-foreground text-sm leading-relaxed">
              {summary?.description}
            </SheetDescription>
            <div className="pt-1">
              <span className="text-muted-foreground/60 text-xs">{toolCount} tools available</span>
            </div>
          </SheetHeader>

          <div className="space-y-5 pt-5">
            {loadedSkills.length > 0 && (
              <div className="rounded-xl border border-border/30 bg-muted/30 p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <h4 className="font-medium text-muted-foreground/70 text-xs">Loaded Skills</h4>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {loadedSkills.map((skill) => (
                    <Badge
                      key={skill}
                      className="h-5 rounded-md border-border/40 bg-muted/60 px-1.5 py-0 font-medium text-[10px] text-muted-foreground"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {groups.map((group) => (
              <div key={group.category}>
                <h3 className="mb-2.5 px-1 font-medium text-muted-foreground/70 text-xs uppercase tracking-wider">
                  {group.label}
                </h3>
                <div className="space-y-1">
                  {group.tools.map((tool) => (
                    <div
                      key={tool.name}
                      className={cn(
                        "group rounded-xl px-3 py-2.5 transition-colors duration-150",
                        "hover:bg-muted/40",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="mb-0.5 flex items-center gap-2">
                            <span className="font-medium text-foreground/90 text-sm">
                              {tool.meta.displayName}
                            </span>
                          </div>
                          <p className="text-muted-foreground/70 text-xs leading-relaxed">
                            {tool.meta.summary}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "mt-0.5 h-5 shrink-0 rounded-md px-1.5 py-0 font-medium text-[10px]",
                            APPROVAL_STYLES[tool.approval],
                          )}
                        >
                          {APPROVAL_LABELS[tool.approval]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 pb-2">
            <div className="rounded-xl border border-border/30 bg-muted/30 p-3">
              <h4 className="mb-2 font-medium text-muted-foreground/70 text-xs">Approval legend</h4>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge
                    className={cn(
                      "h-5 rounded-md px-1.5 py-0 font-medium text-[10px]",
                      APPROVAL_STYLES.auto,
                    )}
                  >
                    {APPROVAL_LABELS.auto}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground/60">
                    No confirmation needed
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={cn(
                      "h-5 rounded-md px-1.5 py-0 font-medium text-[10px]",
                      APPROVAL_STYLES.approval_after,
                    )}
                  >
                    {APPROVAL_LABELS.approval_after}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground/60">
                    Runs first, then asks to apply
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={cn(
                      "h-5 rounded-md px-1.5 py-0 font-medium text-[10px]",
                      APPROVAL_STYLES.approval_before,
                    )}
                  >
                    {APPROVAL_LABELS.approval_before}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground/60">
                    Waits for your confirmation
                  </span>
                </div>
              </div>
            </div>
          </div>
        </SheetPrimitive.Content>
      </SheetPortal>
    </Sheet>
  );
}
