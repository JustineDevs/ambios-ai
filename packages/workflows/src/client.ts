import { Render } from "@renderinc/sdk";
import { z } from "zod";

const investigationRequest = z.object({
  incidentId: z.string().min(1).max(128),
  organizationId: z.string().min(1).max(128),
});

export async function startIncidentInvestigation(input: unknown) {
  const taskSlug = process.env.RENDER_INCIDENT_INVESTIGATION_TASK;
  if (!taskSlug)
    throw new Error("RENDER_INCIDENT_INVESTIGATION_TASK is required to start an investigation.");

  const request = investigationRequest.parse(input);
  const render = new Render({ token: process.env.RENDER_API_KEY });
  return render.workflows.startTask(taskSlug, [request]);
}
