"use client";

import { maskCredentialValue, type System, type ToolCall } from "@ambios-ai/shared";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  Globe,
  Key,
  KeyRound,
  Loader2,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SystemIcon } from "@/components/ui/system-icon";
import { useSystemActions } from "@/hooks/use-system-actions";
import { useToast } from "@/hooks/use-toast";
import {
  createToolInteractionEntry,
  type ToolMutation,
} from "@/lib/agent/agent-tools/tool-call-state";
import { useInvalidateSystems, useSystems } from "@/queries/systems";
import { useAgentContext } from "../AgentContextProvider";
import { ToolCallWrapper } from "./ToolComponentWrapper";

interface CreateSystemComponentProps {
  tool: ToolCall;
  onInputChange: (newInput: any) => void;
  onToolUpdate?: (toolCallId: string, updates: Partial<ToolCall>) => void;
  onToolMutation?: (toolCallId: string, mutation: ToolMutation) => void;
  onAbortStream?: () => void;
}

interface CreateSystemOutput {
  success?: boolean;
  confirmationState?: string;
  systemConfig?: any;
  system?: System;
}

function CreateSystemComponentImpl({
  tool,
  onInputChange,
  onToolUpdate,
  onToolMutation,
  onAbortStream,
}: CreateSystemComponentProps) {
  const [isInstructionsExpanded, setIsInstructionsExpanded] = useState(false);
  const [isPrefilledExpanded, setIsPrefilledExpanded] = useState(false);
  const [credentialValues, setCredentialValues] = useState<Record<string, string>>({});
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const { sendAgentRequest } = useAgentContext();
  const { saveSystem, handleOAuth } = useSystemActions();
  const { toast } = useToast();
  const { systems, isRefreshing } = useSystems();
  const invalidateSystems = useInvalidateSystems();

  const getAuthBadge = useCallback((credentials: Record<string, any>) => {
    if (!credentials || Object.keys(credentials).length === 0) {
      return { color: "amber", label: "No Auth", icon: "clock" };
    }

    const keys = Object.keys(credentials);
    if (keys.includes("client_id") && keys.includes("client_secret")) {
      return { color: "blue", label: "OAuth", icon: "key" };
    }
    if (keys.includes("api_key") || keys.includes("apiKey") || keys.includes("token")) {
      return { color: "green", label: "API Key", icon: "key" };
    }
    if (keys.includes("username") && keys.includes("password")) {
      return { color: "green", label: "Basic Auth", icon: "key" };
    }
    if (keys.includes("bearer") || keys.includes("access_token")) {
      return { color: "green", label: "Bearer Token", icon: "key" };
    }

    return { color: "green", label: "Custom Auth", icon: "key" };
  }, []);

  const input = (() => {
    if (!tool.input) return null;
    try {
      return typeof tool.input === "string" ? JSON.parse(tool.input) : tool.input;
    } catch {
      return null;
    }
  })();

  const output = (() => {
    if (!tool.output) return null;
    try {
      return typeof tool.output === "string"
        ? JSON.parse(tool.output)
        : (tool.output as CreateSystemOutput);
    } catch {
      return null;
    }
  })();

  const systemConfig = output?.systemConfig || input;

  const allCredentialFields = useMemo(() => {
    const creds = systemConfig?.credentials;
    if (!creds || typeof creds !== "object") return {};
    return creds as Record<string, any>;
  }, [systemConfig?.credentials]);

  const { blankFields, prefilledFields } = useMemo(() => {
    const blank: string[] = [];
    const prefilled: string[] = [];
    for (const [key, value] of Object.entries(allCredentialFields)) {
      if (value === "" || value === null || value === undefined) {
        blank.push(key);
      } else {
        prefilled.push(key);
      }
    }
    return { blankFields: blank, prefilledFields: prefilled };
  }, [allCredentialFields]);

  const hasCredentials = Object.keys(allCredentialFields).length > 0;
  const isAwaitingConfirmation = tool.status === "awaiting_confirmation" && hasCredentials;
  const _isConfirming = tool.status === "running" && hasCredentials;
  const isCompleted = tool.status === "completed" && output?.success;
  const isToolInProgress = tool.status === "running" || tool.status === "pending";

  const systemId = output?.system?.id || systemConfig?.id || input?.id;
  const systemName = output?.system?.name || systemConfig?.name || input?.name;
  const systemFromContext = useMemo(() => {
    if (systemId) return systems.find((i) => i.id === systemId) || null;
    if (systemName) return systems.find((i) => i.name === systemName) || null;
    return null;
  }, [systems, systemId, systemName]);

  const displaySystem = systemFromContext || output?.system || systemConfig || input;

  const badge = useMemo(
    () => getAuthBadge(displaySystem?.credentials || {}),
    [displaySystem?.credentials, getAuthBadge],
  );
  const colorClasses = useMemo(
    () => ({
      blue: "text-blue-800 dark:text-blue-300 bg-blue-500/10",
      amber: "text-amber-800 dark:text-amber-300 bg-amber-500/10",
      green: "text-green-800 dark:text-green-300 bg-green-500/10",
    }),
    [],
  );

  const hasTriggeredRefreshRef = useRef(false);
  useEffect(() => {
    if (isCompleted && systemId && !hasTriggeredRefreshRef.current) {
      hasTriggeredRefreshRef.current = true;
      invalidateSystems();
    }
  }, [isCompleted, systemId, invalidateSystems]);

  useEffect(() => {
    if (isCompleted || tool.status === "declined" || tool.status === "error") {
      setIsExecuting(false);
    }
  }, [isCompleted, tool.status]);

  const handleConfirm = useCallback(() => {
    if (!sendAgentRequest) return;

    const allValues: Record<string, string> = {};
    for (const key of Object.keys(allCredentialFields)) {
      if (Object.hasOwn(credentialValues, key)) {
        allValues[key] = credentialValues[key].trim();
      } else if (allCredentialFields[key] !== undefined && allCredentialFields[key] !== null) {
        allValues[key] = String(allCredentialFields[key]);
      }
    }

    setIsExecuting(true);
    onToolUpdate?.(tool.id, { status: "running" });
    onToolMutation?.(tool.id, {
      interactionEntry: createToolInteractionEntry(
        "user_submitted_credentials_and_confirmed_system_creation",
        {
          credentialsSummary: Object.fromEntries(
            Object.entries(allValues)
              .filter(([_, v]) => v?.trim())
              .map(([k, v]) => [k, maskCredentialValue(k, v)]),
          ),
        },
      ),
      confirmationState: "confirmed",
      confirmationData: {
        systemConfig,
        userProvidedCredentials: allValues,
      },
    });

    sendAgentRequest(undefined, {
      resumeToolCallId: tool.id,
    });
  }, [
    allCredentialFields,
    credentialValues,
    onToolMutation,
    onToolUpdate,
    sendAgentRequest,
    systemConfig,
    tool.id,
  ]);

  const handleCancel = useCallback(() => {
    if (!sendAgentRequest) return;

    onToolUpdate?.(tool.id, { status: "declined" });
    onToolMutation?.(tool.id, {
      interactionEntry: createToolInteractionEntry("user_declined_system_creation"),
      confirmationState: "declined",
    });

    sendAgentRequest(undefined, {
      resumeToolCallId: tool.id,
    });
  }, [onToolMutation, onToolUpdate, sendAgentRequest, tool.id]);

  const allBlankFieldsFilled = useMemo(() => {
    if (blankFields.length === 0) return true;
    return blankFields.every(
      (field) => credentialValues[field] && credentialValues[field].trim() !== "",
    );
  }, [blankFields, credentialValues]);

  if (!displaySystem) {
    if (isRefreshing || isToolInProgress) {
      return (
        <ToolCallWrapper
          tool={tool}
          openByDefault={true}
          statusOverride={isToolInProgress ? "running" : undefined}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-600 dark:bg-blue-400" />
            </div>
            <div className="text-muted-foreground text-sm">Creating system...</div>
          </div>
        </ToolCallWrapper>
      );
    }
    return (
      <ToolCallWrapper tool={tool} openByDefault={true}>
        <div className="flex items-center gap-3">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-600 dark:bg-blue-400" />
          </div>
          <div className="text-muted-foreground text-sm">
            No system data found - this is probably a bug
          </div>
        </div>
      </ToolCallWrapper>
    );
  }

  if (isToolInProgress && !isAwaitingConfirmation) {
    return (
      <ToolCallWrapper tool={tool} openByDefault={true} statusOverride="running">
        <div className="flex items-center gap-3">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-600 dark:bg-blue-400" />
          </div>
          <div className="text-muted-foreground text-sm">Creating system...</div>
        </div>
      </ToolCallWrapper>
    );
  }

  return (
    <ToolCallWrapper tool={tool} openByDefault={!isCompleted}>
      <div className="space-y-4">
        <div
          className={`rounded-lg border bg-background p-4 ${
            isAwaitingConfirmation ? "border-amber-200 dark:border-amber-800" : "border-border"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {displaySystem?.name || displaySystem?.id ? (
                <SystemIcon system={displaySystem} size={24} fallbackClassName="text-foreground" />
              ) : (
                <Globe className="h-6 w-6 text-foreground" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <div className="mb-1 font-medium text-muted-foreground text-xs">
                  System Endpoint
                </div>
                <div className="rounded bg-muted/50 px-2 py-1 font-mono text-sm">
                  {displaySystem.url || "No endpoint specified"}
                </div>
              </div>

              <div>
                <div className="mb-1 font-medium text-muted-foreground text-xs">System</div>
                <div className="rounded bg-muted/50 px-2 py-1 font-mono text-sm">
                  {displaySystem.name || displaySystem.id || "N/A"}
                </div>
              </div>

              {!isAwaitingConfirmation && (
                <div>
                  <div className="mb-1 font-medium text-muted-foreground text-xs">
                    Authentication
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs ${colorClasses[badge.color as keyof typeof colorClasses]} flex items-center gap-1 rounded px-2 py-1`}
                    >
                      {badge.icon === "clock" ? (
                        <Clock className="h-3 w-3" />
                      ) : (
                        <Key className="h-3 w-3" />
                      )}
                      {badge.label}
                    </span>
                  </div>
                </div>
              )}

              {isAwaitingConfirmation && blankFields.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="font-medium text-muted-foreground text-xs">Enter credentials</div>
                  {blankFields.map((field) => (
                    <div key={field} className="space-y-1">
                      <div className="flex items-center gap-1.5 font-medium text-foreground text-xs">
                        <KeyRound className="h-3 w-3 text-amber-500" />
                        {field}
                      </div>
                      <div className="relative">
                        <Input
                          type={showCredentials[field] ? "text" : "password"}
                          value={credentialValues[field] || ""}
                          onChange={(e) =>
                            setCredentialValues((prev) => ({ ...prev, [field]: e.target.value }))
                          }
                          placeholder={`Enter ${field}...`}
                          className="h-9 pr-10 text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-0 right-0 h-9 w-9 hover:bg-transparent"
                          onClick={() =>
                            setShowCredentials((prev) => ({ ...prev, [field]: !prev[field] }))
                          }
                        >
                          {showCredentials[field] ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isAwaitingConfirmation && prefilledFields.length > 0 && (
                <Collapsible open={isPrefilledExpanded} onOpenChange={setIsPrefilledExpanded}>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1 pt-2 font-medium text-muted-foreground text-xs transition-colors hover:text-foreground"
                    >
                      {isPrefilledExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                      Pre-filled configuration ({prefilledFields.length} field
                      {prefilledFields.length !== 1 ? "s" : ""})
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-3 pt-2">
                      {prefilledFields.map((field) => (
                        <div key={field} className="space-y-1">
                          <div className="flex items-center gap-1.5 font-medium text-foreground text-xs">
                            <KeyRound className="h-3 w-3 text-muted-foreground" />
                            {field}
                          </div>
                          <div className="relative">
                            <Input
                              type={showCredentials[field] ? "text" : "password"}
                              value={
                                credentialValues[field] !== undefined
                                  ? credentialValues[field]
                                  : String(allCredentialFields[field] ?? "")
                              }
                              onChange={(e) =>
                                setCredentialValues((prev) => ({
                                  ...prev,
                                  [field]: e.target.value,
                                }))
                              }
                              placeholder={`Enter ${field}...`}
                              className="h-9 pr-10 text-sm"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute top-0 right-0 h-9 w-9 hover:bg-transparent"
                              onClick={() =>
                                setShowCredentials((prev) => ({ ...prev, [field]: !prev[field] }))
                              }
                            >
                              {showCredentials[field] ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {displaySystem.specificInstructions?.trim() && (
                <div>
                  <Collapsible
                    open={isInstructionsExpanded}
                    onOpenChange={setIsInstructionsExpanded}
                  >
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1 font-medium text-muted-foreground text-xs transition-colors hover:text-foreground"
                      >
                        {isInstructionsExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                        Additional System Instructions
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 rounded-md border border-border bg-muted/30 p-3">
                        <div className="whitespace-pre-wrap text-xs leading-relaxed">
                          {displaySystem.specificInstructions}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}
            </div>
          </div>
        </div>

        {(isAwaitingConfirmation || isExecuting) && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="glass"
              onClick={handleConfirm}
              disabled={!allBlankFieldsFilled || isExecuting}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Confirming...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
            <Button size="sm" variant="glass" onClick={handleCancel} disabled={isExecuting}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </ToolCallWrapper>
  );
}

export const CreateSystemComponent = memo(CreateSystemComponentImpl);
