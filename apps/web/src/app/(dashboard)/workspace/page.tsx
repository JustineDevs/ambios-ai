"use client";

import { useEffect, useState } from "react";
import {
  EnterprisePage,
  EnterpriseState,
  EnterpriseSummary,
} from "@/components/ui/enterprise-page";
import { requestOperation } from "@/lib/api-client";

type Workspace = {
  organization?: { name: string };
  agent?: { name: string } | null;
};

export default function WorkspacePage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = () => {
    setLoading(true);
    setError(null);
    void requestOperation("getWorkspace")
      .then(async (response) => {
        const payload = (await response.json()) as { data?: Workspace; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Workspace is unavailable.");
        setWorkspace(payload.data ?? null);
      })
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);
  return (
    <EnterprisePage
      eyebrow="Manage"
      title="AmbiOS workspace"
      description="Inspect the organization, active agent, operating context, and readiness that govern this workspace."
    >
      <EnterpriseSummary
        items={[
          {
            label: "Organization",
            value: loading ? "Loading…" : (workspace?.organization?.name ?? "Not selected"),
            detail: "Shared operating context",
          },
          {
            label: "Active agent",
            value: loading ? "Loading…" : (workspace?.agent?.name ?? "None"),
            detail: workspace?.agent ? "Agent configured" : "Setup required",
            tone: workspace?.agent ? "success" : "warning",
          },
          {
            label: "Access",
            value: error ? "Unavailable" : "Authenticated",
            detail: error ? "Retry workspace read" : "Workspace context",
          },
          {
            label: "Governance",
            value: "Enabled",
            detail: "Policies apply to actions",
            tone: "success",
          },
        ]}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {error && (
          <div className="sm:col-span-2">
            <EnterpriseState
              tone="danger"
              title="Workspace unavailable"
              description={error}
              action={
                <button className="font-medium underline" type="button" onClick={load}>
                  Retry workspace
                </button>
              }
            />
          </div>
        )}
        <div className="rounded-xl border p-5">
          <p className="text-muted-foreground text-sm">Organization</p>
          <h2 className="mt-2 font-medium text-xl">
            {loading
              ? "Loading workspace…"
              : (workspace?.organization?.name ?? "No workspace selected")}
          </h2>
          <p className="mt-2 text-muted-foreground text-sm">
            Shared context for people, agents, and connected services.
          </p>
        </div>
        <div className="rounded-xl border p-5">
          <p className="text-muted-foreground text-sm">Active agent</p>
          <h2 className="mt-2 font-medium text-xl">
            {workspace?.agent?.name ?? "No active agent"}
          </h2>
          <p className="mt-2 text-muted-foreground text-sm">
            {workspace?.agent
              ? "Readiness is reported by the Agent setup checklist."
              : "Create a workspace to evaluate readiness."}
          </p>
        </div>
      </div>
    </EnterprisePage>
  );
}
