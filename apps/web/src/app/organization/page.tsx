"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/operations/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnterprisePage, EnterpriseState } from "@/components/ui/enterprise-page";
import { requestOperation } from "@/lib/api-client";

type Workspace = {
  organization?: { id?: string; name?: string } | null;
  agent?: { name?: string } | null;
};

export default function OrganizationPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    requestOperation("getWorkspace", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as {
          data?: Workspace;
          error?: string;
        } | null;
        if (!response.ok) throw new Error(payload?.error ?? "Organization data is unavailable.");
        setWorkspace(payload?.data ?? null);
      })
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : "Organization data is unavailable."),
      );
  }, []);
  return (
    <EnterprisePage
      eyebrow="Manage"
      title="Organization"
      description="Review the organization and workspace context that scopes people, agents, providers, and governance."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Organization data unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : !workspace ? (
        <EnterpriseState
          loading
          title="Loading organization"
          description="Reading the authorized organization context."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Current organization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-xl">
                {workspace.organization?.name ?? "No organization selected"}
              </p>
              <p className="mt-2 text-muted-foreground text-sm">
                {workspace.organization?.id
                  ? `Organization record: ${workspace.organization.id}`
                  : "Create a workspace before managing organization access."}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Governance boundary</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusBadge status={workspace.organization ? "ready" : "blocked"} />
              <p className="mt-3 text-muted-foreground text-sm">
                Role, member, policy, ownership, and organization-audit records require dedicated
                backend operations that are not currently mounted.
              </p>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Administration surfaces</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Members, workspaces, roles, policies, ownership, and domain verification are
                intentionally unavailable until persisted organization-management endpoints are
                implemented. This page does not show placeholder rows or imply access.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </EnterprisePage>
  );
}
