"use client";

import { IntegrationListSchema } from "@ambios-ai/shared";
import { useEffect, useState } from "react";
import { OnboardingChecklist } from "@/components/ui/onboarding-checklist";
import { OnboardingScreen } from "@/components/ui/onboarding-screen";
import { requestOperation } from "@/lib/api-client";

export default function OnboardingPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<{
    workspace: { id: string; name: string } | null;
    integrations: { provider: string; status: string }[];
  } | null>(null);
  useEffect(() => {
    void Promise.all([
      requestOperation("getWorkspace", { cache: "no-store" }),
      requestOperation("listIntegrations", { cache: "no-store" }),
    ])
      .then(async ([workspaceResponse, integrationsResponse]) => {
        if (!workspaceResponse.ok || !integrationsResponse.ok) return;
        const workspace = (await workspaceResponse.json()) as {
          organization?: { id: string; name: string } | null;
        };
        const integrations = IntegrationListSchema.parse(await integrationsResponse.json()).data
          .integrations;
        setReadiness({
          workspace: workspace.organization ?? null,
          integrations: integrations.map((item) => ({
            provider: item.providerId,
            status: item.connectionStatus,
          })),
        });
      })
      .catch(() => setReadiness(null));
  }, []);
  async function createWorkspace(data: { businessName: string; legalName: string }) {
    const response = await requestOperation("getWorkspace", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify({ name: data.businessName }),
    });
    setMessage(
      response.ok
        ? "Workspace created. Connect the required providers before reviewable actions are enabled."
        : "Workspace setup failed. Check the error and retry.",
    );
    if (response.ok) {
      const [workspaceResponse, integrationsResponse] = await Promise.all([
        requestOperation("getWorkspace", { cache: "no-store" }),
        requestOperation("listIntegrations", { cache: "no-store" }),
      ]);
      const workspace = (await workspaceResponse.json().catch(() => null)) as {
        organization?: { id: string; name: string } | null;
      } | null;
      const integrations = IntegrationListSchema.parse(await integrationsResponse.json()).data
        .integrations;
      setReadiness({
        workspace: workspace?.organization ?? null,
        integrations: integrations.map((item) => ({
          provider: item.providerId,
          status: item.connectionStatus,
        })),
      });
    }
  }
  return (
    <section className="grid gap-6">
      <div>
        <p className="text-muted-foreground text-sm">First-run setup</p>
        <h1 className="font-semibold text-3xl">Create your workspace</h1>
        <p className="mt-2 text-muted-foreground">
          Set the shared context where humans, agents, and services collaborate.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <OnboardingScreen
          title="Create your workspace"
          subtitle="Set the shared context where people, agents, and services collaborate."
          businessNameLabel="Workspace name"
          businessNamePlaceholder="AmbiOS workspace"
          legalNameLabel="Organization name"
          legalNamePlaceholder="Legal organization name"
          onComplete={createWorkspace}
        />
        <div className="grid content-start gap-3">
          <OnboardingChecklist
            title="Workspace readiness"
            steps={[
              {
                id: 1,
                title: "Create workspace",
                isCompleted: Boolean(readiness?.workspace),
              },
              {
                id: 2,
                title: "Connect OpenAI API access",
                isCompleted:
                  readiness?.integrations.some(
                    (item) => item.provider === "openai" && item.status === "connected",
                  ) ?? false,
              },
              {
                id: 3,
                title: "Connect GitHub",
                isCompleted:
                  readiness?.integrations.some(
                    (item) => item.provider === "github" && item.status === "connected",
                  ) ?? false,
              },
              { id: 4, title: "Review agent guardrails", isCompleted: false },
            ]}
          />
          {message && (
            <p aria-live="polite" className="text-muted-foreground text-sm">
              {message}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
