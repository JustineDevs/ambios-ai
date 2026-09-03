"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AgentModalContent, AgentModalProvider } from "@/components/agent/AgentModalContext";
import { LeftSidebar } from "@/components/sidebar/LeftSidebar";
import { RightSidebar } from "@/components/sidebar/RightSidebar";
import { RightSidebarProvider } from "@/components/sidebar/RightSidebarContext";
import {
  SystemPickerModalContent,
  SystemPickerModalProvider,
} from "@/components/systems/SystemPickerModalContext";
import { requestOperation } from "@/lib/api-client";
import { connectionMonitor } from "@/lib/connection-monitor";
import { registerWebMCPTools } from "@/lib/webmcp/register";
import { queryClient } from "@/queries";
import { Toaster } from "../components/ui/toaster";
import { ConnectionToast } from "../components/utils/ConnectionToast";
import { useToken } from "../hooks/use-token";
import { type Config, ConfigProvider } from "./config-context";
import { EnvironmentProvider } from "./environment-context";
import { jetbrainsMono, jetbrainsSans } from "./fonts";
import { OrgProvider } from "./org-context";
import { CSPostHogProvider } from "./providers";

interface Props {
  children: React.ReactNode;
  config: Config;
}

function WelcomeGate({
  children,
  apiEndpoint,
  token,
}: {
  children: React.ReactNode;
  apiEndpoint: string;
  token: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isWelcomePage = pathname === "/welcome";
  const developmentAuthDisabled =
    process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_AUTH_DISABLE === "true";
  const [welcomeStatus, setWelcomeStatus] = useState<"unknown" | "required" | "complete">(
    isWelcomePage || developmentAuthDisabled ? "complete" : "unknown",
  );

  useEffect(() => {
    let cancelled = false;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    if (isWelcomePage || developmentAuthDisabled || welcomeStatus !== "unknown") {
      return;
    }

    if (!token) {
      setWelcomeStatus("complete");
      return;
    }

    const checkTenantInfo = async () => {
      try {
        const response = await requestOperation("getWorkspace", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (!response.ok) {
          if (response.status >= 500 && !cancelled) {
            connectionMonitor.onInfrastructureError(apiEndpoint);
            retryTimeout = setTimeout(() => {
              void checkTenantInfo();
            }, 1000);
            return;
          }
          if (!cancelled) setWelcomeStatus("complete");
          return;
        }

        const workspace = (await response.json()) as {
          organization?: { name?: string } | null;
        };
        const requiresWelcome = !workspace?.organization;

        if (!cancelled) {
          setWelcomeStatus(requiresWelcome ? "required" : "complete");
        }
      } catch {
        if (!cancelled) {
          connectionMonitor.onInfrastructureError(apiEndpoint);
          retryTimeout = setTimeout(() => {
            void checkTenantInfo();
          }, 1000);
        }
      }
    };

    void checkTenantInfo();

    return () => {
      cancelled = true;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [apiEndpoint, developmentAuthDisabled, isWelcomePage, token, welcomeStatus]);

  useEffect(() => {
    if (!isWelcomePage && welcomeStatus === "required") {
      router.replace("/welcome");
    }
  }, [isWelcomePage, router, welcomeStatus]);

  if (!isWelcomePage && welcomeStatus === "unknown") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  return <>{children}</>;
}

export function ClientWrapper({ children, config }: Props) {
  const pathname = usePathname();
  const token = useToken();
  const isWelcomePage = pathname === "/welcome";
  const isAuthPage = pathname === "/login" || pathname.startsWith("/auth/");

  useEffect(() => {
    void registerWebMCPTools();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider config={config}>
        <OrgProvider>
          <EnvironmentProvider>
            <CSPostHogProvider serverSession={config.serverSession}>
              <RightSidebarProvider>
                <AgentModalProvider>
                  <SystemPickerModalProvider>
                    <div
                      className={`${jetbrainsSans.variable} ${jetbrainsMono.variable} antialiased`}
                    >
                      <WelcomeGate apiEndpoint={config.apiEndpoint} token={token}>
                        {isWelcomePage ? (
                          <div className="min-h-screen">
                            <main className="min-h-screen">{children}</main>
                            <SystemPickerModalContent />
                            <AgentModalContent />
                          </div>
                        ) : (
                          <div className="flex h-screen overflow-hidden">
                            {!isAuthPage && <LeftSidebar />}
                            <div className="relative h-full min-w-0 flex-1">
                              <a
                                href="#main-content"
                                className="sr-only z-[100] rounded-md bg-background px-3 py-2 text-foreground focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                Skip to main content
                              </a>
                              <AnimatePresence mode="wait">
                                <motion.div
                                  key={pathname}
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="h-full w-full overflow-y-auto"
                                >
                                  <main id="main-content" className="h-full w-full">
                                    {children}
                                  </main>
                                </motion.div>
                              </AnimatePresence>
                              <SystemPickerModalContent />
                              <AgentModalContent />
                            </div>
                            {token && !isAuthPage && (
                              <div className="hidden h-full flex-shrink-0 lg:flex">
                                <RightSidebar />
                              </div>
                            )}
                          </div>
                        )}
                      </WelcomeGate>
                      <Toaster />
                      {token && !isWelcomePage && <ConnectionToast />}
                    </div>
                  </SystemPickerModalProvider>
                </AgentModalProvider>
              </RightSidebarProvider>
            </CSPostHogProvider>
          </EnvironmentProvider>
        </OrgProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
