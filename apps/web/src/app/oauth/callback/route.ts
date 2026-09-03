import { NextResponse } from "next/server";

/**
 * Integration OAuth is intentionally not enabled until the server-side token
 * exchange and encrypted connection storage are available. Keep this callback
 * routable so providers receive a valid redirect target and users receive a
 * truthful, structured result instead of a rewrite-generated 501.
 */
export function GET() {
  return NextResponse.json(
    {
      status: "unsupported",
      code: "INTEGRATION_OAUTH_UNSUPPORTED",
      message: "Integration OAuth is not enabled in this deployment.",
      next_step: "Configure a supported server-side provider connection before retrying.",
    },
    { status: 501 },
  );
}
