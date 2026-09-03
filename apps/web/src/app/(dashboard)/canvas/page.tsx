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

type CanvasSource = {
  id: string;
  title: string;
  service: string;
  severity: string;
  status: string;
};

export default function CanvasIndexPage() {
  const [sources, setSources] = useState<CanvasSource[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const response = await requestOperation("listIncidents", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as {
        data?: { incidents?: CanvasSource[] };
        detail?: string;
        error?: string;
      } | null;
      if (!response.ok)
        throw new Error(payload?.detail ?? payload?.error ?? "Canvas sources are unavailable.");
      setSources(payload?.data?.incidents ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Canvas sources are unavailable.");
    }
  }, []);

  useEffect(() => void load(), [load]);

  return (
    <EnterprisePage
      eyebrow="Operate"
      title="Canvas"
      description="Open persisted relationship graphs for incidents in the current workspace."
      actions={<Freshness onRefresh={() => void load()} loading={sources === null} />}
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Canvas sources unavailable</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Retry read
            </Button>
          </AlertDescription>
        </Alert>
      ) : sources === null ? (
        <EnterpriseState
          loading
          title="Loading Canvas sources"
          description="Reading incidents that have workspace-scoped operational graphs."
        />
      ) : sources.length === 0 ? (
        <EnterpriseState
          title="No Canvas sources recorded"
          description="Canvas opens from persisted incident records. Create or ingest an incident before a relationship graph can be opened."
          action={
            <Button asChild variant="outline">
              <Link href="/incidents">Open Incidents</Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Incident</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Open</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell>
                    <Link
                      className="font-medium underline-offset-4 hover:underline"
                      href={`/incidents/${encodeURIComponent(source.id)}/canvas`}
                    >
                      {source.title}
                    </Link>
                    <p className="text-muted-foreground text-xs">{source.id}</p>
                  </TableCell>
                  <TableCell>{source.service}</TableCell>
                  <TableCell>
                    <StatusBadge status={source.severity} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={source.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm">
                      <Link href={`/incidents/${encodeURIComponent(source.id)}/canvas`}>
                        Open Canvas
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
