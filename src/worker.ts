import { createHonoApp } from "./hono-app";

export interface Env {
  ENVIRONMENT?: string;
  AUTH_DISABLE?: string;
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  QUEUE: Queue;
  NANGO_SECRET_KEY?: string;
  NANGO_HOST?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  MCP_AUTHORIZATION_SERVER_URL?: string;
  MCP_AUTH_UI_URL?: string;
  MCP_RESOURCE_URL?: string;
  OPENAI_APPS_CHALLENGE_TOKEN?: string;
}

const hono = createHonoApp();

/**
 * Core owns synchronous domain/API traffic and queue production. Queue
 * consumption is intentionally isolated in connector-worker.ts so provider
 * execution cannot be accidentally reintroduced into the Core bundle.
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (!env.DB || !env.KV || !env.R2 || !env.QUEUE) {
      return Response.json(
        { error: "AmbiOS runtime bindings are not configured" },
        { status: 503 },
      );
    }
    if (env.ENVIRONMENT === "production" && new URL(request.url).protocol !== "https:") {
      return Response.redirect(request.url.replace(/^http:/, "https:"), 301);
    }
    return hono.fetch(request, env, ctx);
  },
};
