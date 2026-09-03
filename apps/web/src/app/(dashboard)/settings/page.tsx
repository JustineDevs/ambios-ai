"use client";

import { ArrowRight, KeyRound, PlugZap, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/operations/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnterprisePage, EnterpriseState } from "@/components/ui/enterprise-page";
import { requestOperation } from "@/lib/api-client";
import { useAuthClient } from "@/lib/auth-client";

type Workspace = { organization: { id: string; name: string } | null };

export default function SettingsPage() {
  const { user } = useAuthClient();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    requestOperation("getWorkspace")
      .then((response) => response.json())
      .then((payload) => {
        const data = (payload as { data?: Workspace }).data;
        setWorkspace(data ?? null);
      })
      .catch(() => setError("Workspace settings could not be loaded."));
  }, []);
  return (
    <EnterprisePage
      eyebrow="Manage"
      title="Settings"
      description="Manage account, workspace, provider connections, policies, budgets, retention, and audit controls from explicit domains."
    >
      {error && <EnterpriseState tone="danger" title="Settings unavailable" description={error} />}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal account</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate font-medium text-sm">{user?.email ?? "Account not loaded"}</p>
              <p className="mt-1 text-muted-foreground text-sm">
                Profile, sessions, preferences, and authorization.
              </p>
            </div>
            <Link className="shrink-0" href="/account" aria-label="Open account settings">
              <UserRound className="size-5" />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Organization governance</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium text-sm">
                {workspace?.organization?.name ?? "No organization"}
              </p>
              <p className="mt-1 text-muted-foreground text-sm">
                Members, workspaces, roles, and policy boundaries.
              </p>
            </div>
            <Link className="shrink-0" href="/organization" aria-label="Open organization settings">
              <UsersRound className="size-5" />
            </Link>
          </CardContent>
        </Card>
      </div>
      <section className="grid gap-3" aria-label="Settings areas">
        <h2 className="font-medium text-lg">Workspace controls</h2>
        {[
          [
            "Provider integrations",
            "Manage persisted provider connections and capabilities.",
            "/plugins",
            PlugZap,
          ],
          [
            "API keys",
            "Review the current availability of scoped API key management.",
            "/settings/api-keys",
            KeyRound,
          ],
        ].map(([title, description, href, Icon]) => {
          const RowIcon = Icon as typeof PlugZap;
          return (
            <Link
              key={href as string}
              href={href as string}
              className="group flex items-center justify-between rounded-xl border p-4 transition-colors hover:bg-muted/40"
            >
              <span className="flex min-w-0 items-center gap-3">
                <RowIcon className="size-5 shrink-0" />
                <span>
                  <span className="block font-medium text-sm">{title as string}</span>
                  <span className="mt-1 block text-muted-foreground text-sm">
                    {description as string}
                  </span>
                </span>
              </span>
              <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-1" />
            </Link>
          );
        })}
      </section>
      <section className="rounded-xl border p-5">
        <div className="flex items-center gap-2">
          <StatusBadge status="unsupported" />
          <h2 className="font-medium">Manage your data</h2>
        </div>
        <p className="mt-2 text-muted-foreground text-sm">
          Review retention, export, and privacy recovery options.
        </p>
        <Link className="mt-3 inline-block text-primary text-sm underline" href="/privacy">
          Read privacy details
        </Link>
        <p className="mt-2 text-muted-foreground text-xs">
          Data export and deletion actions are not available until their backend operations are
          mounted.
        </p>
      </section>
    </EnterprisePage>
  );
}
