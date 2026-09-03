import { requestOperation } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";
import type { AgentCursor, CanvasEdge, CanvasNode, CanvasUser } from "./types";

async function assertCanvasAccess(
  canvasId: string,
  shareLink?: string,
  permission: "read" | "write" = "read",
) {
  const params = new URLSearchParams({ canvasId });
  if (shareLink) params.set("shareLink", shareLink);
  const response = await requestOperation(
    "getCanvasAccess",
    { cache: "no-store" },
    {},
    Object.fromEntries(params),
  );
  if (!response.ok) throw new Error("Canvas access denied");
  const body = (await response.json()) as { data?: { permissions?: Record<string, boolean> } };
  if (body.data?.permissions?.[permission] !== true) throw new Error("Canvas permission denied");
}

async function getRealtimeToken(
  canvasId: string,
  shareLink: string | undefined,
  permission: "read" | "write",
) {
  const params = new URLSearchParams({ canvasId, permission });
  if (shareLink) params.set("shareLink", shareLink);
  const response = await requestOperation(
    "getCanvasRealtimeToken",
    { cache: "no-store" },
    {},
    Object.fromEntries(params),
  );
  if (!response.ok) throw new Error("Realtime authorization denied");
  const body = (await response.json()) as { data?: { token?: string } };
  if (!body.data?.token) throw new Error("Realtime authorization unavailable");
  return body.data.token;
}

type CanvasCallbacks = {
  onNodeUpdate?: (node: CanvasNode) => void;
  onEdgeUpdate?: (edge: CanvasEdge) => void;
  onEdgesUpdate?: (edges: CanvasEdge[]) => void;
  onUsersChange?: (users: CanvasUser[]) => void;
  onAgentCursorMove?: (cursor: AgentCursor) => void;
};

export async function subscribeToCanvas(
  canvasId: string,
  callbacks: CanvasCallbacks,
  shareLink?: string,
) {
  try {
    await assertCanvasAccess(canvasId, shareLink, "read");
  } catch {
    throw new Error("Canvas access denied");
  }
  const client = createClient();
  await client.realtime.setAuth(await getRealtimeToken(canvasId, shareLink, "read"));
  const channel = client.channel(`canvas:${canvasId}`, { config: { private: true } });
  channel
    .on("broadcast", { event: "node-update" }, ({ payload }) =>
      callbacks.onNodeUpdate?.(payload.node as CanvasNode),
    )
    .on("broadcast", { event: "edge-update" }, ({ payload }) =>
      callbacks.onEdgeUpdate?.(payload.edge as CanvasEdge),
    )
    .on("broadcast", { event: "edges-update" }, ({ payload }) =>
      callbacks.onEdgesUpdate?.(payload.edges as CanvasEdge[]),
    )
    .on("broadcast", { event: "agent-cursor" }, ({ payload }) =>
      callbacks.onAgentCursorMove?.(payload.cursor as AgentCursor),
    )
    .on("presence", { event: "sync" }, () => {
      const users = Object.values(channel.presenceState())
        .flat()
        .filter(Boolean) as unknown as CanvasUser[];
      callbacks.onUsersChange?.(users);
    })
    .subscribe();
  return channel;
}

export async function broadcastCanvasEvent(
  canvasId: string,
  event: string,
  payload: unknown,
  shareLink?: string,
) {
  await assertCanvasAccess(canvasId, shareLink, "write");
  const client = createClient();
  await client.realtime.setAuth(await getRealtimeToken(canvasId, shareLink, "write"));
  const channel = client.channel(`canvas:${canvasId}`, { config: { private: true } });
  await channel.subscribe();
  const result = await channel.send({ type: "broadcast", event, payload });
  await channel.unsubscribe();
  return result;
}
