"use client";

import { useEffect, useState } from "react";
import { requestOperation } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";

export default function McpAuthorizePage() {
  const [requestId, setRequestId] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "working" | "error">("loading");
  const [message, setMessage] = useState("Checking your AmbiOS session…");
  const [request, setRequest] = useState<{ clientName: string; scopes: string[] } | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("request_id");
    if (!id) {
      setState("error");
      setMessage("This authorization request is missing its request ID.");
      return;
    }
    setRequestId(id);
    void requestOperation("mcpAuthorizationRequestApi", undefined, { requestId: id })
      .then((response) => response.json())
      .then((payload: { clientName?: string; scopes?: string[] }) => {
        if (payload.clientName && Array.isArray(payload.scopes))
          setRequest({ clientName: payload.clientName, scopes: payload.scopes });
      });
    void createClient()
      .auth.getUser()
      .then(({ data, error }) => {
        if (error || !data.user) {
          const next = `${window.location.pathname}?request_id=${encodeURIComponent(id)}`;
          window.location.assign(`/login?next=${encodeURIComponent(next)}`);
          return;
        }
        setState("ready");
        setMessage(
          "Review the requested AmbiOS workspace scopes before authorizing this MCP client.",
        );
      });
  }, []);

  async function consent(approve: boolean) {
    if (!requestId) return;
    setState("working");
    const {
      data: { session },
    } = await createClient().auth.getSession();
    const response = await requestOperation("mcpConsent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ request_id: requestId, approve }),
    });
    const payload = (await response.json().catch(() => null)) as {
      redirect_uri?: string;
      error_description?: string;
    } | null;
    if (!response.ok || !payload?.redirect_uri) {
      setState("error");
      setMessage(payload?.error_description ?? "AmbiOS could not complete authorization.");
      return;
    }
    window.location.assign(payload.redirect_uri);
  }

  return (
    <section className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-12">
      <section className="w-full rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.2em]">
          AmbiOS MCP authorization
        </p>
        <h1 className="mt-3 font-semibold text-2xl">Authorize a workspace connection</h1>
        <p className="mt-3 text-muted-foreground text-sm">
          This authorizes your ChatGPT account to call scoped AmbiOS MCP tools for your selected
          workspace. Provider credentials are never shared, and consequential actions still require
          an exact approval inside AmbiOS.
        </p>
        {request && (
          <div className="mt-4 rounded-lg border border-border p-3 text-sm">
            <p>
              <span className="font-medium">Client:</span> {request.clientName}
            </p>
            <p className="mt-2 font-medium">Requested AmbiOS scopes</p>
            <ul className="mt-1 list-inside list-disc text-muted-foreground">
              {request.scopes.map((scope) => (
                <li key={scope}>{scope}</li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-6 rounded-lg bg-muted p-3 text-sm" role="status">
          {message}
        </p>
        {state === "ready" && (
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground text-sm"
              onClick={() => void consent(true)}
            >
              Authorize
            </button>
            <button
              type="button"
              className="rounded-lg border border-border px-4 py-2 font-medium text-sm"
              onClick={() => void consent(false)}
            >
              Deny
            </button>
          </div>
        )}
      </section>
    </section>
  );
}
