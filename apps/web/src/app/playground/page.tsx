"use client";

import { useEffect, useState } from "react";
import { useConfig } from "@/app/config-context";
import { useToken } from "@/hooks/use-token";
import { tokenRegistry } from "@/lib/token-registry";

export default function PlaygroundPage() {
  const config = useConfig();
  const [iframeUrl, setIframeUrl] = useState("");
  const _token = useToken();

  useEffect(() => {
    // Construct URL with auth token as query parameter
    const url = new URL(config.apiEndpoint);
    url.searchParams.set("token", tokenRegistry.getToken());
    setIframeUrl(url.toString());
  }, [config.apiEndpoint]);

  return (
    <div className="h-screen w-full">
      {iframeUrl && (
        <iframe
          title="AmbiOS playground"
          src={iframeUrl}
          className="h-full w-full border-0"
          allow="clipboard-write"
        />
      )}
    </div>
  );
}
