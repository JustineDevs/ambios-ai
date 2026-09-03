import { createClient } from "@/lib/supabase/server";
import { error } from "./response";

export async function requireToolUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? user : null;
}

export async function allowToolCall(key: string, limit = 30) {
  // Rate limiting is authoritative in the Hono Worker. Next is only a Vercel
  // presentation runtime and must never attempt to access Cloudflare bindings.
  void key;
  void limit;
  return true;
}

export async function auditToolCall(
  name: string,
  userId: string,
  outcome: "accepted" | "rejected",
  details: {
    actorType?: "human" | "agent" | "system";
    input?: unknown;
    output?: unknown;
    incidentId?: string;
    relatedResourceType?: string;
    relatedResourceId?: string;
    approvalState?: string;
    guardrailDecision?: unknown;
  } = {},
) {
  void name;
  void userId;
  void outcome;
  void details;
  throw new Error("Audit persistence is owned by the Hono Worker.");
}

export function unauthorized() {
  return error("Authentication required", 401, "AUTHENTICATION_REQUIRED");
}

export function rateLimited() {
  return error("WebMCP rate limit exceeded", 429, "RATE_LIMITED");
}

export async function enforceRateLimit(key: string, limit = 30) {
  try {
    return (await allowToolCall(key, limit)) ? null : rateLimited();
  } catch {
    return error(
      "Durable rate-limit storage is unavailable",
      503,
      "RATE_LIMIT_PERSISTENCE_UNAVAILABLE",
    );
  }
}

export function persistenceUnavailable() {
  return error(
    "Durable audit storage is unavailable; configure the Cloudflare DB binding.",
    503,
    "AUDIT_PERSISTENCE_UNAVAILABLE",
  );
}
