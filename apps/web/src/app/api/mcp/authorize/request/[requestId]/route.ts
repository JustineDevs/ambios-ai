import { operationPath, serviceOriginsFromEnv } from "@ambios-ai/shared";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await params;
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(requestId))
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const endpoint = `${serviceOriginsFromEnv(process.env).coreApiOrigin}${operationPath("mcpAuthorizationRequest", { requestId })}`;
  const response = await fetch(endpoint, { cache: "no-store" });
  return NextResponse.json(await response.json().catch(() => ({ error: "invalid_response" })), {
    status: response.status,
  });
}
