import type { Handler, Hono } from "hono";
import type { OperationDefinition } from "../packages/shared/operations";

/**
 * Typed route mount point. Route owners provide the handler; the registry owns
 * the method and template so a new HTTP mount cannot invent an untracked path.
 */
export function registerOperation(
  app: Hono<any>,
  operation: OperationDefinition,
  handler: Handler<any>,
) {
  const method = operation.method === "ALL" ? "ALL" : operation.method;
  app.on(method, operation.pathTemplate, handler);
}
