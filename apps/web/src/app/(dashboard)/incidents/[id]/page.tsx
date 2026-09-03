import Link from "next/link";
import { StatusBadge } from "@/components/operations/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnterprisePage, EnterpriseState } from "@/components/ui/enterprise-page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getIncidentForUser } from "@/lib/ambios/d1";
import { requireToolUser } from "@/lib/ambios/security";
import HotfixForm from "./hotfix-form";

export default async function IncidentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireToolUser();
  const incident = user ? await getIncidentForUser(user.id, id) : null;
  if (!incident) {
    return (
      <EnterprisePage
        eyebrow="Operate"
        title="Incident unavailable"
        description="The requested incident is not present in the current workspace or is not visible to this user."
      >
        <EnterpriseState
          tone="warning"
          title="Incident not found"
          description={`No incident matched “${id}”. Verify the incident identifier and workspace, then retry.`}
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
      eyebrow={`${incident.service} · ${incident.severity}`}
      title={incident.title}
      description={incident.context}
    >
      <EnterpriseState
        tone="warning"
        title="Human approval is required for hot-fix execution"
        description="Review the proposed instruction and exact scope. Approval is server-bound, expiring, and single-use; this page does not infer approval from intent or incident severity."
      />
      <Tabs defaultValue="overview" className="grid gap-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="canvas">Canvas</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Current incident state</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground text-xs">Status</p>
                <div className="mt-2">
                  <StatusBadge status={incident.status} />
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Severity</p>
                <Badge variant="outline" className="mt-2 capitalize">
                  {incident.severity}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Affected service</p>
                <p className="mt-2 font-medium text-sm">{incident.service}</p>
              </div>
              <div className="sm:col-span-3">
                <p className="text-muted-foreground text-xs">Recorded context</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{incident.context}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="evidence">
          <EnterpriseState
            title="Evidence is limited to the persisted incident context"
            description="This route does not infer a root cause or manufacture evidence. Provider logs, deployments, and verification records appear here only when the backend has persisted and scoped them."
          />
        </TabsContent>
        <TabsContent value="actions" className="grid gap-4">
          <HotfixForm incidentId={incident.id} />
          <EnterpriseState
            tone="warning"
            title="Proposal first, execution second"
            description="A submitted proposal is not an execution. Any consequential provider change requires an exact backend approval and independent verification."
          />
        </TabsContent>
        <TabsContent value="canvas">
          <Card>
            <CardHeader>
              <CardTitle>Operational Canvas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted-foreground text-sm">
                Open the persisted relationship graph for this incident.
              </p>
              <Button asChild variant="outline">
                <Link href={`/incidents/${encodeURIComponent(incident.id)}/canvas`}>
                  Open Canvas
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </EnterprisePage>
  );
}
