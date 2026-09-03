"use client";

import { useEffect, useState } from "react";
import ReactFlow, {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
  type OnEdgesChange,
  type OnNodesChange,
} from "reactflow";
import "reactflow/dist/style.css";
import { broadcastCanvasEvent, subscribeToCanvas } from "@/lib/canvas/realtime";
import { useCanvasStore } from "@/lib/canvas/store";
import type { CanvasEdge, CanvasNode as CanvasNodeModel } from "@/lib/canvas/types";
import { AgentCursor } from "./AgentCursor";
import { CanvasNode } from "./CanvasNode";
import { SecurityNode } from "./SecurityNode";

const nodeTypes: NodeTypes = {
  service: CanvasNode,
  incident: CanvasNode,
  proposal: CanvasNode,
  approval: CanvasNode,
  action: CanvasNode,
  vendor: CanvasNode,
  security: SecurityNode,
};

export function Canvas({
  canvasId,
  initialNodes,
  initialEdges,
  shareLink,
}: {
  canvasId: string;
  initialNodes: CanvasNodeModel[];
  initialEdges?: CanvasEdge[];
  shareLink?: string;
}) {
  const { nodes, edges, agentCursor, setNodes, setEdges, setActiveUsers, setAgentCursor } =
    useCanvasStore();
  const [realtimeError, setRealtimeError] = useState(false);
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges ?? []);
  }, [initialEdges, initialNodes, setEdges, setNodes]);
  useEffect(() => {
    let channel: Awaited<ReturnType<typeof subscribeToCanvas>> | null = null;
    let cancelled = false;
    void subscribeToCanvas(
      canvasId,
      {
        onNodeUpdate: (node) =>
          setNodes([
            ...useCanvasStore.getState().nodes.filter((item) => item.id !== node.id),
            node,
          ]),
        onUsersChange: setActiveUsers,
        onAgentCursorMove: setAgentCursor,
        onEdgesUpdate: setEdges,
      },
      shareLink,
    )
      .then((nextChannel) => {
        if (cancelled) {
          void nextChannel?.unsubscribe();
        } else {
          channel = nextChannel;
        }
      })
      .catch(() => setRealtimeError(true));
    return () => {
      cancelled = true;
      void channel?.unsubscribe();
    };
  }, [canvasId, setActiveUsers, setAgentCursor, setEdges, setNodes, shareLink]);
  const onNodesChange: OnNodesChange = (changes) => {
    const nextNodes = applyNodeChanges(changes, nodes) as CanvasNodeModel[];
    setNodes(nextNodes);
    for (const node of nextNodes) {
      void broadcastCanvasEvent(canvasId, "node-update", { node }, shareLink);
    }
  };
  const onEdgesChange: OnEdgesChange = (changes) => {
    const nextEdges = applyEdgeChanges(changes, edges);
    setEdges(nextEdges);
    void broadcastCanvasEvent(canvasId, "edges-update", { edges: nextEdges }, shareLink);
  };
  return (
    <section
      className="relative h-[min(70vh,680px)] min-h-[420px] overflow-hidden rounded-xl border bg-muted/20"
      aria-label="Operational Canvas graph"
      data-testid="operational-canvas"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
      <AgentCursor {...agentCursor} />
      {realtimeError && (
        <p
          className="absolute top-3 right-3 rounded-md border bg-background/90 px-2 py-1 text-muted-foreground text-xs"
          role="status"
        >
          Live collaboration unavailable. Persisted graph data remains visible; retry after checking
          workspace access.
        </p>
      )}
    </section>
  );
}
