import { describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const getSession = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser, getSession },
  })),
}));

describe("getNangoProxyAuth", () => {
  it("forwards the validated Supabase access token", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_DISABLE", "false");
    getUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } });
    getSession.mockResolvedValueOnce({ data: { session: { access_token: "session-token" } } });

    const { getNangoProxyAuth } = await import("./session-proxy");
    await expect(getNangoProxyAuth()).resolves.toEqual({
      accessToken: "session-token",
      isDevelopmentBypass: false,
    });
  });

  it("does not require Supabase in local auth-disabled development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AUTH_DISABLE", "true");

    const { getNangoProxyAuth } = await import("./session-proxy");
    await expect(getNangoProxyAuth()).resolves.toEqual({
      accessToken: null,
      isDevelopmentBypass: true,
    });
  });
});
