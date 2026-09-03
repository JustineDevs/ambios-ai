"use client";

import type { ToolDiff } from "@ambios-ai/shared";
import {
  ChevronDown,
  ChevronUp,
  FileBracesCorner,
  FileJson,
  FilePlay,
  FileText,
  Globe,
  Plus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { SystemIcon } from "@/components/ui/system-icon";
import {
  type DiffLine,
  type DiffTarget,
  type DiffTargetType,
  type EnrichedDiff,
  formatTargetLabel,
} from "@/lib/config-diff-utils";
import { cn } from "@/lib/general-utils";
import { useSystems } from "@/queries/systems";

/**
 * Get icon for a diff target type (matches MiniStepCard icons)
 */
function getTargetIcon(type: DiffTargetType) {
  switch (type) {
    case "newStep":
      return <Plus className="h-3.5 w-3.5 text-green-500" />;
    case "outputTransform":
      return <FilePlay className="h-3.5 w-3.5 text-primary" />;
    case "inputSchema":
    case "outputSchema":
      return <FileBracesCorner className="h-3.5 w-3.5 text-primary" />;
    case "toolInput":
      return <FileJson className="h-3.5 w-3.5 text-primary" />;
    case "instruction":
      return <FileText className="h-3.5 w-3.5 text-muted-foreground" />;
    default:
      return <Globe className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

/**
 * Get system-based icon for a step (matches MiniStepCard)
 */
function StepSystemIcon({ systemId }: { systemId?: string }) {
  const { systems } = useSystems();

  const system = useMemo(() => {
    if (!systemId) return null;
    return systems.find((i) => i.id === systemId) || null;
  }, [systemId, systems]);

  if (system) {
    return (
      <div className="rounded-full border border-border/50 bg-white p-1 dark:bg-gray-100">
        <SystemIcon system={system} size={14} />
      </div>
    );
  }

  return <Globe className="h-3.5 w-3.5 text-muted-foreground" />;
}

// Re-export types for consumers
export type { DiffLine, DiffTarget, EnrichedDiff, ToolDiff };

/**
 * Render a single line of a diff with appropriate styling
 */
function DiffLineDisplay({ line, lineNumber }: { line: DiffLine; lineNumber?: number }) {
  const baseClasses = "flex items-start text-[11px] font-mono leading-5";

  const lineNumDisplay =
    lineNumber !== undefined ? (
      <span className="w-8 flex-shrink-0 select-none pr-2 text-right text-muted-foreground/50">
        {lineNumber}
      </span>
    ) : null;

  switch (line.type) {
    case "removed":
      return (
        <div className={cn(baseClasses, "bg-red-50 dark:bg-red-900/20")}>
          {lineNumDisplay}
          <span className="w-4 flex-shrink-0 select-none text-red-400 dark:text-red-500">-</span>
          <span className="whitespace-pre text-red-700 dark:text-red-300">{line.content}</span>
        </div>
      );
    case "added":
      return (
        <div className={cn(baseClasses, "bg-green-50 dark:bg-green-900/20")}>
          {lineNumDisplay}
          <span className="w-4 flex-shrink-0 select-none text-green-400 dark:text-green-500">
            +
          </span>
          <span className="whitespace-pre text-green-700 dark:text-green-300">{line.content}</span>
        </div>
      );
    default:
      return (
        <div className={cn(baseClasses, "text-muted-foreground")}>
          {lineNumDisplay}
          <span className="w-4 flex-shrink-0 select-none">&nbsp;</span>
          <span className="whitespace-pre">{line.content}</span>
        </div>
      );
  }
}

/**
 * Display a single enriched diff item with header and code lines
 */
function DiffItem({ enrichedDiff, compact }: { enrichedDiff: EnrichedDiff; compact?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullContext, setShowFullContext] = useState(false);
  const { target, lines, contextNew } = enrichedDiff;
  const targetInfo = formatTargetLabel(target);

  const previewSize = 9;
  const firstChangeIndexRaw = lines.findIndex((l) => l.type !== "context");
  const firstChangeIndex = firstChangeIndexRaw === -1 ? 0 : firstChangeIndexRaw;
  const maxPreviewStart = Math.max(0, lines.length - previewSize);
  const previewStart = Math.max(0, Math.min(firstChangeIndex - 1, maxPreviewStart));
  const previewEnd = Math.min(lines.length, previewStart + previewSize);
  const previewLines = lines.slice(previewStart, previewEnd);
  const hiddenCount = Math.max(0, lines.length - previewLines.length);
  const hasMore = hiddenCount > 0;
  const displayLines = isExpanded ? lines : previewLines;
  const displayStart = isExpanded ? 0 : previewStart;

  // Full context lines (for "Show full config" mode)
  const fullContextLines = useMemo(() => {
    if (!contextNew) return [];
    return contextNew.split("\n").map((content, i) => ({
      type: "context" as const,
      content,
      lineNumber: i + 1,
    }));
  }, [contextNew]);

  return (
    <div className="overflow-hidden rounded border border-border bg-white font-mono text-xs dark:bg-neutral-900">
      {/* Header with target info */}
      <div className="flex items-center justify-between border-b bg-muted/50 px-2 py-1.5">
        <div className="flex items-center gap-1.5">
          {targetInfo.type === "step" ? (
            <StepSystemIcon systemId={targetInfo.systemId} />
          ) : (
            getTargetIcon(targetInfo.type)
          )}
          {targetInfo.stepNumber !== undefined && (
            <span className="rounded bg-primary/10 px-1 py-0.5 font-medium text-[10px] text-primary">
              {targetInfo.stepNumber}
            </span>
          )}
          <span className="font-medium text-foreground">
            {targetInfo.stepId || targetInfo.label}
          </span>
          {targetInfo.path && (
            <span className="text-[10px] text-muted-foreground">/{targetInfo.path}</span>
          )}
        </div>
        {!compact && contextNew && (
          <button
            type="button"
            onClick={() => setShowFullContext(!showFullContext)}
            className="rounded p-0.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            title={showFullContext ? "Show diff only" : "Show full context"}
          >
            <div className="flex flex-col -space-y-1.5">
              <ChevronUp
                className={cn(
                  "h-3 w-3 transition-opacity",
                  showFullContext ? "opacity-100" : "opacity-40",
                )}
              />
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-opacity",
                  showFullContext ? "opacity-40" : "opacity-100",
                )}
              />
            </div>
          </button>
        )}
      </div>

      {/* Diff lines or full context */}
      {showFullContext ? (
        <div className="scrollbar-hidden max-h-[300px] overflow-x-auto overflow-y-auto">
          <div className="min-w-max">
            {fullContextLines.map((line) => (
              <DiffLineDisplay
                key={`${line.lineNumber}:${line.content}`}
                line={line}
                lineNumber={line.lineNumber}
              />
            ))}
          </div>
        </div>
      ) : lines.length > 0 ? (
        <div className="scrollbar-hidden overflow-x-auto">
          <div className="min-w-max">
            {displayLines.map((line) => (
              <DiffLineDisplay
                key={`${line.lineNumber}:${line.content}`}
                line={line}
                lineNumber={line.lineNumber}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="px-2 py-2 text-muted-foreground italic">No changes to display</div>
      )}

      {/* Expand/collapse button */}
      {!showFullContext && hasMore && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-center gap-1 border-t px-2 py-1 text-center text-[10px] text-muted-foreground hover:bg-muted/50"
        >
          <ChevronDown className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-180")} />
          {isExpanded ? "Show less" : `${hiddenCount} more lines`}
        </button>
      )}
    </div>
  );
}

/**
 * Display a list of enriched diffs (read-only, no approval controls)
 */
export function DiffDisplay({
  enrichedDiffs,
  compact,
}: {
  enrichedDiffs: EnrichedDiff[];
  compact?: boolean;
}) {
  if (!enrichedDiffs || enrichedDiffs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {enrichedDiffs.map((enrichedDiff, index) => (
        <DiffItem
          key={`${enrichedDiff.diff.op}:${enrichedDiff.diff.path}:${enrichedDiff.diff.value ?? ""}`}
          enrichedDiff={enrichedDiff}
          compact={compact}
        />
      ))}
    </div>
  );
}

/**
 * Legacy DiffDisplay that takes raw ToolDiff[] - kept for backwards compatibility
 * but won't show line-by-line diffs without original config
 */
export function DiffDisplayLegacy({ diffs }: { diffs: ToolDiff[] }) {
  if (!diffs || diffs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {diffs.map((diff, index) => (
        <div
          key={`${diff.op}:${diff.path}:${diff.value ?? ""}`}
          className="overflow-hidden rounded border border-border bg-white font-mono text-xs dark:bg-neutral-900"
        >
          <div className="flex items-center gap-2 border-b bg-muted/50 px-2 py-1.5">
            <span className="font-medium text-foreground">{diff.path}</span>
            <span className="text-[10px] text-muted-foreground">({diff.op})</span>
          </div>
          {diff.value !== undefined && (
            <div className="scrollbar-hidden overflow-x-auto px-2 py-1">
              <pre className="whitespace-pre-wrap text-[11px]">
                {typeof diff.value === "string" ? diff.value : JSON.stringify(diff.value, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
