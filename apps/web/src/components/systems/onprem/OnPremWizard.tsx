"use client";

import { slugify, type TunnelConnection, type TunnelTarget } from "@ambios-ai/shared";
import { ArrowLeft, CheckCircle2, CloudOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/general-utils";
import {
  generateTunnelInstructions,
  getProtocolIcon,
  getProtocolIconName,
  toTitleCase,
} from "@/lib/protocol-utils";
import { useCreateSystem, useSystems } from "@/queries/systems";
import { TunnelSelector } from "./TunnelSelector";

interface OnPremWizardProps {
  onClose?: () => void;
  className?: string;
}

type WizardStep = "select-tunnel" | "confirm-name" | "success";

export function OnPremWizard({ onClose, className }: OnPremWizardProps) {
  const [step, setStep] = useState<WizardStep>("select-tunnel");
  const { connectedTunnels, loading: tunnelsLoading } = useSystems();
  const [selectedTunnel, setSelectedTunnel] = useState<TunnelConnection | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<TunnelTarget | null>(null);
  const [systemName, setSystemName] = useState("");
  const [createdSystemId, setCreatedSystemId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const createSystemMutation = useCreateSystem();

  const handleSelectTunnel = useCallback((tunnel: TunnelConnection) => {
    setSelectedTunnel(tunnel);
    setSelectedTarget(null);
  }, []);

  const handleSelectTarget = useCallback((target: TunnelTarget) => {
    setSelectedTarget(target);
    // Set default name from target name (converted to title case)
    setSystemName(toTitleCase(target.name));
    // Advance to name confirmation step
    setStep("confirm-name");
  }, []);

  const handleBack = useCallback(() => {
    if (step === "confirm-name") {
      setStep("select-tunnel");
    }
  }, [step]);

  const handleSubmit = useCallback(async () => {
    if (!selectedTunnel || !selectedTarget || !systemName.trim()) return;

    try {
      const protocol = (selectedTarget.protocol || "https").toLowerCase();
      const URL_SCHEME_MAP: Record<string, string> = {
        postgres: "postgres",
        postgresql: "postgres",
        mssql: "mssql",
        sqlserver: "mssql",
        redis: "redis",
        rediss: "rediss",
        sftp: "sftp",
        ftp: "ftp",
        smb: "smb",
        http: "http",
      };
      const urlScheme = URL_SCHEME_MAP[protocol] || "https";

      const needsTrailingSlash = ["sftp", "ftp", "smb"].includes(urlScheme);
      const systemUrl = `${urlScheme}://${selectedTunnel.id}.tunnel${needsTrailingSlash ? "/" : ""}`;

      const result = await createSystemMutation.mutateAsync({
        id: slugify(systemName.trim()),
        name: systemName.trim(),
        url: systemUrl,
        icon: getProtocolIconName(protocol),
        tunnel: {
          tunnelId: selectedTunnel.id,
          targetName: selectedTarget.name,
        },
        specificInstructions: generateTunnelInstructions(systemUrl, protocol),
      });

      setCreatedSystemId(result.id);
      setStep("success");
      toast({
        title: "System Created",
        description: `Successfully created private system "${systemName.trim()}"`,
      });
    } catch (error) {
      console.error("Failed to create system:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create system",
        variant: "destructive",
      });
    }
  }, [selectedTunnel, selectedTarget, systemName, toast, createSystemMutation]);

  const handleViewSystem = useCallback(() => {
    if (createdSystemId) {
      router.push(`/systems/${createdSystemId}`);
    }
    onClose?.();
  }, [createdSystemId, router, onClose]);

  // Get the icon for the selected target
  const TargetIcon = selectedTarget ? getProtocolIcon(selectedTarget.protocol) : CloudOff;

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Header */}
      <div className="mb-6 flex flex-shrink-0 items-center gap-4">
        {step === "confirm-name" && (
          <Button variant="ghost" size="icon" onClick={handleBack} className="flex-shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            {step === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <TargetIcon className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <h1 className="font-bold text-xl">
              {step === "success" ? "System Created" : "Connect to Private System"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {step === "select-tunnel" && "Select a connected gateway and target"}
              {step === "confirm-name" && "Confirm the system name"}
              {step === "success" && "Configure documentation and authentication"}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {step === "select-tunnel" && (
          <TunnelSelector
            tunnels={connectedTunnels}
            selectedTunnel={selectedTunnel}
            selectedTarget={selectedTarget}
            onSelectTunnel={handleSelectTunnel}
            onSelectTarget={handleSelectTarget}
            isLoading={tunnelsLoading}
          />
        )}

        {step === "confirm-name" && selectedTunnel && selectedTarget && (
          <div className="space-y-6">
            {/* Target Info */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <TargetIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedTarget.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {selectedTarget.protocol.toUpperCase()} via {selectedTunnel.id}
                  </p>
                </div>
              </div>
            </div>

            {/* System Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name">System Name</Label>
              <Input
                id="name"
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                placeholder="e.g., Internal API, Production Database"
                className="h-10"
                autoFocus
              />
              <p className="text-muted-foreground text-xs">
                A friendly name to identify this system in AmbiOS
              </p>
            </div>

            {/* Create Button */}
            <div className="pt-4">
              <Button
                onClick={handleSubmit}
                disabled={!systemName.trim() || createSystemMutation.isPending}
                className="w-full"
              >
                {createSystemMutation.isPending ? "Creating..." : "Create System"}
              </Button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="mb-2 font-medium text-lg">System Created Successfully</h3>
            <p className="mb-6 max-w-md text-muted-foreground text-sm">
              Your private system has been created. Now configure documentation and authentication
              (like API keys) in the system settings.
            </p>
            <Button onClick={handleViewSystem} className="min-w-[200px]">
              View System Settings
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
