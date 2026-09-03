"use client";
import { useEffect, useRef } from "react";
import { useConnectionState } from "@/hooks/use-connection-state";
import { useToast } from "@/hooks/use-toast";

export function ConnectionToast() {
  const state = useConnectionState();
  const { toast } = useToast();
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (state === "disconnected" && !toastShownRef.current) {
      toastShownRef.current = true;
      toast({
        title: "Reconnecting to server...",
        description: "Attempting to restore connection",
      });
    }
    if (state === "connected") {
      toastShownRef.current = false;
    }
  }, [state, toast]);

  return null;
}
