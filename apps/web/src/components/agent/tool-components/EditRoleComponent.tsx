"use client";

import type { ToolCall } from "@ambios-ai/shared";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ToolCallWrapper } from "./ToolComponentWrapper";

function parseOutput(tool: ToolCall) {
  if (!tool.output) return null;
  try {
    return typeof tool.output === "string" ? JSON.parse(tool.output) : tool.output;
  } catch {
    return null;
  }
}

interface EditRoleComponentProps {
  tool: ToolCall;
}

export function EditRoleComponent({ tool }: EditRoleComponentProps) {
  const output = parseOutput(tool);
  const explanation = output?.explanation || tool.input?.explanation;
  const isError = tool.status === "error" || output?.success === false;

  return (
    <ToolCallWrapper tool={tool}>
      <div className="space-y-2">
        {explanation && <p className="text-muted-foreground text-xs">{explanation}</p>}
        {isError && output?.error && <p className="text-red-500/80 text-xs">{output.error}</p>}
        {!isError && tool.status === "completed" && (
          <Badge variant="glass" className="gap-1 font-normal text-xs">
            <Check className="h-3 w-3 text-foreground/50" /> Applied to draft
          </Badge>
        )}
        {tool.status === "error" && (
          <Badge variant="glass" className="gap-1 font-normal text-xs">
            <X className="h-3 w-3 text-foreground/50" /> Failed
          </Badge>
        )}
      </div>
    </ToolCallWrapper>
  );
}
