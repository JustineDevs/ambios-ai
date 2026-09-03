import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|googleb24d000c6a1cb7c4.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
