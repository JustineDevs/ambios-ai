import { operationPath } from "@ambios-ai/shared";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  const apiPrefix = operationPath("getHealth").replace(/\/[^/]+$/, "");
  const mcpResourcePath = operationPath("mcp");
  const mcpAuthorizationUiPath = operationPath("mcp") + operationPath("mcpAuthorize");
  const mcpOAuthPaths = new Set([
    operationPath("mcpAuthorize"),
    operationPath("mcpRegister"),
    operationPath("mcpToken"),
  ]);
  const developmentAuthDisabled =
    process.env.NODE_ENV !== "production" && process.env.AUTH_DISABLE === "true";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    if (developmentAuthDisabled) {
      // Local auth-disabled development is intentionally usable without a
      // Supabase project. Production never enters this branch because the
      // bypass requires NODE_ENV !== "production".
      return NextResponse.next({ request });
    }
    throw new Error(
      "AmbiOS requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env and configure Supabase.",
    );
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const {
    data: { user },
  } = developmentAuthDisabled ? { data: { user: null } } : await supabase.auth.getUser();
  const isPublicCanvasShare =
    request.nextUrl.pathname.includes("/incidents/") &&
    request.nextUrl.pathname.endsWith("/canvas") &&
    request.nextUrl.searchParams.has("shareLink");
  const isPublicMcpOAuthEndpoint =
    request.nextUrl.pathname.startsWith("/.well-known/") ||
    mcpOAuthPaths.has(request.nextUrl.pathname);

  if (
    !developmentAuthDisabled &&
    !user &&
    request.nextUrl.pathname.startsWith(apiPrefix) === false &&
    request.nextUrl.pathname !== mcpResourcePath &&
    request.nextUrl.pathname !== mcpAuthorizationUiPath &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/oauth") &&
    !request.nextUrl.pathname.startsWith("/terms") &&
    !request.nextUrl.pathname.startsWith("/privacy") &&
    !request.nextUrl.pathname.startsWith("/support") &&
    !isPublicMcpOAuthEndpoint &&
    !isPublicCanvasShare
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    if (next !== "/login") url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
