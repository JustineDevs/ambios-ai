import { serviceOriginsFromEnv } from "@ambios-ai/shared";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { getThemeScript } from "@/lib/general-utils";
import { ClientWrapper } from "./client-layout";
import { jetbrainsMono, jetbrainsSans } from "./fonts";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "AmbiOS AI",
    template: "%s | AmbiOS AI",
  },
  description:
    "A WebMCP-native workspace for humans and agents to collaborate on safer operations.",
  keywords: ["WebMCP", "AI agents", "incident response", "operations"],
  authors: [{ name: "AmbiOS AI" }],
  openGraph: {
    title: "AmbiOS AI",
    description:
      "A WebMCP-native workspace for humans and agents to collaborate on safer operations.",
    url: "https://ambios.ai",
    siteName: "AmbiOS AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AmbiOS AI",
    description: "A WebMCP-native workspace for safer operations.",
  },
  icons: {
    icon: "/assets/image/logo.png",
    apple: "/assets/image/logo.png",
  },
  metadataBase: new URL("https://ambios.ai"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiEndpoint = process.env.API_ENDPOINT || serviceOriginsFromEnv(process.env).coreApiOrigin;
  const apiKey = process.env.NEXT_PUBLIC_AMBIOS_API_KEY || "";

  const config = {
    ambiosApiKey: apiKey,
    apiEndpoint,
    postHogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY || "",
    postHogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST || "",
    serverSession: null,
  };

  return (
    <html
      lang="en"
      className={`${jetbrainsSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script>{getThemeScript()}</script>
      </head>
      <body>
        <ClientWrapper config={config}>{children}</ClientWrapper>
        <Analytics />
      </body>
    </html>
  );
}
