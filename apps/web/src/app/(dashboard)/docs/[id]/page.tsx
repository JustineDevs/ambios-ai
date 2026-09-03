import Link from "next/link";
import { EnterprisePage, EnterpriseState } from "@/components/ui/enterprise-page";
import { getDocForUser } from "@/lib/ambios/d1";
import { requireToolUser } from "@/lib/ambios/security";

export default async function DocPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireToolUser();
  const doc = user ? await getDocForUser(user.id, id) : null;
  if (!doc) {
    return (
      <EnterprisePage
        eyebrow="Govern"
        title="Document unavailable"
        description="The requested document is not present in the current workspace or is not visible to this user."
      >
        <EnterpriseState
          tone="warning"
          title="Document not found"
          description={`No operational document matched “${id}”. Verify the workspace and document identifier, then retry.`}
          action={
            <Link className="text-primary text-sm underline" href="/docs">
              Return to documentation
            </Link>
          }
        />
      </EnterprisePage>
    );
  }
  return (
    <EnterprisePage
      eyebrow="Govern"
      title={doc.title}
      description="Review the evidence-backed operational document before publication or follow-up."
    >
      <div className="rounded-xl border p-6 text-muted-foreground leading-7">{doc.body}</div>
    </EnterprisePage>
  );
}
