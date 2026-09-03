"use client";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { hasResolvedOrgId, useOrgOptional } from "./org-context";

export type ExecutionMode = "dev" | "prod";

interface EnvironmentContextValue {
  mode: ExecutionMode;
  setMode: (mode: ExecutionMode) => void;
  hasMultiEnvSystems: boolean;
  isLoading: boolean;
  refreshHasMultiEnvSystems: () => void;
}

const EnvironmentContext = createContext<EnvironmentContextValue | null>(null);

const BASE_STORAGE_KEY = "ambios-environment-mode";
const MULTI_ENV_KEY = "multi-env-systems";

export function EnvironmentProvider({ children }: { children: ReactNode }) {
  const org = useOrgOptional();
  const orgId = org?.orgId;
  const storageKey = hasResolvedOrgId(orgId) ? `${BASE_STORAGE_KEY}:${orgId}` : BASE_STORAGE_KEY;
  const [mode, setModeState] = useState<ExecutionMode>("prod");
  const queryClient = useQueryClient();

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored === "dev" || stored === "prod") {
      setModeState(stored);
    } else if (stored === "development") {
      setModeState("dev");
      localStorage.setItem(storageKey, "dev");
    } else if (stored === "production") {
      setModeState("prod");
      localStorage.setItem(storageKey, "prod");
    }
  }, [storageKey]);

  const setMode = useCallback(
    (newMode: ExecutionMode) => {
      setModeState(newMode);
      localStorage.setItem(storageKey, newMode);
    },
    [storageKey],
  );

  // Multi-environment system management is not mounted in the canonical
  // Worker API. Do not call the retired /v1 probe or infer readiness from a
  // compatibility response; the selector remains production-safe and is
  // enabled when the persisted systems endpoint is introduced.
  const multiEnvQuery = { data: false, isLoading: false };

  const refreshHasMultiEnvSystems = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [MULTI_ENV_KEY, orgId] });
  }, [queryClient, orgId]);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      hasMultiEnvSystems: multiEnvQuery.data ?? false,
      isLoading: multiEnvQuery.isLoading,
      refreshHasMultiEnvSystems,
    }),
    [mode, setMode, multiEnvQuery.data, multiEnvQuery.isLoading, refreshHasMultiEnvSystems],
  );

  return <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>;
}

export function useEnvironment() {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error("useEnvironment must be used within an EnvironmentProvider");
  }
  return context;
}
