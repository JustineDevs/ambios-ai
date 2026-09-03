"use client";

import type { ToolCall } from "@ambios-ai/shared";
import { Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { copyToClipboard } from "@/components/tools/shared/CopyButton";
import { ErrorMessage } from "@/components/ui/error-message";
import { ToolCallWrapper } from "./ToolComponentWrapper";

interface DefaultComponentProps {
  tool: ToolCall;
  onInputChange: (newInput: any) => void;
}

export function DefaultComponent({ tool, onInputChange }: DefaultComponentProps) {
  const [activeTab, setActiveTab] = useState<"input" | "output">("input");

  // Set initial active tab and update when tool status changes
  useEffect(() => {
    if ((tool.status === "completed" || tool.status === "error") && tool.output) {
      setActiveTab("output");
    } else if (tool.input && activeTab !== "input" && activeTab !== "output") {
      setActiveTab("input");
    }
  }, [tool.status, tool.output, tool.input, activeTab]);

  return (
    <ToolCallWrapper tool={tool}>
      <div className="space-y-4">
        {(tool.input || tool.output) && (
          <div>
            <div className="mb-3 flex border-border border-b">
              {tool.input && (
                <button
                  type="button"
                  className={`relative -mb-[2px] border-b-2 px-3 py-2 font-medium text-sm transition-colors ${
                    activeTab === "input"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                  }`}
                  onClick={() => setActiveTab("input")}
                >
                  Input
                </button>
              )}
              {tool.output && (
                <button
                  type="button"
                  className={`relative -mb-[2px] border-b-2 px-3 py-2 font-medium text-sm transition-colors ${
                    activeTab === "output"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                  }`}
                  onClick={() => setActiveTab("output")}
                >
                  Output
                </button>
              )}
            </div>

            {activeTab === "input" && tool.input && (
              <div className="relative rounded-md bg-muted/50 p-3">
                <button
                  type="button"
                  onClick={() => copyToClipboard(JSON.stringify(tool.input, null, 2))}
                  className="absolute top-2 right-8 rounded p-1 text-muted-foreground transition-colors hover:bg-muted-foreground/20 hover:text-foreground"
                  title="Copy input"
                >
                  <Copy className="h-5 w-5" />
                </button>
                <pre className="max-h-64 overflow-x-auto whitespace-pre-wrap pr-8 font-mono text-xs">
                  {JSON.stringify(tool.input, null, 2)}
                </pre>
              </div>
            )}

            {activeTab === "output" && tool.output && (
              <div className="relative rounded-md bg-muted/50 p-3">
                <button
                  type="button"
                  onClick={() => {
                    const outputText = (() => {
                      if (typeof tool.output === "string") {
                        try {
                          const parsed = JSON.parse(tool.output);
                          return JSON.stringify(parsed, null, 2);
                        } catch {
                          return tool.output;
                        }
                      }
                      return JSON.stringify(tool.output, null, 2);
                    })();
                    copyToClipboard(outputText);
                  }}
                  className="absolute top-2 right-8 rounded p-1 text-muted-foreground transition-colors hover:bg-muted-foreground/20 hover:text-foreground"
                  title="Copy output"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <pre className="max-h-64 overflow-x-auto pr-8 font-mono text-xs">
                  {(() => {
                    // If output is a string, try to parse and prettify JSON
                    if (typeof tool.output === "string") {
                      try {
                        const parsed = JSON.parse(tool.output);
                        return JSON.stringify(parsed, null, 2);
                      } catch {
                        // Not JSON, return as-is
                        return tool.output;
                      }
                    }
                    // If output is an object, stringify it
                    return JSON.stringify(tool.output, null, 2);
                  })()}
                </pre>
              </div>
            )}
          </div>
        )}

        {tool.error && (
          <ErrorMessage
            title="Found Issue"
            message={
              typeof tool.error === "string" ? tool.error : JSON.stringify(tool.error, null, 2)
            }
          />
        )}
      </div>
    </ToolCallWrapper>
  );
}
