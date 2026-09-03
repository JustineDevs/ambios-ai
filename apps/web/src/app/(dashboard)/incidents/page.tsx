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

type Incident = {
  id: string;
  title: string;
  service: string;
  severity: string;
  status: string;
  createdAt?: string;
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setError(null);
    try {
      const response = await requestOperation("listIncidents", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as {
        data?: { incidents?: Incident[] };
        error?: string;
      } | null;
      if (!response.ok) throw new Error(payload?.error ?? "Incident data is unavailable.");
      setIncidents(payload?.data?.incidents ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Incident data is unavailable.");
    }
  }, []);
  useEffect(() => void load(), [load]);
  return (
    <EnterprisePage
      eyebrow="Operate"
      title="Incidents"
      description="Review evidence-backed incident state, linked actions, and the next governed decision."
      actions={<Freshness onRefresh={() => void load()} loading={incidents === null} />}
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Incident data unavailable</AlertTitle>
          <AlertDescription>
            {error} No incident state is inferred locally.
            <Button variant="outline" size="sm" className="ml-3" onClick={() => void load()}>
              Retry read
            </Button>
          </AlertDescription>
        </Alert>
      ) : incidents === null ? (
        <EnterpriseState
          loading
          title="Loading incident state"
          description="Reading scoped incident records from the workspace backend."
        />
      ) : incidents.length === 0 ? (
        <EnterpriseState
          title="No incidents recorded"
          description="No incidents are recorded for this workspace. Create one from an authorized incident intake when an operational event needs review."
        />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Incident</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Started</TableHead>
                <TableHead className="text-right">Open</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell>
                    <Link
                      className="font-medium underline-offset-4 hover:underline"
                      href={`/incidents/${encodeURIComponent(incident.id)}`}
                    >
                      {incident.title}
                    </Link>
                    <p className="text-muted-foreground text-xs">{incident.id}</p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={incident.severity} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={incident.status} />
                  </TableCell>
                  <TableCell>{incident.service}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {incident.createdAt
                      ? new Date(incident.createdAt).toLocaleString()
                      : "Not recorded"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/incidents/${encodeURIComponent(incident.id)}`}>Inspect</Link>
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
