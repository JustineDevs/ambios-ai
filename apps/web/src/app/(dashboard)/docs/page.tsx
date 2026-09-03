"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  EnterprisePage,
  EnterpriseState,
  EnterpriseSummary,
} from "@/components/ui/enterprise-page";
import { requestOperation } from "@/lib/api-client";

type Doc = { id: string; incidentId: string; title: string; status: string };

export default function DocsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void requestOperation("listDocs")
      .then(async (response) => {
        const payload = (await response.json()) as { error?: string; data?: { docs?: Doc[] } };
        if (!response.ok) throw new Error(payload.error ?? "Documentation is unavailable.");
        return payload as { data?: { docs?: Doc[] } };
      })
      .then((payload) => setDocs(payload.data?.docs ?? []))
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setLoading(false));
  }, []);
  return (
    <EnterprisePage
      eyebrow="Govern"
      title="Documentation proposals"
      description="Convert incident and execution evidence into reviewable operational knowledge without silently changing published documentation."
    >
      <EnterpriseSummary
        items={[
          {
            label: "Needs review",
            value: docs.filter((d) => d.status !== "published").length,
            detail: "Agent-generated proposals",
            tone: docs.length ? "warning" : "neutral",
          },
          {
            label: "Published",
            value: docs.filter((d) => d.status === "published").length,
            detail: "Accepted knowledge",
          },
          { label: "Evidence", value: "Linked", detail: "Proposals reference incidents" },
          {
            label: "Publication",
            value: "Human review",
            detail: "No silent edits",
            tone: "success",
          },
        ]}
      />
      {error && (
        <EnterpriseState tone="danger" title="Documentation unavailable" description={error} />
      )}
      <div className="grid gap-3">
        {loading ? (
          <EnterpriseState
            loading
            title="Loading documentation proposals"
            description="Reading proposal status and linked incident evidence."
          />
        ) : docs.length ? (
          docs.map((doc) => (
            <Link
              className="rounded-xl border p-5 hover:bg-muted"
              href={`/docs/${doc.id}`}
              key={doc.id}
            >
              <h2 className="font-medium">{doc.title}</h2>
              <p className="mt-2 text-muted-foreground text-sm">
                {doc.status} · incident {doc.incidentId}
              </p>
            </Link>
          ))
        ) : (
          <EnterpriseState
            title="No documentation proposals"
            description="No operational documents are recorded yet. Resolved incident context will appear here as a proposal with evidence, diff, reviewer, and publication status."
          />
        )}
      </div>
    </EnterprisePage>
  );
}
