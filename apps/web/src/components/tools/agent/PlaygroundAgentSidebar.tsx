"use client";

import {
  isRequestConfig,
  type RequestStepConfig,
  safeStringify,
  type Tool,
  type ToolDiff,
  type ToolStep,
} from "@ambios-ai/shared";
import { MessagesSquare, Pencil, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import { BloubBot } from "@/components/animation/bloub/BloubBot";
import { Button } from "@/components/ui/button";
import { FileChip } from "@/components/ui/file-chip";
import { Textarea } from "@/components/ui/textarea";
import { ThinkingIndicator } from "@/components/ui/thinking-indicator";
import {
  buildSystemPlaygroundInitializationMessage,
  buildToolPlaygroundInitializationMessage,
  SYSTEM_PLAYGROUND_INIT_MARKER,
  TOOL_PLAYGROUND_INIT_MARKER,
} from "@/lib/agent/agent-context";
import { AgentType } from "@/lib/agent/agent-kind";
import type {
  AccessRulesContext,
  DraftLookup,
  PlaygroundToolContext,
} from "@/lib/agent/agent-types";
import { cn } from "@/lib/general-utils";
import { useInvalidateSystems } from "@/queries/systems";
import { useAmbiOSClient } from "@/queries/use-client";
import { AgentCapabilities } from "../../agent/AgentCapabilities";
import { AgentContextProvider, useAgentContext } from "../../agent/AgentContextProvider";
import { AgentInputArea } from "../../agent/AgentInputArea";
import { ConversationHistory } from "../../agent/ConversationHistory";
import type { AgentConfig } from "../../agent/hooks/types";
import {
  ScrollToBottomButton,
  ScrollToBottomContainer,
  ScrollToBottomTrigger,
  type ScrollToBottomTriggerRef,
} from "../../agent/hooks/use-scroll-to-bottom";
import { ToolCallComponent } from "../../agent/ToolCallComponent";
import { BackgroundToolGroup, groupMessageParts } from "../../agent/tool-components";
import { useRightSidebar } from "../../sidebar/RightSidebarContext";
import type { SystemContextForAgent } from "../../systems/context/types";
import { STREAMDOWN_COMPONENTS } from "../../ui/streamdown-components";
import { useToolConfig } from "../context/tool-config-context";
import { useExecution } from "../context/tool-execution-context";

const MAX_MESSAGE_LENGTH = 50000;

export type PlaygroundMode = "tool" | "system" | "access";

export type SystemConfigForAgent = SystemContextForAgent;

interface PlaygroundAgentSidebarProps {
  className?: string;
  hideHeader?: boolean;
  initialError?: string;
  mode?: PlaygroundMode;
  systemConfig?: SystemContextForAgent;
}

function buildToolExecutionResultsSnapshot(
  execution: ReturnType<typeof useExecution>,
  steps: ToolStep[],
) {
  const executionResults: Record<string, { status: string; result?: string; error?: string }> = {};

  for (const step of steps) {
    const stepStatus = execution.getStepStatus(step.id);
    const stepResult = execution.getStepResult(step.id);
    const stepError = execution.getStepError(step.id);

    if (stepStatus !== "pending") {
      const entry: { status: string; result?: string; error?: string } = { status: stepStatus };
      if (stepResult !== null) {
        const resultStr =
          typeof stepResult === "string" ? stepResult : safeStringify(stepResult, 2);
        entry.result = resultStr.length > 5000 ? `${resultStr.substring(0, 5000)}...` : resultStr;
      }
      if (stepError) {
        entry.error = stepError.length > 500 ? `${stepError.substring(0, 500)}...` : stepError;
      }
      executionResults[step.id] = entry;
    }
  }

  return Object.keys(executionResults).length > 0 ? executionResults : undefined;
}

function buildToolPlaygroundContext(
  toolConfig: ReturnType<typeof useToolConfig>,
  executionSummary: string,
  initialError?: string,
): PlaygroundToolContext {
  const { tool, steps, outputTransform, inputSchema, outputSchema, payload } = toolConfig;
  const systemIds = [
    ...new Set(
      steps
        .map((s: ToolStep) =>
          s.config && isRequestConfig(s.config)
            ? (s.config as RequestStepConfig).systemId
            : undefined,
        )
        .filter(Boolean),
    ),
  ] as string[];

  return {
    toolId: tool.id,
    instruction: tool.instruction,
    steps: steps.map((step: ToolStep) => ({
      ...step,
    })),
    outputTransform,
    inputSchema: inputSchema?.trim() ? inputSchema : null,
    outputSchema: outputSchema?.trim() ? outputSchema : null,
    systemIds,
    executionSummary,
    initialError,
    currentPayload: safeStringify(payload.computedPayload || {}, 2),
  };
}

export interface PlaygroundAgentContentProps {
  hideHeader?: boolean;
  mode: PlaygroundMode;
  agentType: AgentType;
  cacheKeyPrefix: string;
  initializationMessage?: string;
  initializationMarker?: string;
  onApplyChanges?: (newConfig: Tool, diffs?: ToolDiff[]) => void;
  onApplyPayload?: (newPayload: string) => void;
  onApplyRoleConfig?: (newConfig: any) => void;
  currentPlaygroundState?: Partial<PlaygroundToolContext>;
}

export function PlaygroundAgentContent({
  hideHeader = false,
  mode,
  agentType,
  cacheKeyPrefix,
  initializationMessage,
  initializationMarker,
  onApplyChanges,
  onApplyPayload,
  onApplyRoleConfig,
  currentPlaygroundState,
}: PlaygroundAgentContentProps) {
  const initialError = currentPlaygroundState?.initialError;
  const currentPayload = currentPlaygroundState?.currentPayload;

  const {
    messages,
    isLoading,
    stopStreaming,
    handleToolInputChange,
    handleToolUpdate,
    handleToolMutation,
    sendAgentRequest,
    filePayloads,
    currentConversationId,
    setCurrentConversationId,
    sessionId,
    loadConversation,
    startNewConversation,
    editingMessageId,
    editingContent,
    setEditingContent,
    handleEditMessage,
    handleCancelEdit,
    handleSaveEdit,
  } = useAgentContext();

  const { registerSetAgentInput, registerResetAgentChat } = useRightSidebar();
  const [inputValue, setInputValue] = useState("");
  const [isHighlighted, setIsHighlighted] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasAutoFixedRef = useRef(false);
  const scrollTriggerRef = useRef<ScrollToBottomTriggerRef>(null);
  const hasVisibleMessages = messages.some((m) => m.role !== "system" && !(m as any).isHidden);
  const hasInitializationMessage =
    !!initializationMarker &&
    messages.some(
      (m) =>
        !!(m as any).isHidden &&
        typeof m.content === "string" &&
        m.content.startsWith(initializationMarker),
    );

  const sendPlaygroundRequest = useCallback(
    async (
      userMessage?: string,
      options?: {
        hiddenStarterMessage?: string;
        hideUserMessage?: boolean;
        resumeToolCallId?: string;
      },
    ) => {
      let hiddenStarterMessage = options?.hiddenStarterMessage;

      if (initializationMessage && !hasInitializationMessage) {
        hiddenStarterMessage = hiddenStarterMessage
          ? `${initializationMessage}\n\n---\n\n${hiddenStarterMessage}`
          : initializationMessage;
      }

      return sendAgentRequest(userMessage, {
        ...options,
        hiddenStarterMessage,
      });
    },
    [sendAgentRequest, initializationMessage, hasInitializationMessage],
  );

  // Register the setInput function to paste message into input field and select it
  useEffect(() => {
    registerSetAgentInput((message: string) => {
      setInputValue(message);
      setIsHighlighted(true);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.style.height = "auto";
          inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
        }
      }, 0);
    });
  }, [registerSetAgentInput]);

  // Register the reset chat function so it can be called from outside (Cmd+L)
  useEffect(() => {
    registerResetAgentChat(startNewConversation);
  }, [registerResetAgentChat, startNewConversation]);

  useEffect(() => {
    if (initialError && !hasAutoFixedRef.current && !isLoading && !hasVisibleMessages) {
      hasAutoFixedRef.current = true;
      const truncatedError =
        initialError.length > 500 ? `${initialError.slice(0, 500)}...` : initialError;
      const errorMessage =
        mode === "tool"
          ? `The tool execution failed with the following error:\n\n${truncatedError}\n\nPlease analyze this error and fix the tool configuration.`
          : `The system test failed with the following error:\n\n${truncatedError}\n\nPlease analyze this error and help fix the configuration.`;
      sendPlaygroundRequest(errorMessage);
    }
  }, [initialError, isLoading, hasVisibleMessages, sendPlaygroundRequest, mode]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isLoading) return;
    scrollTriggerRef.current?.scrollToBottom();
    sendPlaygroundRequest(inputValue.trim());
    setInputValue("");
    setIsHighlighted(false);
  }, [inputValue, isLoading, sendPlaygroundRequest]);

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const emptyStateText =
    mode === "tool"
      ? {
          title: "Ask ambios to edit your tool",
          hint: 'e.g. "Add a filter to step getUsers to retrieve only active users"',
        }
      : mode === "access"
        ? {
            title: "Ask ambios to configure access rules",
            hint: 'e.g. "Make this role read-only for Stripe" or "Block all POST requests to the admin API"',
          }
        : {
            title: "Ask ambios to help with your system",
            hint: 'e.g. "Test my API credentials" or "Help me debug authentication"',
          };

  return (
    <div className="flex h-full flex-col bg-background">
      <div
        className={cn(
          "relative z-10 flex items-center justify-between overflow-visible px-3 py-2",
          !hideHeader && "border-b bg-muted/30",
        )}
      >
        {!hideHeader && (
          <div className="flex items-center gap-1.5 font-medium text-foreground text-sm">
            <MessagesSquare className="h-3.5 w-3.5" />
            Agent
          </div>
        )}
        <div className={cn("relative flex items-center gap-1", hideHeader && "ml-auto")}>
          <AgentCapabilities agentType={agentType} compact triggerClassName="h-7 w-7" />
          <ConversationHistory
            messages={messages}
            currentConversationId={currentConversationId}
            sessionId={sessionId}
            onConversationLoad={loadConversation}
            onCurrentConversationIdChange={setCurrentConversationId}
            cacheKeyPrefix={cacheKeyPrefix}
          />
          {(hasVisibleMessages || hideHeader) && (
            <Button variant="glass" size="sm" onClick={startNewConversation} className="h-8 px-2">
              <Plus className="mr-1 h-3 w-3" />
              New
            </Button>
          )}
        </div>
      </div>

      <ScrollToBottomContainer
        className="relative flex-1 overflow-hidden"
        scrollViewClassName="overflow-x-hidden scrollbar-hidden"
        followButtonClassName="hidden"
        debounce={50}
      >
        <div className="space-y-4 p-4">
          {!hasVisibleMessages && (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center">
                <BloubBot state="idle" size={32} label="AmbiOS assistant" />
              </div>
              <p className="text-muted-foreground text-sm">{emptyStateText.title}</p>
              <p className="mt-2 max-w-[240px] text-muted-foreground/70 text-xs">
                {emptyStateText.hint}
              </p>
            </div>
          )}

          {messages
            .filter((m) => m.role !== "system" && !(m as any).isHidden)
            .map((message) => (
              <div key={message.id} className="group min-h-12 rounded-xl p-2 pt-3">
                <div className="min-w-0 space-y-2 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full",
                        message.role === "user" ? "bg-neutral-100 dark:bg-neutral-900" : "",
                      )}
                    >
                      {message.role === "user" ? (
                        <span className="font-semibold text-[9px] text-neutral-900 dark:text-neutral-100">
                          Y
                        </span>
                      ) : (
                        <BloubBot state="idle" size={16} label="AmbiOS assistant" />
                      )}
                    </div>
                    <span className="font-medium text-sm">
                      {message.role === "user" ? "You" : "ambios"}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatTimestamp(message.timestamp)}
                    </span>
                    {(() => {
                      const hasContent =
                        message.content?.trim() ||
                        message.parts?.some((p) => p.type === "content" && p.content?.trim());
                      return message.isStreaming && !hasContent ? <ThinkingIndicator /> : null;
                    })()}
                    {message.role === "user" && !isLoading && (
                      <button
                        type="button"
                        onClick={() => handleEditMessage(message.id, message.content)}
                        className="flex h-6 w-6 items-center justify-center rounded opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                        title="Edit message"
                      >
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </button>
                    )}
                  </div>

                  {message.role === "user" &&
                    (message as any).attachedFiles &&
                    (message as any).attachedFiles.length > 0 && (
                      <div className="mb-1.5 flex flex-wrap gap-1.5">
                        {(message as any).attachedFiles.map((file: any) => (
                          <FileChip
                            key={file.key}
                            file={file}
                            size="compact"
                            rounded="md"
                            showOriginalName={true}
                            maxWidth="200px"
                          />
                        ))}
                      </div>
                    )}

                  {editingMessageId === message.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="max-h-[120px] min-h-[48px] resize-y rounded-lg border border-border/50 bg-gradient-to-br from-muted/50 to-muted/30 px-3 py-2 text-sm shadow-sm backdrop-blur-sm focus-visible:ring-0 dark:from-muted/30 dark:to-muted/20"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => handleSaveEdit(message.id)}
                          disabled={!editingContent.trim() || isLoading}
                          className="h-7 rounded-lg text-xs"
                        >
                          Save & Restart
                        </Button>
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={handleCancelEdit}
                          disabled={isLoading}
                          className="h-7 rounded-lg text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="message-content-wrapper space-y-2 break-words">
                      {message.parts && message.parts.length > 0 ? (
                        groupMessageParts(message.parts).map((grouped, idx) => {
                          if (grouped.type === "content") {
                            return (
                              <div
                                key={grouped.part.id}
                                className={cn(
                                  "prose prose-sm dark:prose-invert max-w-none text-sm",
                                  message.isStreaming && "streaming-message",
                                )}
                              >
                                <Streamdown components={STREAMDOWN_COMPONENTS}>
                                  {grouped.part.content || ""}
                                </Streamdown>
                              </div>
                            );
                          }
                          if (grouped.type === "background_tools") {
                            return (
                              <BackgroundToolGroup
                                key={`background-${grouped.tools.map((tool) => tool.id).join("-")}`}
                                tools={grouped.tools}
                              />
                            );
                          }
                          if (grouped.type === "tool" && grouped.part.tool) {
                            return (
                              <ToolCallComponent
                                key={grouped.part.tool.id}
                                tool={grouped.part.tool}
                                onInputChange={handleToolInputChange}
                                onToolUpdate={handleToolUpdate}
                                onToolMutation={handleToolMutation}
                                sendAgentRequest={sendPlaygroundRequest}
                                onAbortStream={stopStreaming}
                                onApplyChanges={onApplyChanges}
                                onApplyPayload={onApplyPayload}
                                onApplyRoleConfig={onApplyRoleConfig}
                                currentPayload={currentPayload}
                                isPlayground={mode === "tool"}
                                filePayloads={filePayloads}
                              />
                            );
                          }
                          return null;
                        })
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                          <Streamdown components={STREAMDOWN_COMPONENTS}>
                            {message.content}
                          </Streamdown>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
        <ScrollToBottomTrigger ref={scrollTriggerRef} />
        <ScrollToBottomButton
          className="absolute bottom-3 left-1/2 z-50 -translate-x-1/2"
          buttonClassName="h-8 w-8 p-0 rounded-full bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 border-2 border-green-400 dark:border-green-500 shadow-lg hover:shadow-xl transition-all duration-200"
          iconClassName="w-4 h-4 text-white"
        />
      </ScrollToBottomContainer>

      <div className="p-3">
        <AgentInputArea
          value={inputValue}
          onChange={(v) => {
            setInputValue(v);
            setIsHighlighted(false);
          }}
          onSend={handleSend}
          onStop={stopStreaming}
          isLoading={isLoading}
          placeholder="Message ambios..."
          maxLength={MAX_MESSAGE_LENGTH}
          compact
          inputRef={inputRef}
          containerClassName={cn(
            isHighlighted &&
              "!ring-1 border-amber-500 shadow-amber-500/30 shadow-lg ring-amber-500 focus-within:border-amber-500 hover:border-amber-500",
          )}
          scrollToBottom={() => scrollTriggerRef.current?.scrollToBottom()}
        />
      </div>
    </div>
  );
}

function ToolPlaygroundAgentSidebar({
  className,
  hideHeader,
  initialError,
}: Omit<PlaygroundAgentSidebarProps, "mode" | "systemConfig">) {
  const toolConfig = useToolConfig();
  const execution = useExecution();
  const createClient = useAmbiOSClient();
  const { setSavedTool } = useRightSidebar();
  const toolId = toolConfig.tool.id;

  const handleApplyChanges = useCallback(
    (newConfig: Tool, _diffs?: ToolDiff[]) => {
      execution.skipNextHashInvalidation();

      const stepsAreDifferent = (a: ToolStep, b: ToolStep): boolean => {
        const aSystemId =
          a.config && isRequestConfig(a.config)
            ? (a.config as RequestStepConfig).systemId
            : undefined;
        const bSystemId =
          b.config && isRequestConfig(b.config)
            ? (b.config as RequestStepConfig).systemId
            : undefined;
        return (
          a.id !== b.id ||
          aSystemId !== bSystemId ||
          a.dataSelector !== b.dataSelector ||
          JSON.stringify(a.config) !== JSON.stringify(b.config)
        );
      };

      let firstChangedStepIndex: number | null = null;
      if (newConfig.steps) {
        const oldSteps = toolConfig.steps;
        const newSteps = newConfig.steps;
        const maxLen = Math.max(oldSteps.length, newSteps.length);

        for (let i = 0; i < maxLen; i++) {
          const oldStep = oldSteps[i];
          const newStep = newSteps[i];
          if (!oldStep || !newStep || stepsAreDifferent(oldStep, newStep)) {
            firstChangedStepIndex = i;
            break;
          }
        }

        toolConfig.setSteps(
          newSteps.map((step) => ({
            ...step,
          })),
        );
      }

      const outputTransformChanged =
        newConfig.outputTransform !== undefined &&
        newConfig.outputTransform !== toolConfig.outputTransform;

      if (newConfig.outputTransform !== undefined) {
        toolConfig.setOutputTransform(newConfig.outputTransform);
      }

      if (newConfig.instruction !== undefined) {
        toolConfig.setInstruction(newConfig.instruction || "");
      }

      if (newConfig.outputSchema !== undefined) {
        const schemaValue = newConfig.outputSchema
          ? typeof newConfig.outputSchema === "string"
            ? newConfig.outputSchema
            : JSON.stringify(newConfig.outputSchema, null, 2)
          : "";
        toolConfig.setOutputSchema(schemaValue);
      }

      if (newConfig.inputSchema !== undefined) {
        const schemaValue = newConfig.inputSchema
          ? typeof newConfig.inputSchema === "string"
            ? newConfig.inputSchema
            : JSON.stringify(newConfig.inputSchema, null, 2)
          : null;
        toolConfig.setInputSchema(schemaValue);
      }

      if (firstChangedStepIndex !== null) {
        execution.clearExecutionsFrom(firstChangedStepIndex);
      } else if (outputTransformChanged) {
        execution.clearFinalResult();
      }
    },
    [toolConfig, execution],
  );

  const handleApplyPayload = useCallback(
    (newPayload: string) => {
      toolConfig.setPayloadText(newPayload);
    },
    [toolConfig],
  );

  const executionResults = useMemo(
    () => buildToolExecutionResultsSnapshot(execution, toolConfig.steps),
    [execution, toolConfig.steps],
  );

  const initializationMessage = useMemo(
    () =>
      buildToolPlaygroundInitializationMessage({
        config: {
          ...toolConfig.tool,
          steps: toolConfig.steps.map((step) => ({ ...step })),
        } as Tool,
        manualPayload: toolConfig.payload.manualPayloadText || "{}",
        mergedPayload: toolConfig.payload.computedPayload || {},
      }),
    [
      toolConfig.tool,
      toolConfig.steps,
      toolConfig.payload.manualPayloadText,
      toolConfig.payload.computedPayload,
    ],
  );

  // Build current draft config that updates whenever toolConfig changes
  const currentPlaygroundState = useMemo<PlaygroundToolContext>(
    () => buildToolPlaygroundContext(toolConfig, "", initialError),
    [toolConfig, initialError],
  );

  const syncSavedPlaygroundState = useCallback(
    async (savedToolId: string) => {
      try {
        const client = createClient();
        const savedTool = await client.getWorkflow(savedToolId);
        if (savedTool) {
          if (savedTool.id !== toolConfig.tool.id) {
            toolConfig.setToolId(savedTool.id);
          }
          toolConfig.setSteps(
            (savedTool.steps || []).map((step) => ({
              ...step,
            })),
          );
          toolConfig.setInstruction(savedTool.instruction || "");
          toolConfig.setOutputTransform(
            savedTool.outputTransform || "(sourceData) => { return {} }",
          );
          toolConfig.setInputSchema(
            savedTool.inputSchema ? JSON.stringify(savedTool.inputSchema, null, 2) : null,
          );
          toolConfig.setOutputSchema(
            savedTool.outputSchema ? JSON.stringify(savedTool.outputSchema, null, 2) : "",
          );
          toolConfig.setFolder(savedTool.folder);
          toolConfig.setIsArchived(savedTool.archived || false);
          toolConfig.setResponseFilters(savedTool.responseFilters || []);
          setSavedTool(savedTool);
        }
      } catch (error) {
        console.warn("Failed to refresh playground state after save_tool:", error);
      } finally {
        setTimeout(toolConfig.markCurrentStateAsBaseline, 0);
      }
    },
    [createClient, setSavedTool, toolConfig],
  );

  const onToolComplete = useCallback(
    (toolName: string, _toolCallId: string, output: any) => {
      if (
        toolName === "save_tool" &&
        output?.success === true &&
        output?.persistence === "saved" &&
        typeof output.toolId === "string"
      ) {
        void syncSavedPlaygroundState(output.toolId);
      }
    },
    [syncSavedPlaygroundState],
  );

  const playgroundDraftBuilderRef = useRef<() => DraftLookup | null>(() => null);
  playgroundDraftBuilderRef.current = () => {
    const ctx = buildToolPlaygroundContext(toolConfig, "", initialError);
    if (!ctx.toolId || !ctx.steps || ctx.steps.length === 0) {
      return null;
    }

    return {
      config: {
        id: ctx.toolId,
        instruction: ctx.instruction,
        steps: ctx.steps,
        outputTransform: ctx.outputTransform,
        inputSchema: ctx.inputSchema ?? undefined,
        outputSchema: ctx.outputSchema ?? undefined,
        folder: toolConfig.tool.folder,
        archived: toolConfig.tool.isArchived,
        responseFilters:
          toolConfig.tool.responseFilters.length > 0 ? toolConfig.tool.responseFilters : undefined,
      },
      systemIds: ctx.systemIds || [],
      instruction: ctx.instruction || "",
      executionResults,
    };
  };

  const agentConfig = useMemo<AgentConfig>(() => {
    return {
      agentId: AgentType.PLAYGROUND,
      playgroundDraftBuilder: () => playgroundDraftBuilderRef.current?.() ?? null,
      onToolComplete,
    };
  }, [onToolComplete]);

  return (
    <div className={cn("h-full", className)}>
      <AgentContextProvider config={agentConfig}>
        <PlaygroundAgentContent
          hideHeader={hideHeader}
          mode="tool"
          agentType={AgentType.PLAYGROUND}
          cacheKeyPrefix={`ambios-playground-${toolId}`}
          initializationMessage={initializationMessage}
          initializationMarker={TOOL_PLAYGROUND_INIT_MARKER}
          onApplyChanges={handleApplyChanges}
          onApplyPayload={handleApplyPayload}
          currentPlaygroundState={currentPlaygroundState}
        />
      </AgentContextProvider>
    </div>
  );
}

function SystemPlaygroundAgentSidebar({
  className,
  hideHeader,
  initialError,
  systemConfig,
}: Omit<PlaygroundAgentSidebarProps, "mode"> & { systemConfig: SystemContextForAgent }) {
  const invalidateSystems = useInvalidateSystems();

  const onToolComplete = useCallback(
    (toolName: string, _toolId: string, output: any) => {
      if ((toolName === "edit_system" || toolName === "create_system") && output?.success) {
        invalidateSystems();
      }
    },
    [invalidateSystems],
  );

  const agentConfig = useMemo<AgentConfig>(() => {
    return {
      agentId: AgentType.SYSTEM_PLAYGROUND,
      systemPlaygroundContextBuilder: () => systemConfig,
      onToolComplete,
    };
  }, [onToolComplete, systemConfig]);

  const initializationMessage = useMemo(
    () => buildSystemPlaygroundInitializationMessage(systemConfig),
    [systemConfig],
  );

  return (
    <div className={cn("h-full", className)}>
      <AgentContextProvider config={agentConfig}>
        <PlaygroundAgentContent
          hideHeader={hideHeader}
          mode="system"
          agentType={AgentType.SYSTEM_PLAYGROUND}
          cacheKeyPrefix={`ambios-system-${systemConfig.systemId || "new"}`}
          initializationMessage={initializationMessage}
          initializationMarker={SYSTEM_PLAYGROUND_INIT_MARKER}
          currentPlaygroundState={initialError ? { initialError } : undefined}
        />
      </AgentContextProvider>
    </div>
  );
}

function AccessPlaygroundAgentSidebar({
  className,
  hideHeader,
}: Omit<PlaygroundAgentSidebarProps, "mode" | "systemConfig">) {
  const { accessRulesContext, onRoleDraftUpdate } = useRightSidebar();

  const onToolComplete = useCallback(
    (toolName: string, _toolId: string, output: any) => {
      if (toolName === "edit_role" && output?.success && output?.newConfig && onRoleDraftUpdate) {
        onRoleDraftUpdate({ ...output.newConfig, roleId: output.roleId });
      }
    },
    [onRoleDraftUpdate],
  );

  const contextRef = useRef<AccessRulesContext | undefined>(accessRulesContext);
  contextRef.current = accessRulesContext;

  const agentConfig = useMemo<AgentConfig>(
    () => ({
      agentId: AgentType.ACCESS_RULES,
      accessRulesContextBuilder: () => contextRef.current || null,
      onToolComplete,
    }),
    [onToolComplete],
  );

  return (
    <div className={cn("h-full", className)}>
      <AgentContextProvider config={agentConfig}>
        <PlaygroundAgentContent
          hideHeader={hideHeader}
          mode="access"
          agentType={AgentType.ACCESS_RULES}
          cacheKeyPrefix="ambios-access"
          onApplyRoleConfig={onRoleDraftUpdate}
        />
      </AgentContextProvider>
    </div>
  );
}

export function PlaygroundAgentSidebar({
  className,
  hideHeader,
  initialError,
  mode = "tool",
  systemConfig,
}: PlaygroundAgentSidebarProps) {
  if (mode === "access") {
    return <AccessPlaygroundAgentSidebar className={className} hideHeader={hideHeader} />;
  }

  if (mode === "system" && systemConfig) {
    return (
      <SystemPlaygroundAgentSidebar
        className={className}
        hideHeader={hideHeader}
        initialError={initialError}
        systemConfig={systemConfig}
      />
    );
  }

  return (
    <ToolPlaygroundAgentSidebar
      className={className}
      hideHeader={hideHeader}
      initialError={initialError}
    />
  );
}
