import Link from "next/link";
import { EnterprisePage, EnterpriseState } from "@/components/ui/enterprise-page";
import { TaskWidget } from "@/components/ui/task-widget-disclosure";
import { getIncidentForUser } from "@/lib/ambios/d1";
import { requireToolUser } from "@/lib/ambios/security";
import HotfixForm from "../hotfix-form";

export default async function IncidentHotfixPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireToolUser();
  const incident = user ? await getIncidentForUser(user.id, id) : null;
  if (!incident) {
    return (
      <EnterprisePage
        eyebrow="Operate"
        title="Hot-fix unavailable"
        description="A controlled change can only be prepared for an incident visible in the current workspace."
      >
        <EnterpriseState
          tone="warning"
          title="Incident not found"
          description={`No incident matched “${id}”. Verify the incident identifier before preparing a change.`}
          action={
            <Link className="text-primary text-sm underline" href="/incidents">
              Return to incidents
            </Link>
          }
        />
      </EnterprisePage>
    );
  }

  return (
    <EnterprisePage
      eyebrow={`Operate · ${incident.service}`}
      title="Review hot-fix"
      description={incident.title}
    >
      <HotfixForm incidentId={incident.id} />
      <TaskWidget
        data={{
          title: "AI hot-fix action",
          progress: 25,
          completedCount: 1,
          totalCount: 4,
          priority: "Guarded",
          status: "Awaiting human review",
          subtasks: [
            { id: "context", title: "Collect incident context", completed: true },
            { id: "suggest", title: "Suggest a safe hot-fix", completed: false },
            { id: "approve", title: "Approve the action", completed: false },
            { id: "audit", title: "Write audit record", completed: false },
          ],
          assignees: [{ name: "AmbiOS AI", avatar: "/assets/image/logo.png", color: "#6366f1" }],
        }}
      />
    </EnterprisePage>
  );
}
