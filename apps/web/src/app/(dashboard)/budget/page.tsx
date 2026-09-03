"use client";

import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/operations/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EnterprisePage, EnterpriseState, Freshness } from "@/components/ui/enterprise-page";
import { Progress } from "@/components/ui/progress";
import { requestOperation } from "@/lib/api-client";

type Budget = {
  limitAmount: number;
  spentAmount: number;
  reservedAmount: number;
  available: number;
  period: string;
};

export default function BudgetPage() {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [period, setPeriod] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestOperation("getBudget", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as {
        data?: { budget?: Budget | null; period?: string; configured?: boolean };
        error?: string;
      } | null;
      if (!response.ok) throw new Error(payload?.error ?? "Budget data is unavailable.");
      setBudget(payload?.data?.budget ?? null);
      setPeriod(payload?.data?.period ?? null);
      setConfigured(payload?.data?.configured === true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Budget data is unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => void load(), [load]);
  const used = budget ? budget.spentAmount + budget.reservedAmount : 0;
  const percent = budget ? Math.min(100, (used / Math.max(1, budget.limitAmount)) * 100) : 0;
  return (
    <EnterprisePage
      eyebrow="Govern"
      title="Budget"
      description="Review the current workspace spending limit and the capacity available to governed actions."
      actions={
        <Freshness
          updatedAt={budget?.period ?? undefined}
          onRefresh={() => void load()}
          loading={loading}
        />
      }
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Budget data unavailable</AlertTitle>
          <AlertDescription>
            {error} No spend value is inferred locally; retrying this read is safe.
          </AlertDescription>
        </Alert>
      ) : loading ? (
        <EnterpriseState
          loading
          title="Loading budget"
          description="Reading persisted workspace budget state."
        />
      ) : !configured || !budget ? (
        <EnterpriseState
          tone="warning"
          title="No budget is configured"
          description={`There is no persisted budget for ${period ?? "the current period"}. Budget-dependent actions should remain blocked until an authorized budget is configured.`}
        />
      ) : (
        <section className="rounded-xl border p-5" aria-labelledby="budget-summary">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                Current period
              </p>
              <h2 id="budget-summary" className="mt-1 font-semibold text-2xl">
                {budget.period}
              </h2>
            </div>
            <StatusBadge status={budget.available > 0 ? "ready" : "blocked"} />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground text-sm">Actual + reserved</p>
              <p className="mt-1 font-medium text-xl">{used} credits</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Remaining</p>
              <p className="mt-1 font-medium text-xl">{budget.available} credits</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Limit</p>
              <p className="mt-1 font-medium text-xl">{budget.limitAmount} credits</p>
            </div>
          </div>
          <Progress
            value={percent}
            className="mt-6"
            aria-label={`${percent.toFixed(0)} percent of budget used`}
          />
          <p className="mt-2 text-muted-foreground text-xs">
            {percent.toFixed(0)}% used. Reserved capacity is included because it can block future
            governed actions.
          </p>
        </section>
      )}
    </EnterprisePage>
  );
}
