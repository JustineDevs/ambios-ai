"use client";
import { createContext, type ReactNode, useContext, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { tokenRegistry } from "../lib/token-registry";

export interface ServerSession {
  userId: string;
  email: string;
  orgId: string;
  orgName: string;
  orgStatus: string;
}

export interface Config {
  ambiosApiKey: string;
  apiEndpoint: string;
  postHogKey: string;
  postHogHost: string;
  serverSession: ServerSession | null;
}

interface ConfigContextValue {
  apiEndpoint: string;
  postHogKey: string;
  postHogHost: string;
  serverSession: ServerSession | null;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

export function ConfigProvider({ children, config }: { children: ReactNode; config: Config }) {
  useEffect(() => {
    let active = true;
    let supabase: ReturnType<typeof createClient> | null = null;

    try {
      supabase = createClient();
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (active) tokenRegistry.setToken(session?.access_token ?? (config.ambiosApiKey || null));
      });
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (active) tokenRegistry.setToken(session?.access_token ?? (config.ambiosApiKey || null));
      });
      return () => {
        active = false;
        subscription.unsubscribe();
      };
    } catch {
      tokenRegistry.setToken(config.ambiosApiKey || null);
      return () => {
        active = false;
      };
    }
  }, [config.ambiosApiKey]);

  const { ambiosApiKey, ...lightConfig } = config;

  return <ConfigContext.Provider value={lightConfig}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const config = useContext(ConfigContext);
  if (!config) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return config;
}
