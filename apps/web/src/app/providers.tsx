"use client";
import posthog, { type PostHog } from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { type ReactNode, useEffect } from "react";
import type { ServerSession } from "./config-context";

let posthogClient: PostHog;

export function CSPostHogProvider({
  children,
  serverSession,
}: {
  children: ReactNode;
  serverSession: ServerSession | null;
}) {
  // Keep local authentication debugging deterministic and avoid loading an
  // ad-blocked analytics transport into the developer browser. Telemetry is
  // opt-in outside production and remains independently disableable there.
  const disable = process.env.NODE_ENV !== "production" || process.env.DISABLE_TELEMETRY === "true";

  useEffect(() => {
    if (typeof window === "undefined" || disable || posthogClient) return;
    // Initialize PostHog
    posthogClient = posthog.init("phc_89mcVkZ9osPaFQwTp3oFA2595ne95OSNk47qnhqCCbE", {
      api_host: "https://d22ze2hfwgrlye.cloudfront.net",
      ui_host: "https://us.posthog.com",
      person_profiles: "always",
      session_recording: {
        maskAllInputs: false,
        maskInputOptions: {
          password: true,
        },
      },
    });

    // Identify user from server session — no extra getSession() call needed
    if (serverSession) {
      posthog.identify(serverSession.email, {
        id: serverSession.userId,
        email: serverSession.email,
      });
    }
  }, [serverSession?.userId, serverSession?.email, serverSession, disable]);

  if (disable) {
    return <>{children}</>;
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
