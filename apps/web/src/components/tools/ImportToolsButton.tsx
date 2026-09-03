import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useOrg } from "@/app/org-context";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryKeys } from "@/queries/query-keys";
import { useSystems } from "@/queries/systems";
import { useTools } from "@/queries/tools";
import { useAmbiOSClient } from "@/queries/use-client";
import {
  type ConflictResolution,
  generateUniqueId,
  generateUniqueSystemId,
  type ImportSystemItem,
  type ImportToolItem,
  type ImportValidationResult,
  validateImportData,
} from "./import-export-utils";

interface UseImportToolsOptions {
  onImportComplete?: () => void;
}

export function useImportTools({ onImportComplete }: UseImportToolsOptions = {}) {
  const { orgId } = useOrg();
  const { tools } = useTools();
  const { systems } = useSystems();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createClient = useAmbiOSClient();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [importTools, setImportTools] = useState<ImportToolItem[]>([]);
  const [importSystems, setImportSystems] = useState<ImportSystemItem[]>([]);

  const handleClose = useCallback(() => {
    setIsDialogOpen(false);
    setValidationResult(null);
    setImportTools([]);
    setImportSystems([]);
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        const result = validateImportData(data, tools, systems);
        setValidationResult(result);
        setImportTools(result.tools);
        setImportSystems(result.systems);
        setIsDialogOpen(true);
      } catch (error) {
        toast({
          title: "Invalid JSON file",
          description: error instanceof Error ? error.message : "Could not parse the file",
          variant: "destructive",
        });
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [tools, systems, toast],
  );

  const triggerImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleToolSelectionChange = useCallback((index: number, selected: boolean) => {
    setImportTools((prev) => prev.map((item, i) => (i === index ? { ...item, selected } : item)));
  }, []);

  const handleToolResolutionChange = useCallback(
    (index: number, resolution: ConflictResolution) => {
      setImportTools((prev) =>
        prev.map((item, i) => {
          if (i !== index) return item;
          const newId =
            resolution === "rename"
              ? generateUniqueId(
                  item.tool.id,
                  tools.map((t) => t.id),
                )
              : undefined;
          return { ...item, resolution, newId };
        }),
      );
    },
    [tools],
  );

  const handleSystemSelectionChange = useCallback((index: number, selected: boolean) => {
    setImportSystems((prev) => prev.map((item, i) => (i === index ? { ...item, selected } : item)));
  }, []);

  const handleSystemResolutionChange = useCallback(
    (index: number, resolution: ConflictResolution) => {
      setImportSystems((prev) =>
        prev.map((item, i) => {
          if (i !== index) return item;
          const newId =
            resolution === "rename"
              ? generateUniqueSystemId(item.system.id, item.system.environment, systems)
              : undefined;
          return { ...item, resolution, newId };
        }),
      );
    },
    [systems],
  );

  const handleImport = useCallback(async () => {
    setIsImporting(true);

    try {
      const client = createClient();

      const selectedSystems = importSystems.filter((s) => s.selected && s.resolution !== "skip");
      for (const item of selectedSystems) {
        const systemId = item.resolution === "rename" ? item.newId! : item.system.id;
        const systemData = { ...item.system, id: systemId };
        // Preserve environment from import, default to undefined (which means prod/standalone)
        const environment = item.system.environment;

        if (item.resolution === "overwrite" && item.conflict) {
          // For overwrite, we need to update the system with matching environment
          await client.updateSystem(systemId, systemData, { environment });
        } else {
          await client.createSystem({
            id: systemId,
            name: systemData.name || systemId,
            url: systemData.url || "",
            credentials: systemData.credentials,
            specificInstructions: systemData.specificInstructions,
            icon: systemData.icon,
            metadata: systemData.metadata,
            templateName: systemData.templateName,
            environment,
          });
        }
      }

      const selectedTools = importTools.filter((t) => t.selected && t.resolution !== "skip");
      for (const item of selectedTools) {
        const toolId = item.resolution === "rename" ? item.newId! : item.tool.id;
        const toolData = {
          ...item.tool,
          id: toolId,
          archived: false,
        };

        await client.upsertWorkflow(toolId, toolData as any);
      }

      const importedCount = selectedTools.length + selectedSystems.length;
      toast({
        title: `Imported ${importedCount} item${importedCount !== 1 ? "s" : ""}`,
        description: `${selectedTools.length} tool${selectedTools.length !== 1 ? "s" : ""}, ${selectedSystems.length} system${selectedSystems.length !== 1 ? "s" : ""}`,
      });

      await queryClient.invalidateQueries({ queryKey: queryKeys.tools.all(orgId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.systems.all(orgId) });
      onImportComplete?.();
      handleClose();
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "An error occurred during import",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  }, [
    createClient,
    importSystems,
    importTools,
    toast,
    queryClient,
    orgId,
    onImportComplete,
    handleClose,
  ]);

  const selectedToolCount = importTools.filter((t) => t.selected && t.resolution !== "skip").length;
  const selectedSystemCount = importSystems.filter(
    (s) => s.selected && s.resolution !== "skip",
  ).length;
  const hasSelection = selectedToolCount > 0 || selectedSystemCount > 0;

  return {
    triggerImport,
    fileInputRef,
    handleFileSelect,
    isDialogOpen,
    handleClose,
    isImporting,
    validationResult,
    importTools,
    importSystems,
    handleToolSelectionChange,
    handleToolResolutionChange,
    handleSystemSelectionChange,
    handleSystemResolutionChange,
    handleImport,
    selectedToolCount,
    selectedSystemCount,
    hasSelection,
  };
}

interface ImportToolsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isImporting: boolean;
  validationResult: ImportValidationResult | null;
  importTools: ImportToolItem[];
  importSystems: ImportSystemItem[];
  onToolSelectionChange: (index: number, selected: boolean) => void;
  onToolResolutionChange: (index: number, resolution: ConflictResolution) => void;
  onSystemSelectionChange: (index: number, selected: boolean) => void;
  onSystemResolutionChange: (index: number, resolution: ConflictResolution) => void;
  onImport: () => void;
  selectedToolCount: number;
  selectedSystemCount: number;
  hasSelection: boolean;
}

export function ImportToolsDialog({
  isOpen,
  onClose,
  isImporting,
  validationResult,
  importTools,
  importSystems,
  onToolSelectionChange,
  onToolResolutionChange,
  onSystemSelectionChange,
  onSystemResolutionChange,
  onImport,
  selectedToolCount,
  selectedSystemCount,
  hasSelection,
}: ImportToolsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="flex max-h-[80vh] max-w-2xl flex-col overflow-hidden shadow-2xl shadow-black/20"
        overlayClassName="bg-background/60 backdrop-blur-sm"
      >
        <DialogHeader>
          <DialogTitle>Import Tools</DialogTitle>
          <DialogDescription>Review and select items to import</DialogDescription>
        </DialogHeader>

        {validationResult && !validationResult.valid && (
          <div className="rounded-md border border-red-600/50 bg-red-600/10 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
              <div className="space-y-1">
                <p className="font-medium text-red-600 text-sm">Validation errors</p>
                <ul className="list-inside list-disc text-muted-foreground text-xs">
                  {validationResult.errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 space-y-4 overflow-y-auto py-2">
          {importTools.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Tools ({importTools.length})</h4>
              <div className="space-y-2">
                {importTools.map((item, index) => (
                  <ImportItemRow
                    key={item.tool.id}
                    id={item.tool.id}
                    name={item.tool.name}
                    type="tool"
                    selected={item.selected}
                    conflict={item.conflict}
                    resolution={item.resolution}
                    newId={item.newId}
                    onSelectionChange={(selected) => onToolSelectionChange(index, selected)}
                    onResolutionChange={(resolution) => onToolResolutionChange(index, resolution)}
                  />
                ))}
              </div>
            </div>
          )}

          {importSystems.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Systems ({importSystems.length})</h4>
              <div className="space-y-2">
                {importSystems.map((item, index) => (
                  <ImportItemRow
                    key={`${item.system.id}-${item.system.environment || "prod"}`}
                    id={item.system.id}
                    name={item.system.name}
                    type="system"
                    environment={item.system.environment}
                    selected={item.selected}
                    conflict={item.conflict}
                    resolution={item.resolution}
                    newId={item.newId}
                    onSelectionChange={(selected) => onSystemSelectionChange(index, selected)}
                    onResolutionChange={(resolution) => onSystemResolutionChange(index, resolution)}
                  />
                ))}
              </div>
            </div>
          )}

          {importTools.length === 0 && importSystems.length === 0 && validationResult?.valid && (
            <p className="py-4 text-center text-muted-foreground text-sm">
              No items found in the import file
            </p>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="mr-auto flex items-center gap-2 text-muted-foreground text-sm">
            {hasSelection && (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {selectedToolCount} tool{selectedToolCount !== 1 ? "s" : ""}, {selectedSystemCount}{" "}
                system{selectedSystemCount !== 1 ? "s" : ""} selected
              </>
            )}
          </div>
          <Button variant="glass" onClick={onClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button
            variant="glass-primary"
            onClick={onImport}
            disabled={!hasSelection || isImporting || !validationResult?.valid}
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ImportItemRowProps {
  id: string;
  name?: string;
  type: "tool" | "system";
  environment?: "dev" | "prod";
  selected: boolean;
  conflict: boolean;
  resolution: ConflictResolution;
  newId?: string;
  onSelectionChange: (selected: boolean) => void;
  onResolutionChange: (resolution: ConflictResolution) => void;
}

function ImportItemRow({
  id,
  name,
  environment,
  selected,
  conflict,
  resolution,
  newId,
  onSelectionChange,
  onResolutionChange,
}: ImportItemRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-md border bg-card p-2">
      <Checkbox
        checked={selected}
        onCheckedChange={(checked) => onSelectionChange(checked === true)}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-mono text-sm">{id}</span>
          {environment && (
            <span
              className={`rounded px-1.5 py-0.5 text-xs ${
                environment === "dev"
                  ? "bg-yellow-500/20 text-yellow-600"
                  : "bg-green-500/20 text-green-600"
              }`}
            >
              {environment}
            </span>
          )}
          {name && name !== id && (
            <span className="truncate text-muted-foreground text-xs">({name})</span>
          )}
          {conflict && (
            <span className="flex items-center gap-1 text-xs text-yellow-600">
              <AlertTriangle className="h-3 w-3" />
              exists
            </span>
          )}
        </div>
        {resolution === "rename" && newId && (
          <p className="text-muted-foreground text-xs">
            Will be imported as: <span className="font-mono">{newId}</span>
          </p>
        )}
      </div>
      {conflict && selected && (
        <Select
          value={resolution}
          onValueChange={(value) => onResolutionChange(value as ConflictResolution)}
        >
          <SelectTrigger className="h-8 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="skip">Skip</SelectItem>
            <SelectItem value="overwrite">Overwrite</SelectItem>
            <SelectItem value="rename">Rename</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
