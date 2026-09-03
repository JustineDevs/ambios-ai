"use client";

import { ChatGptIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Check, ChevronDown, X } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CHAT_MODEL_DEFINITIONS } from "@/lib/ai/chat-models";

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  provider: "openai";
  category: "flagship" | "fast" | "legacy";
  icon: ReactNode;
}

export const SUPPORTED_CHAT_MODELS: AIAgent[] = CHAT_MODEL_DEFINITIONS.map((model) => ({
  ...model,
  icon: <HugeiconsIcon icon={ChatGptIcon} size={18} aria-hidden="true" />,
}));

export function SelectAIAgent({
  agents = SUPPORTED_CHAT_MODELS,
  selectedAgentId,
  onAgentChange,
  className = "",
}: {
  agents?: AIAgent[];
  selectedAgentId: string;
  onAgentChange: (agent: AIAgent) => void;
  className?: string;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const selected = agents.find((agent) => agent.id === selectedAgentId) ?? agents[0];

  if (!selected) return null;

  return (
    <LayoutGroup>
      <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <PopoverTrigger asChild>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            className={`flex shrink-0 items-center gap-2 rounded-full border border-border/70 bg-background/80 px-2 py-1.5 text-left shadow-sm backdrop-blur transition-colors hover:bg-muted ${className}`}
            aria-expanded={isMenuOpen}
            aria-haspopup="dialog"
            aria-label={`Selected model: ${selected.name}`}
          >
            <span className="flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground">
              {selected.icon}
            </span>
            <span className="hidden max-w-28 truncate font-medium text-xs min-[420px]:block">
              {selected.name}
            </span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </motion.button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          sideOffset={8}
          className="w-[min(20rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] overflow-x-hidden rounded-2xl border-border/70 bg-background/95 p-2 shadow-xl backdrop-blur-xl"
        >
          <AnimatePresence initial={false}>
            <motion.div
              initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 8, filter: "blur(6px)" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="min-w-0 overflow-x-hidden"
              role="dialog"
              aria-label="Choose chat model"
            >
              <div className="flex items-center justify-between px-2 py-1">
                <span className="font-semibold text-sm">Choose model</span>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="h-11 w-11 rounded-full p-0 text-muted-foreground hover:bg-muted"
                  aria-label="Close model menu"
                >
                  <X className="mx-auto size-4" aria-hidden="true" />
                </button>
              </div>
              <p className="px-2 pt-1 text-muted-foreground text-xs">
                OpenAI models available through your connected workspace
              </p>
              <div className="mt-1 grid max-h-[min(28rem,60vh)] min-w-0 gap-1 overflow-y-auto overflow-x-hidden">
                {agents.map((agent) => {
                  const active = agent.id === selected.id;
                  return (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => {
                        onAgentChange(agent);
                        setIsMenuOpen(false);
                      }}
                      className="flex w-full min-w-0 items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-muted"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground">
                        {agent.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-sm">{agent.name}</span>
                        <span className="block max-w-full break-words text-muted-foreground text-xs">
                          {agent.description}
                        </span>
                        <span className="block text-[10px] text-muted-foreground/70 uppercase tracking-wide">
                          {agent.provider} · {agent.category}
                        </span>
                      </span>
                      {active && <Check className="size-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </PopoverContent>
      </Popover>
    </LayoutGroup>
  );
}
