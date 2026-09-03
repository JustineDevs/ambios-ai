"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/operations/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EnterprisePage, EnterpriseState, Freshness } from "@/components/ui/enterprise-page";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requestOperation } from "@/lib/api-client";

type Action = {
  id?: string;
  summary?: string;
  actionType?: string;
  approvalState?: string;
  status?: string;
  incidentId?: string;
};

export default function ApprovalsPage() {
  const [actions, setActions] = useState<Action[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setError(null);
    try {
      const response = await requestOperation("listActions", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as {
        data?: { actions?: Action[] };
        error?: string;
      } | null;
      if (!response.ok) throw new Error(payload?.error ?? "Approval data is unavailable.");
      setActions(
        (payload?.data?.actions ?? []).filter((action) => action.approvalState === "pending"),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Approval data is unavailable.");
    }
  }, []);
  useEffect(() => void load(), [load]);
  return (
    <EnterprisePage
      eyebrow="Govern"
      title="Approval queue"
      description="Review exact proposed actions before execution. Approval state is read from persisted workspace actions."
      actions={<Freshness onRefresh={() => void load()} loading={actions === null} />}
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Approval queue unavailable</AlertTitle>
          <AlertDescription>
            {error} No decision is inferred until the action service responds.
            <Button variant="outline" size="sm" className="ml-3" onClick={() => void load()}>
              Retry read
            </Button>
          </AlertDescription>
        </Alert>
      ) : actions === null ? (
        <EnterpriseState
          loading
          title="Loading approval queue"
          description="Reading persisted actions and approval states."
        />
      ) : actions.length === 0 ? (
        <EnterpriseState
          tone="success"
          title="No pending approvals"
          description="There are no proposed changes waiting for a human decision."
        />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Action state</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead className="text-right">Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.map((action) => (
                <TableRow key={String(action.id)}>
                  <TableCell className="font-medium">
                    {action.summary ?? "Pending action"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {action.actionType ?? "Not specified"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={action.status} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={action.approvalState} />
                  </TableCell>
                  <TableCell className="text-right">
                    {action.incidentId ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/incidents/${encodeURIComponent(action.incidentId)}`}>
                          Inspect incident
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/runs?run=${encodeURIComponent(String(action.id ?? ""))}`}>
                          Inspect run
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </EnterprisePage>
  );
}
