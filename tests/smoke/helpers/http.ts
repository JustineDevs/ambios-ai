import type { OperationId } from "../../../packages/shared/operations.ts";
import type { SmokeConfig } from "../config/runtime.ts";
import { smokeUrl } from "../config/runtime.ts";
import type { SmokeReport } from "./report.ts";

export async function checkHttp(
  report: SmokeReport,
  config: SmokeConfig,
  input: {
    caseId: string;
    suite: string;
    operationId: OperationId;
    service?: "frontend" | "core" | "connector" | "oauth";
    expectedStatus: number[];
    expectedContent?: "json" | "html";
    marker?: string;
    method?: string;
    body?: unknown;
  },
) {
  const url = smokeUrl(config, input.operationId, {}, input.service);
  try {
    const response = await fetch(url, {
      method: input.method ?? "GET",
      headers: {
        Accept: input.expectedContent === "html" ? "text/html" : "application/json",
        ...(input.body ? { "Content-Type": "application/json" } : {}),
      },
      body: input.body ? JSON.stringify(input.body) : undefined,
      signal: AbortSignal.timeout(10000),
    });
    const text = await response.text();
    const contentType = response.headers.get("content-type") ?? "";
    const valid =
      input.expectedStatus.includes(response.status) &&
      (!input.expectedContent ||
        (input.expectedContent === "json"
          ? contentType.includes("json")
          : contentType.includes("html"))) &&
      (!input.marker || text.includes(input.marker));
    return report.add({
      caseId: input.caseId,
      suite: input.suite,
      scenario: `${input.method ?? "GET"} ${input.operationId}`,
      expected: `HTTP ${input.expectedStatus.join("/")} ${input.expectedContent ?? "response"}`,
      actual: `HTTP ${response.status} ${contentType}`,
      status: valid ? "pass" : "fail",
      operationId: input.operationId,
      route: new URL(url).pathname,
      statusCode: response.status,
      safeNetworkError: valid ? undefined : "Response did not match the declared contract",
      recommendedFixLane: valid ? undefined : "deployment-contract",
    });
  } catch (error) {
    return report.add({
      caseId: input.caseId,
      suite: input.suite,
      scenario: `${input.method ?? "GET"} ${input.operationId}`,
      expected: "reachable response",
      actual: "request failed",
      status: "fail",
      operationId: input.operationId,
      route: new URL(url).pathname,
      safeNetworkError: error instanceof Error ? error.message : "request failed",
      recommendedFixLane: "deployment-connectivity",
    });
  }
}
