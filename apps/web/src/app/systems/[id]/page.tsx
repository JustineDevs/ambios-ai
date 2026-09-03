"use client";

import { Loader2 } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { SystemConfigProvider } from "@/components/systems/context";
import { SystemPlayground } from "@/components/systems/SystemPlayground";
import { useSystem } from "@/queries/systems";

export default function SystemPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const systemId = params.id as string;
  const isNew = systemId === "new";
  const envParam = searchParams.get("env") as "dev" | "prod" | null;

  const {
    data: system,
    isLoading,
    error,
  } = useSystem(
    isNew
      ? ""
      : (() => {
          try {
            return decodeURIComponent(systemId);
          } catch {
            return systemId;
          }
        })(),
    envParam ? { environment: envParam } : undefined,
  );

  if (!isNew && isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!isNew && error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Failed to load system</p>
        <button
          type="button"
          onClick={() => router.push("/systems")}
          className="text-primary hover:underline"
        >
          Back to Systems
        </button>
      </div>
    );
  }

  if (!isNew && !system) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">System not found</p>
        <button
          type="button"
          onClick={() => router.push("/systems")}
          className="text-primary hover:underline"
        >
          Back to Systems
        </button>
      </div>
    );
  }

  return (
    <SystemConfigProvider initialSystem={system || undefined} isNew={isNew} isOnboarding={isNew}>
      <SystemPlayground />
    </SystemConfigProvider>
  );
}
