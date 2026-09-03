"use client";

import type { Run } from "@ambios-ai/shared";
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DetailDrawer,
  EnterprisePage,
  EnterpriseSummary,
  ExecutionProgress,
  Freshness,
  PageToolbar,
  RiskBadge,
  ScopeSummary,
  type TimelineItem,
} from "@/components/ui/enterprise-page";
import { Input } from "@/components/ui/input";
import { OperationIndicator } from "@/components/ui/operation-indicator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/general-utils";
import { useRuns } from "@/queries/runs";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "running", label: "Running" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "aborted", label: "Aborted" },
];

const STATUS_STYLES: Record<string, string> = {
  running: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  success: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  failed: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  aborted: "bg-muted text-muted-foreground border-border/50",
};

function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  return (
    <Badge
      variant="outline"
      className={cn("whitespace-nowrap capitalize", STATUS_STYLES[key] ?? STATUS_STYLES.aborted)}
    >
      <OperationIndicator status={key} label={key} showLabel size={20} />
    </Badge>
  );
}

function formatDuration(run: Run): string {
  const ms =
    run.metadata?.durationMs ??
    (run.metadata?.completedAt && run.metadata?.startedAt
      ? new Date(run.metadata.completedAt).getTime() - new Date(run.metadata.startedAt).getTime()
      : undefined);

  if (ms === undefined || Number.isNaN(ms)) return "-";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  // Round to whole seconds first, then carry into minutes so we never render "Xm 60s"
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function formatTimestamp(iso?: string): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export default function RunsPage() {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to first page whenever filters change
  useEffect(() => {
    setPage(0);
  }, []);

  const { data, isLoading, isError, error, isFetching, refetch } = useRuns({
    page,
    pageSize: 25,
    search: debouncedSearch || undefined,
    status,
  });

  const runs = useMemo(() => data?.items ?? [], [data]);
  const hasMore = data?.hasMore ?? false;
  const selectRun = (run: Run) => {
    setSelectedRun(run);
    window.history.replaceState(null, "", `/runs?run=${encodeURIComponent(run.runId)}`);
  };
  const closeRun = () => {
    setSelectedRun(null);
    window.history.replaceState(null, "", "/runs");
  };

  return (
    <EnterprisePage
      eyebrow="Control plane"
      title="Runs"
      description="Review execution history, status, provenance, and result details without starting or changing a run."
      className="h-full overflow-hidden p-8"
    >
      <EnterpriseSummary
        items={[
          { label: "Visible runs", value: runs.length, detail: `Page ${page + 1}` },
          {
            label: "Running",
            value: runs.filter((run) => run.status.toLowerCase() === "running").length,
            detail: "Current page",
          },
          {
            label: "Failed",
            value: runs.filter((run) => run.status.toLowerCase() === "failed").length,
            detail: "Current page",
            tone: "warning",
          },
          {
            label: "Data status",
            value: isError ? "Unavailable" : "Available",
            detail: isError ? "Retry to recover" : "Read-only execution history",
            tone: isError ? "danger" : "success",
          },
        ]}
      />
      <div className="flex flex-shrink-0 items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          Select a run to inspect its execution details and payload.
        </p>
        <Freshness updatedAt="Live query" onRefresh={() => refetch()} loading={isFetching} />
      </div>

      <PageToolbar onRefresh={() => refetch()} refreshing={isFetching}>
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            aria-label="Search runs by ID, tool, or error"
            placeholder="Search by run ID, tool, or error..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]" aria-label="Filter runs by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-[170px]" aria-label="Filter runs by time range">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
          </SelectContent>
        </Select>
      </PageToolbar>

      <div className="flex-1 overflow-auto rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead className="w-[110px]">Status</TableHead>
              <TableHead>Tool</TableHead>
              <TableHead>Run ID</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Started At</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">
                <button
                  type="button"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  aria-label="Refresh runs"
                  className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-muted/50 disabled:opacity-50"
                  title="Refresh Runs"
                >
                  <RefreshCw
                    className={cn(
                      "h-3.5 w-3.5 text-muted-foreground",
                      isFetching && "animate-spin",
                    )}
                  />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Loader2 className="inline-block h-6 w-6 animate-spin text-foreground" />
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2 text-destructive">
                    <span>Failed to load runs</span>
                    <span className="text-muted-foreground text-xs">
                      {error instanceof Error ? error.message : "Please try again."}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                      Retry
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : runs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <span>No runs found</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              runs.map((run) => (
                <TableRow
                  key={run.runId}
                  className="cursor-pointer hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  role="button"
                  tabIndex={0}
                  aria-label={`View details for run ${run.runId}`}
                  onClick={() => selectRun(run)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      selectRun(run);
                    }
                  }}
                >
                  <TableCell>
                    <StatusBadge status={run.status} />
                  </TableCell>
                  <TableCell className="max-w-[220px] font-medium">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block truncate">{run.tool?.id || run.toolId}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{run.tool?.id || run.toolId}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <span className="block truncate font-mono text-muted-foreground text-xs">
                      {run.runId}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="whitespace-nowrap text-muted-foreground text-xs">
                      {run.requestSource || "-"}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                    {formatTimestamp(run.metadata?.startedAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                    {formatDuration(run)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex flex-shrink-0 items-center justify-end gap-2">
        <span className="mr-2 text-muted-foreground text-sm">Page {page + 1}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0 || isFetching}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasMore || isFetching}
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <RunDetailDrawer run={selectedRun} onClose={closeRun} />
    </EnterprisePage>
  );
}

function RunDetailDrawer({ run, onClose }: { run: Run | null; onClose: () => void }) {
  const metadata = (run?.metadata ?? {}) as Record<string, unknown>;
  const risk = typeof metadata.riskLevel === "string" ? metadata.riskLevel : "unknown";
  const scopes = Array.isArray(metadata.scopes)
    ? metadata.scopes.filter((scope): scope is string => typeof scope === "string")
    : [];
  const timeline: TimelineItem[] = [
    {
      title: "Request received",
      description: run?.requestSource || "Execution request",
      timestamp: formatTimestamp(metadata.startedAt as string | undefined),
      status: "complete",
    },
    {
      title: "Context and policy evaluated",
      description: "Durable policy evidence is shown when supplied by the runtime.",
      status: "policy_evaluated",
    },
    {
      title: "Tool invoked",
      description: run ? run.tool?.id || run.toolId : "",
      status: run?.status || "pending",
    },
    {
      title: "Provider response",
      description:
        typeof metadata.providerRequestId === "string"
          ? `Request ${metadata.providerRequestId}`
          : "Provider request ID not available",
      status: run?.status || "pending",
    },
    {
      title: "Verification and final result",
      description:
        run?.error || "Independent verification evidence is shown when supplied by the runtime.",
      status: run?.status || "pending",
    },
  ];

  return (
    <DetailDrawer
      open={!!run}
      onOpenChange={(open) => !open && onClose()}
      title={run ? run.tool?.id || run.toolId : "Run details"}
      description={run ? `Run ${run.runId}` : undefined}
    >
      {run && (
        <div className="space-y-6 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={run.status} />
            <RiskBadge risk={risk} />
          </div>
          <ExecutionProgress status={run.status} steps={timeline} />
          <dl className="grid grid-cols-[130px_1fr] gap-x-4 gap-y-2">
            <dt className="text-muted-foreground">Run ID</dt>
            <dd className="flex break-all font-mono text-xs">{run.runId}</dd>
            <dt className="text-muted-foreground">Source</dt>
            <dd>{run.requestSource || "Not recorded"}</dd>
            <dt className="text-muted-foreground">Initiating user</dt>
            <dd className="break-all">{run.userId || "Not recorded"}</dd>
            <dt className="text-muted-foreground">Started</dt>
            <dd>{formatTimestamp(metadata.startedAt as string | undefined)}</dd>
            <dt className="text-muted-foreground">Completed</dt>
            <dd>{formatTimestamp(metadata.completedAt as string | undefined)}</dd>
            <dt className="text-muted-foreground">Duration</dt>
            <dd>{formatDuration(run)}</dd>
            <dt className="text-muted-foreground">Approval</dt>
            <dd>
              {typeof metadata.approvalState === "string" ? metadata.approvalState : "Not recorded"}
            </dd>
            <dt className="text-muted-foreground">Cost</dt>
            <dd>
              {typeof metadata.cost === "string" || typeof metadata.cost === "number"
                ? String(metadata.cost)
                : "Not recorded"}
            </dd>
          </dl>
          <div>
            <p className="mb-2 font-medium">Granted scopes</p>
            <ScopeSummary scopes={scopes} />
          </div>
          {run.error && (
            <div>
              <div className="mb-1 text-muted-foreground">Failure and recovery</div>
              <pre className="whitespace-pre-wrap break-words rounded-md bg-destructive/10 p-3 text-destructive text-xs">
                {run.error}
              </pre>
            </div>
          )}
          {run.data != null && (
            <div>
              <div className="mb-1 text-muted-foreground">Result</div>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted/50 p-3 text-xs">
                {JSON.stringify(run.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </DetailDrawer>
  );
}
