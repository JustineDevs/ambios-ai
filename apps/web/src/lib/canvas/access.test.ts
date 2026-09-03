import { beforeEach, describe, expect, it, vi } from "vitest";

const { getD1, getOrganizationForUser } = vi.hoisted(() => ({
  getD1: vi.fn(),
  getOrganizationForUser: vi.fn(),
}));

vi.mock("@/lib/ambios/d1", () => ({ getD1, getOrganizationForUser }));

import { checkCanvasAccess } from "./access";

function database(first: unknown) {
  return {
    prepare: vi.fn(() => ({
      bind: vi.fn(() => ({ first: vi.fn().mockResolvedValue(first) })),
    })),
  };
}

describe("canvas access", () => {
  beforeEach(() => {
    getD1.mockReset();
    getOrganizationForUser.mockReset();
  });

  it("limits authenticated access to incidents in the user's organization", async () => {
    getOrganizationForUser.mockResolvedValue({ id: "org-a", role: "member" });
    getD1.mockResolvedValue(database({ id: "incident-a" }));

    await expect(checkCanvasAccess("incident-a", "user-a")).resolves.toEqual({
      allowed: true,
      role: "member",
      permissions: { read: true, write: true },
    });
  });

  it("rejects expired or malformed public share records", async () => {
    getD1.mockResolvedValue(database({ mode: "public", permissions: "not-json" }));
    await expect(checkCanvasAccess("incident-a", undefined, "share-a")).resolves.toEqual({
      allowed: false,
    });
  });

  it("grants only the permissions encoded by a live public share", async () => {
    getD1.mockResolvedValue(
      database({ mode: "public", permissions: JSON.stringify({ read: true, write: false }) }),
    );

    await expect(checkCanvasAccess("incident-a", undefined, "share-a")).resolves.toEqual({
      allowed: true,
      role: "viewer",
      permissions: { read: true, write: false },
    });
  });
});
