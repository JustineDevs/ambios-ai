"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Canvas } from "@/components/canvas/Canvas";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EnterprisePage, EnterpriseState, Freshness } from "@/components/ui/enterprise-page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requestOperation } from "@/lib/api-client";
import type { CanvasEdge, CanvasNode } from "@/lib/canvas/types";

type Incident = { id: string; title: string; service: string; status: string };
type Graph = { nodes?: CanvasNode[]; edges?: CanvasEdge[]; source?: string };

export default function AgentsPage() {
  const [incidents, setIncidents] = useState<Incident[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [graph, setGraph] = useState<Graph | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [graphError, setGraphError] = useState<string | null>(null);

  const loadIncidents = useCallback(async () => {
    setError(null);
    try {
      const response = await requestOperation("listIncidents", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as {
        data?: { incidents?: Incident[] };
        detail?: string;
        error?: string;
      } | null;
      if (!response.ok)
        throw new Error(payload?.detail ?? payload?.error ?? "Agent context is unavailable.");
      const next = payload?.data?.incidents ?? [];
      setIncidents(next);
      setSelectedId((current) => current ?? next[0]?.id ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Agent context is unavailable.");
    }
  }, []);

  const loadGraph = useCallback(async (incidentId: string) => {
    setGraph(null);
    setGraphError(null);
    try {
      const response = await requestOperation(
        "getCanvas",
        { cache: "no-store" },
        { canvasId: incidentId },
      );
      const payload = (await response.json().catch(() => null)) as {
        data?: Graph;
        detail?: string;
        error?: string;
      } | null;
      if (!response.ok)
        throw new Error(payload?.detail ?? payload?.error ?? "Canvas data is unavailable.");
      setGraph(payload?.data ?? { nodes: [], edges: [], source: "persisted" });
    } catch (cause) {
      setGraphError(cause instanceof Error ? cause.message : "Canvas data is unavailable.");
    }
  }, []);

  useEffect(() => void loadIncidents(), [loadIncidents]);
  useEffect(() => {
    if (selectedId) void loadGraph(selectedId);
  }, [loadGraph, selectedId]);

  return (
    <EnterprisePage
      eyebrow="Build"
      title="Agents"
      description="Inspect the persisted operational context available to the governed agent."
      actions={<Freshness onRefresh={() => void loadIncidents()} loading={incidents === null} />}
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Agent context unavailable</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void loadIncidents()}>
              Retry read
            </Button>
          </AlertDescription>
        </Alert>
      ) : incidents === null ? (
        <EnterpriseState
          loading
          title="Loading agent context"
          description="Reading persisted workspace incidents and their operational graph."
        />
      ) : incidents.length === 0 ? (
        <EnterpriseState
          title="No agent context is available"
          description="The agent Canvas opens from persisted incident records. Create or ingest an incident before a graph can be inspected."
          action={
            <Button asChild variant="outline">
              <Link href="/incidents">Open Incidents</Link>
            </Button>
          }
        />
      ) : (
        <Tabs value={selectedId ?? undefined} onValueChange={setSelectedId} className="grid gap-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            {incidents.map((incident) => (
              <TabsTrigger key={incident.id} value={incident.id}>
                {incident.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {incidents.map((incident) => (
            <TabsContent key={incident.id} value={incident.id} className="grid gap-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-muted-foreground text-sm">
                    {incident.service} · {incident.status}
                  </p>
                  <h2 className="font-semibold text-xl">{incident.title}</h2>
                </div>
                <Button asChild variant="outline">
                  <Link href={`/incidents/${encodeURIComponent(incident.id)}`}>Open incident</Link>
                </Button>
              </div>
              {incident.id === selectedId && graphError ? (
                <Alert variant="destructive">
                  <AlertTitle>Canvas unavailable</AlertTitle>
                  <AlertDescription>{graphError}</AlertDescription>
                </Alert>
              ) : incident.id === selectedId && graph ? (
                <>
                  <div className="text-muted-foreground text-xs" role="status">
                    Source: {graph.source ?? "persisted"} · Workspace-scoped ·{" "}
                    {graph.nodes?.length ?? 0} nodes · {graph.edges?.length ?? 0} relationships
                  </div>
                  <Canvas
                    canvasId={incident.id}
                    initialNodes={graph.nodes ?? []}
                    initialEdges={graph.edges ?? []}
                  />
                </>
              ) : (
                <EnterpriseState
                  loading
                  title="Loading persisted Canvas"
                  description="Reading the selected incident graph."
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </EnterprisePage>
  );
}
