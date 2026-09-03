"use client";

import type { ToolCall } from "@ambios-ai/shared";
import { AlertCircle, BookOpen, FileText, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { ErrorMessage } from "@/components/ui/error-message";
import { useSystems } from "@/queries/systems";
import { ToolCallWrapper } from "./ToolComponentWrapper";

interface SearchDocumentationComponentProps {
  tool: ToolCall;
  onInputChange: (newInput: any) => void;
}

export function SearchDocumentationComponent({
  tool,
  onInputChange,
}: SearchDocumentationComponentProps) {
  const { systems } = useSystems();
  const isLoading = tool.status === "pending" || tool.status === "running";
  const keywords = tool.input?.keywords || "";
  const systemId = tool.input?.systemId || "";
  const systemName = useMemo(() => {
    const sys = systemId ? systems.find((s) => s.id === systemId) : null;
    return sys?.name || systemId;
  }, [systems, systemId]);

  const output = typeof tool.output === "string" ? JSON.parse(tool.output) : tool.output;
  const hasNoDocumentation = output?.noDocumentation || false;
  const hasNoResults = output?.noResults || false;
  const message = output?.message || "";

  return (
    <ToolCallWrapper tool={tool}>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex-shrink-0">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm">
              <span className="text-muted-foreground">System:</span>{" "}
              <span className="font-mono text-xs">{systemName}</span>
            </div>
            <div className="mt-1 text-sm">
              <span className="text-muted-foreground">Keywords:</span>{" "}
              <span className="font-medium">{keywords}</span>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Searching documentation...</span>
          </div>
        )}

        {tool.status === "completed" && hasNoDocumentation && (
          <div className="space-y-2 rounded-md border border-amber-500/20 bg-amber-500/10 p-3">
            <div className="flex items-start gap-2">
              <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-amber-900 text-sm dark:text-amber-100">
                  No Documentation Available
                </div>
                <div className="mt-1 whitespace-pre-line text-amber-800 text-xs dark:text-amber-200">
                  {message}
                </div>
              </div>
            </div>
          </div>
        )}

        {tool.status === "completed" && hasNoResults && !hasNoDocumentation && (
          <div className="space-y-2 rounded-md bg-muted/50 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm">No Results Found</div>
                <div className="mt-1 text-muted-foreground text-xs">{message}</div>
              </div>
            </div>
          </div>
        )}

        {tool.error && !hasNoDocumentation && (
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
