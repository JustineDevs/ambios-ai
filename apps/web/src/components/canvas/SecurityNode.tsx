"use client";

import { ShieldAlert } from "lucide-react";
import { Handle, type NodeProps, Position } from "reactflow";
import { OperationIndicator } from "@/components/ui/operation-indicator";
import type { CanvasNodeData } from "@/lib/canvas/types";
import { SecurityDashboard } from "./SecurityDashboard";

export function SecurityNode({ data }: NodeProps<CanvasNodeData>) {
  if (!data.securityVendor) return null;
  return (
    <article className="min-w-56 rounded-xl border bg-card p-3 text-card-foreground shadow-sm">
      <Handle type="target" position={Position.Top} className="!size-2" />
      <div className="flex items-start gap-2">
        <ShieldAlert className="mt-0.5 size-4" aria-hidden="true" />
        <div>
          <p className="font-medium">{data.label}</p>
          <p className="text-muted-foreground text-xs">
            <OperationIndicator
              status={data.status ?? "ready"}
              label={data.status ?? "ready"}
              showLabel
              size={20}
            />
            {data.severity ? `${data.severity} severity` : "Security control"}
            {typeof data.riskScore === "number" ? ` · risk ${data.riskScore}` : ""}
          </p>
        </div>
      </div>
      <SecurityDashboard
        vendor={data.securityVendor}
        data={{
          status: data.status ?? "ready",
          description: data.description ?? "",
          permissions: data.permissions ?? [],
        }}
      />
      <Handle type="source" position={Position.Bottom} className="!size-2" />
    </article>
  );
}
