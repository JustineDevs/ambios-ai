"use client";

import { Calendar, Code, Webhook, Zap } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/general-utils";
import { EnterpriseFeatureCard } from "../../ui/enterprise-feature-card";
import { SdkAccordion } from "../deploy/SdkAccordion";
import { useToolCodeSnippets } from "../deploy/useToolCodeSnippets";

interface TriggersCardProps {
  toolId: string;
  payload: Record<string, any>;
  /** Compact mode for embedding in gallery (no scroll area wrapper) */
  compact?: boolean;
}

export function TriggersCard({ toolId, payload, compact = false }: TriggersCardProps) {
  const [activeSection, setActiveSection] = useState<"schedule" | "webhook" | "sdk">("sdk");

  const isSavedTool = toolId && !toolId.startsWith("draft_") && toolId !== "new";

  const snippets = useToolCodeSnippets(toolId, payload);

  if (!isSavedTool) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 pt-28 pb-12 text-center">
        <Zap className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-muted-foreground text-sm">Save this tool first</p>
        <p className="mt-2 max-w-[240px] text-muted-foreground/70 text-xs">
          API access will be available after saving. Scheduling and webhooks are available in the
          Enterprise edition.
        </p>
      </div>
    );
  }

  const content = (
    <div className={compact ? "space-y-4" : "space-y-4 p-4"}>
      {/* Schedule Section */}
      <div className={activeSection === "schedule" ? "" : "hidden"}>
        <EnterpriseFeatureCard
          title="Scheduled Triggers"
          description="Recurring executions and schedule management are available in the Enterprise edition."
        />
      </div>

      {/* Webhook Section */}
      <div className={activeSection === "webhook" ? "" : "hidden"}>
        <EnterpriseFeatureCard
          title="Webhook Triggers"
          description="Incoming webhooks and webhook-triggered run history are available in the Enterprise edition."
        />
      </div>

      {/* SDK/API Section */}
      <div className={activeSection === "sdk" ? "" : "hidden"}>
        <p className="text-muted-foreground text-xs">
          Call this tool programmatically using our SDK or REST API.
        </p>
        <SdkAccordion
          typescriptCode={snippets.typescriptCode}
          pythonCode={snippets.pythonCode}
          curlCommand={snippets.curlCommand}
          variant="card"
        />
      </div>
    </div>
  );

  return (
    <div className={compact ? "rounded-lg border bg-card p-4 shadow-md" : "flex h-full flex-col"}>
      {/* Header */}
      {compact && (
        <div className="mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          <h3 className="font-semibold text-lg">Triggers</h3>
        </div>
      )}
      {/* Section tabs */}
      <Tabs
        value={activeSection}
        onValueChange={(v) => setActiveSection(v as "schedule" | "webhook" | "sdk")}
        className={compact ? "mb-3" : ""}
      >
        <TabsList className={cn("h-9 rounded-md p-1", compact ? "" : "mx-3 my-2")}>
          <TabsTrigger
            value="schedule"
            className="flex h-full items-center gap-1.5 rounded-sm px-3 text-xs data-[state=active]:rounded-sm"
          >
            <Calendar className="h-3.5 w-3.5" />
            Schedule
          </TabsTrigger>
          <TabsTrigger
            value="webhook"
            className="flex h-full items-center gap-1.5 rounded-sm px-3 text-xs data-[state=active]:rounded-sm"
          >
            <Webhook className="h-3.5 w-3.5" />
            Webhook
          </TabsTrigger>
          <TabsTrigger
            value="sdk"
            className="flex h-full items-center gap-1.5 rounded-sm px-3 text-xs data-[state=active]:rounded-sm"
          >
            <Code className="h-3.5 w-3.5" />
            SDK/API
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {compact ? content : <ScrollArea className="flex-1">{content}</ScrollArea>}
    </div>
  );
}
