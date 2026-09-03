import { AmbiOSClient } from "@ambios-ai/shared";
import { useCallback } from "react";
import { useConfig } from "@/app/config-context";
import { connectionMonitor } from "@/lib/connection-monitor";
import { tokenRegistry } from "@/lib/token-registry";

export function useAmbiOSClient() {
  const { apiEndpoint } = useConfig();

  return useCallback(() => {
    return new AmbiOSClient({
      apiEndpoint,
      apiKey: tokenRegistry.getToken(),
      onInfrastructureError: () => connectionMonitor.onInfrastructureError(apiEndpoint),
    });
  }, [apiEndpoint]);
}
