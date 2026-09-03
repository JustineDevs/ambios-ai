"use client";

import { AlertCircle, Bot, CheckCircle2, CircleDashed, Clock3, PauseCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { ActivitiesCard } from "@/components/ui/activities-card";
import {
  EnterprisePage,
  EnterpriseState,
  EnterpriseSummary,
} from "@/components/ui/enterprise-page";
import { useToken } from "@/hooks/use-token";
import { requestOperation } from "@/lib/api-client";

type Action = {
  id: string;
  actionType?: string;
  approvalState?: string;
  status: string;
  summary: string;
  createdAt: string;
};

type Lifecycle = "queued" | "awaiting_approval" | "running" | "succeeded" | "failed" | "aborted";

function lifecycleFor(action: Action): Lifecycle {
  if (action.approvalState === "pending") return "awaiting_approval";
  if (["failed", "error", "rejected"].includes(action.status)) return "failed";
  if (["aborted", "cancelled", "canceled"].includes(action.status)) return "aborted";
  if (["completed", "succeeded", "success"].includes(action.status)) return "succeeded";
  if (["running", "in_progress", "executing"].includes(action.status)) return "running";
  return "queued";
}

const lifecycleLabels: Record<Lifecycle, string> = {
  queued: "Queued",
  awaiting_approval: "Awaiting approval",
  running: "Running",
  succeeded: "Succeeded",
  failed: "Failed",
  aborted: "Aborted",
};

const lifecycleIcons: Record<Lifecycle, typeof CircleDashed> = {
  queued: CircleDashed,
  awaiting_approval: PauseCircle,
  running: Clock3,
  succeeded: CheckCircle2,
  failed: AlertCircle,
  aborted: PauseCircle,
};

export default function ConsolePage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [error, setError] = useState<string | null>(null);
  const token = useToken();
  useEffect(() => {
    if (!token) return;
    requestOperation("getConsole")
      .then(async (response) => {
        if (!response.ok) throw new Error(`Activity service returned ${response.status}.`);
        const payload = (await response.json()) as {
          data?: { actions?: Action[] };
          error?: string;
        };
        if (payload.error) throw new Error(payload.error);
        setActions(payload.data?.actions ?? []);
      })
      .catch((reason: unknown) => {
        setActions([]);
        setError(reason instanceof Error ? reason.message : "Activity service unavailable.");
      });
  }, [token]);
  return (
    <EnterprisePage
      eyebrow="Operate"
      title="Runtime console"
      description="Follow agent decisions, tool calls, approvals, and outcomes as an auditable operational event stream."
    >
      <EnterpriseSummary
        items={[
          {
            label: "Recorded actions",
            value: actions.length,
            detail: "Current workspace activity",
          },
          {
            label: "Completed",
            value: actions.filter((a) => lifecycleFor(a) === "succeeded").length,
            detail: "Verified outcomes",
            tone: "success",
          },
          {
            label: "In progress",
            value: actions.filter((a) => ["running", "queued"].includes(lifecycleFor(a))).length,
            detail: "Queued or executing",
          },
          {
            label: "Review queue",
            value: actions.filter((a) => lifecycleFor(a) === "awaiting_approval").length,
            detail: "Human decisions pending",
            tone: "warning",
          },
        ]}
      />
      {error && (
        <EnterpriseState tone="danger" title="Activity console unavailable" description={error} />
      )}
      <ActivitiesCard
        headerIcon={<Bot className="h-5 w-5" />}
        title="Recent agent activity"
        subtitle="Human-reviewable actions"
        activities={actions.slice(0, 6).map((action) => ({
          icon: (() => {
            const Icon = lifecycleIcons[lifecycleFor(action)];
            return <Icon className="h-5 w-5" />;
          })(),
          title: action.summary,
          desc: `${action.actionType ?? "Agent action"} · ${lifecycleLabels[lifecycleFor(action)]}`,
          time: new Date(action.createdAt).toLocaleTimeString(),
        }))}
      />
      <div className="rounded-xl border">
        <div className="border-b p-4 text-muted-foreground text-sm">
          {actions.length
            ? `${actions.length} recorded actions`
            : "No runtime actions have been recorded yet."}
        </div>
        {error ? null : actions.length ? (
          actions.map((action) => (
            <div
              className="grid gap-2 border-b p-4 last:border-0 sm:grid-cols-[1fr_auto]"
              key={action.id}
            >
              <div>
                <p className="font-medium">{action.summary}</p>
                <p className="text-muted-foreground text-sm">
                  {action.actionType ?? "Agent action"} ·{" "}
                  {new Date(action.createdAt).toLocaleString()}
                </p>
              </div>
              <span className="text-sm" data-status={action.status}>
                {lifecycleLabels[lifecycleFor(action)]}
              </span>
            </div>
          ))
        ) : (
          <EnterpriseState
            title="No actions yet"
            description="Run a reviewed operation from an incident or agent workflow to populate the console."
          />
        )}
      </div>
    </EnterprisePage>
  );
}
