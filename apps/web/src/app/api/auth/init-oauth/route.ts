import { NextResponse } from "next/server";

/**
 * The legacy browser OAuth initializer must not accept client secrets or
 * create an unbound session. Keep the documented endpoint explicit until the
 * server-side integration OAuth flow replaces it.
 */
export async function POST() {
  return NextResponse.json(
    {
      status: "unsupported",
      code: "INTEGRATION_OAUTH_UNSUPPORTED",
      message: "The legacy browser OAuth initializer is not enabled.",
      next_step: "Use a configured server-side provider connection.",
    },
    { status: 501 },
  );
}
