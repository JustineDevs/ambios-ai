import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ambiosWebMCPTools } from "../webmcp/register.ts";

type EvalCall = {
  functionName: string;
  arguments: Record<string, unknown>;
};

type EvalCase = {
  id: string;
  kind: "deterministic" | "journey";
  prompt: string;
  expectedCall: EvalCall[];
  acceptance: string;
};

type EvalSuite = {
  name: string;
  version: number;
  purpose: string;
  tools: string[];
  cases: EvalCase[];
};

const suitePath = path.resolve(process.cwd(), "webmcp/evals/ambios-hotfix.json");
const suite = JSON.parse(fs.readFileSync(suitePath, "utf8")) as EvalSuite;
const registeredTools = new Map(ambiosWebMCPTools.map((tool) => [tool.name, tool]));

assert.equal(suite.version, 1);
assert.ok(suite.purpose.length > 40);
assert.ok(suite.cases.length >= 5);

for (const toolName of suite.tools) {
  assert.ok(registeredTools.has(toolName), `Eval references unregistered tool: ${toolName}`);
}

const seenCaseIds = new Set<string>();
for (const testCase of suite.cases) {
  assert.ok(!seenCaseIds.has(testCase.id), `Duplicate eval case: ${testCase.id}`);
  seenCaseIds.add(testCase.id);
  assert.ok(testCase.prompt.length > 20, `${testCase.id}: prompt is too short`);
  assert.ok(testCase.acceptance.length > 20, `${testCase.id}: acceptance is too short`);
  assert.ok(testCase.expectedCall.length > 0, `${testCase.id}: no expected calls`);

  for (const expected of testCase.expectedCall) {
    const tool = registeredTools.get(expected.functionName);
    assert.ok(tool, `${testCase.id}: unknown expected tool ${expected.functionName}`);
    assert.deepEqual(tool?.inputSchema.type, "object");
    assert.equal(typeof expected.arguments, "object");
  }
}

const orderedCalls = suite.cases.find((testCase) => testCase.id === "suggest-before-apply");
assert.ok(orderedCalls);
const applyIndex = orderedCalls.expectedCall.findIndex(
  (call) => call.functionName === "ambios.incident.apply_hotfix",
);
assert.equal(applyIndex, -1, "The pre-approval journey must not include execution.");

const approvalCase = suite.cases.find((testCase) => testCase.id === "approval-required");
assert.ok(approvalCase);
const approvalTool = registeredTools.get("ambios.incident.apply_hotfix");
assert.ok(approvalTool);
const approvalSchema = approvalTool.inputSchema as {
  properties?: Record<string, { const?: unknown }>;
};
assert.equal(approvalSchema.properties?.approved?.const, true);
assert.equal(approvalSchema.properties?.approvalSource?.const, "human");

console.log(
  `WebMCP eval suite contract passed: ${suite.cases.length} cases, ${suite.tools.length} tools.`,
);
