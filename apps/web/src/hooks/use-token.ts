import { useSyncExternalStore } from "react";
import { tokenRegistry } from "../lib/token-registry";

export function useToken(): string | null {
  const developmentAuthDisabled =
    process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_AUTH_DISABLE === "true";
  return useSyncExternalStore(
    (callback) => (developmentAuthDisabled ? () => undefined : tokenRegistry.subscribe(callback)),
    () => (developmentAuthDisabled ? null : tokenRegistry.getToken()),
    () => null,
  );
}
