import { createClient } from "@/lib/supabase/server";

export type ServerProxyAuth = {
  accessToken: string | null;
  isDevelopmentBypass: boolean;
};

export async function getServerProxyAuth(): Promise<ServerProxyAuth> {
  const isDevelopmentBypass =
    process.env.NODE_ENV !== "production" && process.env.AUTH_DISABLE === "true";

  if (isDevelopmentBypass) return { accessToken: null, isDevelopmentBypass: true };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { accessToken: null, isDevelopmentBypass: false };

  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { accessToken: session?.access_token ?? null, isDevelopmentBypass: false };
}

/** @deprecated Use getServerProxyAuth for both core and connector proxies. */
export const getNangoProxyAuth = getServerProxyAuth;
