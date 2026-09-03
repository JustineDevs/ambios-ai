import { create } from "zustand";
import type { AgentCursor, CanvasEdge, CanvasNode, CanvasUser } from "./types";

type CanvasState = {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  activeUsers: CanvasUser[];
  agentCursor: AgentCursor;
  setNodes: (nodes: CanvasNode[]) => void;
  setEdges: (edges: CanvasEdge[]) => void;
  addNode: (node: CanvasNode) => void;
  updateNode: (id: string, data: Partial<CanvasNode["data"]>) => void;
  removeNode: (id: string) => void;
  setActiveUsers: (users: CanvasUser[]) => void;
  setAgentCursor: (cursor: AgentCursor) => void;
};

export const useCanvasStore = create<CanvasState>((set) => ({
  nodes: [],
  edges: [],
  activeUsers: [],
  agentCursor: { x: 0, y: 0, state: "idle" },
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  updateNode: (id, data) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node,
      ),
    })),
  removeNode: (id) => set((state) => ({ nodes: state.nodes.filter((node) => node.id !== id) })),
  setActiveUsers: (activeUsers) => set({ activeUsers }),
  setAgentCursor: (agentCursor) => set({ agentCursor }),
}));
