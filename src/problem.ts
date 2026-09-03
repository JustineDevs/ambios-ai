import type { Context } from "hono";

export type ProblemCode =
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNSUPPORTED_OPERATION"
  | "RUNTIME_BINDINGS_MISSING"
  | "INTERNAL_ERROR";

/** RFC 9457-shaped response for every HTTP error emitted by the Worker boundary. */
export function problem(
  c: Context,
  status: 400 | 401 | 403 | 404 | 405 | 409 | 413 | 422 | 429 | 500 | 501 | 503,
  code: ProblemCode,
  detail: string,
  options: { operationId?: string; retryable?: boolean; fields?: Record<string, string> } = {},
) {
  const requestId = c.req.header("X-Request-ID") ?? crypto.randomUUID();
  c.header("Content-Type", "application/problem+json");
  return c.json(
    {
      type: `https://ambios.ai/problems/${code.toLowerCase()}`,
      title: code.replaceAll("_", " "),
      status,
      detail,
      instance: c.req.path,
      code,
      requestId,
      operationId: options.operationId ?? "unknown",
      retryable: options.retryable ?? status >= 500,
      ...(options.fields ? { fields: options.fields } : {}),
    },
    status,
  );
}
