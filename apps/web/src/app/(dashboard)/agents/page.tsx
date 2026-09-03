"use client";

import { useEffect, useState } from "react";
import {
  EnterprisePage,
  EnterpriseState,
  EnterpriseSummary,
} from "@/components/ui/enterprise-page";
import { requestOperation } from "@/lib/api-client";

type Workspace = { agent: { id: string; name: string; status: string } | null };

export default function AgentsPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    requestOperation("getWorkspace")
      .then(async (response) => {
        const payload = (await response.json()) as { error?: string; data?: Workspace };
        if (!response.ok) throw new Error(payload.error ?? "Workspace is unavailable.");
        return payload;
      })
      .then((payload) => {
        setWorkspace(payload.data ?? null);
      })
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setLoading(false));
  }, []);

  const agent = workspace?.agent;
  return (
    <EnterprisePage
      eyebrow="Build"
      title="Agents"
      description="Manage governed agents, their model configuration, allowed capabilities, and review policy."
    >
      <EnterpriseSummary
        items={[
          {
            label: "Active agents",
            value: loading ? "—" : agent ? 1 : 0,
            detail: loading
              ? "Reading workspace"
              : agent
                ? "Workspace agent configured"
                : "Configuration required",
            tone: error ? "danger" : agent ? "success" : "warning",
          },
          {
            label: "Execution policy",
            value: "Approval-gated",
            detail: "Sensitive actions require review",
          },
          {
            label: "Model",
            value: agent ? "Configured" : "Not configured",
            detail: "Resolved by workspace readiness",
          },
          {
            label: "Audit",
            value: "Enabled",
            detail: "Runs and decisions are recorded",
            tone: "success",
          },
        ]}
      />
      {error && (
        <EnterpriseState
          tone="danger"
          title="Agent configuration unavailable"
          description={error}
        />
      )}
      <div className="rounded-xl border p-5">
        {loading ? (
          <EnterpriseState
            loading
            title="Loading agent configuration"
            description="Reading the workspace agent and its governance state."
          />
        ) : agent ? (
          <>
            <p className="font-medium">{agent.name}</p>
            <p className="mt-2 text-emerald-600 text-sm">
              {agent.status} · {agent.id}
            </p>
            <p className="mt-4 text-muted-foreground text-sm">
              Agents propose reviewable actions. Human approval is required before sensitive
              execution.
            </p>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            No agent is configured for this workspace.
          </p>
        )}
      </div>
    </EnterprisePage>
  );
}
