"use client";

import type { SystemConfig } from "@ambios-ai/shared";
import { Lightbulb, Play } from "lucide-react";
import type React from "react";
import { useCallback, useImperativeHandle } from "react";
import { BloubBot } from "@/components/animation/bloub/BloubBot";
import { SystemCarousel } from "@/components/ui/rotating-icon-gallery";
import { cn } from "@/lib/general-utils";

const EXAMPLES = {
  CAPABILITIES: {
    title: "What can ambios do for you?",
    description: "Explain ambios's capabilities",
    user: "What can I do with ambios?",
  },
  TEMPLATES: {
    title: "Give me a demo",
    description: "Show me what ambios can do",
    user: "Give me a demo.",
    hiddenStarterMessage:
      "After a brief welcome message, call load_skill with skills ['demos'] and follow it exactly. Narrate each step briefly and map it to real customer systems.",
  },
};

interface GlassButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  iconGradient: string;
}

function GlassButton({
  onClick,
  icon,
  title,
  description,
  gradient,
  iconGradient,
}: GlassButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative w-full rounded-2xl p-4 text-left transition-all duration-300",
        "bg-gradient-to-br from-muted/50 to-muted/30 dark:from-muted/50 dark:to-muted/30",
        "border border-border/50 backdrop-blur-sm dark:border-border/70",
        "shadow-sm",
        "hover:border-border/80 hover:shadow-md dark:hover:border-border",
        "hover:scale-[1.01] active:scale-[0.99]",
        "overflow-hidden",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          "bg-gradient-to-br",
          gradient,
        )}
      />
      <div className="relative flex items-center gap-4">
        <div
          className={cn(
            "relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
            "transition-transform duration-300 group-hover:scale-105",
            iconGradient,
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 space-y-0.5">
          <h3 className="truncate font-medium text-foreground/90 text-sm transition-colors group-hover:text-foreground dark:text-foreground/95">
            {title}
          </h3>
          <p className="line-clamp-1 text-muted-foreground/80 text-xs transition-colors group-hover:text-muted-foreground dark:text-muted-foreground/90">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}

export interface AgentWelcomeRef {
  cleanup: () => void;
}

interface AgentWelcomeProps {
  onStartPrompt: (
    userPrompt: string,
    hiddenStarterMessage?: string,
    options?: { hideUserMessage?: boolean; chatTitle?: string; chatIcon?: string },
  ) => void;
  ref?: React.Ref<AgentWelcomeRef>;
}

export function AgentWelcome({ onStartPrompt, ref }: AgentWelcomeProps) {
  const cleanup = () => {
    return;
  };

  useImperativeHandle(ref, () => ({
    cleanup,
  }));

  const handleSystemSelect = useCallback(
    (_key: string, label: string, config: SystemConfig) => {
      const hiddenStarterMessage = [
        "The user selected a system template.",
        config.apiUrl ? `Suggested API URL: ${config.apiUrl}` : null,
        config.docsUrl ? `Documentation URL: ${config.docsUrl}` : null,
        config.openApiUrl ? `OpenAPI URL: ${config.openApiUrl}` : null,
        config.preferredAuthType ? `Suggested auth type: ${config.preferredAuthType}` : null,
        `OAuth available: ${config.oauth ? "yes" : "no"}`,
        config.systemSpecificInstructions
          ? `Template-specific instructions: ${config.systemSpecificInstructions}`
          : null,
      ]
        .filter(Boolean)
        .join("\n");
      const prompt = `I want to set up ${label}`;
      onStartPrompt(prompt, hiddenStarterMessage, {
        hideUserMessage: true,
        chatTitle: label,
        chatIcon: config.icon,
      });
    },
    [onStartPrompt],
  );

  return (
    <div className="space-y-6 p-6">
      <header className="mx-auto flex max-w-3xl items-center justify-center gap-4 text-left sm:gap-5">
        <BloubBot state="searching" size={80} follow label="AmbiOS welcome assistant" />
        <div className="min-w-0 space-y-1">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.18em]">
            AmbiOS assistant
          </p>
          <h2 className="font-semibold text-xl tracking-tight sm:text-2xl">How can I help?</h2>
          <p className="max-w-md text-muted-foreground text-sm leading-6">
            Ask about your workspace, connect a provider, or start a governed workflow.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl">
        <SystemCarousel onSystemSelect={handleSystemSelect} showNavArrows />
      </div>

      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-3 md:grid-cols-2">
        <GlassButton
          onClick={() =>
            onStartPrompt(EXAMPLES.CAPABILITIES.user, undefined, {
              hideUserMessage: true,
            })
          }
          icon={<Lightbulb className="h-5 w-5" />}
          title={EXAMPLES.CAPABILITIES.title}
          description={EXAMPLES.CAPABILITIES.description}
          gradient="from-muted/20 via-transparent to-transparent"
          iconGradient="bg-muted text-muted-foreground"
        />

        <GlassButton
          onClick={() => {
            onStartPrompt(EXAMPLES.TEMPLATES.user, EXAMPLES.TEMPLATES.hiddenStarterMessage, {
              hideUserMessage: true,
            });
          }}
          icon={<Play className="h-5 w-5" />}
          title={EXAMPLES.TEMPLATES.title}
          description={EXAMPLES.TEMPLATES.description}
          gradient="from-muted/20 via-transparent to-transparent"
          iconGradient="bg-muted text-muted-foreground"
        />
      </div>
    </div>
  );
}
