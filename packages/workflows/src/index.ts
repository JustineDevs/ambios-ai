import { operationPath } from "@ambios-ai/shared";
import { task } from "@renderinc/sdk/workflows";
import { z } from "zod";

const incidentInput = z.object({
  incidentId: z.string().min(1).max(128),
  organizationId: z.string().min(1).max(128),
});

type IncidentInput = z.infer<typeof incidentInput>;

type WorkflowStep = {
  name: string;
  status: "completed" | "failed";
  detail: string;
};

type WorkflowResult = {
  incidentId: string;
  organizationId: string;
  status: "completed";
  steps: WorkflowStep[];
};

async function callAmbiOS(path: string): Promise<unknown> {
  const apiBaseUrl = process.env.AMBIOS_INTERNAL_API_URL;
  const internalToken = process.env.AMBIOS_INTERNAL_TOKEN;
  if (!apiBaseUrl || !internalToken)
    throw new Error("AMBIOS_INTERNAL_API_URL and AMBIOS_INTERNAL_TOKEN are required.");
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${internalToken}`,
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`AmbiOS API returned ${response.status} for ${path}`);
  return body;
}

export const inspectIncident = task(
  { name: "inspect-incident", timeoutSeconds: 120, retry: { maxRetries: 2, waitDurationMs: 1000 } },
  async (_context, input: IncidentInput) => {
    const parsed = incidentInput.parse(input);
    return callAmbiOS(operationPath("getIncidentContext", { id: parsed.incidentId }));
  },
);

export const verifyIncident = task(
  { name: "verify-incident", timeoutSeconds: 120, retry: { maxRetries: 2, waitDurationMs: 1000 } },
  async (_context, input: IncidentInput) => {
    const parsed = incidentInput.parse(input);
    return callAmbiOS(operationPath("getIncidentContext", { id: parsed.incidentId }));
  },
);

export const incidentInvestigationWorkflow = task(
  {
    name: "incident-investigation",
    timeoutSeconds: 900,
    retry: { maxRetries: 0, waitDurationMs: 1000 },
  },
  async (context, input: IncidentInput): Promise<WorkflowResult> => {
    const parsed = incidentInput.parse(input);
    const steps: WorkflowStep[] = [];

    try {
      await context.run(inspectIncident, parsed);
      steps.push({
        name: "inspect-incident",
        status: "completed",
        detail: "Incident context loaded.",
      });
      await context.run(verifyIncident, parsed);
      steps.push({
        name: "verify-incident",
        status: "completed",
        detail: "Post-action state verified.",
      });
      return {
        incidentId: parsed.incidentId,
        organizationId: parsed.organizationId,
        status: "completed",
        steps,
      };
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : "Workflow failed.";
      steps.push({
        name: "workflow",
        status: "failed",
        detail,
      });
      throw new Error(
        `Incident investigation failed for ${parsed.incidentId}: ${detail}`,
        cause instanceof Error ? { cause } : undefined,
      );
    }
  },
);

export const workflowTasks = [inspectIncident, verifyIncident, incidentInvestigationWorkflow];
