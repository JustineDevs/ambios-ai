"use client";

import { type SystemConfig, systems } from "@ambios-ai/shared";
import { Blocks, CloudOff, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAgentModal } from "@/components/agent/AgentModalContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SystemIcon } from "@/components/ui/system-icon";
import {
  cn,
  formatLabel,
  getSimpleIcon,
  type SimpleIconEntry,
  searchSimpleIcons,
} from "@/lib/general-utils";
import { OnPremWizard } from "./onprem";

interface TemplateOption {
  key: string;
  label: string;
  icon: string;
  config: SystemConfig | null;
  hue?: number;
}

const HUES = [0, 15, 30, 45, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

function hashStringToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return HUES[Math.abs(hash) % HUES.length];
}

function buildTemplateOptions(): TemplateOption[] {
  return Object.entries(systems).map(([key, config]) => ({
    key,
    label: formatLabel(key),
    icon: config.icon || "default",
    config,
    hue: hashStringToHue(key),
  }));
}

function tryResolveIconFromName(name: string): string | null {
  if (!name || name.length < 2) return null;
  const cleaned = name.replace(/[^a-zA-Z0-9]/g, "");
  if (cleaned.length < 2) return null;
  const icon = getSimpleIcon(cleaned);
  if (icon) return cleaned.toLowerCase();
  const words = name.split(/\s+/);
  for (const word of words) {
    const cleanWord = word.replace(/[^a-zA-Z0-9]/g, "");
    if (cleanWord.length >= 2) {
      const wordIcon = getSimpleIcon(cleanWord);
      if (wordIcon) return cleanWord.toLowerCase();
    }
  }
  return null;
}

interface TemplateCardProps {
  option: TemplateOption;
  onClick: () => void;
}

function TemplateCard({ option, onClick }: TemplateCardProps) {
  const hue = option.hue ?? 200;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative w-full rounded-2xl p-4 text-left transition-all duration-300",
        "bg-gradient-to-br from-muted/50 to-muted/30 dark:from-muted/30 dark:to-muted/20",
        "border border-border/50 backdrop-blur-sm",
        "shadow-sm",
        "hover:border-border/80 hover:shadow-md",
        "hover:scale-[1.02] active:scale-[0.98]",
        "overflow-hidden",
        "min-h-[100px]",
      )}
      style={{
        ["--card-hue" as string]: hue,
      }}
    >
      <div
        className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `linear-gradient(135deg, hsla(${hue}, 70%, 50%, 0.08) 0%, transparent 60%)`,
        }}
      />
      <div className="relative flex items-center gap-4">
        <div
          className={cn(
            "relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
            "transition-transform duration-300 group-hover:scale-105",
          )}
          style={{
            backgroundColor: `hsla(${hue}, 60%, 50%, 0.1)`,
          }}
        >
          <SystemIcon
            system={{ icon: option.icon, templateName: option.key }}
            size={24}
            className="transition-transform"
            fallbackClassName="text-muted-foreground"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <h3 className="truncate font-medium text-foreground/80 text-sm transition-colors group-hover:text-foreground">
            {option.label}
          </h3>
          {option.config?.apiUrl && (
            <p className="truncate text-[10px] text-muted-foreground/60">
              {option.config.apiUrl.replace(/^https?:\/\//, "").split("/")[0]}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

interface NewSystemFormProps {
  onSubmit: (name: string) => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  initialName?: string;
}

function NewSystemCard({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative w-full rounded-2xl p-4 text-left transition-all duration-300",
        "bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5",
        "border-2 border-primary/30 border-dashed backdrop-blur-sm",
        "shadow-sm",
        "hover:border-primary/50 hover:shadow-md",
        "hover:scale-[1.02] active:scale-[0.98]",
        "overflow-hidden",
        "min-h-[100px]",
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          "bg-gradient-to-br from-primary/10 via-transparent to-transparent",
        )}
      />
      <div className="relative flex items-center gap-4">
        <div
          className={cn(
            "relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
            "bg-primary/10 dark:bg-primary/20",
            "transition-transform duration-300 group-hover:scale-105",
          )}
        >
          <Plus className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <h3 className="font-medium text-foreground/90 text-sm transition-colors group-hover:text-foreground">
            New System
          </h3>
          <p className="text-[10px] text-muted-foreground/70 transition-colors group-hover:text-muted-foreground/80">
            Connect any API or data source
          </p>
        </div>
      </div>
    </button>
  );
}

function OnPremSystemCard({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative w-full rounded-2xl p-4 text-left transition-all duration-300",
        "bg-gradient-to-br from-muted/30 to-muted/20 dark:from-muted/20 dark:to-muted/10",
        "border-2 border-border/40 border-dashed backdrop-blur-sm",
        "shadow-sm",
        "hover:border-border/60 hover:shadow-md",
        "hover:scale-[1.02] active:scale-[0.98]",
        "overflow-hidden",
        "min-h-[100px]",
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          "bg-gradient-to-br from-muted/20 via-transparent to-transparent",
        )}
      />
      <div className="relative flex items-center gap-4">
        <div
          className={cn(
            "relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
            "bg-muted/50 dark:bg-muted/30",
            "transition-transform duration-300 group-hover:scale-105",
          )}
        >
          <CloudOff className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <h3 className="font-medium text-foreground/90 text-sm transition-colors group-hover:text-foreground">
            Private System
          </h3>
          <p className="text-[10px] text-muted-foreground/70 transition-colors group-hover:text-muted-foreground/80">
            Connect via secure gateway
          </p>
        </div>
      </div>
    </button>
  );
}

interface IconSuggestionCardProps {
  icon: SimpleIconEntry;
  onClick: () => void;
}

function IconSuggestionCard({ icon, onClick }: IconSuggestionCardProps) {
  const hue = hashStringToHue(icon.slug);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative w-full rounded-2xl p-4 text-left transition-all duration-300",
        "bg-gradient-to-br from-muted/30 to-muted/20 dark:from-muted/20 dark:to-muted/10",
        "border border-border/40 border-dashed backdrop-blur-sm",
        "shadow-sm",
        "hover:border-border/60 hover:shadow-md",
        "hover:scale-[1.02] active:scale-[0.98]",
        "overflow-hidden",
        "min-h-[100px]",
      )}
    >
      <div
        className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `linear-gradient(135deg, hsla(${hue}, 70%, 50%, 0.06) 0%, transparent 60%)`,
        }}
      />
      <div className="relative flex items-center gap-4">
        <div
          className={cn(
            "relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
            "transition-transform duration-300 group-hover:scale-105",
          )}
          style={{
            backgroundColor: `hsla(${hue}, 60%, 50%, 0.08)`,
          }}
        >
          <SystemIcon
            system={{ icon: icon.slug }}
            size={24}
            className="transition-transform"
            fallbackClassName="text-muted-foreground"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <h3 className="truncate font-medium text-foreground/70 text-sm transition-colors group-hover:text-foreground/90">
            {icon.title}
          </h3>
          <p className="text-[10px] text-muted-foreground/50">Custom system</p>
        </div>
      </div>
    </button>
  );
}

function NewSystemForm({
  onSubmit,
  expanded,
  onExpandedChange,
  initialName = "",
}: NewSystemFormProps) {
  const [name, setName] = useState(initialName);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (expanded && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      if (initialName) {
        setName(initialName);
      }
    }
    if (!expanded) {
      hasInitializedRef.current = false;
    }
  }, [expanded, initialName]);

  const resolvedIcon = useMemo(() => tryResolveIconFromName(name), [name]);

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name.trim());
      setName("");
      onExpandedChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && name.trim()) {
      handleSubmit();
    }
    if (e.key === "Escape") {
      onExpandedChange(false);
    }
  };

  if (!expanded) {
    return null;
  }

  return (
    <div
      className={cn(
        "col-span-full rounded-2xl p-4 md:col-span-2",
        "bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5",
        "border-2 border-primary/40 backdrop-blur-sm",
        "shadow-md",
        "w-full",
        "fade-in-0 zoom-in-95 animate-in duration-200",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
            "bg-primary/10 dark:bg-primary/20",
            "transition-all duration-300",
          )}
        >
          {resolvedIcon ? (
            <SystemIcon
              system={{ icon: resolvedIcon }}
              size={20}
              fallbackClassName="text-primary"
              className="fade-in-0 zoom-in-50 animate-in duration-200"
            />
          ) : (
            <Blocks className="h-5 w-5 text-primary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Input
            placeholder="Enter system name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="h-10 border-border/50 bg-background/50 text-sm focus-visible:ring-primary/30"
          />
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onExpandedChange(false)}
            className="h-10 px-3 text-xs"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="h-10 px-4 text-xs"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

interface SystemTemplatePickerProps {
  onClose?: () => void;
  showHeader?: boolean;
  className?: string;
}

export function SystemTemplatePicker({
  onClose,
  showHeader = true,
  className,
}: SystemTemplatePickerProps) {
  const { openAgentModal } = useAgentModal();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [newSystemFormExpanded, setNewSystemFormExpanded] = useState(false);
  const [onPremWizardOpen, setOnPremWizardOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const allOptions = useMemo(() => buildTemplateOptions(), []);

  const filteredOptions = useMemo(() => {
    if (!debouncedSearch.trim()) return allOptions;

    const search = debouncedSearch.toLowerCase();
    return allOptions.filter((option) => {
      if (option.label.toLowerCase().includes(search)) return true;
      if (option.key.toLowerCase().includes(search)) return true;
      const keywords = option.config?.keywords || [];
      return keywords.some((kw) => kw.toLowerCase().includes(search));
    });
  }, [allOptions, debouncedSearch]);

  const iconSuggestions = useMemo(() => {
    if (!debouncedSearch.trim() || debouncedSearch.length < 2) return [];

    const templateKeys = new Set(allOptions.map((o) => o.key.toLowerCase()));
    const templateIcons = new Set(allOptions.map((o) => o.icon?.toLowerCase()).filter(Boolean));

    const suggestions = searchSimpleIcons(debouncedSearch, 12);
    return suggestions.filter(
      (icon) => !templateKeys.has(icon.slug) && !templateIcons.has(icon.slug),
    );
  }, [debouncedSearch, allOptions]);

  const buildStarterMessage = useCallback((config: SystemConfig) => {
    const lines = ["The user selected a system template."];
    if (config.apiUrl) lines.push(`Suggested API URL: ${config.apiUrl}`);
    if (config.docsUrl) lines.push(`Documentation URL: ${config.docsUrl}`);
    if (config.openApiUrl) lines.push(`OpenAPI URL: ${config.openApiUrl}`);
    if (config.preferredAuthType) {
      lines.push(`Suggested auth type: ${config.preferredAuthType}`);
    }
    lines.push(`OAuth available: ${config.oauth ? "yes" : "no"}`);
    if (config.systemSpecificInstructions) {
      lines.push(`Template-specific instructions: ${config.systemSpecificInstructions}`);
    }
    return lines.join("\n");
  }, []);

  const handleTemplateSelect = useCallback(
    (option: TemplateOption) => {
      const prompt = `I want to set up ${option.label}`;
      const hiddenStarterMessage = option.config ? buildStarterMessage(option.config) : "";

      openAgentModal({
        userPrompt: prompt,
        hiddenStarterMessage,
        chatTitle: option.label,
        chatIcon: option.icon,
      });
    },
    [openAgentModal, buildStarterMessage],
  );

  const handleNewSystemSubmit = useCallback(
    (name: string) => {
      const prompt = `I want to set up a system called "${name}"`;
      const resolvedIcon = tryResolveIconFromName(name);

      const hiddenStarterMessage = `The user wants to set up a custom system.
Name: ${name}
Suggested auth type: apikey`;

      openAgentModal({
        userPrompt: prompt,
        hiddenStarterMessage,
        chatTitle: name,
        chatIcon: resolvedIcon || undefined,
      });
    },
    [openAgentModal],
  );

  const handleIconSuggestionSelect = useCallback(
    (icon: SimpleIconEntry) => {
      const prompt = `I want to set up ${icon.title}`;

      const hiddenStarterMessage = `The user wants to set up a custom system.
Name: ${icon.title}
Suggested icon: ${icon.slug}
Suggested auth type: apikey`;

      openAgentModal({
        userPrompt: prompt,
        hiddenStarterMessage,
        chatTitle: icon.title,
        chatIcon: icon.slug,
      });
    },
    [openAgentModal],
  );

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {showHeader && (
        <div className="mb-6 flex flex-shrink-0 flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="font-bold text-2xl">Add a System</h1>
              <p className="mt-1 text-muted-foreground text-sm">
                Choose from popular systems or create a new one
              </p>
            </div>
          </div>

          <div className="relative max-w-lg">
            <div
              className={cn(
                "relative flex items-center",
                "bg-gradient-to-r from-muted/60 to-muted/40 dark:from-muted/40 dark:to-muted/20",
                "rounded-xl border border-border/50",
                "shadow-sm",
                "focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20",
                "transition-all duration-200",
              )}
            >
              <Search className="pointer-events-none absolute left-4 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search integrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  "h-11 pr-4 pl-11 text-sm",
                  "border-0 bg-transparent",
                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                  "placeholder:text-muted-foreground/60",
                )}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 rounded-md p-1 transition-colors hover:bg-muted/50"
                >
                  <span className="text-muted-foreground text-xs">Clear</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto overflow-x-visible">
        {debouncedSearch.trim() && filteredOptions.length > 0 && (
          <h3 className="mb-3 px-1 font-medium text-muted-foreground text-xs">Popular Systems</h3>
        )}
        <div className="mt-1 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 px-1 pb-4">
          {newSystemFormExpanded ? (
            <NewSystemForm
              onSubmit={handleNewSystemSubmit}
              expanded={newSystemFormExpanded}
              onExpandedChange={setNewSystemFormExpanded}
              initialName={searchTerm.trim()}
            />
          ) : (
            <NewSystemCard onClick={() => setNewSystemFormExpanded(true)} />
          )}

          <OnPremSystemCard onClick={() => setOnPremWizardOpen(true)} />

          {filteredOptions.map((option) => (
            <TemplateCard
              key={option.key}
              option={option}
              onClick={() => handleTemplateSelect(option)}
            />
          ))}
        </div>

        {iconSuggestions.length > 0 && (
          <div className="mt-6 px-1 pb-4">
            <h3 className="mb-3 font-medium text-muted-foreground text-xs">
              Other systems matching "{debouncedSearch}"
            </h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
              {iconSuggestions.map((icon) => (
                <IconSuggestionCard
                  key={icon.slug}
                  icon={icon}
                  onClick={() => handleIconSuggestionSelect(icon)}
                />
              ))}
            </div>
          </div>
        )}

        {filteredOptions.length === 0 && iconSuggestions.length === 0 && debouncedSearch.trim() && (
          <div className="flex flex-col items-center justify-center px-1 py-8 text-center">
            <p className="text-muted-foreground/60 text-sm">
              No systems match "{debouncedSearch}" — use the New System card above to set it up
            </p>
          </div>
        )}
      </div>

      {/* Private System Wizard Dialog */}
      <Dialog open={onPremWizardOpen} onOpenChange={setOnPremWizardOpen}>
        <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col overflow-y-auto">
          <DialogTitle className="sr-only">Connect to Private System</DialogTitle>
          <OnPremWizard onClose={() => setOnPremWizardOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
