"use client";

import type { SystemConfig } from "@ambios-ai/shared";
import { systems } from "@ambios-ai/shared";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef } from "react";
import { ProviderLogo } from "@/components/integrations/ProviderLogo";
import { cn } from "@/lib/general-utils";
import type { Provider } from "@/lib/integrations/types";

const MVP_PROVIDERS: readonly { provider: Provider; label: string }[] = [
  { provider: "openai", label: "OpenAI" },
  { provider: "cloudflare", label: "Cloudflare" },
  { provider: "github", label: "GitHub" },
  { provider: "vercel", label: "Vercel" },
  { provider: "netlify", label: "Netlify" },
  { provider: "shopify", label: "Shopify" },
];

interface SystemCarouselProps {
  onSystemSelect?: (key: string, label: string, config: SystemConfig) => void;
  className?: string;
  showNavArrows?: boolean;
}

export function SystemCarousel({
  onSystemSelect,
  className,
  showNavArrows = false,
}: SystemCarouselProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const scroll = (direction: number) =>
    scroller.current?.scrollBy({ left: direction * 240, behavior: "smooth" });
  return (
    <div
      className={cn(
        "relative rounded-3xl border border-border/50 bg-card/40 px-4 py-3 shadow-sm",
        className,
      )}
    >
      {showNavArrows && (
        <button
          type="button"
          aria-label="Previous integrations"
          onClick={() => scroll(-1)}
          className="absolute top-1/2 left-1 z-10 -translate-y-1/2 rounded-full border bg-background p-2 shadow-sm"
        >
          <ArrowLeft className="size-4" />
        </button>
      )}
      <div
        ref={scroller}
        className="flex gap-2 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {MVP_PROVIDERS.map(({ provider, label }) => {
          const config = systems[provider] ?? ({ icon: `simpleicons:${provider}` } as SystemConfig);
          return (
            <button
              key={provider}
              type="button"
              aria-label={`Set up ${label}`}
              onClick={() => onSystemSelect?.(provider, label, config)}
              className="group flex min-w-[104px] shrink-0 items-center gap-2 rounded-2xl border border-border/50 bg-background/70 px-3 py-2 text-left transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex size-8 items-center justify-center rounded-xl bg-muted/70 transition-transform duration-200 group-hover:scale-110">
                <ProviderLogo provider={provider} size={18} />
              </span>
              <span className="font-medium text-xs">{label}</span>
            </button>
          );
        })}
      </div>
      {showNavArrows && (
        <button
          type="button"
          aria-label="Next integrations"
          onClick={() => scroll(1)}
          className="absolute top-1/2 right-1 z-10 -translate-y-1/2 rounded-full border bg-background p-2 shadow-sm"
        >
          <ArrowRight className="size-4" />
        </button>
      )}
    </div>
  );
}
