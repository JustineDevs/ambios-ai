"use client";

import { useEffect, useState } from "react";
import { requestOperation } from "@/lib/api-client";

type VendorEmbedProps = { vendor: string; resourceId: string };

export function VendorEmbed({ vendor, resourceId }: VendorEmbedProps) {
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");
  useEffect(() => {
    let active = true;
    requestOperation("listIntegrations", { cache: "no-store" })
      .then((response) => {
        if (active) setState(response.ok ? "ready" : "unavailable");
      })
      .catch(() => {
        if (active) setState("unavailable");
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <div className="mt-2 space-y-1 text-muted-foreground">
      <p>
        {state === "loading"
          ? "Loading connector state…"
          : state === "ready"
            ? "Connector state available."
            : "Connector state unavailable."}
      </p>
      <p>Provider: {vendor}</p>
      <p className="truncate">Resource: {resourceId}</p>
    </div>
  );
}
