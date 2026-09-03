"use client";

import type { ToolCall } from "@ambios-ai/shared";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ErrorMessage } from "@/components/ui/error-message";
import { cn } from "@/lib/general-utils";

interface ToolCallWrapperProps {
  tool: ToolCall;
  children: ReactNode;
  openByDefault?: boolean;
  hideStatusIcon?: boolean;
  statusOverride?: "running" | "completed" | "error" | null;
  manualRunLogs?: Array<{ message: string; timestamp: Date }>;
}

export function ToolCallWrapper({
  tool,
  children,
  openByDefault = false,
  hideStatusIcon = false,
  statusOverride,
  manualRunLogs,
}: ToolCallWrapperProps) {
  const [isExpanded, setIsExpanded] = useState(openByDefault);
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [liveElapsed, setLiveElapsed] = useState<number>(0);

  useEffect(() => {
    setIsExpanded(openByDefault);
  }, [openByDefault]);

  useEffect(() => {
    if (tool.status === "declined" || tool.status === "stopped") {
      setIsExpanded(false);
    }
  }, [tool.status]);

  const displayStatus = (() => {
    // If statusOverride is provided, use it (for manual runs)
    if (statusOverride) {
      return statusOverride;
    }

    if (tool.status === "awaiting_confirmation") {
      return tool.status;
    }

    if (tool.status !== "pending" && tool.status !== "running") {
      return tool.status;
    }

    // Check if this is in the last message and less than 5 minutes old
    const isRecentAndInLastMessage = (() => {
      // If no startTime, assume it's stale
      if (!tool.startTime) return false;

      // Check if it's less than 5 minutes old
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const isRecent = tool.startTime.getTime() > fiveMinutesAgo;

      // For now, assume if it's recent it's likely in the last message
      // (We don't have direct access to message context here)
      return isRecent;
    })();

    // If it's not recent or not in last message, show as error
    return isRecentAndInLastMessage ? tool.status : "error";
  })();

  // Live timer effect for running tools
  useEffect(() => {
    if (displayStatus === "running" && tool.startTime) {
      const interval = setInterval(() => {
        setLiveElapsed(Date.now() - tool.startTime?.getTime());
      }, 100); // Update every 100ms for smooth updates

      return () => {
        clearInterval(interval);
      };
    }
    // Reset live elapsed when tool stops running
    setLiveElapsed(0);
  }, [displayStatus, tool.startTime]);

  // Format elapsed time for display
  const formatElapsedTime = (durationMs: number, live = false) => {
    if (durationMs < 1000 && !live) {
      return `${Math.round(durationMs)}ms`;
    }
    if (durationMs < 60000) {
      return `${Math.floor(durationMs / 1000)}s`;
    }
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "error":
        return "bg-muted text-muted-foreground";
      case "running":
        return "bg-muted text-muted-foreground";
      case "stopped":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case "declined":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case "awaiting_confirmation":
        return "bg-[#ffa500]/15 text-amber-800 dark:bg-[#ffa500]/20 dark:text-[#ffa500]";
      case "pending":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "error":
        return "Found Issue";
      case "running":
        return "Running";
      case "stopped":
        return "Stopped";
      case "awaiting_confirmation":
        return "Awaiting Confirmation";
      case "declined":
        return "Declined";
      case "pending":
        return "Generating Tool Call Inputs";
      default:
        return "Unknown";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Loader2 className="h-3 w-3 animate-spin" />;
      default:
        return null;
    }
  };

  // Get latest log message for running status
  const latestLogMessage = (() => {
    // For manual runs with statusOverride, use manualRunLogs
    if (statusOverride === "running" && manualRunLogs && manualRunLogs.length > 0) {
      const latestLog = manualRunLogs[manualRunLogs.length - 1];
      const message = latestLog.message;
      return message.length > 100 ? `${message.substring(0, 100)}...` : message;
    }
    // For agent tool runs, use tool.logs
    if (tool.status === "running" && tool.logs && tool.logs.length > 0) {
      const latestLog = tool.logs[tool.logs.length - 1];
      const message = latestLog.message;
      return message.length > 100 ? `${message.substring(0, 100)}...` : message;
    }
    return null;
  })();

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="rounded-xl border border-border/50 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm dark:from-muted/40 dark:to-muted/20">
        <CollapsibleTrigger asChild>
          <div className="flex min-w-0 cursor-pointer items-center justify-between gap-2 p-4">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex flex-shrink-0 items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
              <Badge
                className={cn(
                  "flex-shrink-0 font-medium text-xs hover:bg-inherit",
                  getStatusColor(displayStatus),
                )}
              >
                {(() => {
                  const displayNames: Record<string, string> = {
                    edit_tool: "Edit Tool",
                  };
                  return (
                    displayNames[tool.name] ||
                    tool.name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
                  );
                })()}
              </Badge>
              {!hideStatusIcon && (
                <div className="flex min-w-0 items-center gap-1 overflow-hidden text-muted-foreground text-xs">
                  {getStatusIcon(displayStatus)}
                  <span className="flex-shrink-0 capitalize">{getStatusName(displayStatus)}</span>
                  {displayStatus === "running" && latestLogMessage && (
                    <>
                      <span className="mx-1 hidden flex-shrink-0 sm:inline-block">•</span>
                      <span className="hidden truncate sm:inline-block">{latestLogMessage}</span>
                    </>
                  )}
                </div>
              )}
            </div>
            {(() => {
              if (displayStatus === "running" && tool.startTime && liveElapsed > 0) {
                return (
                  <span className="flex-shrink-0 text-muted-foreground text-xs">
                    {formatElapsedTime(liveElapsed, true)}
                  </span>
                );
              }

              if (tool.startTime && tool.endTime) {
                const durationMs = Math.round(tool.endTime.getTime() - tool.startTime.getTime());
                return (
                  <span className="flex-shrink-0 text-muted-foreground text-xs">
                    {formatElapsedTime(durationMs, false)}
                  </span>
                );
              }

              return null;
            })()}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4">
            {displayStatus === "completed" &&
              tool.name !== "call_system" &&
              tool.name !== "edit_tool" &&
              tool.name !== "build_tool" &&
              tool.name !== "run_tool" &&
              tool.output &&
              (() => {
                try {
                  const parsed =
                    typeof tool.output === "string" ? JSON.parse(tool.output) : tool.output;
                  if (parsed && parsed.success === false && !hideStatusIcon) {
                    return (
                      <div className="mb-4 space-y-4">
                        <ErrorMessage
                          title="Task returned an error"
                          message={parsed.message || parsed.error || "An unknown error occurred"}
                        />
                      </div>
                    );
                  }
                } catch {
                  // If parsing fails, don't show error box
                }
                return null;
              })()}

            {/* Show stopped message for stopped tool calls */}
            {displayStatus === "stopped" && (
              <div className="mb-4 space-y-4">
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-700 dark:bg-orange-900/30">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5 text-orange-600 dark:text-orange-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v4a1 1 0 11-2 0V7zM8 13a1 1 0 112 0 1 1 0 01-2 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 font-medium text-orange-800 text-sm dark:text-orange-200">
                        Tool call stopped
                      </div>
                    </div>
                  </div>
                </div>

                {/* Show collapsible input when tool is stopped */}
                {tool.input && (
                  <div>
                    <Collapsible open={isInputExpanded} onOpenChange={setIsInputExpanded}>
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex items-center gap-1.5 text-muted-foreground/60 text-xs transition-colors hover:text-muted-foreground"
                        >
                          {isInputExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                          Input used
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 rounded-md border border-border bg-muted/50 p-3">
                          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs">
                            {JSON.stringify(tool.input, null, 2)}
                          </pre>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                )}
              </div>
            )}

            {/* Show warning message for stale/incomplete tool calls (not for execution failures with statusOverride or tools with custom error display that have actual errors) */}
            {displayStatus === "error" &&
              !statusOverride &&
              !(
                ["run_tool", "build_tool", "edit_tool"].includes(tool.name) &&
                tool.status === "error"
              ) && (
                <div className="mb-4 space-y-4">
                  <ErrorMessage
                    message={(() => {
                      let errorMessage = tool.error;
                      if (errorMessage) {
                        try {
                          const parsed = JSON.parse(errorMessage);
                          errorMessage = parsed.error || parsed.message || errorMessage;
                        } catch {}
                      }
                      if (errorMessage) {
                        return <span>{errorMessage}</span>;
                      }
                      return (
                        <>
                          Tool call{" "}
                          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                            {tool.id}
                          </code>{" "}
                          did not complete.
                          <span className="ml-1 text-xs">(connection issue or tab closed)</span>
                        </>
                      );
                    })()}
                  />

                  {/* Show collapsible input when tool fails */}
                  {tool.input && (
                    <div>
                      <Collapsible open={isInputExpanded} onOpenChange={setIsInputExpanded}>
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="flex items-center gap-1.5 text-muted-foreground/60 text-xs transition-colors hover:text-muted-foreground"
                          >
                            {isInputExpanded ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                            Input used
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-2 rounded-md border border-border bg-muted/50 p-3">
                            <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs">
                              {JSON.stringify(tool.input, null, 2)}
                            </pre>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )}
                </div>
              )}

            {/* Show children only if not failed, stopped, error, or stale */}
            {(() => {
              // Don't show children for stopped tools (unless it's a statusOverride)
              if (displayStatus === "stopped" && !statusOverride) {
                return null;
              }

              // Tools that handle their own error display
              const toolsWithCustomErrorDisplay = ["run_tool", "build_tool", "edit_tool"];

              // Don't show children for error tools (unless it's a statusOverride or tool handles its own error display)
              if (
                displayStatus === "error" &&
                !statusOverride &&
                !toolsWithCustomErrorDisplay.includes(tool.name)
              ) {
                return null;
              }

              // Don't show children for stale tools (when displayStatus differs from actual status AND no statusOverride)
              if (!statusOverride && displayStatus !== tool.status) {
                return null;
              }

              return children;
            })()}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
