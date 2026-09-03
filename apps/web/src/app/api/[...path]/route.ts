import { serviceOriginsFromEnv } from "@ambios-ai/shared";
import { type NextRequest, NextResponse } from "next/server";
import { getServerProxyAuth } from "@/lib/nango/session-proxy";

const { coreApiOrigin, connectorApiOrigin } = serviceOriginsFromEnv(process.env);

const hopByHopHeaders = new Set([
  "connection",
  "content-length",
  "host",
  "transfer-encoding",
  "authorization",
]);

const connectorPaths = (path: string[]) =>
  path[0] === "nango" || (path[0] === "integrations" && path.length >= 2);

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context);
}

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const auth = await getServerProxyAuth();
  if (!auth.accessToken && !auth.isDevelopmentBypass) {
    return NextResponse.json(
      { code: "AUTH_REQUIRED", error: "A valid Supabase session is required." },
      { status: 401 },
    );
  }

  const { path } = await context.params;
  const origin = connectorPaths(path) ? connectorApiOrigin : coreApiOrigin;
  const target = new URL(
    `${origin.replace(/\/$/, "")}/api/${path.map(encodeURIComponent).join("/")}`,
  );
  target.search = request.nextUrl.search;
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase())) headers.set(key, value);
  });
  if (auth.accessToken) headers.set("Authorization", `Bearer ${auth.accessToken}`);

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const response = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: "no-store",
  });
  const responseHeaders = new Headers();
  response.headers.forEach((value, key) => {
    if (!["content-length", "content-encoding", "transfer-encoding"].includes(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });
  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}
