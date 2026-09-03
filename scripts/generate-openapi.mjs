#!/usr/bin/env node
/**
 * Generates the checked-in OpenAPI inventory from the canonical operation
 * registry. Response schemas remain named contract references until their
 * runtime validators are generated; route identity and governance metadata are
 * never duplicated by hand.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { MCP_SCOPES } from "../packages/shared/dist/mcp-resource-registry.js";
import { operationRegistry } from "../packages/shared/dist/operations.js";
import { serviceOriginsFromEnv } from "../packages/shared/dist/service-origins.js";

const origins = serviceOriginsFromEnv({ ...process.env, NODE_ENV: "production" });

const yaml = (value) => JSON.stringify(value);
const paths = new Map();
for (const operation of operationRegistry) {
  if (operation.method === "ALL") {
    const path = paths.get(operation.pathTemplate) ?? { operations: [] };
    path.operations.push(operation);
    paths.set(operation.pathTemplate, path);
    continue;
  }
  const path = paths.get(operation.pathTemplate) ?? { operations: [] };
  path.operations.push(operation);
  paths.set(operation.pathTemplate, path);
}

const lines = [
  "openapi: 3.1.0",
  "info:",
  "  title: AmbiOS AI API",
  "  version: 0.4.0",
  "  description: Generated from packages/shared/operations.ts. Do not edit route inventory by hand.",
  "  x-ambios-operation-registry: packages/shared/operations.ts",
  "servers:",
  `  - url: ${origins.frontendOrigin}`,
  "    description: Canonical Vercel same-origin gateway",
  `  - url: ${origins.coreApiOrigin}`,
  "    description: Core API Worker",
  `  - url: ${origins.connectorApiOrigin}`,
  "    description: Connector and execution Worker",
  "paths:",
];

for (const [pathTemplate, path] of [...paths.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const openApiPath = pathTemplate.replace(/:([^/]+)/g, "{$1}");
  lines.push(`  ${openApiPath}:`);
  lines.push("    x-ambios-operations:");
  for (const operation of path.operations) {
    lines.push(`      - operationId: ${operation.operationId}`);
    lines.push(`        runtimeOwner: ${operation.runtimeOwner}`);
    lines.push(`        supportedStatus: ${operation.supportedStatus}`);
  }
  for (const operation of path.operations) {
    if (operation.method === "ALL") continue;
    lines.push(`    ${operation.method.toLowerCase()}:`);
    lines.push(`      operationId: ${operation.operationId}`);
    lines.push(`      summary: ${yaml(operation.documentationSummary)}`);
    lines.push(`      x-runtime-owner: ${operation.runtimeOwner}`);
    lines.push(`      x-supported-status: ${operation.supportedStatus}`);
    lines.push(`      x-authentication: ${operation.authenticationRequirement}`);
    lines.push(`      x-organization-scope: ${operation.organizationScopeRequirement}`);
    lines.push(`      x-workspace-scope: ${operation.workspaceScopeRequirement}`);
    lines.push(`      x-capability: ${yaml(operation.capabilityRequirement)}`);
    lines.push(`      x-idempotency: ${operation.idempotencyRequirement}`);
    lines.push(`      x-audit: ${operation.auditRequirement}`);
    lines.push(`      x-queue: ${operation.queueRequirement}`);
    lines.push(`      x-deprecation: ${operation.deprecationStatus}`);
    if (operation.replacementOperationId)
      lines.push(`      x-replacement-operation: ${operation.replacementOperationId}`);
    if (operation.operationId === "mcpAuthorize") {
      lines.push("      parameters:");
      for (const [name, description, required, schema] of [
        [
          "client_id",
          "Registered MCP OAuth client identifier.",
          true,
          "{ type: string, minLength: 1 }",
        ],
        [
          "redirect_uri",
          "Exact redirect URI registered for the client.",
          true,
          "{ type: string, format: uri }",
        ],
        ["response_type", "OAuth response type.", true, "{ type: string, enum: [code] }"],
        ["code_challenge", "PKCE S256 code challenge.", true, "{ type: string, minLength: 43 }"],
        ["code_challenge_method", "PKCE challenge method.", true, "{ type: string, enum: [S256] }"],
        [
          "resource",
          "Exact protected AmbiOS MCP resource URL.",
          true,
          "{ type: string, format: uri }",
        ],
        [
          "scope",
          "Space-delimited explicit AmbiOS capability scopes.",
          true,
          `{ type: string, minLength: 1, pattern: "^[A-Za-z0-9._:-]+( [A-Za-z0-9._:-]+)*$", example: "${MCP_SCOPES.slice(0, 2).join(" ")}" }`,
        ],
        ["state", "Opaque client state returned unchanged.", false, "{ type: string }"],
      ]) {
        lines.push(`        - name: ${name}`);
        lines.push("          in: query");
        lines.push(`          required: ${required}`);
        lines.push(`          description: ${yaml(description)}`);
        lines.push(`          schema: ${schema}`);
      }
      lines.push(`      x-mcp-resource: ${yaml(origins.mcpResourceOrigin)}`);
      lines.push(`      x-mcp-scopes-supported: ${yaml(MCP_SCOPES)}`);
    }
    lines.push("      responses:");
    lines.push("        '200':");
    lines.push("          description: Successful operation");
    lines.push("          content:");
    lines.push("            application/json:");
    lines.push(`              x-response-schema: ${operation.responseSchema}`);
    lines.push("              schema: { type: object }");
    lines.push("        '401': { $ref: '#/components/responses/Problem' }");
    lines.push("        '403': { $ref: '#/components/responses/Problem' }");
    lines.push("        '500': { $ref: '#/components/responses/Problem' }");
  }
}

lines.push(
  "components:",
  "  securitySchemes:",
  "    bearerAuth:",
  "      type: http",
  "      scheme: bearer",
  "  responses:",
  "    Problem:",
  "      description: Structured problem response",
  "      content:",
  "        application/json:",
  "          schema:",
  "            type: object",
  "            required: [code, message]",
  "            properties:",
  "              code: { type: string }",
  "              message: { type: string }",
  "              requestId: { type: string }",
);

const generated = `${lines.join("\n")}\n`;
const target = new URL("../openapi.yaml", import.meta.url);
if (process.argv.includes("--check")) {
  const current = readFileSync(target, "utf8");
  if (current !== generated) {
    console.error("OpenAPI drift detected: run pnpm openapi:generate");
    process.exit(1);
  }
  console.log(`OpenAPI registry parity passed (${operationRegistry.length} operations).`);
} else {
  writeFileSync(target, generated);
  console.log(`Generated OpenAPI for ${operationRegistry.length} operations.`);
}
