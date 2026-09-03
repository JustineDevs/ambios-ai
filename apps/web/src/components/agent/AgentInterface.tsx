"use client";
import type { Message, MessageReference, ToolCall } from "@ambios-ai/shared";
import { AlertTriangle, ChevronDown, ChevronUp, Pencil, Plus, ShieldCheck } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import {
  Conversation,
  ConversationContent,
  Message as ElementsMessage,
  Tool as ElementsTool,
  MessageResponse,
  PromptInput,
} from "@/components/ai-elements";
import { BloubBot } from "@/components/animation/bloub/BloubBot";
import { Button } from "@/components/ui/button";
import { FileChip } from "@/components/ui/file-chip";
import { SystemIcon } from "@/components/ui/system-icon";
import { ThinkingIndicator } from "@/components/ui/thinking-indicator";
import { AgentType } from "@/lib/agent/agent-kind";
import type { ToolMutation } from "@/lib/agent/agent-tools/tool-call-state";
import { dedupeReferences, reconcileReferences, splitByMentions } from "@/lib/agent/mentions";
import { DEFAULT_CHAT_MODEL_ID } from "@/lib/ai/chat-models";
import { cn, handleCopyCode } from "@/lib/general-utils";
import {
  RUN_MENTION_WINDOW_DAYS,
  useAllSystemsForMentions,
  useAllToolsForMentions,
  useMissingReferences,
  useRunsForMentions,
} from "@/queries/mention-sources";
import { ArrowCursor } from "../ui/arrow-cursor";
import { SelectAIAgent } from "../ui/select-ai-agent";
import { STREAMDOWN_COMPONENTS } from "../ui/streamdown-components";
import { AgentCapabilities } from "./AgentCapabilities";
import { AgentContextProvider, useAgentContext } from "./AgentContextProvider";
import { AgentInputArea, type MentionItem, mentionItemToReference } from "./AgentInputArea";
import { AgentSetupCard } from "./AgentSetupCard";
import { ConversationHistory } from "./ConversationHistory";
import {
  ScrollToBottomButton,
  ScrollToBottomContainer,
  ScrollToBottomTrigger,
  type ScrollToBottomTriggerRef,
} from "./hooks/use-scroll-to-bottom";
import { MentionChip } from "./MentionChip";
import { MentionEditBox } from "./MentionEditBox";
import { ToolCallComponent } from "./ToolCallComponent";
import { BackgroundToolGroup, groupMessageParts } from "./tool-components";
import { AgentWelcome } from "./welcome/AgentWelcome";

const MAX_MESSAGE_LENGTH = 50000;
const MENTION_SEARCH_DEBOUNCE_MS = 150;
const MENTION_GROUP_HINTS = {
  run: `last ${RUN_MENTION_WINDOW_DAYS} days`,
} as const;

/** Keeps the server-side run search from firing on every keystroke. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

/** Compact age used in the run suggestions, e.g. "12 min ago". */
function formatRunAge(startedAt?: string): string {
  if (!startedAt) return "unknown time";
  const started = new Date(startedAt).getTime();
  if (Number.isNaN(started)) return "unknown time";

  const minutes = Math.floor((Date.now() - started) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
}

function ErrorMessagePart({ content, errorDetails }: { content: string; errorDetails?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-zinc-200/50 bg-zinc-50/50 p-4 dark:border-zinc-700/50 dark:bg-zinc-800/20">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-zinc-500 dark:text-zinc-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-zinc-800 dark:text-zinc-200">{content}</p>
          {errorDetails && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-xs text-zinc-600/70 transition-colors hover:text-zinc-600 dark:text-zinc-400/70 dark:hover:text-zinc-400"
              >
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                {isExpanded ? "Hide details" : "Show details"}
              </button>
              {isExpanded && (
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all rounded border border-zinc-200/30 bg-zinc-100/50 p-2 font-mono text-xs text-zinc-700 dark:border-zinc-700/30 dark:bg-zinc-900/30 dark:text-zinc-300">
                  {errorDetails}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getThinkingPresentation(message: Message) {
  const activeTool = [...(message.parts ?? [])]
    .reverse()
    .map((part) => part.tool)
    .find(
      (tool): tool is ToolCall =>
        !!tool && ["pending", "running", "awaiting_confirmation"].includes(tool.status),
    );

  if (!activeTool) return { text: "Thinking", state: "thinking" as const };
  if (activeTool.status === "awaiting_confirmation") {
    return { text: "Waiting for approval", state: "approval" as const };
  }
  const name = activeTool.name.toLowerCase();
  if (name.includes("search") || name.includes("find") || name.includes("inspect")) {
    return { text: "Searching", state: "searching" as const };
  }
  if (name.includes("connect") || name.includes("oauth") || name.includes("sync")) {
    return { text: "Connecting", state: "connecting" as const };
  }
  return { text: "Working", state: "working" as const };
}

const MemoMessage = React.memo(
  ({
    message,
    onInputChange,
    onToolUpdate,
    onToolMutation,
    sendAgentRequest,
    onAbortStream,
    editingMessageId,
    editingContent,
    setEditingContent,
    isLoading,
    formatTimestamp,
    handleEditMessage,
    handleSaveEdit,
    handleCancelEdit,
    filePayloads,
    missingReferenceKeys,
    editingReferences,
    setEditingReferences,
    mentionItems,
    isLoadingMentions,
    mentionGroupHints,
    onMentionQueryChange,
  }: {
    message: Message;
    onInputChange: (newInput: any) => void;
    onToolUpdate: (toolCallId: string, updates: Partial<ToolCall>) => void;
    onToolMutation: (toolCallId: string, mutation: ToolMutation) => void;
    sendAgentRequest?: (
      userMessage?: string,
      options?: {
        hiddenStarterMessage?: string;
        hideUserMessage?: boolean;
        resumeToolCallId?: string;
      },
    ) => Promise<void>;
    onAbortStream?: () => void;
    editingMessageId: string | null;
    editingContent: string;
    setEditingContent: (content: string) => void;
    isLoading: boolean;
    formatTimestamp: (date: Date) => string;
    handleEditMessage: (
      messageId: string,
      content: string,
      references?: MessageReference[],
    ) => void;
    handleSaveEdit: (messageId: string) => void;
    handleCancelEdit: () => void;
    filePayloads?: Record<string, any>;
    missingReferenceKeys?: Set<string>;
    editingReferences: MessageReference[];
    setEditingReferences: (references: MessageReference[]) => void;
    mentionItems?: MentionItem[];
    isLoadingMentions?: boolean;
    mentionGroupHints?: Partial<Record<string, string>>;
    onMentionQueryChange?: (query: string | null) => void;
  }) => {
    return (
      <ElementsMessage role={message.role}>
        <div key={message.id} className={cn("group flex min-h-16 gap-4 rounded-xl p-2 pt-4")}>
          <div
            className={cn(
              "flex hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-full lg:flex",
              message.role === "user" ? "bg-neutral-100 dark:bg-neutral-900" : "",
            )}
          >
            {message.role === "user" && (
              <span className="font-semibold text-neutral-900 text-sm dark:text-neutral-100">
                Y
              </span>
            )}
            {message.role === "assistant" && (
              <BloubBot state="idle" size={28} label="AmbiOS assistant" />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-3 overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="font-medium text-base">
                {message.role === "user" ? "You" : "AmbiOS AI"}
              </span>
              <span className="text-muted-foreground text-xs">
                {formatTimestamp(message.timestamp)}
              </span>
              {(() => {
                const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
                const isStale = message.timestamp.getTime() < fiveMinutesAgo;
                const hasContent =
                  message.content?.trim() ||
                  message.parts?.some((p) => p.type === "content" && p.content?.trim());

                if (!message.isStreaming || isStale || hasContent) return null;
                const presentation = getThinkingPresentation(message);
                return <ThinkingIndicator {...presentation} />;
              })()}
              {message.role === "user" && !isLoading && (
                <button
                  type="button"
                  onClick={() => handleEditMessage(message.id, message.content, message.references)}
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
                <div className="mb-2 flex flex-wrap gap-2">
                  {(message as any).attachedFiles.map((file: any) => (
                    <FileChip
                      key={file.key}
                      file={file}
                      size="compact"
                      rounded="md"
                      showOriginalName={true}
                      maxWidth="250px"
                    />
                  ))}
                </div>
              )}

            {editingMessageId === message.id ? (
              <div className="space-y-3">
                <MentionEditBox
                  value={editingContent}
                  onChange={setEditingContent}
                  references={editingReferences}
                  onReferencesChange={setEditingReferences}
                  mentionItems={mentionItems}
                  isLoadingMentions={isLoadingMentions}
                  mentionGroupHints={mentionGroupHints as any}
                  onMentionQueryChange={onMentionQueryChange}
                  placeholder="Edit your message..."
                />
                <div className="flex gap-2">
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => handleSaveEdit(message.id)}
                    disabled={!editingContent.trim() || isLoading}
                    className="rounded-xl"
                  >
                    Save & Restart
                  </Button>
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <MessageResponse className="message-content-wrapper space-y-3 break-words">
                {message.parts && message.parts.length > 0 ? (
                  groupMessageParts(message.parts).map((grouped, idx) => {
                    if (grouped.type === "content") {
                      return (
                        <div
                          key={grouped.part.id}
                          className={cn(
                            "prose prose-sm dark:prose-invert max-w-none",
                            message.isStreaming && "streaming-message streaming-active",
                          )}
                        >
                          <Streamdown components={STREAMDOWN_COMPONENTS}>
                            {grouped.part.content || ""}
                          </Streamdown>
                        </div>
                      );
                    }
                    if (grouped.type === "error") {
                      return (
                        <ErrorMessagePart
                          key={grouped.part.id}
                          content={grouped.part.content || "An error occurred"}
                          errorDetails={grouped.part.errorDetails}
                        />
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
                        <ElementsTool
                          key={grouped.part.id}
                          data-tool-call-id={grouped.part.tool.id}
                        >
                          <ToolCallComponent
                            tool={grouped.part.tool}
                            onInputChange={onInputChange}
                            onToolUpdate={onToolUpdate}
                            onToolMutation={onToolMutation}
                            sendAgentRequest={sendAgentRequest}
                            onAbortStream={onAbortStream}
                            filePayloads={filePayloads}
                          />
                        </ElementsTool>
                      );
                    }
                    return null;
                  })
                ) : (
                  <>
                    <div
                      className={cn(
                        "prose prose-sm dark:prose-invert max-w-none",
                        message.isStreaming && "streaming-message streaming-active",
                      )}
                    >
                      {message.role === "user" && message.references?.length ? (
                        // Mentions are rendered as chips instead of markdown so the referenced
                        // entity stays recognisable after sending.
                        <p className="whitespace-pre-wrap break-words">
                          {splitByMentions(message.content, message.references).map(
                            (segment, index) =>
                              segment.reference ? (
                                <MentionChip
                                  key={`${segment.reference?.id ?? "text"}:${segment.text}`}
                                  reference={segment.reference}
                                  text={segment.text}
                                  missing={missingReferenceKeys?.has(
                                    `${segment.reference.type}:${segment.reference.id}`,
                                  )}
                                />
                              ) : (
                                <React.Fragment key={`text:${segment.text}`}>
                                  {segment.text}
                                </React.Fragment>
                              ),
                          )}
                        </p>
                      ) : (
                        <Streamdown components={STREAMDOWN_COMPONENTS}>
                          {message.content}
                        </Streamdown>
                      )}
                    </div>
                    {message.tools && message.tools.length > 0 && (
                      <div className="space-y-3">
                        {message.tools.map((tool) => (
                          <ElementsTool key={tool.id} data-tool-call-id={tool.id}>
                            <ToolCallComponent
                              tool={tool}
                              onInputChange={onInputChange}
                              onToolUpdate={onToolUpdate}
                              onToolMutation={onToolMutation}
                              sendAgentRequest={sendAgentRequest}
                              onAbortStream={onAbortStream}
                              filePayloads={filePayloads}
                            />
                          </ElementsTool>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </MessageResponse>
            )}
          </div>
        </div>
      </ElementsMessage>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to avoid re-renders when filePayloads content hasn't changed
    if (prevProps.message !== nextProps.message) return false;
    if (prevProps.editingMessageId !== nextProps.editingMessageId) return false;
    if (prevProps.editingContent !== nextProps.editingContent) return false;
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    // New Set identity means a reference's existence changed - chips must repaint.
    if (prevProps.missingReferenceKeys !== nextProps.missingReferenceKeys) return false;
    // The edit box needs fresh mention data and reference state while it is open.
    if (prevProps.editingReferences !== nextProps.editingReferences) return false;
    if (prevProps.mentionItems !== nextProps.mentionItems) return false;
    if (prevProps.isLoadingMentions !== nextProps.isLoadingMentions) return false;

    // For filePayloads, only compare keys (not the actual content)
    const prevKeys = Object.keys(prevProps.filePayloads || {})
      .sort()
      .join(",");
    const nextKeys = Object.keys(nextProps.filePayloads || {})
      .sort()
      .join(",");
    if (prevKeys !== nextKeys) return false;

    // Functions are stable due to useCallback, so we can skip comparing them
    return true;
  },
);

MemoMessage.displayName = "MemoMessage";

interface AgentInterfaceProps {
  initialPrompts?: {
    userPrompt: string;
    hiddenStarterMessage: string;
    hideUserMessage?: boolean;
    chatTitle?: string;
    chatIcon?: string;
  } | null;
}

export function AgentInterface({ initialPrompts }: AgentInterfaceProps = {}) {
  return (
    <AgentContextProvider initialPrompts={initialPrompts}>
      <AgentInterfaceContent
        chatTitle={initialPrompts?.chatTitle}
        chatIcon={initialPrompts?.chatIcon}
      />
    </AgentContextProvider>
  );
}

function AgentInterfaceContent({
  chatTitle: initialChatTitle,
  chatIcon: initialChatIcon,
}: {
  chatTitle?: string;
  chatIcon?: string;
}) {
  const {
    messages,
    isLoading,
    editingMessageId,
    editingContent,
    setEditingContent,
    editingReferences,
    setEditingReferences,
    handleEditMessage,
    handleCancelEdit,
    handleSaveEdit,
    stopStreaming,
    handleToolInputChange,
    handleToolUpdate,
    handleToolMutation,
    sendAgentRequest,
    abortStream,
    filePayloads,
    currentConversationId,
    setCurrentConversationId,
    sessionId,
    loadConversation,
    startNewConversation,
    handleSendMessage,
    startTemplatePrompt,
    welcomeRef,
  } = useAgentContext();

  const [chatTitle, setChatTitle] = useState(initialChatTitle);
  const [chatIcon, setChatIcon] = useState(initialChatIcon);

  const handleConversationLoad = useCallback(
    (conversation: any) => {
      setChatTitle(undefined);
      setChatIcon(undefined);
      loadConversation(conversation);
    },
    [loadConversation],
  );

  const handleStartPrompt = useCallback(
    (
      userPrompt: string,
      hiddenStarterMessage?: string,
      options?: { hideUserMessage?: boolean; chatTitle?: string; chatIcon?: string },
    ) => {
      if (options?.chatTitle) {
        setChatTitle(options.chatTitle);
      }
      if (options?.chatIcon) {
        setChatIcon(options.chatIcon);
      }
      startTemplatePrompt(userPrompt, hiddenStarterMessage, options);
    },
    [startTemplatePrompt],
  );

  const [input, setInput] = React.useState("");
  const [references, setReferences] = React.useState<MessageReference[]>([]);
  const [agentReady, setAgentReady] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string>(DEFAULT_CHAT_MODEL_ID);
  const handleReadyChange = useCallback((ready: boolean) => setAgentReady(ready), []);

  // The run list is searched server-side, so the popover query is pushed down to it.
  const [mentionQuery, setMentionQuery] = useState("");
  const debouncedMentionQuery = useDebouncedValue(mentionQuery, MENTION_SEARCH_DEBOUNCE_MS);

  const { tools, isLoading: isLoadingTools } = useAllToolsForMentions();
  const { systems, isLoading: isLoadingSystems } = useAllSystemsForMentions();
  const { runs, isLoading: isLoadingRuns } = useRunsForMentions(debouncedMentionQuery);

  const handleMentionQueryChange = useCallback((query: string | null) => {
    setMentionQuery(query ?? "");
  }, []);

  // Every reference ever sent in this conversation, so deleted targets can be flagged.
  const transcriptReferences = useMemo(
    () => messages.flatMap((message) => message.references ?? []),
    [messages],
  );
  const missingReferenceKeys = useMissingReferences(transcriptReferences);

  const mentionItems = useMemo<MentionItem[]>(() => {
    const toolItems: MentionItem[] = tools.map((tool) => ({
      type: "tool",
      id: tool.id,
      label: tool.name || tool.id,
      description: tool.instruction || undefined,
    }));

    const systemItems: MentionItem[] = systems.map((system) => ({
      type: "system",
      id: system.id,
      label: system.name || system.id,
      description: system.url || undefined,
      icon: system.icon || undefined,
    }));

    const runItems: MentionItem[] = runs.map((run) => ({
      type: "run",
      id: run.runId,
      label: run.toolId || run.runId,
      referenceLabel: `${run.toolId || "run"} · ${run.status}`,
      status: run.status,
      description: `${run.status} · ${formatRunAge(run.metadata?.startedAt)}`,
    }));

    return [...toolItems, ...systemItems, ...runItems];
  }, [tools, systems, runs]);

  const isLoadingMentions = isLoadingTools || isLoadingSystems || isLoadingRuns;

  // Text is the source of truth: deleting "@customer-sync" by hand drops the reference too.
  const handleInputChange = useCallback((next: string) => {
    setInput(next);
    setReferences((prev) => (prev.length ? reconcileReferences(next, prev) : prev));
  }, []);

  const handleMentionSelect = useCallback((item: MentionItem) => {
    setReferences((prev) => dedupeReferences([...prev, mentionItemToReference(item)]));
  }, []);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const scrollTriggerRef = useRef<ScrollToBottomTriggerRef>(null);

  const isAnyMessageStreaming = useMemo(() => messages.some((m) => m.isStreaming), [messages]);

  const formatTimestamp = useCallback((date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }, []);

  // Copy button functionality
  useEffect(() => {
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const btn = target.closest(".copy-code-btn") as HTMLButtonElement;
      if (btn?.dataset.code && !btn.disabled) {
        e.preventDefault();
        handleCopyCode(btn.dataset.code);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Focus input when streaming completes
  useEffect(() => {
    if (messages.length > 0 && !isAnyMessageStreaming) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [messages.length, isAnyMessageStreaming]);

  // Streaming CSS styles
  useEffect(() => {
    const styleId = "streaming-text-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .streaming-message {
          opacity: 1;
          transition: opacity 0.1s ease-out;
        }
        .message-content-wrapper {
          transition: height 0.15s ease-out;
          overflow-wrap: break-word;
          word-break: break-word;
        }
        @keyframes subtleFadeIn {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }
        .streaming-active {
          animation: subtleFadeIn 0.2s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border: none;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.3);
          border-radius: 3px;
          border: none;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.5);
        }
        .custom-scrollbar {
          scrollbar-width: auto;
          scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      const style = document.getElementById(styleId);
      if (style) style.remove();
    };
  }, []);

  const onSendMessage = useCallback(async () => {
    if (!agentReady) return;
    if (!input.trim() || input.length > MAX_MESSAGE_LENGTH) return;
    const content = input;
    const sentReferences = reconcileReferences(content, references);
    setInput("");
    setReferences([]);
    scrollTriggerRef.current?.scrollToBottom();
    await handleSendMessage(
      content,
      sentReferences.length ? sentReferences : undefined,
      selectedModelId,
    );
  }, [agentReady, input, references, handleSendMessage, selectedModelId]);

  const handleStopStreaming = useCallback(() => {
    stopStreaming();
  }, [stopStreaming]);

  const clearMessages = useCallback(() => {
    startNewConversation();
    setChatTitle(undefined);
    setChatIcon(undefined);
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [startNewConversation]);

  return (
    <Conversation className="relative mx-auto h-full min-h-0 w-full max-w-[1600px] bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.08),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.07),_transparent_30%)]">
      <ArrowCursor active={isAnyMessageStreaming} />
      <header className="relative z-20 flex items-center justify-between gap-3 border-border/60 border-b bg-background/70 px-5 py-4 pr-16 backdrop-blur-xl sm:gap-4 sm:px-8 sm:pr-8">
        <div className="flex items-center gap-3">
          <div>
            <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
              AmbiOS workspace
            </p>
            <h1 className="font-semibold text-base">Operations copilot</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/70 px-3 py-1.5 text-emerald-700 text-xs sm:flex dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
            <ShieldCheck className="size-3.5" /> Guardrails: verify per action
          </div>
          <ConversationHistory
            messages={messages}
            currentConversationId={currentConversationId}
            sessionId={sessionId}
            onConversationLoad={handleConversationLoad}
            onCurrentConversationIdChange={setCurrentConversationId}
          />

          {(chatTitle || messages.length > 1 || (messages.length === 1 && messages[0].content)) && (
            <Button
              variant="glass"
              size="sm"
              onClick={clearMessages}
              className="h-9 rounded-xl px-3"
            >
              <Plus className="mr-2 h-4 w-4" />
              New
            </Button>
          )}

          <AgentCapabilities agentType={AgentType.MAIN} />

          {chatTitle && (
            <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-border/50 bg-muted/50 px-3 py-1.5">
              {chatIcon && (
                <SystemIcon
                  system={{ icon: chatIcon }}
                  size={18}
                  className="flex-shrink-0"
                  fallbackClassName="text-muted-foreground"
                />
              )}
              <span className="max-w-[200px] truncate font-medium text-foreground/80 text-sm">
                {chatTitle}
              </span>
            </div>
          )}
        </div>
      </header>
      <ConversationContent>
        <ScrollToBottomContainer
          className={cn(
            "relative mx-4 my-4 overflow-hidden rounded-[28px] border border-border/60 bg-background/55 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)] backdrop-blur-sm sm:mx-6 lg:mx-10",
            "min-h-0 flex-1",
          )}
          scrollViewClassName="custom-scrollbar"
          followButtonClassName="hidden"
          mode={agentReady === true && messages.length > 0 ? undefined : "top"}
          initialScrollBehavior="auto"
          debounce={50}
        >
          <div
            className="mx-auto flex min-h-full w-full min-w-0 max-w-7xl flex-1 flex-col space-y-2 pb-4"
            data-chat-messages
          >
            {agentReady !== true ? (
              <div className="flex min-h-full w-full flex-1 items-center justify-center px-4 py-12">
                <AgentSetupCard onReadyChange={handleReadyChange} />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex min-h-full w-full flex-1 items-center justify-center px-4 py-12">
                <AgentWelcome onStartPrompt={handleStartPrompt} ref={welcomeRef} />
              </div>
            ) : (
              messages
                .filter((m) => m.role !== "system" && !(m as any).isHidden)
                .map((m) => (
                  <MemoMessage
                    key={m.id}
                    message={m}
                    onInputChange={handleToolInputChange}
                    onToolUpdate={handleToolUpdate}
                    onToolMutation={handleToolMutation}
                    sendAgentRequest={sendAgentRequest}
                    onAbortStream={abortStream}
                    editingMessageId={editingMessageId}
                    editingContent={editingContent}
                    setEditingContent={setEditingContent}
                    isLoading={isLoading}
                    formatTimestamp={formatTimestamp}
                    handleEditMessage={handleEditMessage}
                    handleSaveEdit={handleSaveEdit}
                    handleCancelEdit={handleCancelEdit}
                    filePayloads={filePayloads}
                    missingReferenceKeys={missingReferenceKeys}
                    editingReferences={editingReferences}
                    setEditingReferences={setEditingReferences}
                    mentionItems={mentionItems}
                    isLoadingMentions={isLoadingMentions}
                    mentionGroupHints={MENTION_GROUP_HINTS}
                    onMentionQueryChange={handleMentionQueryChange}
                  />
                ))
            )}
          </div>
          <ScrollToBottomTrigger ref={scrollTriggerRef} />
          <ScrollToBottomButton />
        </ScrollToBottomContainer>
      </ConversationContent>
      <PromptInput>
        <AgentInputArea
          value={input}
          onChange={handleInputChange}
          mentionItems={mentionItems}
          isLoadingMentions={isLoadingMentions}
          mentionGroupHints={MENTION_GROUP_HINTS}
          onMentionSelect={handleMentionSelect}
          onMentionQueryChange={handleMentionQueryChange}
          references={references}
          onSend={onSendMessage}
          onStop={handleStopStreaming}
          isLoading={isLoading}
          placeholder="Message AmbiOS AI…"
          maxLength={MAX_MESSAGE_LENGTH}
          showCharCount
          inputContainerRef={inputContainerRef}
          inputRef={inputRef}
          scrollToBottom={() => scrollTriggerRef.current?.scrollToBottom()}
          modelSelector={
            <SelectAIAgent
              selectedAgentId={selectedModelId}
              onAgentChange={(agent) => setSelectedModelId(agent.id)}
            />
          }
        />
      </PromptInput>
    </Conversation>
  );
}
