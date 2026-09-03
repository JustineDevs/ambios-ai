"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/general-utils";

type ElementProps = ComponentPropsWithoutRef<"div"> & { children?: ReactNode };

function element(name: string, className?: string) {
  return function Element({ children, className: extra, ...props }: ElementProps) {
    return (
      <div data-ai-element={name} className={cn(className, extra)} {...props}>
        {children}
      </div>
    );
  };
}

export const Conversation = element("conversation", "flex min-h-0 min-w-0 flex-1 flex-col");
export const ConversationContent = element(
  "conversation-content",
  "flex min-h-0 min-w-0 flex-1 flex-col",
);
export function ConversationScrollButton({
  children = "Jump to latest",
  className,
  ...props
}: ComponentPropsWithoutRef<"button">) {
  return (
    <button
      type="button"
      data-ai-element="conversation-scroll-button"
      className={cn(
        "rounded-full border border-border bg-background px-3 py-1.5 text-xs shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Message({
  role,
  children,
  className,
  ...props
}: ElementProps & { role: "user" | "assistant" | "system" }) {
  return (
    <div data-ai-element="message" data-message-role={role} className={className} {...props}>
      {children}
    </div>
  );
}

export const MessageContent = element("message-content", "min-w-0");
export const MessageResponse = element("message-response", "min-w-0");

export function PromptInput({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"fieldset"> & { children?: ReactNode }) {
  return (
    <fieldset
      data-ai-element="prompt-input"
      aria-label="Agent prompt"
      className={cn("min-w-0 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]", className)}
      {...props}
    >
      {children}
    </fieldset>
  );
}

export function PromptInputTextarea(props: ComponentPropsWithoutRef<"textarea">) {
  return <textarea data-ai-element="prompt-input-textarea" {...props} />;
}

export function PromptInputSubmit({
  label = "Send",
  ...props
}: ComponentPropsWithoutRef<"button"> & { label?: string }) {
  return (
    <button type="submit" data-ai-element="prompt-input-submit" aria-label={label} {...props}>
      {props.children ?? label}
    </button>
  );
}

export const Tool = element("tool", "rounded-xl border border-border/60 bg-card/50");
export const ToolHeader = element("tool-header", "flex items-center justify-between gap-2 p-3");
export const ToolInput = element("tool-input", "border-t border-border/50 p-3 text-xs");
export const ToolOutput = element("tool-output", "border-t border-border/50 p-3 text-sm");

export const Task = element("task", "space-y-3");
export const Queue = element("queue", "space-y-2");
export const Plan = element("plan", "space-y-2 rounded-xl border border-border/60 p-3");
export const Confirmation = element("confirmation", "rounded-xl border border-amber-500/40 p-3");
export const Reasoning = element("reasoning", "rounded-xl border border-border/60 p-3");
export const Checkpoint = element("checkpoint", "rounded-xl border border-border/60 p-3");
export const Agent = element("agent", "rounded-xl border border-border/60 p-3");
export const Sources = element("sources", "space-y-2");
export const Attachments = element("attachments", "flex flex-wrap gap-2");
