import { BookOpen, LifeBuoy, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EnterprisePage,
  EnterpriseState,
  EnterpriseSummary,
} from "@/components/ui/enterprise-page";

export default function SupportPage() {
  return (
    <EnterprisePage
      eyebrow="Manage"
      title="Support"
      description="Find the right recovery path for authentication, integrations, approvals, and runtime operations. Support surfaces report workspace state and never imply provider success."
    >
      <EnterpriseSummary
        items={[
          {
            label: "Connection help",
            value: "Available",
            detail: "Inspect Plugins and Setup",
            tone: "success",
          },
          { label: "Action recovery", value: "Available", detail: "Runs, approvals, and console" },
          { label: "Documentation", value: "Linked", detail: "Operational guidance" },
          {
            label: "Safety",
            value: "Redaction on",
            detail: "Do not share provider tokens",
            tone: "success",
          },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <LifeBuoy className="mb-2 h-5 w-5 text-primary" />
            <CardTitle>Connection help</CardTitle>
            <CardDescription>
              Review connector state and retry a supported connection flow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/plugins">Open Plugins</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <ShieldCheck className="mb-2 h-5 w-5 text-primary" />
            <CardTitle>Action recovery</CardTitle>
            <CardDescription>
              Inspect approvals, runs, audit records, and blocked prerequisites.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/runs">Open Runs</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/approvals">Approvals</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <BookOpen className="mb-2 h-5 w-5 text-primary" />
            <CardTitle>Documentation</CardTitle>
            <CardDescription>
              Read operational guidance and understand the current evidence boundary.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/docs">Open Docs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <EnterpriseState
        tone="warning"
        title="Support boundary"
        description="If a request is blocked, capture its request ID and current status from the Console before retrying. Never paste provider tokens or secret values into a support request."
      />
    </EnterprisePage>
  );
}
