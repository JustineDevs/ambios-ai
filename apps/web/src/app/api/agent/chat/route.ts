import { serviceOriginsFromEnv } from "@ambios-ai/shared";
import { AgentClient } from "@/lib/agent/agent-client";
import type { AgentRequest } from "@/lib/agent/agent-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(message: string, status: 400 | 401 | 503) {
  return Response.json(
    {
      code:
        status === 401
          ? "AUTH_REQUIRED"
          : status === 503
            ? "AGENT_RUNTIME_UNAVAILABLE"
            : "AGENT_REQUEST_INVALID",
      error: message,
    },
    { status },
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
  const apiEndpoint = process.env.API_ENDPOINT ?? serviceOriginsFromEnv(process.env).coreApiOrigin;
  const hasGatewayRuntime = Boolean(process.env.AI_GATEWAY_API_KEY && process.env.AI_GATEWAY_MODEL);
  const configuredProvider = process.env.LLM_PROVIDER?.trim().toLowerCase();
  if (!hasGatewayRuntime && !configuredProvider) {
    return errorResponse(
      "Agent runtime is not configured. Connect a supported model provider before starting an agent run.",
      503,
    );
  }
  try {
    const client = new AgentClient({
      token,
      apiEndpoint,
      model: body.model,
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
          const message = cause instanceof Error ? cause.message : "Agent request failed.";
          controller.enqueue(
            encoder.encode(`${JSON.stringify({ type: "error", errorDetails: message })}\n`),
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
    const isRuntimeFailure = /not configured|missing|api key|credential|model/i.test(message);
    return errorResponse(message, isRuntimeFailure ? 503 : 400);
  }
}
