"use client";

import type { ToolDiff } from "@ambios-ai/shared";
import {
  Check,
  CheckCircle,
  ChevronDown,
  FileJson,
  FilePlay,
  FileText,
  Globe,
  Loader2,
  Play,
  Plus,
  Square,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { JsonEditor } from "@/components/editors/JsonEditor";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ErrorMessage } from "@/components/ui/error-message";
import { SystemIcon } from "@/components/ui/system-icon";
import {
  type DiffLine,
  type DiffTargetType,
  type EnrichedDiff,
  formatTargetLabel,
} from "@/lib/config-diff-utils";
import { cn } from "@/lib/general-utils";
import { useSystems } from "@/queries/systems";

type DiffApprovalState = "pending" | "approved" | "rejected";

function getTargetIcon(type: DiffTargetType) {
  switch (type) {
    case "newStep":
      return <Plus className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />;
    case "outputTransform":
      return <FilePlay className="h-3.5 w-3.5 flex-shrink-0 text-primary" />;
    case "inputSchema":
    case "outputSchema":
      return <FileJson className="h-3.5 w-3.5 flex-shrink-0 text-primary" />;
    case "instruction":
      return <FileText className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />;
    default:
      return <Globe className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />;
  }
}

function StepSystemIcon({ systemId }: { systemId?: string }) {
  const { systems } = useSystems();

  const system = useMemo(() => {
    if (!systemId) return null;
    return systems.find((i) => i.id === systemId) || null;
  }, [systemId, systems]);

  if (system) {
    return (
      <div className="flex-shrink-0 rounded-full border border-border/50 bg-white p-1 dark:bg-gray-100">
        <SystemIcon system={system} size={14} />
      </div>
    );
  }

  return <Globe className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />;
}

interface DiffApprovalComponentProps {
  enrichedDiffs: EnrichedDiff[];
  onComplete: (result: {
    approved: boolean;
    partial: boolean;
    approvedDiffs: ToolDiff[];
    rejectedDiffs: ToolDiff[];
    saveAfterAccept?: boolean;
  }) => void;
  onRunWithDiffs?: (approvedDiffs: ToolDiff[], payload?: Record<string, any>) => void;
  onAbortTest?: () => void;
  isRunning?: boolean;
  testLogs?: Array<{ message: string; timestamp: Date }>;
  testResult?: { success: boolean; data?: any; error?: string } | null;
  initialPayload?: string;
  isSubmitting?: boolean;
  submitMode?: "accept" | "accept_and_save" | null;
  defaultSaveOnAccept?: boolean;
  allowDraftOnlyAccept?: boolean;
}

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

function DiffApprovalItem({
  enrichedDiff,
  state,
  onApprove,
  onReject,
  disabled = false,
}: {
  enrichedDiff: EnrichedDiff;
  state: DiffApprovalState;
  onApprove: () => void;
  onReject: () => void;
  disabled?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { target, lines } = enrichedDiff;
  const targetInfo = formatTargetLabel(target);

  const previewSize = 3;
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

  const stateStyles = {
    pending: "border-green-300 dark:border-green-700 bg-green-50/30 dark:bg-green-900/10",
    approved: "border-green-300 dark:border-green-700 bg-green-50/30 dark:bg-green-900/10",
    rejected: "border-red-300 dark:border-red-700 bg-red-50/30 dark:bg-red-900/10 opacity-60",
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded border font-mono text-xs transition-all",
        stateStyles[state],
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 bg-muted/30 px-2 py-1.5">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {targetInfo.type === "step" ? (
            <StepSystemIcon systemId={targetInfo.systemId} />
          ) : (
            getTargetIcon(targetInfo.type)
          )}
          {targetInfo.stepNumber !== undefined && (
            <span className="flex-shrink-0 rounded bg-primary/10 px-1 py-0.5 font-medium text-[10px] text-primary">
              {targetInfo.stepNumber}
            </span>
          )}
          <span className="truncate font-medium text-foreground text-xs">
            {targetInfo.stepId || targetInfo.label}
          </span>
          {targetInfo.path && (
            <span className="truncate text-[10px] text-muted-foreground">/{targetInfo.path}</span>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onReject}
            disabled={disabled}
            className={cn(
              "rounded p-1 transition-colors",
              state === "rejected"
                ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                : "text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400",
              disabled && "cursor-not-allowed opacity-50",
            )}
            title={state === "rejected" ? "Click to undo rejection" : "Reject this change"}
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onApprove}
            disabled={disabled}
            className={cn(
              "rounded p-1 transition-colors",
              state === "approved"
                ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                : "text-muted-foreground hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-400",
              disabled && "cursor-not-allowed opacity-50",
            )}
            title={state === "approved" ? "Click to undo approval" : "Approve this change"}
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Diff lines preview */}
      {lines.length > 0 ? (
        <div
          className={cn(
            "scrollbar-hidden overflow-x-auto",
            state === "rejected" && "line-through decoration-red-400/50",
          )}
        >
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
        <div className="px-2 py-2 text-[11px] text-muted-foreground italic">
          No content to display
        </div>
      )}

      {/* Expand/collapse button */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-center gap-1 border-t px-2 py-0.5 text-center text-[10px] text-muted-foreground hover:bg-muted/50"
        >
          <ChevronDown className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-180")} />
          {isExpanded ? "Show less" : `${hiddenCount} more lines`}
        </button>
      )}
    </div>
  );
}

export function DiffApprovalComponent({
  enrichedDiffs,
  onComplete,
  onRunWithDiffs,
  onAbortTest,
  isRunning = false,
  testLogs,
  testResult,
  initialPayload,
  isSubmitting = false,
  submitMode = null,
  defaultSaveOnAccept = true,
  allowDraftOnlyAccept = true,
}: DiffApprovalComponentProps) {
  const [diffStates, setDiffStates] = useState<Map<number, DiffApprovalState>>(
    () => new Map(enrichedDiffs.map((_, i) => [i, "approved"])),
  );
  const [editablePayload, setEditablePayload] = useState<string>(initialPayload || "{}");
  const [confirmMenuOpen, setConfirmMenuOpen] = useState(false);
  const confirmActionRef = useRef<HTMLDivElement | null>(null);
  const [confirmActionWidth, setConfirmActionWidth] = useState<number | null>(null);

  useEffect(() => {
    if (initialPayload && initialPayload !== "{}" && initialPayload !== editablePayload) {
      setEditablePayload(initialPayload);
    }
  }, [initialPayload, editablePayload]);

  useEffect(() => {
    const actionGroup = confirmActionRef.current;
    if (!actionGroup) return;

    const updateWidth = () => {
      setConfirmActionWidth(actionGroup.offsetWidth);
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(actionGroup);

    return () => {
      observer.disconnect();
    };
  }, []);

  const approvedCount = useMemo(
    () => [...diffStates.values()].filter((s) => s === "approved").length,
    [diffStates],
  );

  const rejectedCount = useMemo(
    () => [...diffStates.values()].filter((s) => s === "rejected").length,
    [diffStates],
  );

  const handleApprove = useCallback((index: number) => {
    setDiffStates((prev) => new Map(prev).set(index, "approved"));
  }, []);

  const handleReject = useCallback((index: number) => {
    setDiffStates((prev) => new Map(prev).set(index, "rejected"));
  }, []);

  const handleRejectAll = useCallback(() => {
    if (isSubmitting) return;
    if (isRunning && onAbortTest) {
      onAbortTest();
    }

    // Immediately complete with all rejected
    onComplete({
      approved: false,
      partial: false,
      approvedDiffs: [],
      rejectedDiffs: enrichedDiffs.map((ed) => ed.diff),
      saveAfterAccept: false,
    });
  }, [enrichedDiffs, onComplete, isRunning, onAbortTest, isSubmitting]);

  const handleConfirm = useCallback(
    (saveAfterAccept = false) => {
      if (isSubmitting) return;
      if (isRunning && onAbortTest) {
        onAbortTest();
      }

      const approvedDiffs: ToolDiff[] = [];
      const rejectedDiffs: ToolDiff[] = [];

      for (const [index, state] of diffStates) {
        if (state === "approved") {
          approvedDiffs.push(enrichedDiffs[index].diff);
        } else if (state === "rejected") {
          rejectedDiffs.push(enrichedDiffs[index].diff);
        }
      }

      const allApproved = rejectedDiffs.length === 0 && approvedDiffs.length > 0;
      const partial = approvedDiffs.length > 0 && rejectedDiffs.length > 0;

      onComplete({
        approved: allApproved,
        partial,
        approvedDiffs,
        rejectedDiffs,
        saveAfterAccept,
      });
    },
    [diffStates, enrichedDiffs, onComplete, isRunning, onAbortTest, isSubmitting],
  );

  const handleRunWithApproved = useCallback(() => {
    if (isSubmitting) return;
    const approvedDiffs: ToolDiff[] = [];
    for (const [index, state] of diffStates) {
      if (state === "approved") {
        approvedDiffs.push(enrichedDiffs[index].diff);
      }
    }
    let payload: Record<string, any> | undefined;
    try {
      if (editablePayload.trim()) {
        payload = JSON.parse(editablePayload);
      }
    } catch {}
    onRunWithDiffs?.(approvedDiffs, payload);
  }, [diffStates, enrichedDiffs, onRunWithDiffs, editablePayload, isSubmitting]);

  const primaryLabel = defaultSaveOnAccept ? "Accept & Save" : "Accept";
  const submitLabel =
    submitMode === "accept_and_save"
      ? "Accepting & Saving..."
      : submitMode === "accept"
        ? "Accepting..."
        : primaryLabel;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="text-muted-foreground text-xs">
          {enrichedDiffs.length} change{enrichedDiffs.length !== 1 ? "s" : ""}
          {approvedCount > 0 && (
            <span className="text-green-600 dark:text-green-400"> • {approvedCount} approved</span>
          )}
          {rejectedCount > 0 && (
            <span className="text-red-600 dark:text-red-400"> • {rejectedCount} rejected</span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {enrichedDiffs.map((enrichedDiff, index) => (
          <DiffApprovalItem
            key={`${enrichedDiff.diff.op}:${enrichedDiff.diff.path}:${enrichedDiff.diff.value ?? ""}`}
            enrichedDiff={enrichedDiff}
            state={diffStates.get(index) || "pending"}
            onApprove={() => handleApprove(index)}
            onReject={() => handleReject(index)}
            disabled={isSubmitting}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {approvedCount > 0 && onRunWithDiffs ? (
          isRunning ? (
            <Button
              size="sm"
              variant="glass"
              onClick={onAbortTest}
              className="h-9 flex-1 basis-[140px] text-orange-600 text-xs dark:text-orange-400"
            >
              <Square className="mr-1 h-3 w-3" />
              Stop
            </Button>
          ) : (
            <div className="flex flex-1 basis-[140px]">
              <DropdownMenu>
                <div className="flex w-full">
                  <Button
                    size="sm"
                    variant="glass"
                    onClick={handleRunWithApproved}
                    className="h-9 flex-1 rounded-r-none text-xs"
                    disabled={isSubmitting}
                  >
                    <Play className="mr-1 h-3 w-3" />
                    Test {approvedCount} change{approvedCount !== 1 ? "s" : ""}
                  </Button>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="glass"
                      className="h-9 rounded-l-none border-l-0 px-2 text-xs"
                      disabled={isSubmitting}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                </div>
                <DropdownMenuContent align="start" className="w-[400px] p-3">
                  <div className="space-y-2">
                    <span className="font-medium text-sm">Test Payload</span>
                    <p className="text-muted-foreground text-xs">Payload used for testing.</p>
                    <JsonEditor value={editablePayload} readOnly maxHeight="200px" />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        ) : null}
        <Button
          size="sm"
          variant="glass"
          onClick={handleRejectAll}
          className="h-9 flex-1 basis-[140px] text-xs"
          disabled={isSubmitting}
        >
          <X className="mr-1 h-3 w-3" />
          Reject all
        </Button>
        <div className="flex flex-1 basis-[180px]">
          {allowDraftOnlyAccept ? (
            <DropdownMenu open={confirmMenuOpen} onOpenChange={setConfirmMenuOpen}>
              <div ref={confirmActionRef} className="flex w-full">
                <Button
                  size="sm"
                  variant="glass-primary"
                  onClick={() => handleConfirm(defaultSaveOnAccept)}
                  disabled={approvedCount === 0 || isSubmitting}
                  className="h-9 flex-1 rounded-r-none text-xs"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="mr-1 h-3 w-3" />
                  )}
                  {submitLabel}
                </Button>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="glass-primary"
                    disabled={approvedCount === 0 || isSubmitting}
                    className="h-9 rounded-l-none border-l-0 px-3 text-xs"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
              </div>
              <DropdownMenuContent
                align="end"
                className="min-w-0 rounded-md border-0 bg-transparent p-0 shadow-none dark:border-0 dark:bg-transparent dark:from-transparent dark:to-transparent dark:shadow-none"
                style={confirmActionWidth ? { width: confirmActionWidth } : undefined}
              >
                <div className="p-0">
                  <Button
                    size="sm"
                    variant="glass-primary"
                    onClick={() => {
                      setConfirmMenuOpen(false);
                      handleConfirm(!defaultSaveOnAccept);
                    }}
                    disabled={approvedCount === 0 || isSubmitting}
                    className="h-9 w-full justify-center px-3 text-xs"
                  >
                    <Check className="mr-1 h-3 w-3" />
                    {defaultSaveOnAccept ? "Accept" : "Accept & Save"}
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              variant="glass-primary"
              onClick={() => handleConfirm(defaultSaveOnAccept)}
              disabled={approvedCount === 0 || isSubmitting}
              className="h-9 flex-1 text-xs"
            >
              {isSubmitting ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Check className="mr-1 h-3 w-3" />
              )}
              {submitLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Test run status */}
      {(isRunning || testResult) && (
        <div className="mt-3 border-t pt-3">
          {/* Running state - single line log display */}
          {isRunning && (
            <div className="flex min-w-0 items-center gap-2 text-muted-foreground text-xs">
              <Loader2 className="h-3 w-3 flex-shrink-0 animate-spin" />
              <span className="flex-shrink-0">Testing changes...</span>
              {testLogs && testLogs.length > 0 && (
                <>
                  <span className="flex-shrink-0">•</span>
                  <span className="truncate font-mono text-[10px]">
                    {(() => {
                      const msg = testLogs[testLogs.length - 1].message;
                      return msg.length > 80 ? `${msg.substring(0, 80)}...` : msg;
                    })()}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Completed state - show result */}
          {!isRunning && testResult && (
            <div className="space-y-2">
              {testResult.success ? (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-xs">Test Results</span>
                  </div>
                  <JsonEditor
                    value={JSON.stringify(testResult.data, null, 2)}
                    readOnly
                    maxHeight="200px"
                  />
                </div>
              ) : (
                <ErrorMessage message={testResult.error || ""} truncateAt={300} className="p-2" />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
