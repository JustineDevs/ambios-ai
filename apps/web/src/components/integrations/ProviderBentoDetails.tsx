"use client";

import type { IntegrationConnection } from "@ambios-ai/shared";
import { ExternalLink, Loader2, RefreshCw, Unplug } from "lucide-react";
import type { ReactNode } from "react";
import { ProviderLogo } from "@/components/integrations/ProviderLogo";
import { Button } from "@/components/ui/button";
import ExpandableBentoGrid from "@/components/ui/expandable-bento-grid";

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
  if (item.connectionStatus === "unsupported")
    return "This provider is not available in the current deployment.";
  if (item.connectionStatus === "not_configured")
    return "Connect an account to inspect available workspace resources.";
  if (item.capabilities.length > 0) return item.capabilities.join(" · ");
  return item.lastErrorMessageSafe ?? "Provider capability evidence is not available yet.";
}

function DetailsContent({
  item,
  busy,
  onConnect,
  onDisconnect,
  onVerify,
  footer,
}: {
  item: IntegrationConnection;
  busy: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onVerify?: () => void;
  footer?: ReactNode;
}) {
  const hasCallbackConnection = Boolean(
    item.connectionId && !item.connectionId.startsWith("ambios-"),
  );
  const canVerify =
    (item.connectionStatus === "connected" && !item.lastSuccessfulVerificationAt) ||
    (item.connectionStatus === "authorization_pending" && hasCallbackConnection);
  const canConnect =
    ["not_configured", "authorization_pending", "reauthentication_required"].includes(
      item.connectionStatus,
    ) && !canVerify;
  const canDisconnect = item.connectionStatus === "connected";

  return (
    <div className="w-full space-y-3 text-sm">
      <div className="flex items-center justify-between rounded-xl border px-3 py-3">
        <span className="text-muted-foreground">Connection state</span>
        <span className="font-medium">{statusLabel(item)}</span>
      </div>
      <div className="flex items-center justify-between rounded-xl border px-3 py-3">
        <span className="text-muted-foreground">Workspace</span>
        <span className="font-medium">
          {item.workspaceId ? "Current workspace" : "Sign in required"}
        </span>
      </div>
      <div className="rounded-xl border px-3 py-3 text-muted-foreground">
        {capabilityLine(item)}
      </div>
      <div className="rounded-xl border p-3">
        <p className="font-medium text-foreground">Access requested</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          {item.capabilities.length > 0 ? (
            item.capabilities.map((capability) => <li key={capability}>{capability}</li>)
          ) : (
            <li>Read-only connection metadata until access is verified.</li>
          )}
        </ul>
        <p className="mt-3 text-muted-foreground text-xs">
          The provider consent screen is the authority for access granted to this workspace.
        </p>
      </div>
      <dl className="grid gap-3 rounded-xl border p-3 sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Last verified</dt>
          <dd>{item.lastSuccessfulVerificationAt ?? "Not verified"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Mapped resources</dt>
          <dd>{item.mappedResourceCount}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Connection health</dt>
          <dd>{item.connectionHealth}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Next action</dt>
          <dd>{item.nextAction}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Last sync</dt>
          <dd>{item.lastSyncAt ?? "Not synced"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Sync status</dt>
          <dd>{item.lastSyncStatus.replaceAll("_", " ")}</dd>
        </div>
      </dl>
      {item.lastErrorMessageSafe ? (
        <p role="alert" className="text-destructive text-sm">
          {item.lastErrorMessageSafe}
        </p>
      ) : null}
      {footer}
      <div className="flex flex-wrap gap-2 pt-1">
        {canConnect && onConnect ? (
          <Button
            onClick={onConnect}
            disabled={busy}
            aria-label="Start provider authorization from details"
          >
            {busy ? <Loader2 className="animate-spin" /> : <ExternalLink />}
            <span aria-hidden="true">
              {item.providerId === "openai"
                ? "Connect OpenAI API"
                : item.connectionStatus === "reauthentication_required"
                  ? "Reconnect"
                  : item.connectionStatus === "authorization_pending"
                    ? "Continue authorization"
                    : `Connect ${item.providerDisplayName}`}
            </span>
          </Button>
        ) : null}
        {canVerify && onVerify ? (
          <Button onClick={onVerify} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />} Verify access
          </Button>
        ) : null}
        {canDisconnect && onDisconnect ? (
          <Button variant="destructive" onClick={onDisconnect} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Unplug />} Disconnect
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** The provider card's status glyph is the single detail affordance. */
export function ProviderBentoDetails({
  item,
  initiallyOpen = false,
  busy = false,
  onClose,
  onConnect,
  onDisconnect,
  onVerify,
  footer,
  triggerIcon,
}: {
  item: IntegrationConnection;
  initiallyOpen?: boolean;
  busy?: boolean;
  onClose?: () => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onVerify?: () => void;
  footer?: ReactNode;
  triggerIcon?: ReactNode;
}) {
  return (
    <ExpandableBentoGrid
      iconOnly
      instanceKey={`provider-${item.providerId}`}
      initialActiveId={initiallyOpen ? item.providerId : undefined}
      onClose={onClose}
      iconOnlyClassName="border-0 bg-transparent p-0 hover:bg-transparent"
      items={[
        {
          id: item.providerId,
          title: `${item.providerDisplayName} details`,
          description: `Review ${item.providerDisplayName} connection state and supported AmbiOS operations.`,
          icon: <ProviderLogo provider={item.providerId as never} size={24} />,
          ...(triggerIcon ? { triggerIcon } : {}),
          content: (
            <DetailsContent
              item={item}
              busy={busy}
              onConnect={onConnect}
              onDisconnect={onDisconnect}
              onVerify={onVerify}
              footer={footer}
            />
          ),
        },
      ]}
    />
  );
}
