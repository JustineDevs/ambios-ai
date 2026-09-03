"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/operations/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnterprisePage, EnterpriseState } from "@/components/ui/enterprise-page";
import { Separator } from "@/components/ui/separator";
import { requestOperation } from "@/lib/api-client";

type Identity = { id?: string; email?: string; environment?: string };
type Workspace = { organization?: { name?: string } | null; agent?: { name?: string } | null };

export default function AccountPage() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    Promise.all([requestOperation("getIdentity"), requestOperation("getWorkspace")])
      .then(async ([identityResponse, workspaceResponse]) => {
        if (!identityResponse.ok || !workspaceResponse.ok)
          throw new Error("Account data is unavailable.");
        setIdentity((await identityResponse.json()) as Identity);
        const payload = (await workspaceResponse.json()) as { data?: Workspace };
        setWorkspace(payload.data ?? null);
      })
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : "Account data is unavailable."),
      );
  }, []);
  return (
    <EnterprisePage
      eyebrow="Personal"
      title="Account"
      description="Review your identity, workspace access, and account security boundary."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Account data unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : !identity ? (
        <EnterpriseState
          loading
          title="Loading account"
          description="Reading the authenticated identity and workspace context."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Avatar>
                <AvatarFallback>{(identity.email ?? "A").slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{identity.email ?? "Authenticated user"}</p>
                <p className="text-muted-foreground text-sm">
                  {identity.environment ?? "Environment not reported"}
                </p>
              </div>
              <Badge variant="secondary" className="ml-auto">
                Authenticated
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Workspace access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {workspace?.organization?.name ?? "No organization selected"}
              </p>
              <p className="mt-1 text-muted-foreground text-sm">
                {workspace?.agent?.name
                  ? `Active agent: ${workspace.agent.name}`
                  : "Workspace setup is required."}
              </p>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Security and connected clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm">MCP authorization</span>
                <StatusBadge status="unsupported" />
              </div>
              <Separator className="my-4" />
              <p className="text-muted-foreground text-sm">
                Session management and ChatGPT MCP authorization controls are not exposed by the
                current backend contract. No authorization state is inferred here.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </EnterprisePage>
  );
}
