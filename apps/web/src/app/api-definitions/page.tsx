"use client";

import { operationPath, operations } from "@ambios-ai/shared";
import { Code2 } from "lucide-react";
import Link from "next/link";
import {
  EnterprisePage,
  EnterpriseState,
  EnterpriseSummary,
} from "@/components/ui/enterprise-page";

const capabilities = [
  ["Health", "getHealth", "Read-only runtime status"],
  ["Workspace", "getWorkspace", "Authenticated workspace context"],
  ["Readiness", "getReadiness", "Binding and provider readiness"],
  ["Actions", "listActions", "Persisted action/audit records"],
  ["MCP", "mcp", "OAuth 2.1 + PKCE protected Streamable HTTP transport"],
] as const;

export default function ApiDefinitionsPage() {
  return (
    <EnterprisePage
      eyebrow="Govern"
      title="API definitions"
      description="The contract registry makes executable surfaces, lifecycle state, authentication, and compatibility risk explicit."
      actions={
        <Link
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 font-medium text-primary-foreground text-sm"
          href="/docs"
        >
          <Code2 className="size-4" aria-hidden="true" /> Read contract guide
        </Link>
      }
    >
      <EnterpriseSummary
        items={[
          {
            label: "Published contracts",
            value: capabilities.length,
            detail: "Mounted in this environment",
            tone: "success",
          },
          { label: "Lifecycle review", value: "Required", detail: "Changes need evidence" },
          {
            label: "Breaking changes",
            value: "Unknown",
            detail: "Run compatibility checks",
            tone: "warning",
          },
          { label: "Transport", value: "MCP + HTTP", detail: "Protected by auth policy" },
        ]}
      />
      <EnterpriseState
        title="Contract catalog"
        description="The deployed contract is authoritative. Unsupported operations return structured responses and are never presented as provider execution."
      />
      <div className="overflow-hidden rounded-xl border">
        <div className="grid grid-cols-[1fr_1.4fr_2fr] gap-4 border-b bg-muted/30 px-4 py-3 font-medium text-sm">
          <span>Capability</span>
          <span>Route</span>
          <span>Purpose</span>
        </div>
        {capabilities.map(([name, operationId, purpose]) => (
          <div
            key={operationId}
            className="grid grid-cols-[1fr_1.4fr_2fr] gap-4 border-b px-4 py-3 text-sm last:border-0"
          >
            <span>{name}</span>
            <code>
              {operations[operationId].method} {operationPath(operationId)}
            </code>
            <span className="text-muted-foreground">{purpose}</span>
          </div>
        ))}
      </div>
      <Link className="text-primary text-sm underline" href="/docs">
        Read the operator documentation
      </Link>
    </EnterprisePage>
  );
}
