"use client";

import type { SecurityVendor } from "@/lib/canvas/types";

export function SecurityDashboard({
  vendor,
  data,
}: {
  vendor: SecurityVendor;
  data: Record<string, unknown>;
}) {
  const entries = Object.entries(data).slice(0, 12);
  const permissions = Array.isArray(data.permissions)
    ? data.permissions.filter((item): item is string => typeof item === "string")
    : [];
  return (
    <div className="mt-3 rounded-lg border bg-muted/20 p-3 text-xs">
      <p className="font-medium">{vendor} security details</p>
      {permissions.length > 0 && (
        <div className="mt-2 border-t pt-2">
          <p className="font-medium">Access scope</p>
          <ul className="mt-1 grid gap-1 text-muted-foreground">
            {permissions.map((permission) => (
              <li key={permission}>• {permission}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-2 grid gap-1 text-muted-foreground">
        {entries.length ? (
          entries.map(([key, value]) => (
            <div className="flex justify-between gap-3" key={key}>
              <span>{key}</span>
              <span className="max-w-48 truncate text-right text-foreground">
                {typeof value === "string" || typeof value === "number"
                  ? String(value)
                  : JSON.stringify(value)}
              </span>
            </div>
          ))
        ) : (
          <span>No findings returned.</span>
        )}
      </div>
    </div>
  );
}
