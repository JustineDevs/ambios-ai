import { operationPath, operationRegistry, serviceOriginsFromEnv } from "@ambios-ai/shared";
import { type NextRequest, NextResponse } from "next/server";
import { getServerProxyAuth } from "@/lib/nango/session-proxy";

const { coreApiOrigin, connectorApiOrigin } = serviceOriginsFromEnv(process.env);
const apiPrefix = operationPath("getHealth").replace(/\/[^/]+$/, "");

const hopByHopHeaders = new Set([
  "connection",
  "content-length",
  "host",
  "transfer-encoding",
  "authorization",
]);

function matchesTemplate(template: string, actual: string) {
  const expected = template.split("/").filter(Boolean);
  const received = actual.split("/").filter(Boolean);
  if (expected.length !== received.length && !expected.at(-1)?.endsWith("*")) return false;
  return expected.every((segment, index) => {
    if (segment.endsWith("*")) return true;
    return segment.startsWith(":") || segment === received[index];
  });
}

function operationForRequest(method: string, path: string) {
  return operationRegistry
    .filter((operation) => operation.method === method || operation.method === "ALL")
    .filter((operation) => matchesTemplate(operation.pathTemplate, path))
    .sort((left, right) => {
      const leftSpecificity = left.pathTemplate
        .split("/")
        .filter((segment) => segment && !segment.startsWith(":") && !segment.endsWith("*")).length;
      const rightSpecificity = right.pathTemplate
        .split("/")
        .filter((segment) => segment && !segment.startsWith(":") && !segment.endsWith("*")).length;
      return rightSpecificity - leftSpecificity;
    })[0];
}

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
  const auth = await getServerProxyAuth(request);
  if (!auth.accessToken) {
    return NextResponse.json(
      { code: "AUTH_REQUIRED", error: "A valid Supabase session is required." },
      { status: 401 },
    );
  }

  const { path } = await context.params;
  const operation = operationForRequest(request.method, `${apiPrefix}/${path.join("/")}`);
  if (!operation) {
    return Response.json(
      {
        type: "https://ambios.ai/problems/unsupported-operation",
        title: "Unsupported operation",
        status: 404,
        detail: "The requested API operation is not registered.",
        instance: request.nextUrl.pathname,
        code: "UNSUPPORTED_OPERATION",
      },
      { status: 404, headers: { "Content-Type": "application/problem+json" } },
    );
  }
  const origin =
    operation.runtimeOwner === "connector-execution" ? connectorApiOrigin : coreApiOrigin;
  const target = new URL(
    `${origin.replace(/\/$/, "")}${apiPrefix}/${path.map(encodeURIComponent).join("/")}`,
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
