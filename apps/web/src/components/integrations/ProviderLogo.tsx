"use client";

import {
  ApiIcon,
  ChatGptIcon,
  GithubIcon,
  Notion02Icon,
  ShopifyIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  siCloudflare,
  siFigma,
  siGithub,
  siGoogleanalytics,
  siGooglecalendar,
  siGoogledrive,
  siHubspot,
  siJira,
  siLinear,
  siNetlify,
  siNotion,
  siOpenai,
  siShopify,
  siSlack,
  siSnyk,
  siSocketdotio,
  siStripe,
  siVercel,
} from "simple-icons";
import { isDarkIconHex } from "@/lib/general-utils";
import type { Provider } from "@/lib/integrations/types";

const ICONS = {
  openai: siOpenai,
  notion: siNotion,
  cloudflare: siCloudflare,
  figma: siFigma,
  github: siGithub,
  vercel: siVercel,
  netlify: siNetlify,
  shopify: siShopify,
  jira: siJira,
  "google-drive": siGoogledrive,
  "google-calendar": siGooglecalendar,
  "google-analytics": siGoogleanalytics,
  slack: siSlack,
  linear: siLinear,
  hubspot: siHubspot,
  stripe: siStripe,
  snyk: siSnyk,
  socket: siSocketdotio,
} as const;

const HUGEICONS = {
  openai: ChatGptIcon,
  github: GithubIcon,
  notion: Notion02Icon,
  shopify: ShopifyIcon,
} as const;

const LABELS: Record<Provider, string> = {
  openai: "OpenAI",
  notion: "Notion",
  cloudflare: "Cloudflare",
  github: "GitHub",
  vercel: "Vercel",
  netlify: "Netlify",
  shopify: "Shopify",
  jira: "Jira",
  "google-drive": "Google Drive",
  "google-calendar": "Google Calendar",
  "google-analytics": "Google Analytics",
  slack: "Slack",
  linear: "Linear",
  hubspot: "HubSpot",
  stripe: "Stripe",
  figma: "Figma",
  frame: "Frame.io",
  "custom-rest": "Custom REST API",
  snyk: "Snyk",
  socket: "Socket.dev",
};

function FrameLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label="Frame.io">
      <path
        fill="currentColor"
        d="M4 3h6v3H7v4h3v3H7v5h3v3H4V3Zm10 0h6v18h-6v-3h3v-5h-3v-3h3V6h-3V3Z"
      />
    </svg>
  );
}

export function ProviderLogo({ provider, size = 20 }: { provider: Provider; size?: number }) {
  if (provider === "frame") return <FrameLogo size={size} />;
  const hugeIcon = HUGEICONS[provider as keyof typeof HUGEICONS];
  if (hugeIcon) {
    const brand = ICONS[provider as keyof typeof ICONS];
    return (
      <HugeiconsIcon
        icon={hugeIcon}
        size={size}
        color={brand ? `#${brand.hex}` : "currentColor"}
        strokeWidth={1.5}
        className={brand && isDarkIconHex(brand.hex) ? "dark:invert" : undefined}
        aria-hidden="true"
      />
    );
  }

  const icon = ICONS[provider as keyof typeof ICONS];
  if (!icon) {
    if (provider === "custom-rest") {
      return (
        <HugeiconsIcon
          icon={ApiIcon}
          size={size}
          color="currentColor"
          strokeWidth={1.5}
          aria-label={LABELS[provider]}
        />
      );
    }
    return (
      <span
        className="font-semibold"
        style={{ fontSize: size * 0.65 }}
        role="img"
        aria-label={LABELS[provider]}
      >
        ?
      </span>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={icon.title}>
      <path
        className={isDarkIconHex(icon.hex) ? "dark:invert" : undefined}
        fill={`#${icon.hex}`}
        d={icon.path}
      />
    </svg>
  );
}
