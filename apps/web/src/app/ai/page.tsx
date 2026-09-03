"use client";

import { useChat } from "@ai-sdk/react";
import { operationPath } from "@ambios-ai/shared";
import { DefaultChatTransport } from "ai";
import { Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";

import { Button } from "@/components/ui/button";
import { DropdownDisclosure, type Model } from "@/components/ui/dropdown-disclosure";
import { Input } from "@/components/ui/input";
import { ThinkingIndicator } from "@/components/ui/thinking-indicator";

type ChatMessage = ReturnType<typeof useChat>["messages"][number];

function MessageBubble({ message, isStreaming }: { message: ChatMessage; isStreaming: boolean }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[min(42rem,85%)] rounded-lg px-4 py-3 ${
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary/60"
        }`}
      >
        <p className="mb-1 font-medium text-xs opacity-70">{isUser ? "You" : "AI Assistant"}</p>
        <div className="space-y-2 text-sm leading-6">
          {message.parts?.map((part) => {
            if (part.type === "text") {
              return (
                <Streamdown
                  key={`${message.id}-${part.type}-${part.text.slice(0, 24)}`}
                  isAnimating={isStreaming && !isUser}
                >
                  {part.text}
                </Streamdown>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}

export default function AIPage() {
  const [input, setInput] = useState("");
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState("gemma");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: operationPath("getAi"),
    }),
  });
  const isBusy = status === "submitted" || status === "streaming";

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <div className="mx-auto grid h-full w-full max-w-3xl grid-rows-[1fr_auto] overflow-hidden p-4">
      <div className="space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-muted-foreground">
            <p>Ask me anything to get started.</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isStreaming={status === "streaming" && message.role === "assistant"}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex items-center justify-between gap-2 border-t pt-2">
        {isBusy && <ThinkingIndicator text={status === "streaming" ? "Working" : "Connecting"} />}
        <DropdownDisclosure
          isOpen={isModelOpen}
          onOpenChange={setIsModelOpen}
          selectedModelId={selectedModelId}
          onModelChange={(model: Model) => {
            setSelectedModelId(model.id);
            setIsModelOpen(false);
          }}
        />
        <form onSubmit={handleSubmit} className="flex min-w-0 flex-1 items-center space-x-2">
          <Input
            name="prompt"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            autoComplete="off"
            autoFocus
            disabled={isBusy}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isBusy || !input.trim()}
            aria-label="Send message"
          >
            {isBusy ? <Loader2 className="size-4 animate-spin" /> : <Send size={18} />}
          </Button>
        </form>
      </div>
    </div>
  );
}
