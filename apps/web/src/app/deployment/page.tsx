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
  actionType?: string;
  status?: string;
  approvalState?: string;
  summary?: string;
  createdAt?: string;
};

export default function DeploymentPage() {
  const [deployments, setDeployments] = useState<Action[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setError(null);
    try {
      const response = await requestOperation("listActions", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as {
        data?: { actions?: Action[] };
        error?: string;
      } | null;
      if (!response.ok) throw new Error(payload?.error ?? "Deployment records are unavailable.");
      setDeployments(
        (payload?.data?.actions ?? []).filter(
          (action) =>
            /deploy/i.test(action.actionType ?? "") || /deploy/i.test(action.summary ?? ""),
        ),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Deployment records are unavailable.");
    }
  }, []);
  useEffect(() => void load(), [load]);
  return (
    <EnterprisePage
      eyebrow="Operate"
      title="Deployment"
      description="Inspect persisted deployment actions, approval state, and execution outcomes. A request is not reported as deployed until verification exists."
      actions={<Freshness onRefresh={() => void load()} loading={deployments === null} />}
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Deployment records unavailable</AlertTitle>
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" className="ml-3" onClick={() => void load()}>
              Retry read
            </Button>
          </AlertDescription>
        </Alert>
      ) : deployments === null ? (
        <EnterpriseState
          loading
          title="Loading deployment records"
          description="Reading persisted deployment actions from the workspace backend."
        />
      ) : deployments.length === 0 ? (
        <EnterpriseState
          title="No deployment actions recorded"
          description="No deployment action exists in the current workspace. Deployment controls remain unavailable until a governed proposal and supported target exist."
        />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deployment</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead>Execution</TableHead>
                <TableHead>Recorded</TableHead>
                <TableHead className="text-right">Open</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deployments.map((deployment) => (
                <TableRow key={String(deployment.id)}>
                  <TableCell className="font-medium">
                    {deployment.summary ?? deployment.actionType ?? "Deployment action"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={deployment.approvalState} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={deployment.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {deployment.createdAt
                      ? new Date(deployment.createdAt).toLocaleString()
                      : "Not recorded"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/runs?run=${encodeURIComponent(String(deployment.id ?? ""))}`}>
                        Inspect run
                      </Link>
                    </Button>
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
