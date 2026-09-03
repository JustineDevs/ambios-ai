"use client";

import Nango from "@nangohq/frontend";
import { Check, ExternalLink, Loader2, Plug } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Task } from "@/components/ai-elements";
import { BloubBot } from "@/components/animation/bloub/BloubBot";
import { ProviderLogo } from "@/components/integrations/ProviderLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToken } from "@/hooks/use-token";
import { requestOperation } from "@/lib/api-client";
import { getAgentSetupAccess } from "./agent-setup-access";

type Readiness = {
  ready: boolean;
  workspace: { id: string; name: string } | null;
  integration: { provider: string; status: string } | null;
  integrations: { provider: string; status: string }[];
  requirements: string[];
};

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.text();
  if (!body.trim())
    throw new Error(`Setup request returned an empty response (${response.status}).`);
  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error(`Setup request returned invalid JSON (${response.status}).`);
  }
}

export function AgentSetupCard({ onReadyChange }: { onReadyChange: (ready: boolean) => void }) {
  const token = useToken();
  const setupAccess = getAgentSetupAccess({
    token,
    nodeEnv: process.env.NODE_ENV,
    authDisabled: process.env.NEXT_PUBLIC_AUTH_DISABLE,
  });
  const developmentAuthDisabled = setupAccess === "development-bypass";
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [workspaceName, setWorkspaceName] = useState("My AmbiOS workspace");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nangoRef = useRef<Nango | null>(null);

  const loadReadiness = useCallback(async () => {
    const response = await requestOperation("getNangoConnect", { cache: "no-store" });
    const payload = await readJson<{
      data?: Readiness;
      error?: { message?: string };
      detail?: string;
    }>(response);
    if (!response.ok || !payload.data) {
      if (response.status >= 500) {
        throw new Error("AmbiOS could not reach the connector service. Retry setup status.");
      }
      throw new Error(payload.error?.message ?? payload.detail ?? "Setup status unavailable.");
    }
    setReadiness(payload.data);
    onReadyChange(payload.data.ready);
  }, [onReadyChange]);

  useEffect(() => {
    void loadReadiness().catch((cause) => {
      setError(cause instanceof Error ? cause.message : "Setup status unavailable.");
      onReadyChange(false);
    });
  }, [loadReadiness, onReadyChange]);

  async function createWorkspace() {
    setBusy(true);
    setError(null);
    try {
      const response = await requestOperation("getWorkspace", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ name: workspaceName }),
      });
      if (!response.ok) throw new Error("Workspace setup failed.");
      await loadReadiness();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Workspace setup failed.");
    } finally {
      setBusy(false);
    }
  }

  async function connectProvider(provider: "github") {
    setBusy(true);
    setError(null);
    try {
      const response = await requestOperation("connectNango", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ provider }),
      });
      const payload = await readJson<{
        data?: { connectSessionToken?: string };
        error?: { message?: string };
        detail?: string;
      }>(response);
      if (!response.ok || !payload.data?.connectSessionToken) {
        throw new Error(
          payload.error?.message ?? payload.detail ?? "Secure connection could not start.",
        );
      }
      const nango = new Nango();
      nangoRef.current = nango;
      nango
        .openConnectUI({
          sessionToken: payload.data.connectSessionToken,
          onEvent: (event) => {
            if (event.type === "connect" || event.type === "ready") void loadReadiness();
          },
        })
        .open();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Secure connection could not start.");
    } finally {
      setBusy(false);
    }
  }

  if (readiness?.ready) return null;

  if (setupAccess === "sign-in-required") {
    return (
      <Task>
        <section
          className="mx-auto w-full min-w-0 max-w-2xl rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-xl sm:p-8"
          aria-label="Sign in required"
        >
          <div className="flex items-start gap-4">
            <BloubBot state="idle" size={64} label="AmbiOS sign-in required" className="shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.16em]">
                Authentication required
              </p>
              <h2 className="mt-1 font-semibold text-xl">Sign in to prepare this workspace</h2>
              <p className="mt-2 text-muted-foreground text-sm">
                AmbiOS only loads organization and workspace setup after your account is
                authenticated. No workspace data is available in this signed-out state.
              </p>
              <Button asChild className="mt-5">
                <Link href="/login?next=%2Fagent">Sign in to continue</Link>
              </Button>
            </div>
          </div>
        </section>
      </Task>
    );
  }

  const requiredProviders = [
    { provider: "openai" as const, label: "OpenAI / ChatGPT MCP" },
    { provider: "github" as const, label: "GitHub" },
  ];

  return (
    <Task>
      <section
        className="mx-auto w-full min-w-0 max-w-2xl rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-xl sm:p-8"
        aria-label="AmbiOS setup"
      >
        {developmentAuthDisabled && (
          <div
            className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-700 text-xs dark:text-amber-300"
            role="status"
          >
            Development auth bypass is active. This screen uses a local test identity; it is not an
            authenticated user or production workspace.
          </div>
        )}
        <div className="flex items-start gap-4">
          <BloubBot
            state="connecting"
            size={64}
            follow
            label="AmbiOS setup status"
            className="shrink-0 drop-shadow-[0_0_10px_rgba(255,255,255,0.22)]"
          />
          <div className="min-w-0">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.16em]">
              Before we begin
            </p>
            <h2 className="mt-1 font-semibold text-xl">Prepare your workspace</h2>
            <p className="mt-2 text-muted-foreground text-sm">
              Create an AmbiOS workspace, then connect your own ChatGPT account through remote MCP
              OAuth. AmbiOS keeps authority over permissions, proposals, approvals, execution,
              verification, and audit.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-3">
          {!readiness?.workspace ? (
            <div className="grid gap-3 rounded-2xl border bg-background/70 p-4">
              <div className="flex items-center gap-3 text-sm">
                <Plug className="size-4 text-primary" />
                <span>Create your workspace</span>
              </div>
              <Input
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
                aria-label="Workspace name"
                placeholder="Workspace name"
              />
              <Button
                type="button"
                onClick={() => void createWorkspace()}
                disabled={busy || !workspaceName.trim()}
              >
                {busy && <Loader2 className="size-4 animate-spin" />}Create workspace
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 rounded-2xl border bg-background/70 p-4">
              <div className="flex items-center gap-3 text-sm">
                <Check className="size-4 text-emerald-600" />
                <span>{readiness.workspace.name}</span>
              </div>
              {requiredProviders.map(({ provider, label }) => {
                const integration = readiness.integrations.find(
                  (item) => item.provider === provider,
                );
                const connected = integration?.status === "connected";
                return (
                  <div
                    key={provider}
                    className="flex min-w-0 flex-wrap items-center gap-3 rounded-xl border bg-background p-3"
                  >
                    <ProviderLogo provider={provider} size={20} />
                    <span className="min-w-0 flex-1 text-sm">{label}</span>
                    {connected && <Check className="size-4 text-emerald-600" />}
                    {provider === "openai" ? (
                      <span className="w-full text-muted-foreground text-xs sm:ml-auto sm:w-auto">
                        Use your own ChatGPT account through AmbiOS MCP OAuth.
                      </span>
                    ) : (
                      <Button
                        className="w-full sm:ml-auto sm:w-auto"
                        type="button"
                        variant={connected ? "outline" : "default"}
                        onClick={() => void connectProvider(provider)}
                        disabled={busy || connected}
                      >
                        {busy && !connected ? <Loader2 className="size-4 animate-spin" /> : null}
                        {connected
                          ? "Connected"
                          : busy
                            ? "Opening secure connection…"
                            : `Connect ${label}`}
                        {!connected && <ExternalLink className="size-4" />}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {readiness?.integrations.some((item) => item.status === "pending") && (
          <p className="mt-4 text-muted-foreground text-xs">
            Complete the secure connection window, then AmbiOS will unlock the agent automatically.
          </p>
        )}
        {error && (
          <div className="mt-4 flex flex-wrap items-center gap-3" role="alert">
            <p className="text-destructive text-sm">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void loadReadiness()}>
              Retry setup status
            </Button>
          </div>
        )}
      </section>
    </Task>
  );
}
