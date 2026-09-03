"use client";

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
    void requestOperation("getNangoConnect", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { data?: typeof readiness }) => setReadiness(payload.data ?? null));
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
      const refreshed = await requestOperation("getNangoConnect", { cache: "no-store" });
      const payload = (await refreshed.json().catch(() => null)) as {
        data?: typeof readiness;
      } | null;
      setReadiness(payload?.data ?? null);
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
                title: "Connect your ChatGPT account through MCP OAuth",
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
