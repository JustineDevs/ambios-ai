"use client";

import type { Log } from "@ambios-ai/shared";
import { ChevronRight, History, MessagesSquare, ScrollText } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { EnterpriseFeatureCard } from "@/components/ui/enterprise-feature-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/general-utils";
import { useAmbiOSClient } from "@/queries/use-client";
import { useRightSidebar } from "./RightSidebarContext";

const SIDEBAR_MIN_WIDTH = 300;
const SIDEBAR_MAX_WIDTH = 700;
const SIDEBAR_DEFAULT_WIDTH = 350;
const SIDEBAR_COLLAPSED_WIDTH = 45;

type ActivePanel = "logs" | "agent" | "history";

interface RightSidebarProps {
  className?: string;
}

export function RightSidebar({ className }: RightSidebarProps) {
  const { showAgent, setAgentPortalRef, registerSetSidebarExpanded, savedTool } = useRightSidebar();
  const agentContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      setAgentPortalRef(node);
    },
    [setAgentPortalRef],
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>(
    savedTool ? "history" : showAgent ? "agent" : "logs",
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const [transitionDuration, setTransitionDuration] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const resizingWidthRef = useRef(sidebarWidth);
  const cleanupRef = useRef<(() => void) | null>(null);
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  const [logs, setLogs] = useState<Log[]>([]);
  const [_hasNewLogs, setHasNewLogs] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const createClient = useAmbiOSClient();

  const isExpandedRef = useRef(isExpanded);
  const activePanelRef = useRef(activePanel);
  isExpandedRef.current = isExpanded;
  activePanelRef.current = activePanel;

  useEffect(() => {
    const storageKey = showAgent || savedTool ? "playground-sidebar" : "global-sidebar";
    const savedExpanded = localStorage.getItem(`${storageKey}-expanded`) === "true";
    const savedPanel = localStorage.getItem(`${storageKey}-panel`) as ActivePanel;
    // When agent mode or tool is active, always expand the sidebar
    setIsExpanded(showAgent || savedTool ? true : savedExpanded);
    if (showAgent || savedTool) {
      const validPanels: ActivePanel[] = showAgent
        ? ["logs", "agent", "history"]
        : ["logs", "history"];
      setActivePanel(
        savedPanel && validPanels.includes(savedPanel)
          ? savedPanel
          : savedTool
            ? "history"
            : "agent",
      );
    }
    setIsHydrated(true);
    requestAnimationFrame(() => setTransitionDuration(0.3));
  }, [showAgent, savedTool]);

  useEffect(() => {
    if (isHydrated) {
      const storageKey = showAgent || savedTool ? "playground-sidebar" : "global-sidebar";
      localStorage.setItem(`${storageKey}-expanded`, String(isExpanded));
    }
  }, [isExpanded, isHydrated, showAgent, savedTool]);

  useEffect(() => {
    if (isHydrated && (showAgent || savedTool)) {
      localStorage.setItem("playground-sidebar-panel", activePanel);
    }
  }, [activePanel, isHydrated, showAgent, savedTool]);

  useEffect(() => {
    registerSetSidebarExpanded((expanded: boolean) => {
      setIsExpanded(expanded);
      if (expanded) {
        setActivePanel("agent");
      }
    });
  }, [registerSetSidebarExpanded]);

  const client = useMemo(() => createClient(), [createClient]);

  const filteredLogs = useMemo(
    () => (showDebug ? logs : logs.filter((log) => log.level !== "DEBUG")),
    [logs, showDebug],
  );

  useEffect(() => {
    const subscription = client.subscribeToLogsSSE({
      onLog: (log) => {
        setLogs((prev) => [...prev, log].slice(-1000));
        if (!isExpandedRef.current || activePanelRef.current !== "logs") {
          setHasNewLogs(true);
        }
      },
      onError: () => {},
      includeDebug: true,
    });

    return () => {
      subscription.then((sub) => sub.unsubscribe());
      client.disconnect();
    };
  }, [client]);

  useEffect(() => {
    if (isExpanded && activePanel === "logs") {
      setHasNewLogs(false);
    }
  }, [isExpanded, activePanel]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    cleanupRef.current?.();

    setIsResizing(true);
    setTransitionDuration(0);
    const startX = e.clientX;
    const startWidth = resizingWidthRef.current;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;
      let newWidth = startWidth + delta;
      newWidth = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, newWidth));
      resizingWidthRef.current = newWidth;
      setSidebarWidth(newWidth);
    };

    const cleanup = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", cleanup);
      setIsResizing(false);
      setTransitionDuration(0.3);
      cleanupRef.current = null;
    };

    cleanupRef.current = cleanup;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", cleanup);
  };

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  const handlePanelSelect = (panel: ActivePanel) => {
    setActivePanel(panel);
    if (!isExpanded) {
      setIsExpanded(true);
    }
    if (panel === "logs") {
      setHasNewLogs(false);
    }
  };

  const currentWidth = isExpanded
    ? Math.max(sidebarWidth, SIDEBAR_MIN_WIDTH)
    : SIDEBAR_COLLAPSED_WIDTH;

  return (
    <div
      ref={sidebarRef}
      style={{
        width: currentWidth,
        transition: isResizing ? "none" : `width ${transitionDuration}s ease`,
      }}
      className={cn(
        "relative flex h-full flex-col border-border border-l bg-background",
        className,
      )}
    >
      {/* Collapsed state - stacked icons */}
      <div className={cn("flex flex-col items-center gap-2 py-3", isExpanded && "hidden")}>
        {showAgent && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handlePanelSelect("agent")}
            className={cn(
              "relative h-10 w-10",
              activePanel === "agent" && "bg-primary/10 text-primary",
            )}
            title="Agent"
          >
            <MessagesSquare className="h-5 w-5" />
          </Button>
        )}
        {savedTool && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handlePanelSelect("history")}
            className={cn(
              "relative h-10 w-10",
              activePanel === "history" && "bg-primary/10 text-primary",
            )}
            title="Version History"
          >
            <History className="h-5 w-5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handlePanelSelect("logs")}
          className={cn(
            "relative h-10 w-10",
            activePanel === "logs" && "bg-primary/10 text-primary",
          )}
          title="Logs"
        >
          <ScrollText className="h-5 w-5" />
        </Button>
      </div>

      {/* Expanded state */}
      <div className={cn("flex h-full flex-col", !isExpanded && "hidden")}>
        <div className="flex flex-shrink-0 items-center justify-between border-b px-3 py-2">
          <div className="flex items-center gap-1">
            {showAgent && (
              <button
                type="button"
                onClick={() => setActivePanel("agent")}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-md px-2 font-medium text-xs transition-colors",
                  activePanel === "agent"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <MessagesSquare className="h-3.5 w-3.5" />
                Agent
              </button>
            )}
            {savedTool && (
              <button
                type="button"
                onClick={() => setActivePanel("history")}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-md px-2 font-medium text-xs transition-colors",
                  activePanel === "history"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <History className="h-3.5 w-3.5" />
                History
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setActivePanel("logs");
                setHasNewLogs(false);
              }}
              className={cn(
                "relative inline-flex h-7 items-center gap-1.5 rounded-md px-2 font-medium text-xs transition-colors",
                activePanel === "logs"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <ScrollText className="h-3.5 w-3.5" />
              Logs
            </button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(false)}
            className="h-7 w-7"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden">
          {showAgent && (
            <div
              ref={agentContainerRef}
              className={cn("h-full", activePanel !== "agent" && "hidden")}
            />
          )}
          {savedTool && (
            <div className={cn("h-full", activePanel !== "history" && "hidden")}>
              <div className="p-4">
                <EnterpriseFeatureCard
                  title="Version History"
                  description="Tool version history and restore flows are available in the Enterprise edition."
                />
              </div>
            </div>
          )}
          <div className={cn("h-full", activePanel !== "logs" && "hidden")}>
            <LogsPanel
              filteredLogs={filteredLogs}
              expandedLogs={expandedLogs}
              setExpandedLogs={setExpandedLogs}
              showDebug={showDebug}
              setShowDebug={setShowDebug}
            />
          </div>
        </div>

        <hr
          onMouseDown={handleMouseDown}
          className="absolute top-0 left-0 h-full w-2 cursor-col-resize border-none bg-transparent outline-none"
        />
      </div>
    </div>
  );
}

interface LogsPanelProps {
  filteredLogs: Log[];
  expandedLogs: Set<string>;
  setExpandedLogs: React.Dispatch<React.SetStateAction<Set<string>>>;
  showDebug: boolean;
  setShowDebug: (show: boolean) => void;
}

function LogsPanel({
  filteredLogs,
  expandedLogs,
  setExpandedLogs,
  showDebug,
  setShowDebug,
}: LogsPanelProps) {
  useEffect(() => {
    const scrollArea = document.querySelector(
      "[data-sidebar-logs] [data-radix-scroll-area-viewport]",
    );
    if (scrollArea && filteredLogs.length > 0) {
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [filteredLogs]);

  return (
    <div className="flex h-full min-h-0 flex-col" data-sidebar-logs>
      <ScrollArea className="flex-1">
        <div className="p-4">
          {filteredLogs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center pt-28 pb-12 text-center">
              <ScrollText className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm">No logs yet</p>
              <p className="mt-2 max-w-[240px] text-muted-foreground/70 text-xs">
                Logs will appear here as you execute tools
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isLogExpanded = expandedLogs.has(log.id);
              const shouldTruncate = log.message.length > 100;
              const displayMessage =
                shouldTruncate && !isLogExpanded ? `${log.message.slice(0, 100)}...` : log.message;

              return (
                <div
                  key={log.id}
                  className={cn(
                    "mb-2 overflow-hidden rounded p-2 text-sm",
                    log.level === "ERROR"
                      ? "bg-red-500/10"
                      : log.level === "WARN"
                        ? "bg-yellow-500/10"
                        : "bg-muted",
                  )}
                >
                  <div className="flex justify-between">
                    <span className="font-mono text-xs">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={cn(
                        "font-semibold text-xs",
                        log.level === "ERROR" && "text-red-500",
                        log.level === "WARN" && "text-yellow-500",
                      )}
                    >
                      {log.level}
                    </span>
                  </div>
                  <p className="mt-1 max-w-full break-words text-xs">{displayMessage}</p>
                  {shouldTruncate && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedLogs((prev) => {
                          const newSet = new Set(prev);
                          isLogExpanded ? newSet.delete(log.id) : newSet.add(log.id);
                          return newSet;
                        })
                      }
                      className="mt-1 text-muted-foreground text-xs hover:text-foreground"
                    >
                      {isLogExpanded ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
      <div className="flex items-center justify-end gap-2 px-4 py-2">
        <span className="text-muted-foreground text-xs">Show Debug</span>
        <Switch
          checked={showDebug}
          onCheckedChange={setShowDebug}
          className="data-[state=checked]:bg-amber-500"
        />
      </div>
    </div>
  );
}
