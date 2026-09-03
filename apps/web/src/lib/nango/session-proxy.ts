import { createClient } from "@/lib/supabase/server";

export type ServerProxyAuth = {
  accessToken: string | null;
};

export async function getServerProxyAuth(request?: Request): Promise<ServerProxyAuth> {
  const authorization = request?.headers.get("Authorization");
  if (authorization?.startsWith("Bearer "))
    return { accessToken: authorization.slice("Bearer ".length).trim() || null };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { accessToken: null };

  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { accessToken: session?.access_token ?? null };
}
