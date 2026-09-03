"use client";

import { ExternalLink } from "lucide-react";
import { Handle, type NodeProps, Position } from "reactflow";
import { OperationIndicator } from "@/components/ui/operation-indicator";
import type { CanvasNodeData } from "@/lib/canvas/types";
import { VendorEmbed } from "./VendorEmbed";

export function CanvasNode({ data, type }: NodeProps<CanvasNodeData>) {
  return (
    <article className="min-w-52 rounded-xl border bg-card p-3 text-card-foreground shadow-sm">
      <Handle type="target" position={Position.Top} className="!size-2" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {type}
          </p>
          <h3 className="font-medium">{data.label}</h3>
        </div>
        {data.status && (
          <span className="text-muted-foreground text-xs" data-state={data.status}>
            <OperationIndicator
              status={data.status}
              label={data.status}
              showLabel={false}
              size={20}
            />
          </span>
        )}
      </div>
      {data.description && <p className="mt-2 text-muted-foreground text-xs">{data.description}</p>}
      {data.vendor && data.resourceId && (
        <details className="mt-3 rounded-lg border p-2 text-xs">
          <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
            Linked {data.vendor} resource <ExternalLink className="size-3" aria-hidden="true" />
          </summary>
          <VendorEmbed vendor={data.vendor} resourceId={data.resourceId} />
        </details>
      )}
      <Handle type="source" position={Position.Bottom} className="!size-2" />
    </article>
  );
}
