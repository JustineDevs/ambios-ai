"use client";

import type { System } from "@ambios-ai/shared";
import { getSystemAuthStatus } from "@ambios-ai/shared";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SystemActionsMenu } from "@/components/systems/SystemActionsMenu";
import { useSystemPickerModal } from "@/components/systems/SystemPickerModalContext";
import { SystemTemplatePicker } from "@/components/systems/SystemTemplatePicker";
import { Button } from "@/components/ui/button";
import {
  EnterprisePage,
  EnterpriseState,
  EnterpriseSummary,
  Freshness,
} from "@/components/ui/enterprise-page";
import { EnvironmentBadge, type EnvironmentType } from "@/components/ui/environment-label";
import { Input } from "@/components/ui/input";
import { LockedPage } from "@/components/ui/locked-page";
import { SystemIcon } from "@/components/ui/system-icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { createOAuthErrorHandler } from "@/lib/oauth-utils";
import { useInvalidateSystems, useSystems } from "@/queries/systems";

const getAuthLabel = (system: System): string => {
  const status = getSystemAuthStatus(system);

  if (status.authType === "none") {
    return "Not set";
  }

  if (status.authType === "oauth") {
    return "OAuth";
  }

  if (status.authType === "connection_string") {
    return "Connection";
  }

  return "API Key";
};

type SortColumn = "id" | "url" | "updatedAt" | "environment";
type SortDirection = "asc" | "desc";

interface SystemWithEnvInfo extends System {
  envState: EnvironmentType;
  linkedDevSystem?: System;
  linkedProdSystem?: System;
}

export default function SystemsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { systems, loading: initialLoading, isRefreshing, isTunnelConnected, error } = useSystems();
  const { openSystemPicker } = useSystemPickerModal();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const system = searchParams.get("system");
    const message = searchParams.get("message");
    const description = searchParams.get("description");

    if (success === "oauth_completed" && system) {
      toast({
        title: "OAuth Connection Successful",
        description: `Successfully connected to ${system}`,
      });
    } else if (error) {
      const errorMessage = description || message || "Failed to complete OAuth connection";
      const handleOAuthError = createOAuthErrorHandler(system || "unknown", toast);
      handleOAuthError(errorMessage);
    }
  }, [searchParams, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Compute environment state for each system and group linked systems
  const systemsWithEnvInfo = useMemo((): SystemWithEnvInfo[] => {
    if (!systems) return [];

    // With composite key model, systems are linked by having the same ID with different environments
    // Group systems by ID to find linked pairs
    const systemsById = new Map<string, System[]>();
    for (const sys of systems) {
      const existing = systemsById.get(sys.id) || [];
      existing.push(sys);
      systemsById.set(sys.id, existing);
    }

    const result: SystemWithEnvInfo[] = [];
    const processedIds = new Set<string>();

    for (const sys of systems) {
      // Skip if we've already processed this ID (for linked systems, we show the prod one)
      if (processedIds.has(sys.id)) continue;

      const linkedSystems = systemsById.get(sys.id) || [sys];
      const devSystem = linkedSystems.find((s) => s.environment === "dev");
      const prodSystem = linkedSystems.find((s) => s.environment === "prod");

      let envState: EnvironmentType;
      let linkedDevSystem: System | undefined;
      let linkedProdSystem: System | undefined;
      let displaySystem: System;

      // Database constraint ensures environment is always 'dev' or 'prod' (NOT NULL DEFAULT 'prod')
      if (devSystem && prodSystem) {
        envState = "both";
        displaySystem = prodSystem;
        linkedDevSystem = devSystem;
      } else if (prodSystem) {
        envState = "prod";
        displaySystem = prodSystem;
      } else if (devSystem) {
        envState = "dev";
        displaySystem = devSystem;
      } else {
        // Unreachable given DB constraints, but TypeScript needs exhaustive handling
        envState = "prod";
        displaySystem = sys;
      }

      processedIds.add(sys.id);

      result.push({
        ...displaySystem,
        envState,
        linkedDevSystem,
        linkedProdSystem,
      });
    }

    return result;
  }, [systems]);

  const currentSystems = useMemo(() => {
    let filtered = systemsWithEnvInfo.filter((system) => {
      if (!system) return false;

      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        const searchableText = [system.id, system.name, system.url]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!searchableText.includes(searchLower)) return false;
      }
      return true;
    });

    filtered = [...filtered].sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      switch (sortColumn) {
        case "id":
          return dir * (a.name || a.id).localeCompare(b.name || b.id);
        case "url":
          return dir * (a.url || "").localeCompare(b.url || "");
        case "updatedAt":
          return (
            dir *
            (new Date(a.updatedAt || a.createdAt).getTime() -
              new Date(b.updatedAt || b.createdAt).getTime())
          );
        case "environment": {
          const envOrder = { none: 0, dev: 1, prod: 2, both: 3 };
          return dir * (envOrder[a.envState] - envOrder[b.envState]);
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [systemsWithEnvInfo, debouncedSearchTerm, sortColumn, sortDirection]);

  const handleEdit = (system: System) => {
    // Always pass the environment parameter to ensure we edit the correct one
    const envParam = system.environment ? `?env=${system.environment}` : "";
    router.push(`/systems/${encodeURIComponent(system.id)}${envParam}`);
  };

  const handleAdd = () => {
    openSystemPicker();
  };

  const invalidateSystems = useInvalidateSystems();

  const handleRefresh = useCallback(async () => {
    await invalidateSystems();
  }, [invalidateSystems]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection(column === "updatedAt" ? "desc" : "asc");
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  if (initialLoading && systems.length === 0) {
    return (
      <LockedPage>
        <EnterprisePage
          eyebrow="Control plane"
          title="Systems"
          description="Manage the registered runtime endpoints and their environment and authentication posture."
          className="h-full overflow-auto p-8"
        >
          <EnterpriseState
            title="Loading systems"
            description="Retrieving registered system context."
            loading
          />
        </EnterprisePage>
      </LockedPage>
    );
  }

  if (systems.length === 0) {
    return (
      <LockedPage>
        <EnterprisePage
          eyebrow="Control plane"
          title="Systems"
          description="Manage the registered runtime endpoints and their environment and authentication posture."
          className="h-full overflow-auto p-8"
        >
          {error ? (
            <EnterpriseState
              tone="danger"
              title="Systems unavailable"
              description={
                error instanceof Error ? error.message : "The systems catalog could not be loaded."
              }
              action={
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                  Retry
                </Button>
              }
            />
          ) : (
            <SystemTemplatePicker showHeader={true} className="min-h-[320px]" />
          )}
        </EnterprisePage>
      </LockedPage>
    );
  }

  return (
    <LockedPage>
      <EnterprisePage
        eyebrow="Control plane"
        title="Systems"
        description="Manage the registered runtime endpoints and their environment and authentication posture."
        className="h-full overflow-hidden p-8"
        actions={
          <Button className="rounded-xl" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add System
          </Button>
        }
      >
        <EnterpriseSummary
          items={[
            {
              label: "Registered systems",
              value: systemsWithEnvInfo.length,
              detail: "Environment-aware records",
            },
            {
              label: "Search results",
              value: currentSystems.length,
              detail: "Current filters applied",
            },
            {
              label: "Private systems",
              value: systemsWithEnvInfo.filter((system) => Boolean(system.tunnel)).length,
              detail: "Tunnel-backed endpoints",
            },
            {
              label: "Catalog status",
              value: error ? "Degraded" : "Available",
              detail: error ? "Showing last known data" : "Read-only catalog view",
              tone: error ? "warning" : "success",
            },
          ]}
        />
        <div className="flex flex-shrink-0 items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            Review endpoint ownership, environment coverage, and auth readiness.
          </p>
          <Freshness updatedAt="Live query" onRefresh={handleRefresh} loading={isRefreshing} />
        </div>
        {error && (
          <EnterpriseState
            tone="warning"
            title="Systems data may be stale"
            description={
              error instanceof Error ? error.message : "The latest systems refresh failed."
            }
            action={
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                Retry
              </Button>
            }
          />
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="mb-4 flex flex-shrink-0 flex-wrap gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search
                className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                aria-label="Search systems by ID or endpoint"
                placeholder="Search by ID or endpoint..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto rounded-lg border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead className="w-[60px]" />
                  {(["id", "url", "environment"] as const).map((column) => {
                    const labels = {
                      id: "System Name",
                      url: "System Endpoint",
                      environment: "Environments",
                    };
                    return (
                      <TableHead key={column} className="p-0">
                        <button
                          type="button"
                          className="flex w-full items-center px-4 py-3 text-left font-medium hover:bg-muted/50"
                          onClick={() => handleSort(column)}
                          aria-label={`Sort by ${labels[column]}`}
                        >
                          {labels[column]}
                          <SortIcon column={column} />
                        </button>
                      </TableHead>
                    );
                  })}
                  <TableHead>Auth</TableHead>
                  <TableHead className="p-0">
                    <button
                      type="button"
                      className="flex w-full items-center px-4 py-3 text-left font-medium hover:bg-muted/50"
                      onClick={() => handleSort("updatedAt")}
                      aria-label="Sort by updated date"
                    >
                      Updated At
                      <SortIcon column="updatedAt" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      type="button"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      aria-label="Refresh systems"
                      title="Refresh systems"
                      className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-muted/50 disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`}
                        aria-hidden="true"
                      />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentSystems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <EnterpriseState
                        title="No matching systems"
                        description="Adjust the search to view registered systems."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  currentSystems.map((sys) => {
                    const authLabel = getAuthLabel(sys);

                    return (
                      <TableRow key={`${sys.id}-${sys.environment}`} className="hover:bg-secondary">
                        <TableCell className="w-[60px]">
                          <div className="flex items-center justify-center">
                            <SystemIcon system={sys} size={16} />
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] font-medium">
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="min-w-0 truncate">{sys.name || sys.id}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{sys.name || sys.id}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {sys.tunnel && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded bg-muted/50 px-1.5 py-0.5 font-medium text-muted-foreground text-xs">
                                      <Shield className="h-3 w-3" aria-hidden="true" />
                                      <span
                                        className={`h-1.5 w-1.5 rounded-full ${isTunnelConnected(sys.tunnel.tunnelId) ? "bg-green-500" : "bg-gray-400"}`}
                                        aria-hidden="true"
                                      />
                                      <span className="sr-only">
                                        Private system,{" "}
                                        {isTunnelConnected(sys.tunnel.tunnelId)
                                          ? "connected"
                                          : "disconnected"}
                                      </span>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      Private System ({sys.tunnel.tunnelId}) -{" "}
                                      {isTunnelConnected(sys.tunnel.tunnelId)
                                        ? "Connected"
                                        : "Disconnected"}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <span className="block truncate text-muted-foreground text-sm">
                            {sys.url || "No API endpoint"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <EnvironmentBadge type={sys.envState} />
                        </TableCell>
                        <TableCell>
                          <span className="whitespace-nowrap text-muted-foreground text-xs">
                            {authLabel}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                          {sys.updatedAt
                            ? new Date(sys.updatedAt).toLocaleDateString()
                            : sys.createdAt
                              ? new Date(sys.createdAt).toLocaleDateString()
                              : "-"}
                        </TableCell>
                        <TableCell className="w-[180px]">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="glass"
                              size="sm"
                              onClick={() => handleEdit(sys)}
                              className="gap-2"
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                              Edit
                            </Button>
                            <SystemActionsMenu system={sys} />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </EnterprisePage>
    </LockedPage>
  );
}
