import { getD1, getOrganizationForUser } from "@/lib/ambios/d1";

export async function checkCanvasAccess(canvasId: string, userId?: string, shareLink?: string) {
  const organization = userId ? await getOrganizationForUser(userId) : null;
  const db = await getD1();
  if (organization) {
    const incident = await db
      .prepare("SELECT id FROM incidents WHERE id = ? AND organization_id = ? LIMIT 1")
      .bind(canvasId, organization.id)
      .first();
    if (incident)
      return {
        allowed: true as const,
        role: organization.role,
        permissions: { read: true, write: true },
      };
  }
  if (!shareLink) return { allowed: false as const };
  const share = await db
    .prepare(
      "SELECT mode, permissions FROM canvas_shares WHERE canvas_id = ? AND share_link = ? AND (expires_at IS NULL OR datetime(expires_at) > datetime('now')) LIMIT 1",
    )
    .bind(canvasId, shareLink)
    .first<{ mode: string; permissions: string | null }>();
  let permissions: Record<string, boolean> = {};
  if (share?.permissions) {
    try {
      permissions = JSON.parse(share.permissions) as Record<string, boolean>;
    } catch {
      return { allowed: false as const };
    }
  }
  return share?.mode === "public" && permissions.read !== false
    ? { allowed: true as const, role: "viewer" as const, permissions }
    : { allowed: false as const };
}
