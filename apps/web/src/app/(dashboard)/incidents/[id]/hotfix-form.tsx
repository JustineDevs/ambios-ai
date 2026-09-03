"use client";

import { useState } from "react";
import { requestOperation } from "@/lib/api-client";

export default function HotfixForm({ incidentId }: { incidentId: string }) {
  const [message, setMessage] = useState("Prepare a safe rollback plan");
  const [approved, setApproved] = useState(false);
  const [approvalToken, setApprovalToken] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const response = await requestOperation("executeHotfix", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          incidentId,
          instruction: message,
          approved,
          approvalSource: "human",
          approvalToken,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        data?: { doc?: { title: string }; error?: { message?: string } };
        detail?: string;
      } | null;
      setResult(
        response.ok
          ? `Action recorded. ${payload?.data?.doc?.title ?? "Documentation proposal created"}`
          : (payload?.data?.error?.message ?? payload?.detail ?? "Hot-fix failed"),
      );
    } catch {
      setResult("Hot-fix failed: the AmbiOS API is unavailable.");
    }
  }
  return (
    <form className="grid gap-4 rounded-xl border p-5" onSubmit={submit}>
      <div>
        <h2 className="font-medium">Context-aware hot-fix</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          The approved request is recorded and a documentation proposal is created for review. No
          provider write occurs in this local runtime.
        </p>
      </div>
      <textarea
        aria-label="Hot-fix instruction"
        className="min-h-28 rounded-md border bg-transparent p-3 text-sm"
        value={message}
        onChange={(event) => {
          setMessage(event.target.value);
          setApproved(false);
          setApprovalToken(null);
        }}
      />
      <label className="flex items-start gap-2 text-sm">
        <input
          checked={approved}
          className="mt-1"
          onChange={async (event) => {
            const nextApproved = event.target.checked;
            setApproved(nextApproved);
            setApprovalToken(null);
            if (!nextApproved) return;
            const response = await requestOperation("requestHotfixApproval", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Idempotency-Key": crypto.randomUUID(),
              },
              body: JSON.stringify({ incidentId, instruction: message }),
            });
            const payload = (await response.json().catch(() => null)) as {
              data?: { approvalToken?: string };
            } | null;
            setApprovalToken(response.ok ? (payload?.data?.approvalToken ?? null) : null);
          }}
          type="checkbox"
        />
        <span>I reviewed this change and approve the hot-fix execution.</span>
      </label>
      <button
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm"
        type="submit"
        disabled={!approved || !approvalToken || !message.trim()}
      >
        Record approved hot-fix proposal
      </button>
      {result && <p className="text-muted-foreground text-sm">{result}</p>}
    </form>
  );
}
