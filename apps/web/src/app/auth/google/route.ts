import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const requestedNext = requestUrl.searchParams.get("next");
  const next =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/";
  const callback = new URL("/auth/callback", requestUrl.origin);
  callback.searchParams.set("next", next);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString() },
    });

    if (!error && data.url) return NextResponse.redirect(data.url);
  } catch {
    // Fall through to the same safe login error page used by the callback.
  }

  const login = new URL("/login", requestUrl.origin);
  login.searchParams.set("error", "auth-start-error");
  login.searchParams.set("error_description", "Google sign-in could not be started.");
  if (next !== "/") login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}
