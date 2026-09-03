"use client";

import { maskCredentialValue, type ToolCall } from "@ambios-ai/shared";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { ChevronDown, ChevronRight, Eye, EyeOff, KeyRound, Loader2, Settings } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Input } from "@/components/ui/input";
import {
  createToolInteractionEntry,
  type ToolMutation,
} from "@/lib/agent/agent-tools/tool-call-state";
import { useInvalidateSystems, useSystems } from "@/queries/systems";
import { useAgentContext } from "../AgentContextProvider";
import { ToolCallPendingState } from "./ToolCallPendingState";
import { ToolCallWrapper } from "./ToolComponentWrapper";

interface ModifySystemComponentProps {
  tool: ToolCall;
  onInputChange: (newInput: any) => void;
  onToolUpdate?: (toolCallId: string, updates: Partial<ToolCall>) => void;
  onToolMutation?: (toolCallId: string, mutation: ToolMutation) => void;
  onAbortStream?: () => void;
}

interface ModifySystemOutput {
  success?: boolean;
  systemConfig?: any;
  systemId?: string;
  environment?: string;
  system?: {
    id: string;
    [key: string]: any;
  };
  error?: string;
}

function ModifySystemComponentImpl({
  tool,
  onInputChange,
  onToolUpdate,
  onToolMutation,
  onAbortStream,
}: ModifySystemComponentProps) {
  const { systems } = useSystems();
  const { sendAgentRequest } = useAgentContext();
  const invalidateSystems = useInvalidateSystems();
  const hasRefreshedRef = useRef(false);
  const [credentialValues, setCredentialValues] = useState<Record<string, string>>({});
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});
  const [isPrefilledExpanded, setIsPrefilledExpanded] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

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
        : (tool.output as ModifySystemOutput);
    } catch {
      return null;
    }
  })();

  const systemConfig = output?.systemConfig || input;
  const systemId = output?.systemId || output?.system?.id || systemConfig?.id || input?.id;
  const environment = output?.environment || input?.environment || "prod";
  const systemFromContext = useMemo(() => {
    return systemId ? systems.find((i) => i.id === systemId) : null;
  }, [systems, systemId]);
  const displayName =
    systemFromContext?.name || output?.system?.name || systemConfig?.name || systemId;

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
  const isCompleted = tool.status === "completed" && output?.success;
  const isToolPending = tool.status === "pending";
  const isToolRunning =
    tool.status === "running" || (tool.status === "awaiting_confirmation" && !hasCredentials);
  const isToolInProgress = isToolPending || isToolRunning;
  const hasError =
    tool.status === "error" || (tool.status === "completed" && output && !output.success);

  useEffect(() => {
    if (isCompleted && !hasRefreshedRef.current) {
      hasRefreshedRef.current = true;
      invalidateSystems();
    }
  }, [isCompleted, invalidateSystems]);

  useEffect(() => {
    if (isCompleted || hasError || tool.status === "declined") {
      setIsExecuting(false);
    }
  }, [isCompleted, hasError, tool.status]);

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
        "user_submitted_credentials_and_confirmed_system_edit",
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
      interactionEntry: createToolInteractionEntry("user_declined_system_edit"),
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

  if (isCompleted) {
    return (
      <ToolCallWrapper tool={tool} openByDefault={false}>
        {null}
      </ToolCallWrapper>
    );
  }

  if (isToolInProgress) {
    return (
      <ToolCallWrapper
        tool={tool}
        openByDefault={true}
        hideStatusIcon={isToolPending}
        statusOverride={isToolRunning ? "running" : undefined}
      >
        <ToolCallPendingState icon={Settings} label="Updating system..." />
      </ToolCallWrapper>
    );
  }

  if (!input) {
    return (
      <ToolCallWrapper tool={tool} openByDefault={true}>
        <ErrorMessage title="System edit data unavailable" message="No input data available." />
      </ToolCallWrapper>
    );
  }

  return (
    <ToolCallWrapper tool={tool} openByDefault={true}>
      <div className="space-y-3">
        {isAwaitingConfirmation && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">Update system</span>
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-muted-foreground text-xs">
                {displayName}
              </code>
              {environment === "dev" && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 font-medium text-[10px] text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  DEV
                </span>
              )}
            </div>

            {blankFields.length > 0 && (
              <div className="space-y-3">
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

            {prefilledFields.length > 0 && (
              <Collapsible open={isPrefilledExpanded} onOpenChange={setIsPrefilledExpanded}>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1 font-medium text-muted-foreground text-xs transition-colors hover:text-foreground"
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
          </div>
        )}

        {(isAwaitingConfirmation || isExecuting) && (
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              variant="glass"
              className="!bg-[#ffa500] hover:!bg-[#ffd700] dark:!bg-[#ffa500] dark:hover:!bg-[#ffd700] !text-black !border-amber-400/50 dark:!border-amber-500/50 font-semibold"
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

        {hasError && (
          <ErrorMessage
            message={
              output?.error ||
              (typeof tool.error === "string" ? tool.error : "Update encountered an issue")
            }
          />
        )}
      </div>
    </ToolCallWrapper>
  );
}

export const ModifySystemComponent = memo(ModifySystemComponentImpl);
