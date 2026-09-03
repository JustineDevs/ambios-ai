"use client";

import { type IntegrationConnection, IntegrationListSchema } from "@ambios-ai/shared";
import Nango from "@nangohq/frontend";
import { Loader2, RefreshCw, Unplug } from "lucide-react";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { ProviderBentoDetails } from "@/components/integrations/ProviderBentoDetails";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { EnterprisePage, EnterpriseState } from "@/components/ui/enterprise-page";
import { requestOperation } from "@/lib/api-client";

export default function PluginPage({ params }: { params: Promise<{ provider: string }> }) {
  const { provider } = use(params);
  const [item, setItem] = useState<IntegrationConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const nangoRef = useRef<Nango | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestOperation("listIntegrations", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) throw new Error("The provider registry could not be read.");
      setItem(
        IntegrationListSchema.parse(payload).data.integrations.find(
          (entry) => entry.providerId === provider,
        ) ?? null,
      );
    } catch (cause) {
      setItem(null);
      setError(cause instanceof Error ? cause.message : "The provider registry could not be read.");
    } finally {
      setLoading(false);
    }
  }, [provider]);
  useEffect(() => {
    void load();
  }, [load]);
  async function connect() {
    if (!item || item.connectionMode === "mcp_oauth") return;
    setBusy(true);
    setError(null);
    try {
      const response = await requestOperation(
        "connectNango",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
          body: JSON.stringify({ provider: item.providerId }),
        },
        { providerId: item.providerId },
      );
      const payload = (await response.json().catch(() => null)) as {
        data?: { connectSessionToken?: string };
        detail?: string;
      } | null;
      if (!response.ok || !payload?.data?.connectSessionToken)
        throw new Error(payload?.detail ?? "Provider authorization could not start.");
      const nango = new Nango();
      nangoRef.current = nango;
      nango
        .openConnectUI({
          sessionToken: payload.data.connectSessionToken,
          onEvent: () => void load(),
        })
        .open();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Provider authorization could not start.");
    } finally {
      setBusy(false);
    }
  }
  async function verify() {
    if (!item) return;
    setBusy(true);
    setError(null);
    try {
      const response = await requestOperation(
        "verifyIntegration",
        {
          method: "POST",
          headers: { "Idempotency-Key": crypto.randomUUID() },
        },
        { providerId: item.providerId },
      );
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          detail?: string;
          error?: string;
        } | null;
        throw new Error(
          payload?.detail ?? payload?.error ?? "Provider access verification failed.",
        );
      }
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Provider access verification failed.");
    } finally {
      setBusy(false);
    }
  }
  async function disconnect() {
    if (!item || item.connectionMode === "mcp_oauth") return;
    setBusy(true);
    setError(null);
    try {
      const response = await requestOperation(
        "deleteNangoConnect",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
          body: JSON.stringify({ provider: item.providerId, connectionId: item.connectionId }),
        },
        { providerId: item.providerId },
      );
      const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (!response.ok) throw new Error(payload?.detail ?? "Provider disconnect failed.");
      setDisconnectOpen(false);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Provider disconnect failed.");
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return (
      <EnterprisePage eyebrow="Connections" title="Provider details">
        <EnterpriseState
          loading
          title="Reading provider connection"
          description="Loading persisted connection and verification state."
        />
      </EnterprisePage>
    );
  if (error && !item)
    return (
      <EnterprisePage eyebrow="Connections" title="Provider details">
        <EnterpriseState
          tone="danger"
          title="Provider catalog could not be read"
          description={error}
          action={
            <Button variant="outline" onClick={() => void load()}>
              <RefreshCw /> Retry
            </Button>
          }
        />
      </EnterprisePage>
    );
  if (!item)
    return (
      <EnterprisePage eyebrow="Connections" title="Provider details">
        <EnterpriseState
          title="Provider not registered"
          description="This provider is not present in the canonical integration registry."
        />
      </EnterprisePage>
    );
  return (
    <EnterprisePage
      eyebrow="Connections"
      title={item.providerDisplayName}
      description="Inspect the persisted provider connection, capabilities, mappings, verification, and recovery state."
    >
      <ProviderBentoDetails
        item={item}
        initiallyOpen
        onClose={() => window.location.assign("/plugins")}
        busy={busy}
        onConnect={() => void connect()}
        onVerify={() => void verify()}
        onDisconnect={
          item.connectionMode === "mcp_oauth" ? undefined : () => setDisconnectOpen(true)
        }
      />
      <AlertDialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {item.providerDisplayName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This revokes the provider connection for this workspace. Provider actions remain
              blocked until the account is connected and verified again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Keep connected</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void disconnect();
              }}
              disabled={busy}
            >
              {busy ? <Loader2 className="animate-spin" /> : <Unplug />} Disconnect provider
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </EnterprisePage>
  );
}
