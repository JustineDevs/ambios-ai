"use client";

import type { Tool } from "@ambios-ai/shared";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { DiffDisplay } from "@/components/agent/tool-components/DiffDisplayComponent";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { computeToolDiffs, type EnrichedDiff } from "@/lib/config-diff-utils";
import { cn } from "@/lib/general-utils";
import { useAmbiOSClient } from "@/queries/use-client";

interface UnsavedChangesCardProps {
  hasUnsavedChanges: boolean;
  savedTool: Tool | null;
  currentTool: Tool;
  className?: string;
}

const DIFF_SUMMARY_INSTRUCTION = `
</instructions>
<output_format>One sentence, max 15 words, mentioning specific values that changed.</output_format>`;

function formatValue(val: any, maxLen = 80): string {
  if (val === undefined || val === null) return "(none)";
  if (typeof val === "string") {
    return val.length > maxLen ? `${val.slice(0, maxLen)}...` : val;
  }
  const str = JSON.stringify(val);
  return str.length > maxLen ? `${str.slice(0, maxLen)}...` : str;
}

function simplifyPath(path: string): string {
  return path
    .replace(/^\//, "")
    .replace(/steps\/(\d+)/g, (_, n) => `Step ${Number.parseInt(n, 10) + 1}`)
    .replace(/\//g, " > ")
    .replace(/config > /g, "")
    .replace(/properties > /g, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2");
}

function buildDiffSummaryPrompt(_toolId: string, enrichedDiffs: EnrichedDiff[]): string {
  const changes: string[] = [];

  for (const enriched of enrichedDiffs) {
    const { diff, oldValue, newValue } = enriched;
    const field = simplifyPath(diff.path);
    const op = diff.op;

    if (op === "add") {
      changes.push(`<change type="added" field="${field}">${formatValue(newValue)}</change>`);
    } else if (op === "remove") {
      changes.push(`<change type="removed" field="${field}">${formatValue(oldValue)}</change>`);
    } else if (op === "replace") {
      changes.push(`<change type="modified" field="${field}">
  <before>${formatValue(oldValue)}</before>
  <after>${formatValue(newValue)}</after>
</change>`);
    }
  }

  return `<instructions>Summarize the tool configuration changes below.</instructions>
<changes>
${changes.join("\n")}
</changes>
${DIFF_SUMMARY_INSTRUCTION}`;
}

function createDiffCacheKey(toolId: string, enrichedDiffs: EnrichedDiff[]): string {
  // Include values in the key so different edits to the same field get different cache entries
  const diffContent = enrichedDiffs
    .map((d) => `${d.diff.op}:${d.diff.path}:${JSON.stringify(d.diff.value ?? "")}`)
    .join("|");
  // Simple hash to keep key manageable
  let hash = 0;
  for (let i = 0; i < diffContent.length; i++) {
    hash = (hash << 5) - hash + diffContent.charCodeAt(i);
    hash |= 0;
  }
  return `diff:${toolId}:${hash}`;
}

export function UnsavedChangesCard({
  hasUnsavedChanges,
  savedTool,
  currentTool,
  className,
}: UnsavedChangesCardProps) {
  const createEEClient = useAmbiOSClient();
  const [isOpen, setIsOpen] = useState(false);

  const enrichedDiffs = useMemo(() => {
    if (!savedTool || !hasUnsavedChanges) return [];

    try {
      return computeToolDiffs(savedTool, currentTool);
    } catch (error) {
      console.error("Failed to compute diffs:", error);
      return [];
    }
  }, [savedTool, currentTool, hasUnsavedChanges]);

  const toolId = currentTool.id;
  const cacheKey = useMemo(
    () => createDiffCacheKey(toolId, enrichedDiffs),
    [toolId, enrichedDiffs],
  );

  const summaryQuery = useQuery({
    queryKey: ["tool-diff-summary", toolId, cacheKey],
    queryFn: async () => {
      const prompt = buildDiffSummaryPrompt(toolId, enrichedDiffs);
      const result = await createEEClient().summarize(prompt);
      return result.summary;
    },
    enabled: isOpen && enrichedDiffs.length > 0,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 10 * 60 * 1000,
  });

  const ChevronIcon = isOpen ? ChevronDown : ChevronRight;

  if (!hasUnsavedChanges) {
    return (
      <div className={cn("text-right", className)}>
        <div className="invisible inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1">
          <span className="h-2 w-2 rounded-full" />
          <span className="font-medium text-xs">Unsaved Changes</span>
          <ChevronRight className="h-3 w-3" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("text-right", className)}>
      <Popover onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-background px-2.5 py-1 shadow-sm transition-shadow hover:shadow dark:border-amber-700"
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="font-medium text-xs">Unsaved Changes</span>
            <ChevronIcon className="h-3 w-3 text-muted-foreground transition-transform" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[500px] p-0">
          <div className="border-b p-3">
            <h4 className="font-medium text-sm">Pending Changes</h4>
            {summaryQuery.isLoading || summaryQuery.isFetching ? (
              <div className="mt-1 flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground text-xs">Summarizing changes...</span>
              </div>
            ) : summaryQuery.data ? (
              <p className="mt-0.5 text-muted-foreground text-xs">{summaryQuery.data}</p>
            ) : (
              <p className="mt-0.5 text-muted-foreground text-xs">
                {enrichedDiffs.length} change{enrichedDiffs.length !== 1 ? "s" : ""} not yet saved
              </p>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto p-3">
            {enrichedDiffs.length > 0 ? (
              <DiffDisplay enrichedDiffs={enrichedDiffs} compact />
            ) : (
              <p className="py-2 text-center text-muted-foreground text-sm">
                Changes detected but no diff available
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
