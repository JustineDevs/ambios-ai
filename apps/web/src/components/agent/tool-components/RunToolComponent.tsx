"use client";

import type { Tool, ToolCall } from "@ambios-ai/shared";
import { FilePlay, Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { JsonEditor } from "@/components/editors/JsonEditor";
import { ErrorMessage } from "@/components/ui/error-message";
import { ToolCallPendingState } from "./ToolCallPendingState";
import { ToolCallToolDisplay } from "./ToolComponentDisplay";
import { ToolCallWrapper } from "./ToolComponentWrapper";
import { TruncatableInstruction } from "./TruncatableInstruction";

interface RunToolComponentProps {
  tool: ToolCall;
  isPlayground?: boolean;
}

function toolFromSummary(summary: any): Partial<Tool> {
  return {
    id: summary.id,
    outputTransform: summary.hasOutputTransform ? "true" : undefined,
    steps: (summary.steps || []).map((s: any) => ({
      id: s.id,
      config: { type: s.type, ...(s.systemId ? { systemId: s.systemId } : {}) },
    })),
  };
}

export function RunToolComponent({ tool }: RunToolComponentProps) {
  const [currentConfig, setCurrentConfig] = useState<Tool | null>(null);

  const displayInstruction = tool.input?.instruction;

  const parsedOutput = useMemo(() => {
    if (!tool.output) return null;
    try {
      return typeof tool.output === "string" ? JSON.parse(tool.output) : tool.output;
    } catch {
      return null;
    }
  }, [tool.output]);

  const isSuccess = parsedOutput?.success === true;
  const isToolRunning = tool.status === "running";
  const isToolPending = tool.status === "pending";

  useEffect(() => {
    if (parsedOutput?.config && (tool.status === "completed" || tool.status === "error")) {
      setCurrentConfig(parsedOutput.config);
    }
  }, [parsedOutput, tool.status]);

  const displayTool =
    currentConfig ?? (parsedOutput?.toolSummary ? toolFromSummary(parsedOutput.toolSummary) : null);

  const resultData = parsedOutput?.data;
  const resultDisplayHeight = useMemo(() => {
    if (!resultData) return "150px";
    const json = JSON.stringify(resultData, null, 2);
    return `${Math.min(Math.max(json.split("\n").length * 18 + 24, 60), 200)}px`;
  }, [resultData]);

  return (
    <ToolCallWrapper tool={tool} openByDefault={true} hideStatusIcon={isToolPending}>
      <div className="space-y-4">
        {isToolPending && (
          <ToolCallPendingState icon={Play} label="Running tool...">
            {tool.input && (
              <pre className="overflow-hidden whitespace-pre-wrap font-mono text-muted-foreground/60 text-xs">
                {JSON.stringify(tool.input, null, 2)}
              </pre>
            )}
          </ToolCallPendingState>
        )}

        {isToolRunning && (
          <ToolCallPendingState icon={Play} label="Running tool...">
            {displayInstruction && (
              <TruncatableInstruction
                text={displayInstruction}
                className="text-muted-foreground/70 text-sm"
              />
            )}
          </ToolCallPendingState>
        )}

        {tool.status === "completed" && isSuccess && (
          <>
            {displayTool && (
              <ToolCallToolDisplay
                toolId={displayTool.id}
                tool={displayTool as Tool}
                payload={tool.input?.payload}
                showOutput={false}
                showToolSteps={true}
                showPayload={true}
              />
            )}

            {resultData && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <FilePlay className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Tool Output</span>
                </div>
                <JsonEditor
                  value={JSON.stringify(resultData, null, 2)}
                  readOnly
                  maxHeight={resultDisplayHeight}
                  tableEnabled
                  defaultView="table"
                />
              </div>
            )}
          </>
        )}

        {(tool.status === "error" || (tool.status === "completed" && !isSuccess)) && (
          <div className="space-y-3">
            {displayTool && (
              <ToolCallToolDisplay
                toolId={displayTool.id}
                tool={displayTool as Tool}
                payload={tool.input?.payload}
                error={parsedOutput?.error || tool.error}
                showOutput={false}
                showToolSteps={true}
                showPayload={true}
              />
            )}
            {!displayTool && (parsedOutput?.error || tool.error) && (
              <ErrorMessage
                title="Execution failed"
                message={
                  typeof (parsedOutput?.error || tool.error) === "string"
                    ? parsedOutput?.error || tool.error
                    : JSON.stringify(parsedOutput?.error || tool.error, null, 2)
                }
              />
            )}
            {parsedOutput?.inputSchema?.required && (
              <div className="rounded border border-border/50 bg-muted/50 p-3">
                <div className="mb-2 font-medium text-muted-foreground text-xs">
                  Required Inputs:
                </div>
                <div className="space-y-1">
                  {parsedOutput.inputSchema.required.map((field: string) => (
                    <div key={field} className="text-muted-foreground text-xs">
                      • <span className="font-mono">{field}</span>
                      {parsedOutput.inputSchema.properties?.[field]?.description && (
                        <span className="text-muted-foreground/70">
                          {" — "}
                          {parsedOutput.inputSchema.properties[field].description}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolCallWrapper>
  );
}
