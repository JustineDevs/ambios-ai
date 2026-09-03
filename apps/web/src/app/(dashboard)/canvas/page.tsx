"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EnterprisePage, EnterpriseState, Freshness } from "@/components/ui/enterprise-page";
import { requestOperation } from "@/lib/api-client";

type Incident = {
  id: string;
  title: string;
  service: string;
  status: string;
};

export default function CanvasIndexPage() {
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
      if (!response.ok) throw new Error(payload?.error ?? "Canvas records are unavailable.");
      setIncidents(payload?.data?.incidents ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Canvas records are unavailable.");
    }
  }, []);

  useEffect(() => void load(), [load]);

  return (
    <EnterprisePage
      eyebrow="Operate"
      title="Canvas"
      description="Open workspace-scoped operational canvases built from persisted incident relationships."
      actions={<Freshness onRefresh={() => void load()} loading={incidents === null} />}
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Canvas records unavailable</AlertTitle>
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" className="ml-3" onClick={() => void load()}>
              Retry read
            </Button>
          </AlertDescription>
        </Alert>
      ) : incidents === null ? (
        <EnterpriseState
          loading
          title="Loading Canvas records"
          description="Reading scoped incident records from the workspace backend."
        />
      ) : incidents.length === 0 ? (
        <EnterpriseState
          title="No canvases available"
          description="Canvas views appear when the workspace has persisted incident records."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {incidents.map((incident) => (
            <article key={incident.id} className="rounded-xl border p-4">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                {incident.service} · {incident.status}
              </p>
              <h2 className="mt-2 font-medium">{incident.title}</h2>
              <p className="mt-1 text-muted-foreground text-xs">{incident.id}</p>
              <Button asChild size="sm" className="mt-4">
                <Link href={`/incidents/${encodeURIComponent(incident.id)}/canvas`}>
                  Open Canvas
                </Link>
              </Button>
            </article>
          ))}
        </div>
      )}
    </EnterprisePage>
  );
}
