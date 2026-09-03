"use client";

import {
  INTEGRATION_CATALOG,
  type IntegrationConnection,
  IntegrationListSchema,
} from "@ambios-ai/shared";
import Nango from "@nangohq/frontend";
import { ExternalLink, Loader2, Unplug } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ConnectorLockIndicator,
  ConnectorStatusIndicator,
} from "@/components/integrations/ConnectorStatusIndicator";
import { ProviderBentoDetails } from "@/components/integrations/ProviderBentoDetails";
import { ProviderLogo } from "@/components/integrations/ProviderLogo";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnterprisePage, EnterpriseState, Freshness } from "@/components/ui/enterprise-page";
import { requestOperation } from "@/lib/api-client";

type Filter = "all" | "connected" | "attention" | "available" | "unsupported";

function statusLabel(item: IntegrationConnection) {
  if (item.connectionStatus === "not_configured") return "Not configured";
  if (item.connectionStatus === "authorization_pending") return "Authorization pending";
  if (item.connectionStatus === "reauthentication_required") return "Needs re-authentication";
  if (item.connectionStatus === "revoked") return "Revoked";
  if (item.connectionStatus === "unsupported") return "Unsupported";
  if (item.connectionStatus === "error")
    return item.connectionHealth === "unavailable" ? "Unavailable" : "Connection error";
  if (item.connectionStatus === "connected" && item.lastSuccessfulVerificationAt)
    return "Connected, verified";
  if (item.connectionStatus === "connected") return "Connected, verification required";
  return "Disconnected";
}

function capabilityLine(item: IntegrationConnection) {
  if (item.connectionStatus === "unsupported") return "Cataloged for a future connector.";
  if (item.connectionStatus === "not_configured")
    return "Connect to inspect available workspace resources.";
  if (item.capabilities.length) return item.capabilities.join(" · ");
  return item.lastErrorMessageSafe ?? "Capability evidence is not available yet.";
}

function catalogEntry(providerId: string) {
  return INTEGRATION_CATALOG.find((entry) => entry.provider === providerId);
}

function formatDate(value: string | null) {
  if (!value) return "Not verified";
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? "Not verified"
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

async function loadIntegrations() {
  const response = await requestOperation("listIntegrations", { cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok)
    throw new Error(
      payload &&
        typeof payload === "object" &&
        "detail" in payload &&
        typeof payload.detail === "string"
        ? payload.detail
        : "The provider registry could not be read.",
    );
  return IntegrationListSchema.parse(payload).data.integrations;
}

export default function PluginsPage() {
  const [items, setItems] = useState<IntegrationConnection[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [providerErrors, setProviderErrors] = useState<Record<string, string>>({});
  const [disconnectTarget, setDisconnectTarget] = useState<IntegrationConnection | null>(null);
  const nangoRef = useRef<Nango | null>(null);
  const refresh = useCallback(async () => {
    setError(null);
    try {
      setItems(await loadIntegrations());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The provider registry could not be read.");
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const providers = useMemo(() => items ?? [], [items]);
  const visible = providers.filter(
    (item) =>
      filter === "all" ||
      (filter === "connected" && item.connectionStatus === "connected") ||
      (filter === "attention" &&
        ["error", "reauthentication_required", "authorization_pending"].includes(
          item.connectionStatus,
        )) ||
      (filter === "available" && item.connectionStatus === "not_configured") ||
      (filter === "unsupported" && item.connectionStatus === "unsupported"),
  );
  async function connect(item: IntegrationConnection) {
    setBusy(item.providerId);
    setError(null);
    setProviderErrors((current) => ({ ...current, [item.providerId]: "" }));
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
          onEvent: (event) => {
            if (event.type === "connect" || event.type === "ready") void refresh();
          },
        })
        .open();
      await refresh();
    } catch (cause) {
      setProviderErrors((current) => ({
        ...current,
        [item.providerId]:
          cause instanceof Error ? cause.message : "Provider authorization could not start.",
      }));
    } finally {
      setBusy(null);
    }
  }
  async function verify(item: IntegrationConnection) {
    setBusy(item.providerId);
    setError(null);
    setProviderErrors((current) => ({ ...current, [item.providerId]: "" }));
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
      await refresh();
    } catch (cause) {
      setProviderErrors((current) => ({
        ...current,
        [item.providerId]:
          cause instanceof Error ? cause.message : "Provider access verification failed.",
      }));
    } finally {
      setBusy(null);
    }
  }
  async function disconnect() {
    const item = disconnectTarget;
    if (!item) return;
    setBusy(item.providerId);
    setError(null);
    setProviderErrors((current) => ({ ...current, [item.providerId]: "" }));
    try {
      const response = await requestOperation(
        "disconnectIntegration",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
          body: JSON.stringify({ provider: item.providerId, connectionId: item.connectionId }),
        },
        { providerId: item.providerId },
      );
      const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (!response.ok)
        throw new Error(payload?.detail ?? "Provider disconnect could not be completed.");
      setDisconnectTarget(null);
      await refresh();
    } catch (cause) {
      setProviderErrors((current) => ({
        ...current,
        [item.providerId]:
          cause instanceof Error ? cause.message : "Provider disconnect could not be completed.",
      }));
    } finally {
      setBusy(null);
    }
  }
  return (
    <EnterprisePage
      eyebrow="Connections"
      title="Plugins"
      description="Connect your external provider accounts securely. AmbiOS stores connection metadata and sync state; provider credentials never enter this application."
      actions={
        <Freshness
          updatedAt={items?.[0]?.connectionUpdatedAt ?? undefined}
          onRefresh={() => void refresh()}
          loading={items === null}
        />
      }
    >
      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Plugin filters">
        {(["all", "connected", "attention", "available", "unsupported"] as Filter[]).map(
          (value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={filter === value ? "secondary" : "outline"}
              role="tab"
              aria-selected={filter === value}
              onClick={() => setFilter(value)}
            >
              {value[0].toUpperCase() + value.slice(1)}
            </Button>
          ),
        )}
      </div>
      {error ? (
        <EnterpriseState
          tone="danger"
          title="Provider catalog could not be read"
          description={`${error} No provider state was inferred locally.`}
          action={
            <Button variant="outline" onClick={() => void refresh()}>
              Retry catalog read
            </Button>
          }
        />
      ) : items === null ? (
        <EnterpriseState
          loading
          title="Reading provider connections"
          description="Loading persisted connection and capability records from the workspace backend."
        />
      ) : visible.length === 0 ? (
        <EnterpriseState
          title="No providers match this view"
          description="Change the filter or connect a provider. Provider status is shown from persisted backend records."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {visible.map((item) => {
            const entry = catalogEntry(item.providerId);
            const indicator =
              item.connectionStatus === "unsupported" ? (
                <ConnectorLockIndicator />
              ) : (
                <ProviderBentoDetails
                  item={item}
                  busy={busy === item.providerId}
                  triggerIcon={
                    <ConnectorStatusIndicator
                      status={
                        item.connectionStatus === "connected"
                          ? "connected"
                          : item.connectionStatus === "authorization_pending"
                            ? "pending"
                            : "not-connected"
                      }
                    />
                  }
                  onConnect={() => void connect(item)}
                  onVerify={() => void verify(item)}
                  onDisconnect={() => setDisconnectTarget(item)}
                />
              );
            return (
              <Card
                key={item.providerId}
                className="flex min-h-[270px] flex-col overflow-hidden transition-shadow hover:shadow-md"
              >
                <CardHeader className="flex-row items-start justify-between gap-3 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-muted/60">
                      <ProviderLogo provider={item.providerId as never} size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{item.providerDisplayName}</CardTitle>
                      <p className="mt-1 text-muted-foreground text-xs">{statusLabel(item)}</p>
                    </div>
                  </div>
                  {indicator}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4 pt-2">
                  <div className="min-h-10 space-y-1 text-sm leading-6">
                    <p className="text-foreground">{entry?.description ?? capabilityLine(item)}</p>
                    <p className="text-muted-foreground text-xs">{capabilityLine(item)}</p>
                  </div>
                  <div className="grid gap-1 text-muted-foreground text-xs">
                    <span>Last verified: {formatDate(item.lastSuccessfulVerificationAt)}</span>
                    {item.resourceMappingStatus !== "not_required" ? (
                      <span>Mapped resources: {item.mappedResourceCount}</span>
                    ) : null}
                  </div>
                  {providerErrors[item.providerId] || item.lastErrorMessageSafe ? (
                    <p role="alert" className="text-destructive text-xs">
                      {providerErrors[item.providerId] || item.lastErrorMessageSafe}
                    </p>
                  ) : null}
                  <div className="mt-auto flex flex-wrap gap-2">
                    {[
                      "not_configured",
                      "authorization_pending",
                      "reauthentication_required",
                    ].includes(item.connectionStatus) ? (
                      <Button
                        onClick={() => void connect(item)}
                        disabled={busy === item.providerId}
                      >
                        {busy === item.providerId ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <ExternalLink />
                        )}
                        {item.connectionStatus === "authorization_pending"
                          ? "Continue authorization"
                          : item.connectionStatus === "reauthentication_required"
                            ? "Reconnect"
                            : item.providerId === "openai"
                              ? "Connect OpenAI API"
                              : `Connect ${item.providerDisplayName}`}
                      </Button>
                    ) : null}
                    {item.connectionStatus === "connected" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDisconnectTarget(item)}
                        disabled={busy === item.providerId}
                      >
                        <Unplug /> Disconnect
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <AlertDialog
        open={disconnectTarget !== null}
        onOpenChange={(open) => !open && setDisconnectTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {disconnectTarget?.providerDisplayName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This revokes the provider connection for this workspace. Future provider actions
              remain blocked until authorization and verification succeed again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy !== null}>Keep connected</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void disconnect();
              }}
              disabled={busy !== null}
            >
              {busy ? <Loader2 className="animate-spin" /> : <Unplug />}Disconnect provider
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </EnterprisePage>
  );
}
