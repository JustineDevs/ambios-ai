import { operationPath, serviceOriginsFromEnv } from "@ambios-ai/shared";
import { AgentClient } from "@/lib/agent/agent-client";
import type { AgentRequest } from "@/lib/agent/agent-types";
import { initializeUserAIModel } from "@/lib/ai/nango-model";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const agentChatPath = operationPath("agentChat");

function errorResponse(message: string, status: 400 | 401 | 503) {
  let problemType = "agent_request";
  let title = "Agent request failed";
  let code = "AGENT_REQUEST_INVALID";

  if (status === 401) {
    problemType = "auth_required";
    title = "Authentication required";
    code = "AUTH_REQUIRED";
  } else if (status === 503) {
    code = "AGENT_RUNTIME_UNAVAILABLE";
  }

  return Response.json(
    {
      type: `https://ambios.ai/problems/${problemType}`,
      title,
      status,
      detail: message,
      instance: agentChatPath,
      code,
      error: message,
    },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ") || authorization.length <= "Bearer ".length) {
    return errorResponse("A user session is required for agent requests.", 401);
  }

  let body: AgentRequest;
  try {
    body = (await request.json()) as AgentRequest;
  } catch {
    return errorResponse("Request body must be valid JSON.", 400);
  }

  const token = authorization.slice("Bearer ".length).trim();
  let userId: string;
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user) return errorResponse("A valid user session is required.", 401);
    userId = user.id;
  } catch {
    return errorResponse("Authentication service is unavailable.", 503);
  }
  const apiEndpoint = process.env.API_ENDPOINT ?? serviceOriginsFromEnv(process.env).coreApiOrigin;
  try {
    // Chat credentials are workspace-scoped Nango connections, not deployment
    // environment variables. This keeps the selector and Connect flow on the
    // same source of truth and prevents a false "runtime not configured" state.
    const modelInstance = await initializeUserAIModel(userId, body.model, token);
    const client = new AgentClient({
      token,
      apiEndpoint,
      model: body.model,
      modelInstance,
      abortSignal: request.signal,
    });
    const validated = client.validateRequest(body);
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of client.streamResponse(validated)) {
            controller.enqueue(encoder.encode(`${JSON.stringify(chunk)}\n`));
          }
          controller.close();
        } catch (cause) {
          const message = "Agent request failed. Check the run details and try again if safe.";
          controller.enqueue(
            encoder.encode(
              `${JSON.stringify({
                type: "error",
                content: message,
                errorDetails: message,
              })}\n`,
            ),
          );
          controller.close();
        } finally {
          client.disconnect();
        }
      },
      cancel() {
        client.disconnect();
      },
    });

    return new Response(stream, {
      headers: {
        "Cache-Control": "no-cache, no-store",
        Connection: "keep-alive",
        "Content-Type": "application/x-ndjson; charset=utf-8",
      },
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Agent runtime is unavailable.";
    const isRuntimeFailure =
      /not configured|not connected|missing|api key|credential|model|integration|organization/i.test(
        message,
      );
    return errorResponse(
      isRuntimeFailure
        ? message.includes("not connected")
          ? "OpenAI is not connected for this workspace. Connect OpenAI before starting chat."
          : "Agent runtime is not available. Check workspace model configuration."
        : "Agent request could not be started.",
      isRuntimeFailure ? 503 : 400,
    );
  }
}
