"use client";

import { getToolSystemIds } from "@ambios-ai/shared";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  Hammer,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Upload,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAgentModal } from "@/components/agent/AgentModalContext";

import { DeployButton } from "@/components/tools/deploy/DeployButton";
import { FolderSelector, useFolderFilter } from "@/components/tools/folders/FolderSelector";
import { InlineFolderPicker } from "@/components/tools/folders/InlineFolderPicker";
import { ImportToolsDialog, useImportTools } from "@/components/tools/ImportToolsButton";
import { CopyButton } from "@/components/tools/shared/CopyButton";
import { ToolActionsMenu } from "@/components/tools/ToolActionsMenu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EnterprisePage, EnterpriseState, Freshness } from "@/components/ui/enterprise-page";
import { Input } from "@/components/ui/input";
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
import { getToolBuilderPrompts } from "@/lib/agent/agent-context";
import { ambiosWebMCPTools } from "@/lib/webmcp/register";
import { useSystems } from "@/queries/systems";
import { useInvalidateTools, useToolsIncludingArchived } from "@/queries/tools";

type SortColumn = "id" | "folder" | "instruction" | "updatedAt";
type SortDirection = "asc" | "desc";

const ToolsTable = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tools, isInitiallyLoading, isRefreshing } = useToolsIncludingArchived();
  const { systems, loading: systemsLoading } = useSystems();
  const { openAgentModal, registerOnClose } = useAgentModal();

  const invalidateTools = useInvalidateTools();
  const importTools = useImportTools({ onImportComplete: () => invalidateTools() });

  const systemParam = searchParams.get("system");
  const systemsParam = searchParams.get("systems");
  const systemIdsFromUrl = useMemo(() => {
    if (systemsParam) {
      return systemsParam
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
    }
    if (systemParam) {
      return [systemParam.trim()].filter(Boolean);
    }
    return [];
  }, [systemParam, systemsParam]);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const { selectedFolder, setSelectedFolder, filteredByFolder } = useFolderFilter(tools);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Memoize filtered and sorted configs
  const currentConfigs = useMemo(() => {
    let filtered = filteredByFolder.filter((config) => {
      if (!config) return false;

      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        // Only search relevant fields instead of entire object
        const searchableText = [config.id, config.folder, config.instruction]
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
          return dir * a.id.localeCompare(b.id);
        case "folder":
          return dir * (a.folder || "").localeCompare(b.folder || "");
        case "instruction":
          return dir * (a.instruction || "").localeCompare(b.instruction || "");
        case "updatedAt":
          return (
            dir *
            (new Date(a.updatedAt || a.createdAt).getTime() -
              new Date(b.updatedAt || b.createdAt).getTime())
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [filteredByFolder, debouncedSearchTerm, sortColumn, sortDirection]);

  const refreshConfigs = useCallback(() => {
    invalidateTools();
  }, [invalidateTools]);

  const openToolBuilderModal = useCallback(
    (systemIds?: string[]) => {
      const prompts = getToolBuilderPrompts({ systemIds, systems });
      openAgentModal(prompts);
    },
    [openAgentModal, systems],
  );

  const handleTool = useCallback(() => {
    openToolBuilderModal();
  }, [openToolBuilderModal]);

  const handlePlayTool = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // Navigate to the tool page, passing the ID. The user can then run it.
    router.push(`/tools/${encodeURIComponent(id)}`);
  };

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

  const autoOpenedRef = useRef(false);
  useEffect(() => {
    if (autoOpenedRef.current) return;
    if (systemIdsFromUrl.length === 0) return;
    if (systemsLoading) return;

    autoOpenedRef.current = true;
    openToolBuilderModal(systemIdsFromUrl);

    const unregister = registerOnClose(() => {
      router.replace("/tools");
    });

    return unregister;
  }, [
    systemsLoading,
    openToolBuilderModal,
    registerOnClose,
    router,
    systemIdsFromUrl.length,
    systemIdsFromUrl,
  ]);

  return (
    <EnterprisePage
      eyebrow="Control plane"
      title="WebMCP tool registry"
      description="Review the executable tool catalog, ownership context, and deployment posture without executing a tool."
      className="h-full overflow-hidden p-8"
      showContext={false}
      actions={
        <div className="flex gap-2">
          <input
            ref={importTools.fileInputRef}
            type="file"
            accept=".json"
            onChange={importTools.handleFileSelect}
            className="hidden"
          />
          <DropdownMenu>
            <div className="flex">
              <Button className="rounded-xl rounded-r-none" onClick={handleTool}>
                <Plus className="mr-2 h-4 w-4" />
                Create
              </Button>
              <DropdownMenuTrigger asChild>
                <Button
                  className="rounded-xl rounded-l-none border-l-0 px-2"
                  aria-label="Open tool actions"
                >
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
            </div>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={importTools.triggerImport}>
                <Upload className="mr-2 h-4 w-4" />
                Import from JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    >
      <div className="flex flex-shrink-0 items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          Inspect tool definitions and open a detail view when you need to review execution context.
        </p>
        <Freshness updatedAt="Live query" onRefresh={refreshConfigs} loading={isRefreshing} />
      </div>
      <ImportToolsDialog
        isOpen={importTools.isDialogOpen}
        onClose={importTools.handleClose}
        isImporting={importTools.isImporting}
        validationResult={importTools.validationResult}
        importTools={importTools.importTools}
        importSystems={importTools.importSystems}
        onToolSelectionChange={importTools.handleToolSelectionChange}
        onToolResolutionChange={importTools.handleToolResolutionChange}
        onSystemSelectionChange={importTools.handleSystemSelectionChange}
        onSystemResolutionChange={importTools.handleSystemResolutionChange}
        onImport={importTools.handleImport}
        selectedToolCount={importTools.selectedToolCount}
        selectedSystemCount={importTools.selectedSystemCount}
        hasSelection={importTools.hasSelection}
      />

      <div className="mb-4 flex flex-shrink-0 flex-wrap gap-3">
        <FolderSelector
          tools={tools}
          selectedFolder={selectedFolder}
          onFolderChange={setSelectedFolder}
        />
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            aria-label="Search tools by ID or details"
            placeholder="Search by ID or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {currentConfigs.length === 0 && ambiosWebMCPTools.length > 0 && (
          <section className="pb-4" aria-label="Mounted WebMCP contracts">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="font-medium">Mounted WebMCP contracts</h2>
                <p className="mt-1 text-muted-foreground text-xs">
                  Browser tools registered by the authenticated AmbiOS runtime. Provider
                  availability is enforced at execution.
                </p>
              </div>
              <span className="text-muted-foreground text-xs">
                {ambiosWebMCPTools.length} contract definitions
              </span>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {ambiosWebMCPTools.map((tool) => (
                <div className="rounded-lg bg-muted/30 p-3" key={tool.name}>
                  <code className="font-medium text-xs">{tool.name}</code>
                  <p className="mt-1 text-muted-foreground text-xs">{tool.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead className="w-[60px]" />
              {(
                [
                  ["id", "ID"],
                  ["folder", "Folder"],
                  ["instruction", "Instructions"],
                  ["updatedAt", "Updated At"],
                ] as const
              ).map(([column, label]) => (
                <TableHead key={column} className="p-0">
                  <button
                    type="button"
                    className="flex w-full items-center px-4 py-3 text-left font-medium hover:bg-muted/50"
                    onClick={() => handleSort(column)}
                    aria-label={`Sort by ${label}`}
                  >
                    {label}
                    <SortIcon column={column} />
                  </button>
                </TableHead>
              ))}
              <TableHead className="text-right">
                <button
                  type="button"
                  onClick={refreshConfigs}
                  disabled={isRefreshing}
                  className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-md transition-colors hover:bg-muted/50 disabled:opacity-50"
                  title="Refresh Tools"
                  aria-label="Refresh tools"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isInitiallyLoading && tools.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="inline-block h-6 w-6 animate-spin text-foreground" />
                </TableCell>
              </TableRow>
            ) : currentConfigs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <EnterpriseState
                    title={selectedFolder !== "all" ? "No tools in this folder" : "No tools found"}
                    description={
                      selectedFolder !== "all"
                        ? "Choose another folder or show all tools."
                        : "Create or import a tool definition to populate the catalog."
                    }
                  />
                  {selectedFolder !== "all" && (
                    <div className="mt-2">
                      {selectedFolder !== "all" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedFolder("all")}
                        >
                          Show all tools
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              currentConfigs.map((tool) => {
                const systemIdsArray = getToolSystemIds(tool);

                return (
                  <TableRow key={tool.id} className="hover:bg-secondary">
                    <TableCell className="w-[60px]">
                      {systemIdsArray.length > 0 ? (
                        <div className="flex flex-shrink-0 items-center justify-center gap-1">
                          {systemIdsArray.map((systemId: string) => {
                            const system = systems.find((s) => s.id === systemId);
                            if (!system) return null;
                            return (
                              <TooltipProvider key={systemId}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span>
                                      <SystemIcon system={system} size={14} />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{system.name || system.id}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="group relative max-w-[200px] truncate font-medium">
                      <div className="flex items-center space-x-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate">{tool.id}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{tool.id}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <div className="opacity-0 transition-opacity group-hover:opacity-100">
                          <CopyButton text={tool.id} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-[200px] min-w-[200px] max-w-[400px]">
                      <InlineFolderPicker tool={tool} />
                    </TableCell>
                    <TableCell className="group relative max-w-[300px] truncate">
                      <div className="flex items-center space-x-1">
                        <span className="truncate">{tool.instruction}</span>
                        {tool.instruction && (
                          <div className="opacity-0 transition-opacity group-hover:opacity-100">
                            <CopyButton text={tool.instruction} />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="w-[150px]">
                      {tool.updatedAt
                        ? new Date(tool.updatedAt).toLocaleDateString()
                        : tool.createdAt
                          ? new Date(tool.createdAt).toLocaleDateString()
                          : ""}
                    </TableCell>
                    <TableCell className="w-[140px]">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={(e) => handlePlayTool(e, tool.id)}
                          className="gap-2"
                        >
                          <Hammer className="h-4 w-4" />
                          View
                        </Button>
                        {!tool.archived && <DeployButton tool={tool} className="gap-2" />}
                        <ToolActionsMenu tool={tool} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </EnterprisePage>
  );
};

export default ToolsTable;
