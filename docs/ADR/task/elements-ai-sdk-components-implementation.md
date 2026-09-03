# Elements AI SDK Components Implementation Guide for AmbiOS AI

**Complete Component Integration Guide**

**Last Updated:** August 31, 2026

**Evidence status:** `BLOCKED` — this is an implementation proposal; no adoption or production readiness is claimed. Use `PASS` only after the selected components are installed and verified in the app, otherwise use `BLOCKED` or `FAIL`.

---

## Executive Summary

**AI Elements** is a component library built on top of shadcn/ui, specifically designed for AI-native applications. Its components are candidates for integration with the Vercel AI SDK; this guide does not establish production readiness.

**For AmbiOS AI:** We should adopt Elements AI SDK components for our **chat interface, message rendering, tool displays, and agent collaboration UI** to accelerate development and ensure best practices.

---

## 1. Installation & Setup

### 1.1 Prerequisites

- ✅ Node.js 18+
- ✅ Next.js project with AI SDK installed
- ✅ shadcn/ui installed (auto-installed if missing)
- ✅ Tailwind CSS 4
- ✅ React 19

### 1.2 Install AI Elements

```bash
# Install AI Elements CLI
npx ai-elements@latest

# Or install specific components
npx ai-elements@latest add conversation
npx ai-elements@latest add message
npx ai-elements@latest add tool
npx ai-elements@latest add attachments
npx ai-elements@latest add sources
npx ai-elements@latest add reasoning
npx ai-elements@latest add prompt-input
```

### 1.3 Configure globals.css

```css
/* app/globals.css */

@source "../node_modules/streamdown/dist/*.js";

/* This is REQUIRED for MessageResponse component to work properly */
/* Without this, Streamdown styles won't be applied */
```

---

## 2. Component Catalog for AmbiOS AI

### 2.1 Core Components (High Priority)

| Component | Purpose | AmbiOS Use Case | Priority |
|-----------|---------|-----------------|----------|
| **Conversation** | Chat container with auto-scrolling | Main agent collaboration canvas | 🔴 Critical |
| **Message** | Display chat messages with markdown | Agent-human message threads | 🔴 Critical |
| **MessageResponse** | Markdown renderer with syntax highlighting | AI response rendering | 🔴 Critical |
| **Tool** | Display tool invocation details | WebMCP tool execution UI | 🔴 Critical |
| **PromptInput** | Smart input with auto-resize and attachments | Agent command input | 🔴 Critical |
| **Attachments** | Display file attachments | Incident docs, screenshots, logs | 🟡 High |
| **Sources** | Show citations/references | Security scan sources, vendor docs | 🟡 High |
| **Reasoning** | Display AI thought process | Agent investigation steps | 🟡 High |

### 2.2 Advanced Components (Medium Priority)

| Component | Purpose | AmbiOS Use Case | Priority |
|-----------|---------|-----------------|----------|
| **Checkpoint** | Save/restore conversation state | Canvas state snapshots | 🟡 Medium |
| **Confirmation** | Request user confirmation | Approval gates for actions | 🟡 Medium |
| **Context** | Show conversation context | Incident context sidebar | 🟡 Medium |
| **InlineCitation** | Inline source references | Security vulnerability citations | 🟡 Medium |
| **ModelSelector** | Switch between AI models | Agent model selection | 🟡 Medium |
| **Plan** | Display execution plan | Agent action proposals | 🟡 Medium |
| **Queue** | Show pending actions | Action queue visualization | 🟡 Medium |
| **Shimmer** | Loading state animation | Agent thinking indicator | 🟡 Medium |
| **Suggestion** | AI suggestions | Fix recommendations | 🟡 Medium |
| **Task** | Task list display | Action checklists | 🟡 Medium |

### 2.3 Specialized Components (Low Priority)

| Component | Purpose | AmbiOS Use Case | Priority |
|-----------|---------|-----------------|----------|
| **Agent** | Agent status and steps | Multi-agent coordination | 🟢 Low |
| **Artifact** | Rendered artifact preview | Generated code/docs | 🟢 Low |
| **AudioPlayer** | Audio playback | Voice notes (future) | 🟢 Low |
| **Branch** | Message branching UI | Alternative response versions | 🟢 Low |
| **ChainOfThought** | Detailed reasoning trace | Deep investigation trails | 🟢 Low |
| **CodeBlock** | Syntax-highlighted code | Code snippets in messages | 🟢 Low |
| **MessageActions** | Action buttons (copy, retry) | Message interaction | 🟢 Low |
| **MessageAvatar** | User/agent avatars | Visual distinction | 🟢 Low |

---

## 3. Implementation Examples

### 3.1 Main Chat Interface (Conversation + Message + PromptInput)

```typescript
// components/ambios/AmbiosChat.tsx

"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import {
  Attachments,
  Attachment,
  AttachmentPreview,
  AttachmentInfo,
} from "@/components/ai-elements/attachments";
import {
  Sources,
  Source,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { Reasoning } from "@/components/ai-elements/reasoning";
import { RefreshCcwIcon, CopyIcon, ThumbsUpIcon, ThumbsDownIcon } from "lucide-react";
import { Fragment } from "react";

export function AmbiosChat() {
  const [input, setInput] = useState("");
  
  const { messages, sendMessage, status, regenerate } = useChat({
    api: "/api/chat",
    maxSteps: 10, // Enable multi-step agent workflows
  });

  const handleSubmit = (message: PromptInputMessage) => {
    if (message.text.trim()) {
      sendMessage({ 
        text: message.text,
        // Include attachments if any
        parts: message.attachments?.map(att => ({
          type: 'file',
          data: att.data,
        })),
      });
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-6">
      {/* Conversation Container */}
      <Conversation>
        <ConversationContent>
          {messages.map((message, messageIndex) => (
            <Fragment key={message.id}>
              {message.parts.map((part, i) => {
                switch (part.type) {
                  case "text":
                    const isLastMessage = messageIndex === messages.length - 1;
                    
                    return (
                      <Fragment key={`${message.id}-${i}`}>
                        <Message from={message.role}>
                          <MessageContent>
                            <MessageResponse>
                              {part.text}
                            </MessageResponse>
                          </MessageContent>
                        </Message>
                        
                        {/* Show actions for assistant messages */}
                        {message.role === "assistant" && isLastMessage && (
                          <MessageActions>
                            <MessageAction
                              onClick={() => regenerate()}
                              label="Retry"
                            >
                              <RefreshCcwIcon className="size-3" />
                            </MessageAction>
                            <MessageAction
                              onClick={() => navigator.clipboard.writeText(part.text)}
                              label="Copy"
                            >
                              <CopyIcon className="size-3" />
                            </MessageAction>
                            <MessageAction
                              onClick={() => {/* TODO: Implement like */}}
                              label="Helpful"
                            >
                              <ThumbsUpIcon className="size-3" />
                            </MessageAction>
                          </MessageActions>
                        )}
                      </Fragment>
                    );
                    
                  case "tool-fetch_weather_data":
                  case "tool-cloudflare_deploy_worker":
                  case "tool-snyk_scan_project":
                    // Render tool invocations
                    return (
                      <Tool key={`${message.id}-${i}`} defaultOpen={true}>
                        <ToolHeader
                          type={part.type}
                          state={part.state}
                        />
                        <ToolContent>
                          <ToolInput input={part.input} />
                          <ToolOutput
                            output={
                              <MessageResponse>
                                {formatToolOutput(part.output)}
                              </MessageResponse>
                            }
                            errorText={part.errorText}
                          />
                        </ToolContent>
                      </Tool>
                    );
                    
                  case "reasoning":
                    // Show agent reasoning/investigation steps
                    return (
                      <Reasoning key={`${message.id}-${i}`}>
                        <MessageResponse>
                          {part.text}
                        </MessageResponse>
                      </Reasoning>
                    );
                    
                  case "source":
                    // Show sources/citations
                    return (
                      <Sources key={`${message.id}-${i}`}>
                        <SourcesTrigger>
                          View {part.sources.length} sources
                        </SourcesTrigger>
                        <SourcesContent>
                          {part.sources.map((source, idx) => (
                            <Source key={idx} source={source} />
                          ))}
                        </SourcesContent>
                      </Sources>
                    );
                    
                  case "file":
                    // Show attachments
                    return (
                      <Attachments key={`${message.id}-${i}`} variant="grid">
                        <Attachment data={part}>
                          <AttachmentPreview />
                          <AttachmentInfo />
                        </Attachment>
                      </Attachments>
                    );
                    
                  default:
                    return null;
                }
              })}
            </Fragment>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input Area */}
      <PromptInput
        onSubmit={handleSubmit}
        className="mt-4 w-full max-w-2xl mx-auto relative"
      >
        <PromptInputTextarea
          value={input}
          placeholder="Ask the agent to investigate an incident..."
          onChange={(e) => setInput(e.currentTarget.value)}
          className="pr-12"
          accept="image/*,.pdf,.txt,.json,.log"
        />
        <PromptInputSubmit
          status={status === "streaming" ? "streaming" : "ready"}
          disabled={!input.trim() && status !== "streaming"}
          className="absolute bottom-1 right-1"
        />
      </PromptInput>
    </div>
  );
}

function formatToolOutput(output: any): string {
  if (!output) return "No output";
  
  if (typeof output === "string") {
    return output;
  }
  
  // Format JSON output nicely
  return JSON.stringify(output, null, 2);
}
```

### 3.2 Tool Display with Status Indicators

```typescript
// components/ambios/ToolInvocation.tsx

"use client";

import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
  getStatusBadge,
} from "@/components/ai-elements/tool";
import { MessageResponse } from "@/components/ai-elements/message";
import type { ToolUIPart } from "ai";

interface AmbiosToolInvocationProps {
  toolPart: ToolUIPart;
  defaultOpen?: boolean;
}

export function AmbiosToolInvocation({ 
  toolPart, 
  defaultOpen = true 
}: AmbiosToolInvocationProps) {
  return (
    <Tool defaultOpen={defaultOpen}>
      <ToolHeader
        type={toolPart.type}
        state={toolPart.state}
      />
      <ToolContent>
        {/* Show tool input parameters */}
        <ToolInput 
          input={toolPart.input} 
          title="Input Parameters"
        />
        
        {/* Show tool output or error */}
        <ToolOutput
          output={
            toolPart.output ? (
              <MessageResponse>
                {formatToolResult(toolPart.output)}
              </MessageResponse>
            ) : null
          }
          errorText={toolPart.errorText}
        />
        
        {/* Show status badge */}
        <div className="mt-2">
          {getStatusBadge(toolPart.state)}
        </div>
      </ToolContent>
    </Tool>
  );
}

function formatToolResult(result: any): string {
  if (typeof result === "string") {
    return result;
  }
  
  // Handle common tool result types
  if (result.scanId && result.vulnerabilities) {
    // Snyk scan result
    return `**Scan Completed**\n\n- **Scan ID:** ${result.scanId}\n- **Vulnerabilities Found:** ${result.vulnerabilities.length}\n- **Severity Breakdown:**\n  - Critical: ${result.vulnerabilities.filter(v => v.severity === 'critical').length}\n  - High: ${result.vulnerabilities.filter(v => v.severity === 'high').length}\n  - Medium: ${result.vulnerabilities.filter(v => v.severity === 'medium').length}\n  - Low: ${result.vulnerabilities.filter(v => v.severity === 'low').length}`;
  }
  
  if (result.deploymentUrl) {
    // Cloudflare/Vercel deploy result
    return `**Deployment Successful**\n\n- **URL:** ${result.deploymentUrl}\n- **Environment:** ${result.environment}\n- **Version:** ${result.version}`;
  }
  
  // Default: JSON stringify
  return JSON.stringify(result, null, 2);
}
```

### 3.3 Agent Reasoning Display

```typescript
// components/ambios/AgentReasoning.tsx

"use client";

import { Reasoning } from "@/components/ai-elements/reasoning";
import { MessageResponse } from "@/components/ai-elements/message";

interface AgentReasoningProps {
  reasoning: string;
  title?: string;
}

export function AgentReasoning({ reasoning, title = "Agent Investigation" }: AgentReasoningProps) {
  return (
    <Reasoning title={title}>
      <MessageResponse>
        {reasoning}
      </MessageResponse>
    </Reasoning>
  );
}

// Usage in chat:
// <AgentReasoning reasoning={agentThoughts} title="Security Investigation" />
```

### 3.4 File Attachments for Incident Docs

```typescript
// components/ambios/IncidentAttachments.tsx

"use client";

import {
  Attachments,
  Attachment,
  AttachmentPreview,
  AttachmentInfo,
  AttachmentRemove,
} from "@/components/ai-elements/attachments";
import type { FileUIPart } from "ai";

interface IncidentAttachmentsProps {
  attachments: (FileUIPart & { id: string })[];
  onRemove?: (id: string) => void;
  variant?: "grid" | "inline" | "list";
}

export function IncidentAttachments({ 
  attachments, 
  onRemove,
  variant = "grid"
}: IncidentAttachmentsProps) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <Attachments variant={variant}>
      {attachments.map((file) => (
        <Attachment
          key={file.id}
          data={file}
          onRemove={onRemove ? () => onRemove(file.id) : undefined}
        >
          <AttachmentPreview />
          <AttachmentInfo />
          {onRemove && <AttachmentRemove />}
        </Attachment>
      ))}
    </Attachments>
  );
}

// Usage:
// <IncidentAttachments attachments={incidentDocs} variant="list" />
```

### 3.5 Sources/Citations for Security Findings

```typescript
// components/ambios/SecuritySources.tsx

"use client";

import {
  Sources,
  Source,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import type { SourceDocumentUIPart } from "ai";

interface SecuritySourcesProps {
  sources: SourceDocumentUIPart[];
  title?: string;
}

export function SecuritySources({ sources, title = "Security Sources" }: SecuritySourcesProps) {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <Sources>
      <SourcesTrigger>
        🔍 View {sources.length} security sources
      </SourcesTrigger>
      <SourcesContent title={title}>
        {sources.map((source, idx) => (
          <Source key={idx} source={source} />
        ))}
      </SourcesContent>
    </Sources>
  );
}

// Usage:
// <SecuritySources sources={vulnerabilitySources} title="CVE References" />
```

---

## 4. Integration with AmbiOS Architecture

### 4.1 Replace Existing Chat Components

**Before:**
```typescript
// Old custom chat component
import { Chat } from "@/components/custom/Chat";
import { MessageBubble } from "@/components/custom/MessageBubble";
```

**After:**
```typescript
// New Elements-based chat
import { Conversation, Message, MessageResponse } from "@/components/ai-elements";
import { useChat } from "@ai-sdk/react";
```

### 4.2 Integrate with WebMCP Tools

```typescript
// lib/webmcp/ui-integration.ts

import { AmbiosToolInvocation } from "@/components/ambios/ToolInvocation";

export function renderToolInvocation(toolPart: any) {
  return <AmbiosToolInvocation toolPart={toolPart} defaultOpen={true} />;
}

// In chat component:
{message.parts.map((part) => {
  if (part.type.startsWith("tool-")) {
    return renderToolInvocation(part);
  }
  // ... other parts
})}
```

### 4.3 Add to Canvas Collaboration

```typescript
// components/canvas/CanvasChat.tsx

import { AmbiosChat } from "@/components/ambios/AmbiosChat";

export function CanvasChat() {
  return (
    <div className="canvas-chat-panel">
      <AmbiosChat />
    </div>
  );
}
```

---

## 5. Customization

### 5.1 Theme Customization

```typescript
// components/ai-elements/custom-theme.ts

// Customize message styling
export const customMessageStyles = {
  user: {
    background: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
  },
  assistant: {
    background: "bg-transparent",
    border: "border-none",
  },
  tool: {
    background: "bg-gray-50 dark:bg-gray-900/50",
    border: "border-gray-200 dark:border-gray-800",
  },
};
```

### 5.2 Extend Components

```typescript
// components/ai-elements/extended/MessageWithAgentAvatar.tsx

import { Message, MessageAvatar } from "@/components/ai-elements/message";

interface MessageWithAgentAvatarProps {
  from: "user" | "assistant";
  agentName?: string;
  children: React.ReactNode;
}

export function MessageWithAgentAvatar({ 
  from, 
  agentName,
  children 
}: MessageWithAgentAvatarProps) {
  return (
    <Message from={from}>
      {from === "assistant" && (
        <MessageAvatar>
          <AgentIcon name={agentName || "Agent"} />
        </MessageAvatar>
      )}
      {children}
    </Message>
  );
}
```

---

## 6. Best Practices

### 6.1 Performance

- ✅ Use `defaultOpen={false}` for tools with large outputs
- ✅ Lazy-load heavy components (Attachments, Sources)
- ✅ Implement virtual scrolling for long conversations
- ✅ Cache MessageResponse markdown rendering

### 6.2 Accessibility

- ✅ All components are keyboard accessible
- ✅ Proper ARIA labels included
- ✅ Screen reader friendly
- ✅ Focus management for collapsible components

### 6.3 Security

- ✅ Sanitize user input before displaying
- ✅ Use `MessageResponse` for all AI-generated content (includes sanitization)
- ✅ Validate attachment file types
- ✅ Rate limit tool invocations

---

## 7. Migration Checklist

### Phase 1: Core Components (Week 1)

- [ ] Install AI Elements (`npx ai-elements@latest`)
- [ ] Add `@source` to `globals.css`
- [ ] Replace custom chat container with `Conversation`
- [ ] Replace custom message bubbles with `Message` + `MessageResponse`
- [ ] Replace custom input with `PromptInput`
- [ ] Test basic chat functionality

### Phase 2: Tool Integration (Week 2)

- [ ] Add `Tool` component for WebMCP tool invocations
- [ ] Integrate `ToolHeader`, `ToolInput`, `ToolOutput`
- [ ] Add status indicators with `getStatusBadge`
- [ ] Test tool execution display
- [ ] Add error handling

### Phase 3: Advanced Features (Week 3)

- [ ] Add `Attachments` for incident docs
- [ ] Add `Sources` for security citations
- [ ] Add `Reasoning` for agent investigation steps
- [ ] Add `MessageActions` (copy, retry, like/dislike)
- [ ] Test with real incidents

### Phase 4: Polish & Optimization (Week 4)

- [ ] Customize theme to match AmbiOS branding
- [ ] Add custom agent avatars
- [ ] Implement virtual scrolling for long conversations
- [ ] Add loading states with `Shimmer`
- [ ] Performance testing
- [ ] Accessibility audit

---

## 8. Component Reference

### Full Component List

| Component | Install Command | Description |
|-----------|----------------|-------------|
| `conversation` | `npx ai-elements@latest add conversation` | Chat container with auto-scroll |
| `message` | `npx ai-elements@latest add message` | Message display with markdown |
| `prompt-input` | `npx ai-elements@latest add prompt-input` | Smart input with attachments |
| `tool` | `npx ai-elements@latest add tool` | Tool invocation display |
| `attachments` | `npx ai-elements@latest add attachments` | File attachment display |
| `sources` | `npx ai-elements@latest add sources` | Citations and references |
| `reasoning` | `npx ai-elements@latest add reasoning` | AI thought process display |
| `checkpoint` | `npx ai-elements@latest add checkpoint` | Save/restore state |
| `confirmation` | `npx ai-elements@latest add confirmation` | User confirmation dialogs |
| `context` | `npx ai-elements@latest add context` | Conversation context |
| `inline-citation` | `npx ai-elements@latest add inline-citation` | Inline source references |
| `model-selector` | `npx ai-elements@latest add model-selector` | Model switching |
| `plan` | `npx ai-elements@latest add plan` | Execution plan display |
| `queue` | `npx ai-elements@latest add queue` | Action queue |
| `shimmer` | `npx ai-elements@latest add shimmer` | Loading animation |
| `suggestion` | `npx ai-elements@latest add suggestion` | AI suggestions |
| `task` | `npx ai-elements@latest add task` | Task list |
| `agent` | `npx ai-elements@latest add agent` | Agent status |
| `artifact` | `npx ai-elements@latest add artifact` | Artifact preview |
| `audio-player` | `npx ai-elements@latest add audio-player` | Audio playback |
| `branch` | `npx ai-elements@latest add branch` | Message branching |
| `chain-of-thought` | `npx ai-elements@latest add chain-of-thought` | Detailed reasoning |
| `code-block` | `npx ai-elements@latest add code-block` | Syntax-highlighted code |

---

## 9. Resources

- **Documentation:** https://elements.ai-sdk.dev/docs
- **Component Gallery:** https://elements.ai-sdk.dev/components
- **GitHub:** https://github.com/vercel/ai-elements
- **Vercel Changelog:** https://vercel.com/changelog/introducing-ai-elements
- **AI SDK Docs:** https://ai-sdk.dev/docs

---

## 10. Recommendation for AmbiOS AI

**Priority Components to Implement:**

1. 🔴 **Conversation** - Replace custom chat container
2. 🔴 **Message** + **MessageResponse** - Replace custom message bubbles
3. 🔴 **PromptInput** - Replace custom input
4. 🔴 **Tool** - Display WebMCP tool invocations
5. 🟡 **Attachments** - Show incident docs and screenshots
6. 🟡 **Sources** - Display security citations
7. 🟡 **Reasoning** - Show agent investigation steps
8. 🟢 **MessageActions** - Add copy, retry, like/dislike

**Timeline:**
- Week 1-2: Core components (Conversation, Message, PromptInput)
- Week 3: Tool integration
- Week 4: Advanced features (Attachments, Sources, Reasoning)

**Benefits:**
- ✅ Components with upstream tests (verify the selected version locally before adoption)
- ✅ AI SDK integration out of the box
- ✅ Markdown rendering with syntax highlighting
- ✅ Accessibility built-in
- ✅ Customizable via shadcn/ui patterns
- ✅ Faster development (no need to build from scratch)

---

**Adoption decision:** `BLOCKED` pending a local integration, accessibility check, and build verification for the selected components. This document is a candidate implementation guide, not a production-readiness claim.
