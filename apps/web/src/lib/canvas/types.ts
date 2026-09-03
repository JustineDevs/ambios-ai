import type { Edge, Node } from "reactflow";

export type CanvasNodeKind =
  | "service"
  | "incident"
  | "proposal"
  | "approval"
  | "action"
  | "vendor"
  | "security";
export type SecurityVendor = "snyk" | "socket" | "dependabot" | "github-security";

export type CanvasNodeData = {
  label: string;
  description?: string;
  status?: string;
  vendor?: "cloudflare" | "vercel" | "github" | "shopify" | "notion";
  securityVendor?: SecurityVendor;
  severity?: "low" | "medium" | "high" | "critical";
  riskScore?: number;
  permissions?: readonly string[];
  resourceId?: string;
};

export type CanvasNode = Node<CanvasNodeData> & { type: CanvasNodeKind };
export type CanvasEdge = Edge;

export type CanvasUser = { id: string; name?: string; role?: string };
export type AgentCursor = { x: number; y: number; state: "idle" | "thinking" | "acting" };
