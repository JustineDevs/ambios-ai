import type { Tool } from "@ambios-ai/shared";
import { Bot, Calendar, Code, ExternalLink, Webhook, X } from "lucide-react";
import { useEffect, useState } from "react";
import { CodeSnippet } from "../../editors/ReadonlyCodeEditor";
import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { EnterpriseFeatureCard } from "../../ui/enterprise-feature-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { SdkAccordion } from "./SdkAccordion";
import { useToolCodeSnippets } from "./useToolCodeSnippets";

interface ToolDeployModalProps {
  currentTool: Tool;
  payload: Record<string, any>;
  isOpen: boolean;
  onClose: () => void;
}

export function ToolDeployModal({
  currentTool,
  payload,
  isOpen,
  onClose = () => {},
}: ToolDeployModalProps) {
  const [activeTab, setActiveTab] = useState("sdk");

  const snippets = useToolCodeSnippets(currentTool.id, payload);

  useEffect(() => {
    if (isOpen) {
      setActiveTab("sdk");
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] max-w-6xl flex-col overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Deploy your Tool</span>
            <Button variant="ghost" size="icon" className="shrink-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          {/* Tool ID section */}
          <div className="flex-shrink-0 space-y-3">
            <p className="text-muted-foreground">
              Your tool is ready to use in production. Choose how you want to deploy it:
            </p>
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex w-full flex-1 flex-col overflow-hidden"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="schedule" className="gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Schedule</span>
              </TabsTrigger>
              <TabsTrigger value="sdk" className="gap-2">
                <Code className="h-4 w-4" />
                <span className="hidden sm:inline">SDK/API</span>
              </TabsTrigger>
              <TabsTrigger value="webhook" className="gap-2">
                <Webhook className="h-4 w-4" />
                <span className="hidden sm:inline">Webhooks</span>
              </TabsTrigger>
              <TabsTrigger value="mcp" className="gap-2">
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">MCP</span>
              </TabsTrigger>
            </TabsList>

            {/* Schedule Tab */}
            {activeTab === "schedule" && (
              <TabsContent
                value="schedule"
                className="mt-4 flex flex-1 flex-col gap-6 overflow-y-auto"
              >
                <EnterpriseFeatureCard
                  title="Scheduled Deployments"
                  description="Recurring executions and schedule management are available in the Enterprise edition."
                />
              </TabsContent>
            )}

            {/* SDK/API Tab */}
            {activeTab === "sdk" && (
              <TabsContent value="sdk" className="mt-4 flex-1 overflow-y-auto overflow-x-hidden">
                <div className="mb-4 space-y-2">
                  <p className="text-muted-foreground">
                    For programmatic execution, use our JavaScript or Python SDK, or access the REST
                    API directly via cURL. You'll find your tool-specific code snippets below.
                    Simply replace the placeholder with your ambios API key.
                  </p>
                </div>

                <SdkAccordion
                  typescriptCode={snippets.typescriptCode}
                  pythonCode={snippets.pythonCode}
                  curlCommand={snippets.curlCommand}
                  variant="modal"
                  defaultExpanded="typescript"
                />
              </TabsContent>
            )}

            {/* Webhooks Tab */}
            {activeTab === "webhook" && (
              <TabsContent
                value="webhook"
                className="mt-4 flex flex-1 flex-col gap-6 overflow-y-auto"
              >
                <EnterpriseFeatureCard
                  title="Webhook Deployments"
                  description="Incoming and outgoing webhooks are available in the Enterprise edition."
                />
              </TabsContent>
            )}

            {/* MCP Tab */}
            {activeTab === "mcp" && (
              <TabsContent value="mcp" className="mt-4 flex flex-1 flex-col gap-4 overflow-y-auto">
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    Make this tool available to Claude, Cursor, or any MCP-compatible agent. Simply
                    replace the placeholder with your ambios API key.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="mb-2 font-medium text-sm">
                      1. Add ambios MCP server to your config
                    </div>
                    <CodeSnippet code={snippets.mcpConfig} language="json" />
                  </div>

                  <div>
                    <div className="mb-2 font-medium text-sm">2. Use in your AI agent</div>
                    <CodeSnippet
                      code={`Please execute the ambios tool "${currentTool.id}"`}
                      language="bash"
                    />
                  </div>
                </div>

                <div className="mt-2 text-muted-foreground text-sm">
                  <a
                    href="https://docs.ambios.cloud/mcp/using-the-mcp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    Learn more about using your tools via MCP
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
