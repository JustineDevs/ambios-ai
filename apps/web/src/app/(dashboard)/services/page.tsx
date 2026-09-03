"use client";

import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/operations/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EnterprisePage, EnterpriseState, Freshness } from "@/components/ui/enterprise-page";
import { Separator } from "@/components/ui/separator";
import { requestOperation } from "@/lib/api-client";

type RuntimeStatus = { service?: string; status?: string; mode?: string };

export default function ServicesPage() {
  const [runtime, setRuntime] = useState<RuntimeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestOperation("getCoreBackendStatus", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as {
        data?: RuntimeStatus;
        error?: string;
      } | null;
      if (!response.ok) throw new Error(payload?.error ?? "Runtime service data is unavailable.");
      setRuntime(payload?.data ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Runtime service data is unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => void load(), [load]);
  return (
    <EnterprisePage
      eyebrow="Connect"
      title="Services"
      description="Inspect the service directory and runtime health that support this workspace."
      actions={<Freshness onRefresh={() => void load()} loading={loading} />}
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Runtime health unavailable</AlertTitle>
          <AlertDescription>
            {error}. Retry is safe because this page performs a read only.
          </AlertDescription>
        </Alert>
      ) : loading ? (
        <EnterpriseState
          loading
          title="Checking runtime services"
          description="Reading current runtime health."
        />
      ) : runtime ? (
        <section className="rounded-xl border p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">{runtime.service ?? "Core API"}</p>
              <p className="mt-1 text-muted-foreground text-sm">
                Mode: {runtime.mode ?? "Not reported"}
              </p>
            </div>
            <StatusBadge status={runtime.status} />
          </div>
          <Separator className="my-5" />
          <p className="text-muted-foreground text-sm">
            This is the only service record currently returned by the backend.
          </p>
        </section>
      ) : (
        <EnterpriseState
          title="Service directory unavailable"
          description="The backend returned no persisted service records. No service health or ownership is inferred."
        />
      )}
      {!loading && !error ? (
        <EnterpriseState
          tone="warning"
          title="Service directory is not configured"
          description="Service ownership, dependency mappings, environments, and deployment links require a persisted service registry operation. Runtime health above remains available."
        />
      ) : null}
    </EnterprisePage>
  );
}
