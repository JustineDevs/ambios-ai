import { useSyncExternalStore } from "react";
import { type ConnectionState, connectionMonitor } from "../lib/connection-monitor";

export function useConnectionState(): ConnectionState {
  return useSyncExternalStore(
    (callback) => connectionMonitor.subscribe(callback),
    () => connectionMonitor.getState(),
    () => "checking" as ConnectionState, // Server-side rendering fallback is not provider evidence
  );
}
