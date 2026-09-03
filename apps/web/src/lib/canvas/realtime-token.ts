import { runtimeEnv } from "@/lib/ambios/runtime";

type CanvasRealtimeClaims = {
  aud: "authenticated";
  canvas_id: string;
  canvas_read: boolean;
  canvas_write: boolean;
  exp: number;
  iat: number;
  role: "authenticated";
  sub: string;
};

function encode(value: string | Uint8Array) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export async function createCanvasRealtimeToken(
  canvasId: string,
  subject: string,
  permissions: { read: boolean; write: boolean },
) {
  const secret = await runtimeEnv("SUPABASE_JWT_SECRET");
  if (!secret) throw new Error("AmbiOS requires SUPABASE_JWT_SECRET for realtime authorization.");
  const now = Math.floor(Date.now() / 1000);
  const header = encode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const claims: CanvasRealtimeClaims = {
    aud: "authenticated",
    canvas_id: canvasId,
    canvas_read: permissions.read,
    canvas_write: permissions.write,
    exp: now + 300,
    iat: now,
    role: "authenticated",
    sub: subject,
  };
  const payload = encode(JSON.stringify(claims));
  const signingInput = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput));
  return `${signingInput}.${encode(new Uint8Array(signature))}`;
}
