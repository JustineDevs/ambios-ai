import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const providerError = searchParams.get("error_description") || searchParams.get("error");
  const requestedNext = searchParams.get("next");
  const next =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        // we can be confident that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(new URL(next, origin));
      }
      const trustedHosts = new Set([
        ...(process.env.AMBIOS_TRUSTED_HOSTS ?? "")
          .split(",")
          .map((host) => host.trim().toLowerCase())
          .filter(Boolean),
      ]);
      if (forwardedHost) {
        try {
          const forwardedUrl = new URL(`https://${forwardedHost}`);
          if (
            forwardedUrl.protocol === "https:" &&
            trustedHosts.has(forwardedUrl.host.toLowerCase())
          ) {
            return NextResponse.redirect(new URL(next, forwardedUrl.origin));
          }
        } catch {
          // Fall back to the request origin when a proxy header is malformed.
        }
      }
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // return the user to an error page with instructions
  const login = new URL("/login", origin);
  login.searchParams.set("error", "auth-code-error");
  if (providerError) login.searchParams.set("error_description", providerError.slice(0, 240));
  if (next !== "/") login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}
