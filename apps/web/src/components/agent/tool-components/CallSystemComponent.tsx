"use client";

import { inferProtocolFromUrl, type ToolCall } from "@ambios-ai/shared";
import { ChevronDown, Database, FolderOpen, Loader2, Terminal } from "lucide-react";
import { useEffect, useState } from "react";
import { JsonEditor } from "@/components/editors/JsonEditor";
import { CopyButton } from "@/components/tools/shared/CopyButton";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ToolMutation } from "@/lib/agent/agent-tools/tool-call-state";
import type { CallSystemAutoExecute } from "@/lib/agent/agent-types";
import { useAgentContext } from "../AgentContextProvider";
import { ToolCallPendingState } from "./ToolCallPendingState";
import { ToolCallWrapper } from "./ToolComponentWrapper";

const maskConnectionString = (url: string): string => {
  // If URL contains unresolved placeholders, show them cleanly with single angle brackets
  if (url.includes("<<") && url.includes(">>")) {
    return url.replace(/<<([^>]+)>>/g, "<$1>");
  }

  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = "****";
    }
    return parsed.toString();
  } catch {
    return url.replace(/:([^:@]+)@/, ":****@");
  }
};

interface CallSystemComponentProps {
  tool: ToolCall;
  onInputChange: (newInput: any) => void;
  onToolUpdate?: (toolCallId: string, updates: Partial<ToolCall>) => void;
  onToolMutation?: (toolCallId: string, mutation: ToolMutation) => void;
  sendAgentRequest?: (
    userMessage?: string,
    options?: {
      hiddenStarterMessage?: string;
      hideUserMessage?: boolean;
      resumeToolCallId?: string;
    },
  ) => Promise<void>;
  onAbortStream?: () => void;
}

export function CallSystemComponent({
  tool,
  onInputChange,
  onToolUpdate,
  onToolMutation,
  sendAgentRequest,
  onAbortStream,
}: CallSystemComponentProps) {
  const { getToolPolicy, setToolPolicy } = useAgentContext();
  const currentPolicy = (getToolPolicy("call_system")?.autoExecute ||
    "ask_every_time") as CallSystemAutoExecute;

  const handlePolicyChange = (value: CallSystemAutoExecute) => {
    setToolPolicy("call_system", { autoExecute: value });
  };

  const isAwaitingConfirmation = tool.status === "awaiting_confirmation";
  const [detailsExpanded, setDetailsExpanded] = useState(isAwaitingConfirmation);
  const [isExecuting, setIsExecuting] = useState(false);

  const url = tool.input?.url || "";
  const method = tool.input?.method || "GET";
  const headers = tool.input?.headers || {};
  const body = tool.input?.body;

  const protocol = inferProtocolFromUrl(url);

  let parsedBody: any = null;
  try {
    if (body) {
      parsedBody = JSON.parse(body);
    }
  } catch {
    parsedBody = body;
  }

  let output = null;
  let outputParseError = false;
  const outputRaw = tool.output ?? null;
  try {
    output = outputRaw ? (typeof outputRaw === "string" ? JSON.parse(outputRaw) : outputRaw) : null;
  } catch (e) {
    outputParseError = true;
    console.error("Failed to parse tool output:", e);
  }

  const isPending = tool.status === "pending";
  const isRunning = tool.status === "running";
  const isCompleted = tool.status === "completed";
  const isDeclined = tool.status === "declined";
  const hasError = output?.success === false && output?.error && !isDeclined;

  useEffect(() => {
    if (isCompleted || isDeclined) {
      setDetailsExpanded(false);
      setIsExecuting(false);
    }
  }, [isCompleted, isDeclined]);

  const generateCurlCommand = () => {
    let curl = `curl -X ${method}`;

    if (Object.keys(headers).length > 0) {
      Object.entries(headers).forEach(([key, value]) => {
        curl += ` \\\n  -H "${key}: ${value}"`;
      });
    }

    if (body) {
      const escapedBody = body.replace(/"/g, '\\"');
      curl += ` \\\n  -d "${escapedBody}"`;
    }

    curl += ` \\\n  "${url}"`;

    return curl;
  };

  const handleConfirm = () => {
    if (!sendAgentRequest) return;

    setIsExecuting(true);
    onToolUpdate?.(tool.id, { status: "running" });
    onToolMutation?.(tool.id, {
      confirmationState: "confirmed",
    });

    sendAgentRequest(undefined, {
      resumeToolCallId: tool.id,
    });
  };

  const handleCancel = () => {
    if (!sendAgentRequest) return;

    onToolUpdate?.(tool.id, { status: "declined" });
    onToolMutation?.(tool.id, {
      confirmationState: "declined",
    });

    sendAgentRequest(undefined, {
      resumeToolCallId: tool.id,
    });
  };

  const renderHttpHeader = () => (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={() => setDetailsExpanded(!detailsExpanded)}
        className="-m-1 mt-1 flex-shrink-0 rounded p-1 transition-colors hover:bg-muted"
        title={detailsExpanded ? "Hide curl command" : "Show curl command"}
      >
        {detailsExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Terminal className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="flex-shrink-0 font-medium font-mono text-sm">{method}</span>
          <span className="truncate font-mono text-muted-foreground text-sm">{url}</span>
        </div>
      </div>
    </div>
  );

  const renderPostgresHeader = () => {
    const query = parsedBody?.query || body || "";
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-muted-foreground text-xs">
            PostgreSQL
          </span>
        </div>
        <div className="relative rounded border border-border p-3">
          <div className="absolute top-1 right-1">
            <CopyButton text={query} />
          </div>
          <pre className="whitespace-pre-wrap break-words pr-6 font-mono text-foreground text-sm">
            {query}
          </pre>
        </div>
      </div>
    );
  };

  const renderMssqlHeader = () => {
    const query = parsedBody?.query || body || "";
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-muted-foreground text-xs">
            Microsoft SQL Server
          </span>
        </div>
        <div className="relative rounded border border-border p-3">
          <div className="absolute top-1 right-1">
            <CopyButton text={query} />
          </div>
          <pre className="whitespace-pre-wrap break-words pr-6 font-mono text-foreground text-sm">
            {query}
          </pre>
        </div>
      </div>
    );
  };

  const renderSftpHeader = () => {
    const operation = parsedBody?.operation || "unknown";
    const path = parsedBody?.path || "";
    return (
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => setDetailsExpanded(!detailsExpanded)}
          className="-m-1 mt-1 flex-shrink-0 rounded p-1 transition-colors hover:bg-muted"
          title={detailsExpanded ? "Hide details" : "Show details"}
        >
          {detailsExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-muted-foreground text-xs">
              SFTP
            </span>
            <span className="font-medium text-muted-foreground text-xs uppercase">{operation}</span>
          </div>
          {path && <pre className="truncate font-mono text-foreground text-sm">{path}</pre>}
        </div>
      </div>
    );
  };

  const renderSmbHeader = () => {
    const operation = parsedBody?.operation || "unknown";
    const path = parsedBody?.path || "";
    return (
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => setDetailsExpanded(!detailsExpanded)}
          className="-m-1 mt-1 flex-shrink-0 rounded p-1 transition-colors hover:bg-muted"
          title={detailsExpanded ? "Hide details" : "Show details"}
        >
          {detailsExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-muted-foreground text-xs">
              SMB
            </span>
            <span className="font-medium text-muted-foreground text-xs uppercase">{operation}</span>
          </div>
          {path && <pre className="truncate font-mono text-foreground text-sm">{path}</pre>}
        </div>
      </div>
    );
  };

  const renderHttpDetails = () => (
    <div className="space-y-2 rounded-md bg-muted/50 p-3">
      <div className="flex items-center justify-between">
        <div className="font-medium text-sm">cURL Command</div>
      </div>
      <div className="relative rounded border border-border bg-background p-3">
        <div className="absolute top-1 right-1">
          <CopyButton getData={generateCurlCommand} />
        </div>
        <pre className="max-h-64 overflow-x-auto whitespace-pre pr-6 font-mono text-xs">
          {generateCurlCommand()}
        </pre>
      </div>
    </div>
  );

  const renderSftpDetails = () => {
    const operation = parsedBody?.operation || "unknown";
    const path = parsedBody?.path || "";
    const content = parsedBody?.content;
    return (
      <div className="space-y-2 rounded-md bg-muted/50 p-3">
        <div className="flex items-center justify-between">
          <div className="font-medium text-sm">SFTP Operation</div>
          <CopyButton getData={() => JSON.stringify(parsedBody, null, 2)} />
        </div>
        <div className="space-y-1 text-xs">
          <div>
            <span className="text-muted-foreground">Operation:</span>{" "}
            <span className="font-medium font-mono uppercase">{operation}</span>
          </div>
          {path && (
            <div>
              <span className="text-muted-foreground">Path:</span>{" "}
              <span className="font-mono">{path}</span>
            </div>
          )}
          {content && (
            <div>
              <span className="text-muted-foreground">Content:</span>
              <pre className="mt-1 max-h-32 overflow-x-auto whitespace-pre rounded border border-border bg-background p-2 font-mono text-xs">
                {typeof content === "string" ? content : JSON.stringify(content, null, 2)}
              </pre>
            </div>
          )}
        </div>
        <div className="text-muted-foreground text-xs">Connection: {maskConnectionString(url)}</div>
      </div>
    );
  };

  const renderSmbDetails = () => {
    const operation = parsedBody?.operation || "unknown";
    const path = parsedBody?.path || "";
    const content = parsedBody?.content;
    return (
      <div className="space-y-2 rounded-md bg-muted/50 p-3">
        <div className="flex items-center justify-between">
          <div className="font-medium text-sm">SMB Operation</div>
          <CopyButton getData={() => JSON.stringify(parsedBody, null, 2)} />
        </div>
        <div className="space-y-1 text-xs">
          <div>
            <span className="text-muted-foreground">Operation:</span>{" "}
            <span className="font-medium font-mono uppercase">{operation}</span>
          </div>
          {path && (
            <div>
              <span className="text-muted-foreground">Path:</span>{" "}
              <span className="font-mono">{path}</span>
            </div>
          )}
          {content && (
            <div>
              <span className="text-muted-foreground">Content:</span>
              <pre className="mt-1 max-h-32 overflow-x-auto whitespace-pre rounded border border-border bg-background p-2 font-mono text-xs">
                {typeof content === "string" ? content : JSON.stringify(content, null, 2)}
              </pre>
            </div>
          )}
        </div>
        <div className="text-muted-foreground text-xs">Connection: {maskConnectionString(url)}</div>
      </div>
    );
  };

  const renderRedisHeader = () => {
    const command = parsedBody?.command || (Array.isArray(parsedBody) ? "PIPELINE" : "");
    const args = parsedBody?.args || [];
    const commandCount = Array.isArray(parsedBody) ? parsedBody.length : 0;
    return (
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => setDetailsExpanded(!detailsExpanded)}
          className="-m-1 mt-1 flex-shrink-0 rounded p-1 transition-colors hover:bg-muted"
          title={detailsExpanded ? "Hide details" : "Show details"}
        >
          {detailsExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Database className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-muted-foreground text-xs">
              Redis
            </span>
            <span className="font-medium text-muted-foreground text-xs uppercase">{command}</span>
            {commandCount > 0 && (
              <span className="text-muted-foreground text-xs">({commandCount} commands)</span>
            )}
          </div>
          {!Array.isArray(parsedBody) && args.length > 0 && (
            <pre className="truncate font-mono text-foreground text-sm">
              {args.map((a: any) => String(a)).join(" ")}
            </pre>
          )}
        </div>
      </div>
    );
  };

  const renderRedisDetails = () => {
    const commands = Array.isArray(parsedBody) ? parsedBody : [parsedBody];
    return (
      <div className="space-y-2 rounded-md bg-muted/50 p-3">
        <div className="flex items-center justify-between">
          <div className="font-medium text-sm">
            {commands.length > 1 ? `Redis Pipeline (${commands.length} commands)` : "Redis Command"}
          </div>
          <CopyButton getData={() => JSON.stringify(parsedBody, null, 2)} />
        </div>
        <div className="space-y-1.5 text-xs">
          {commands.map((cmd: any) => (
            <div key={String(cmd?.command)} className="font-mono">
              <span className="font-medium">{cmd?.command}</span>
              {cmd?.args?.length > 0 && (
                <span className="text-muted-foreground">
                  {" "}
                  {cmd.args.map((a: any) => String(a)).join(" ")}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="text-muted-foreground text-xs">Connection: {maskConnectionString(url)}</div>
      </div>
    );
  };

  const renderDataResponse = () => {
    let data = output?.data;
    if (
      (data === undefined || data === null) &&
      outputParseError &&
      typeof outputRaw === "string"
    ) {
      data = outputRaw;
    }
    if (data === undefined || data === null) return null;

    if (typeof data === "object" && "data" in data && !Array.isArray(data)) {
      data = data.data;
    }

    const tryParseJson = (value: string): any | null => {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    };

    const normalizeDisplayData = (value: any): { data: any; isJson: boolean } => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const hasTruncation = value._truncated === true;
        const preview = typeof value.preview === "string" ? value.preview : null;
        if (hasTruncation && preview) {
          const parsedPreview = tryParseJson(preview);
          return parsedPreview
            ? { data: parsedPreview, isJson: true }
            : { data: preview, isJson: false };
        }

        const cleaned = { ...value };
        if ("_note" in cleaned) delete cleaned._note;
        if ("_truncated" in cleaned) delete cleaned._truncated;
        if ("preview" in cleaned && preview) delete cleaned.preview;
        return { data: cleaned, isJson: true };
      }

      if (typeof value === "string") {
        const cleaned = value
          .replace(/\n\n\[Truncated from .* chars\]$/u, "")
          .replace(/\n\n\.\.\. \[Output truncated - result too large\]$/u, "")
          .replace(/\n\n\.\.\. \[Data truncated - exceeds size limit\]$/u, "")
          .replace(/\n\n\.\.\. \[Truncated - too many lines\]$/u, "");
        const parsed = tryParseJson(cleaned);
        return parsed ? { data: parsed, isJson: true } : { data: cleaned, isJson: false };
      }

      return { data: value, isJson: typeof value === "object" };
    };

    const normalized = normalizeDisplayData(data);
    const dataStr =
      typeof normalized.data === "string"
        ? normalized.data
        : JSON.stringify(normalized.data, null, 2);

    const lineCount = dataStr.split("\n").length;
    const estimatedHeight = Math.min(360, Math.max(80, lineCount * 18 + 24));

    return (
      <div className="space-y-2">
        <div className="font-medium text-sm">
          {protocol === "postgres" || protocol === "mssql"
            ? "Query Results"
            : protocol === "redis"
              ? "Command Results"
              : "Response Data"}
        </div>
        {normalized.isJson ? (
          <JsonEditor
            value={dataStr}
            readOnly
            maxHeight={`${estimatedHeight}px`}
            overlayPlacement="corner"
            tableEnabled
            defaultView="table"
          />
        ) : (
          <div className="relative rounded border border-border p-3">
            <div className="absolute top-1 right-1">
              <CopyButton text={dataStr} />
            </div>
            <pre className="max-h-[360px] overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words pr-6 font-mono text-xs">
              {dataStr}
            </pre>
          </div>
        )}
      </div>
    );
  };

  const _getWarningMessage = () => {
    if (protocol === "http") {
      return `This ${method} request may modify data. Review carefully before confirming.`;
    }
    if (protocol === "postgres" || protocol === "mssql") {
      return "This database query will be executed. Review carefully before confirming.";
    }
    if (protocol === "redis") {
      return "This Redis command will be executed. Review carefully before confirming.";
    }
    return "This file operation will be executed. Review carefully before confirming.";
  };

  const getRunningMessage = () => {
    if (protocol === "http") return "Executing request...";
    if (protocol === "postgres" || protocol === "mssql") return "Executing query...";
    if (protocol === "redis") return "Executing command...";
    return "Executing operation...";
  };

  return (
    <ToolCallWrapper tool={tool} openByDefault={!isDeclined}>
      <div className="space-y-3">
        {isPending && <ToolCallPendingState icon={Terminal} label="Calling system..." />}

        {!isPending && protocol === "http" && renderHttpHeader()}
        {!isPending && protocol === "postgres" && renderPostgresHeader()}
        {!isPending && protocol === "mssql" && renderMssqlHeader()}
        {!isPending && protocol === "redis" && renderRedisHeader()}
        {!isPending && protocol === "sftp" && renderSftpHeader()}
        {!isPending && protocol === "smb" && renderSmbHeader()}

        {detailsExpanded && protocol === "http" && renderHttpDetails()}
        {detailsExpanded && protocol === "redis" && renderRedisDetails()}
        {detailsExpanded && protocol === "sftp" && renderSftpDetails()}
        {detailsExpanded && protocol === "smb" && renderSmbDetails()}

        {isAwaitingConfirmation && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="glass"
                className="!bg-[#ffa500] hover:!bg-[#ffd700] dark:!bg-[#ffa500] dark:hover:!bg-[#ffd700] !text-black !border-amber-400/50 dark:!border-amber-500/50 font-semibold"
                onClick={handleConfirm}
                disabled={isExecuting}
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  "Confirm"
                )}
              </Button>
              <Button size="sm" variant="glass" onClick={handleCancel} disabled={isExecuting}>
                Cancel
              </Button>
              <Select value={currentPolicy} onValueChange={handlePolicyChange}>
                <SelectTrigger className="h-8 w-[140px] border-border/50 bg-gradient-to-br from-muted/50 to-muted/30 text-muted-foreground text-xs shadow-sm backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ask_every_time">Ask every time</SelectItem>
                  <SelectItem value="run_gets_only">Run reads only</SelectItem>
                  <SelectItem value="run_everything">Run everything</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {isRunning && (
          <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{getRunningMessage()}</span>
          </div>
        )}

        {isDeclined && (
          <div className="rounded-md bg-muted/50 p-3">
            <div className="text-muted-foreground text-sm">Request declined by user</div>
          </div>
        )}

        {isCompleted && hasError && (
          <ErrorMessage
            title={
              protocol === "http"
                ? "Request returned an error"
                : protocol === "postgres" || protocol === "mssql"
                  ? "Query returned an error"
                  : protocol === "redis"
                    ? "Command returned an error"
                    : "Operation returned an error"
            }
            message={
              typeof output.error === "string"
                ? output.error
                : JSON.stringify(output.error, null, 2)
            }
          />
        )}

        {isCompleted && !hasError && output && renderDataResponse()}

        {isCompleted && (
          <div className="mt-3 flex items-center justify-end border-border/50 border-t pt-2">
            <Select value={currentPolicy} onValueChange={handlePolicyChange}>
              <SelectTrigger className="h-7 w-[140px] border-border/50 bg-gradient-to-br from-muted/50 to-muted/30 text-muted-foreground text-xs shadow-sm backdrop-blur-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ask_every_time">Ask every time</SelectItem>
                <SelectItem value="run_gets_only">Run reads only</SelectItem>
                <SelectItem value="run_everything">Run everything</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {tool.error && (
          <ErrorMessage
            message={
              typeof tool.error === "string" ? tool.error : JSON.stringify(tool.error, null, 2)
            }
          />
        )}
      </div>
    </ToolCallWrapper>
  );
}
