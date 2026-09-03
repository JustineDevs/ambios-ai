import { type OperationId, operationPath } from "@ambios-ai/shared";

export type ApiProblem = {
  type?: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code: string;
  requestId?: string;
  operationId?: string;
  retryable: boolean;
  fields?: Record<string, string[]>;
};

export class ApiRequestError extends Error {
  readonly problem: ApiProblem;

  constructor(problem: ApiProblem) {
    super(problem.detail);
    this.name = "ApiRequestError";
    this.problem = problem;
  }
}

export function operationUrl(
  operationId: OperationId,
  pathParams: Record<string, string> = {},
  query: Record<string, string> = {},
) {
  const suffix = new URLSearchParams(query).toString();
  return `${operationPath(operationId, pathParams)}${suffix ? `?${suffix}` : ""}`;
}

export function requestOperation(
  operationId: OperationId,
  init?: RequestInit,
  pathParams: Record<string, string> = {},
  query: Record<string, string> = {},
) {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (!headers.has("X-Request-ID")) headers.set("X-Request-ID", crypto.randomUUID());
  if (!headers.has("X-Correlation-ID")) headers.set("X-Correlation-ID", crypto.randomUUID());
  return fetch(operationUrl(operationId, pathParams, query), {
    credentials: "include",
    ...init,
    headers,
  });
}

async function requestStrictOperation(
  operationId: OperationId,
  init?: RequestInit,
  pathParams: Record<string, string> = {},
  query: Record<string, string> = {},
) {
  const response = await requestOperation(operationId, init, pathParams, query);
  if (response.ok) return response;
  const payload = (await response.json().catch(() => null)) as Partial<ApiProblem> | null;
  throw new ApiRequestError({
    type: payload?.type,
    title: payload?.title ?? "AmbiOS request failed",
    status: payload?.status ?? response.status,
    detail: payload?.detail ?? "The requested operation could not be completed.",
    instance: payload?.instance,
    code: payload?.code ?? `HTTP_${response.status}`,
    requestId: payload?.requestId ?? response.headers.get("X-Request-ID") ?? undefined,
    operationId: payload?.operationId ?? operationId,
    retryable: payload?.retryable ?? response.status >= 500,
    fields: payload?.fields,
  });
}

export async function requestJsonOperation<T>(
  operationId: OperationId,
  init?: RequestInit,
  pathParams: Record<string, string> = {},
  query: Record<string, string> = {},
  parse?: (value: unknown) => T,
): Promise<T> {
  const response = await requestStrictOperation(operationId, init, pathParams, query);
  const value: unknown = await response.json();
  return parse ? parse(value) : (value as T);
}
