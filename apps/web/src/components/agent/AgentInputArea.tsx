"use client";

import {
  ALLOWED_FILE_EXTENSIONS,
  type MessageReference,
  type MessageReferenceType,
} from "@ambios-ai/shared";
import { AlertTriangle, ChevronUp, Paperclip, Send, Square } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import ExpandDetails from "@/components/ui/expand-details";
import { FileChip } from "@/components/ui/file-chip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { formatBytes } from "@/lib/file-utils";
import { cn } from "@/lib/general-utils";
import { useAgentContext } from "./AgentContextProvider";
import { type MentionItem, useMentionInput } from "./hooks/use-mention-input";
import { MentionOverlay, MentionPopover } from "./MentionPopover";

export type { MentionItem } from "./hooks/use-mention-input";
// Re-exported so existing imports keep working after the mention logic moved into the hook.
export { mentionItemToReference } from "./hooks/use-mention-input";

export interface AgentInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isLoading: boolean;
  placeholder?: string;
  maxLength?: number;
  compact?: boolean;
  showCharCount?: boolean;
  inputContainerRef?: React.RefObject<HTMLDivElement | null>;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  containerClassName?: string;
  inputClassName?: string;
  scrollToBottom?: () => void;
  // Mentions stay opt-in: composers that do not pass candidates keep the plain textarea.
  mentionItems?: MentionItem[];
  isLoadingMentions?: boolean;
  // Short note per group, e.g. telling the user that runs are limited to a time window.
  mentionGroupHints?: Partial<Record<MessageReferenceType, string>>;
  onMentionSelect?: (item: MentionItem) => void;
  // Lets the owner run a server-side search while the popover is open.
  onMentionQueryChange?: (query: string | null) => void;
  // Drives the chip highlights painted behind the text.
  references?: MessageReference[];
  modelSelector?: React.ReactNode;
}

export function AgentInputArea({
  value,
  onChange,
  onSend,
  onStop,
  isLoading,
  placeholder = "Message AmbiOS AI…",
  maxLength = 50000,
  compact = false,
  showCharCount = false,
  inputContainerRef,
  inputRef: inputRefProp,
  containerClassName,
  inputClassName,
  scrollToBottom,
  mentionItems,
  isLoadingMentions = false,
  mentionGroupHints,
  onMentionSelect,
  onMentionQueryChange,
  references,
  modelSelector,
}: AgentInputAreaProps) {
  const internalInputRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = inputRefProp ?? internalInputRef;

  const {
    isMentionOpen,
    visibleGroups,
    highlightedIndex,
    mentionSegments,
    mirrorRef,
    syncMirrorScroll,
    syncMention,
    closeMention,
    applyMention,
    setActiveIndex,
    setGroupLevel,
    handleKeyDown: handleMentionKeyDown,
  } = useMentionInput({
    value,
    onChange,
    inputRef,
    mentionItems,
    isLoadingMentions,
    onMentionSelect,
    onMentionQueryChange,
    references,
  });

  const {
    pendingFiles,
    sessionFiles,
    isProcessingFiles,
    isDragging,
    fileInputRef,
    handleFilesUpload,
    handlePendingFileRemove,
    handleSessionFileRemove,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    loadedSkills,
  } = useAgentContext();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Mention handling first: token deletion and, while the popover is open, navigation.
      if (handleMentionKeyDown(e)) return;

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (value.trim() && value.length <= maxLength) {
          onSend();
          scrollToBottom?.();
        }
      }
    },
    [handleMentionKeyDown, value, maxLength, onSend, scrollToBottom],
  );

  useEffect(() => {
    if (!inputRef.current) return;
    const el = inputRef.current;
    const maxH = compact ? 100 : 200;
    if (compact && !value.trim()) {
      el.style.height = "52px";
      return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxH)}px`;
    syncMirrorScroll();
  }, [value, compact, syncMirrorScroll, inputRef.current]);

  // Both the textarea and the overlay are built from this one string: identical padding and
  // font metrics are what keeps the highlights sitting exactly behind their characters.
  const composerTextClasses = cn(
    compact
      ? "!min-h-[32px] max-h-[100px] px-2 py-1.5 pr-20 text-sm"
      : "max-h-[200px] min-h-[44px] px-4 py-3 pr-[12rem] text-[15px] sm:pr-[19rem]",
    inputClassName,
  );

  const canSend = value.trim() && value.length <= maxLength;
  const showCount = showCharCount && value.length > maxLength * 0.8;
  const contextStatus = isProcessingFiles
    ? "processing"
    : pendingFiles.some((file) => file.status === "error")
      ? "attention"
      : "ready";

  return (
    <div
      ref={inputContainerRef}
      className={cn(
        "min-w-0",
        !compact && "sticky right-0 bottom-0 left-0 bg-background/95 backdrop-blur-sm",
      )}
    >
      <div className={cn(compact ? "p-0" : "mx-0 px-2 pb-4 sm:mx-2 sm:px-4 lg:mx-6")}>
        <div className={cn("relative", !compact && "mx-auto max-w-7xl")}>
          {isMentionOpen && (
            <MentionPopover
              visibleGroups={visibleGroups}
              highlightedIndex={highlightedIndex}
              isLoading={isLoadingMentions}
              groupHints={mentionGroupHints}
              onSelect={applyMention}
              onHoverIndex={setActiveIndex}
              onToggleGroup={setGroupLevel}
            />
          )}
          <section
            role="application"
            className={cn(
              "relative flex min-w-0 flex-col overflow-visible transition-[border-color,box-shadow] duration-200",
              "bg-gradient-to-br from-muted/50 to-muted/30 dark:from-muted/30 dark:to-muted/20",
              "border border-border/50 backdrop-blur-sm",
              "focus-within:border-border/80 hover:border-border/80",
              compact
                ? "gap-1 rounded-lg shadow-sm"
                : "gap-2 rounded-2xl shadow-sm focus-within:shadow-md hover:shadow-md",
              containerClassName,
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {isDragging && (
              <div
                className={cn(
                  "absolute inset-0 z-10 flex items-center justify-center border-2 border-primary border-dashed bg-primary/10 backdrop-blur-sm",
                  compact ? "rounded-lg" : "rounded-2xl",
                )}
              >
                <div className="font-medium text-primary text-sm">Drop files here</div>
              </div>
            )}

            {pendingFiles.length > 0 && (
              <div className={cn("flex flex-wrap gap-2", compact ? "px-3 pt-2" : "px-4 pt-3")}>
                {pendingFiles.map((file) => (
                  <FileChip
                    key={file.key}
                    file={file}
                    onRemove={handlePendingFileRemove}
                    size="compact"
                    rounded="md"
                    showOriginalName={true}
                    maxWidth="300px"
                  />
                ))}
              </div>
            )}

            <div
              className={cn(
                "relative flex items-center gap-2",
                compact ? "px-1.5 pt-0.5 pb-1" : "",
              )}
            >
              {mentionSegments && (
                <MentionOverlay
                  segments={mentionSegments}
                  mirrorRef={mirrorRef}
                  wrapperClassName={compact ? "px-1.5 pb-1 pt-0.5" : undefined}
                  textClassName={composerTextClasses}
                />
              )}

              <input
                ref={fileInputRef as React.RefObject<HTMLInputElement>}
                type="file"
                multiple
                accept={ALLOWED_FILE_EXTENSIONS.join(",")}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    handleFilesUpload(Array.from(e.target.files));
                    e.target.value = "";
                  }
                }}
              />

              <Textarea
                ref={inputRef}
                value={value}
                onChange={(e) => {
                  onChange(e.target.value);
                  syncMention(e.target.value, e.target.selectionStart);
                }}
                onKeyDown={handleKeyDown}
                onSelect={(e) => {
                  // Read text and caret from the same element so they can never come from
                  // two different generations of the input (native undo, drag-drop, IME).
                  const el = e.target as HTMLTextAreaElement;
                  syncMention(el.value, el.selectionStart);
                }}
                onBlur={closeMention}
                placeholder={placeholder}
                aria-label="Message AmbiOS"
                rows={compact ? 2 : undefined}
                onScroll={syncMirrorScroll}
                className={cn(
                  "relative flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
                  composerTextClasses,
                )}
              />

              <div
                className={cn(
                  "absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1.5",
                  compact && "right-2 gap-1",
                )}
              >
                {modelSelector}
                <ExpandDetails
                  status={contextStatus}
                  details={[
                    { label: "Session files", value: sessionFiles.length },
                    { label: "Pending files", value: pendingFiles.length },
                    { label: "References", value: references?.length ?? 0 },
                    { label: "Loaded skills", value: loadedSkills.length },
                  ]}
                />
                <div
                  className={cn(
                    "flex items-center overflow-hidden rounded-xl",
                    "bg-gradient-to-br from-white/60 to-white/30 dark:from-white/10 dark:to-white/5",
                    "border border-black/5 backdrop-blur-sm dark:border-white/10",
                  )}
                >
                  {sessionFiles.length > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Show ${sessionFiles.length} session file${sessionFiles.length === 1 ? "" : "s"}`}
                          className={cn(
                            "flex items-center justify-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground",
                            "border-black/5 border-r dark:border-white/10",
                            compact ? "h-8 min-w-[14px] px-1.5" : "h-9 min-w-[16px] px-2",
                          )}
                        >
                          <span
                            className={cn(
                              "flex items-center justify-center rounded-full bg-primary font-medium text-[10px] text-primary-foreground",
                              compact ? "h-3.5 min-w-[14px] px-1" : "h-4 min-w-[16px] px-1",
                            )}
                          >
                            {sessionFiles.length}
                          </span>
                          <ChevronUp className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className={cn(
                          "w-auto min-w-[250px] max-w-[280px] p-3",
                          "bg-gradient-to-br from-white/90 to-white/70 dark:from-neutral-900/95 dark:to-neutral-900/80",
                          "border border-black/10 backdrop-blur-xl dark:border-white/10",
                          "shadow-black/10 shadow-lg dark:shadow-black/30",
                        )}
                        align="end"
                        side="top"
                        sideOffset={8}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="font-medium text-foreground/70 text-xs">
                            Session Files
                          </span>
                          <span className="text-muted-foreground/60 text-xs">
                            {formatBytes(sessionFiles.reduce((acc, f) => acc + (f.size || 0), 0))}
                          </span>
                        </div>
                        <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
                          {sessionFiles.map((file) => (
                            <FileChip
                              key={file.key}
                              file={file}
                              onRemove={handleSessionFileRemove}
                              size="compact"
                              rounded="md"
                              showOriginalName={true}
                              showSize={true}
                              className="w-full"
                            />
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn(
                      "rounded-none border-0 bg-transparent p-0 hover:bg-black/5 dark:hover:bg-white/10",
                      "text-muted-foreground transition-colors hover:text-foreground",
                      compact ? "h-8 w-8" : "h-9 w-9",
                    )}
                    onClick={() => (fileInputRef.current as HTMLInputElement | null)?.click()}
                    disabled={isProcessingFiles}
                    aria-label="Attach files"
                  >
                    <Paperclip aria-hidden="true" className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
                  </Button>
                </div>

                <Button
                  onClick={isLoading ? onStop : onSend}
                  disabled={!isLoading && (!canSend || !value.trim())}
                  size="sm"
                  className={cn(
                    "rounded-xl bg-primary p-0 shadow-sm hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground",
                    compact ? "h-8 w-8" : "h-9 w-9",
                  )}
                  variant="default"
                  aria-label={isLoading ? "Stop generating" : "Send message"}
                >
                  {isLoading ? (
                    <Square
                      aria-hidden="true"
                      className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")}
                    />
                  ) : (
                    <Send aria-hidden="true" className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
                  )}
                </Button>
              </div>
            </div>
          </section>

          {showCount && (
            <div className="mt-2 flex items-center justify-start px-2">
              <span
                className={cn(
                  "text-xs",
                  value.length > maxLength
                    ? "font-medium text-amber-600 dark:text-amber-500"
                    : "text-muted-foreground/60",
                )}
              >
                {value.length > maxLength ? (
                  <>
                    <AlertTriangle className="mr-1 inline h-3 w-3" />
                    {value.length.toLocaleString()}/{maxLength.toLocaleString()} chars
                  </>
                ) : (
                  `${value.length.toLocaleString()}/${maxLength.toLocaleString()} chars`
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
