import Link from "next/link";
import { notFound } from "next/navigation";
import { Canvas } from "@/components/canvas/Canvas";
import { getCanvasForUser, getIncidentForUser, getSharedIncident } from "@/lib/ambios/d1";
import { requireToolUser } from "@/lib/ambios/security";
import { checkCanvasAccess } from "@/lib/canvas/access";
import type { CanvasEdge, CanvasNode } from "@/lib/canvas/types";

export default async function IncidentCanvasPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ shareLink?: string }>;
}) {
  const { id } = await params;
  const { shareLink } = await searchParams;
  const user = await requireToolUser();
  let incident = user ? await getIncidentForUser(user.id, id) : null;
  const graph = user ? await getCanvasForUser(user.id, id) : null;
  if (!incident && shareLink && (await checkCanvasAccess(id, user?.id, shareLink)).allowed) {
    incident = await getSharedIncident(id, shareLink);
  }
  if (!incident) notFound();
  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">Operational Canvas · {incident.service}</p>
          <h1 className="font-semibold text-2xl">{incident.title}</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Persisted incident context and governed operational relationships for this workspace.
          </p>
        </div>
        <Link
          className="text-primary text-sm underline"
          href={`/incidents/${encodeURIComponent(id)}`}
        >
          Back to incident
        </Link>
      </div>
      <div
        className="flex flex-wrap gap-2 text-muted-foreground text-xs"
        role="status"
        aria-label="Canvas data status"
      >
        <span className="rounded-full border px-2 py-1">Source: Hono graph API</span>
        <span className="rounded-full border px-2 py-1">Incident: {incident.status}</span>
        <span className="rounded-full border px-2 py-1">Workspace-scoped</span>
      </div>
      <Canvas
        canvasId={id}
        shareLink={shareLink}
        initialNodes={
          (graph?.nodes ?? [
            {
              id: `incident:${incident.id}`,
              type: "incident",
              position: { x: 0, y: 0 },
              data: {
                label: incident.title,
                description: incident.context,
                status: incident.status,
              },
            },
          ]) as CanvasNode[]
        }
        initialEdges={(graph?.edges ?? []) as CanvasEdge[]}
      />
    </section>
  );
}
