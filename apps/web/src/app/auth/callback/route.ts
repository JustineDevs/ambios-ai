import { serviceOriginsFromEnv } from "@ambios-ai/shared";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = serviceOriginsFromEnv(process.env).frontendOrigin;
  const code = searchParams.get("code");
  let providerError = searchParams.get("error_description") || searchParams.get("error");
  const requestedNext = searchParams.get("next");
  const next =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/";

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.warn("[auth.callback] code exchange rejected", {
          code: error.code ?? error.name ?? "AUTH_EXCHANGE_FAILED",
          status: error.status ?? null,
        });
        providerError = safeAuthError(error.code ?? error.name);
      } else {
        return NextResponse.redirect(new URL(next, origin));
      }
    } catch (error) {
      console.error("[auth.callback] code exchange unavailable", {
        error: error instanceof Error ? error.name : "AUTH_EXCHANGE_UNAVAILABLE",
      });
      providerError = "Authentication service is unavailable.";
    }
  }

  // return the user to an error page with instructions
  const login = new URL("/login", origin);
  login.searchParams.set("error", "auth-code-error");
  if (providerError) login.searchParams.set("error_description", providerError.slice(0, 240));
  if (next !== "/") login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}

function safeAuthError(code: string | null | undefined): string {
  switch (code) {
    case "bad_code_verifier":
    case "pkce_code_verifier_not_found":
    case "invalid_grant":
      return "This sign-in session expired or was opened in a different browser tab. Start Google sign-in again.";
    case "flow_state_expired":
    case "flow_state_not_found":
      return "This sign-in session expired. Start Google sign-in again.";
    default:
      return "Google sign-in could not be completed. Start again.";
  }
}
