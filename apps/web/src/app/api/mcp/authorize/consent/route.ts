import { operationPath, serviceOriginsFromEnv } from "@ambios-ai/shared";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const endpoint = `${serviceOriginsFromEnv(process.env).coreApiOrigin}${operationPath("mcpConsent")}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return NextResponse.json(await response.json().catch(() => ({ error: "invalid_response" })), {
    status: response.status,
  });
}
