import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { SmokeConfig } from "../config/runtime.ts";

export type SmokeResult = {
  caseId: string;
  suite: string;
  scenario: string;
  expected: string;
  actual: string;
  status: "pass" | "fail" | "skip";
  classification?: string;
  operationId?: string;
  route?: string;
  statusCode?: number;
  errorCode?: string;
  auditStatus?: string;
  runStatus?: string;
  providerVerificationStatus?: string;
  screenshot?: string;
  trace?: string;
  safeNetworkError?: string;
  safeConsoleError?: string;
  recommendedFixLane?: string;
};

const sensitiveKey =
  /password|token|secret|cookie|authorization|credential|code_verifier|refresh|access_token|api_key|trace|requestid|internalid|databaseid/i;
export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        sensitiveKey.test(key) ? "[REDACTED]" : redact(item),
      ]),
    );
  if (typeof value === "string")
    return value
      .replace(/Bearer\s+[^\s]+/gi, "Bearer [REDACTED]")
      .replace(/[A-Za-z0-9_-]{32,}/g, "[REDACTED]");
  return value;
}

export class SmokeReport {
  readonly results: SmokeResult[] = [];
  add(result: SmokeResult) {
    this.results.push(result);
    return result;
  }
  async write(config: SmokeConfig, metadata: Record<string, unknown> = {}) {
    const dir = join(config.reports, config.runId);
    await mkdir(dir, { recursive: true });
    const report = redact({
      runId: config.runId,
      environment: config.environment,
      origins: config.origins,
      ...metadata,
      results: this.results,
      summary: {
        pass: this.results.filter((r) => r.status === "pass").length,
        fail: this.results.filter((r) => r.status === "fail").length,
        skip: this.results.filter((r) => r.status === "skip").length,
      },
    });
    await writeFile(join(dir, "smoke-report.json"), `${JSON.stringify(report, null, 2)}\n`);
    const lines = [
      "# AmbiOS interactive smoke report",
      "",
      `- Run: \`${config.runId}\``,
      `- Environment: \`${config.environment}\``,
      `- Frontend: ${config.origins.frontendOrigin}`,
      `- Core API: ${config.origins.coreApiOrigin}`,
      `- Connector: ${config.origins.connectorApiOrigin}`,
      "",
      "| Status | Case | Scenario | Evidence |",
      "|---|---|---|---|",
    ];
    for (const result of this.results)
      lines.push(
        `| ${result.status.toUpperCase()} | ${result.caseId} | ${result.scenario.replace(/\|/g, "\\|")} | ${[result.operationId, result.route, result.statusCode ? `HTTP ${result.statusCode}` : "", result.errorCode].filter(Boolean).join(" · ")} |`,
      );
    await writeFile(join(dir, "smoke-report.md"), `${lines.join("\n")}\n`);
    return { json: join(dir, "smoke-report.json"), markdown: join(dir, "smoke-report.md") };
  }
}
