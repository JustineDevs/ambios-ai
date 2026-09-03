"use client";

import type { System } from "@ambios-ai/shared";
import { AlertTriangle, Hammer, MoreVertical, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useAgentModal } from "@/components/agent/AgentModalContext";
import { useToast } from "@/hooks/use-toast";
import { getToolBuilderPrompts } from "@/lib/agent/agent-context";
import { cn } from "@/lib/general-utils";
import { useDeleteSystem, useSystems } from "@/queries/systems";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface SystemActionsMenuProps {
  system: System;
  onDeleted?: () => void;
  disabled?: boolean;
  showLabel?: boolean;
}

export function SystemActionsMenu({
  system,
  onDeleted,
  disabled = false,
  showLabel = false,
}: SystemActionsMenuProps) {
  const { openAgentModal } = useAgentModal();
  const { toast } = useToast();
  const { systems } = useSystems();
  const deleteSystem = useDeleteSystem();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Check for linked systems (same ID, different environment)
  const linkedDevSystem = useMemo(() => {
    return systems.find((s) => s.id === system.id && s.environment === "dev") || null;
  }, [systems, system.id]);

  const linkedProdSystem = useMemo(() => {
    return systems.find((s) => s.id === system.id && s.environment === "prod") || null;
  }, [systems, system.id]);

  const isLinkedProd = system.environment === "prod" && !!linkedDevSystem;
  const isLinkedDev = system.environment === "dev" && !!linkedProdSystem;

  const handleBuildTool = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prompts = getToolBuilderPrompts({ systemIds: [system.id], systems: [system] });
    openAgentModal(prompts);
  };

  const handleDelete = async () => {
    try {
      // If this is a linked prod system, delete the dev system first
      if (isLinkedProd && linkedDevSystem) {
        await deleteSystem.mutateAsync({
          id: linkedDevSystem.id,
          options: { environment: linkedDevSystem.environment },
        });
      }

      // Delete the current system with its environment
      await deleteSystem.mutateAsync({
        id: system.id,
        options: { environment: system.environment },
      });
      onDeleted?.();
    } catch (error) {
      console.error("Error deleting system:", error);
      toast({
        title: "Error",
        description: "Failed to delete system",
        variant: "destructive",
      });
    }
  };

  const getDeleteDialogContent = () => {
    if (isLinkedProd) {
      return {
        title: "Delete Production System?",
        description: (
          <div className="space-y-3">
            <p>
              This production system has a linked development system:{" "}
              <span className="font-medium">{linkedDevSystem?.name || linkedDevSystem?.id}</span>
            </p>
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-amber-700 text-sm dark:text-amber-400">
                Deleting this production system will also delete its linked development system. This
                action cannot be undone.
              </p>
            </div>
          </div>
        ),
        actionLabel: "Delete Both Systems",
      };
    }

    if (isLinkedDev) {
      return {
        title: "Delete Development System?",
        description: (
          <p>
            This will delete the development system "{system.name || system.id}". The linked
            production system ({linkedProdSystem?.name || linkedProdSystem?.id}) will remain and
            become a standalone production system.
          </p>
        ),
        actionLabel: "Delete Dev System",
      };
    }

    return {
      title: "Delete System?",
      description: (
        <p>
          Are you sure you want to delete the system "{system.name || system.id}"? This action
          cannot be undone.
        </p>
      ),
      actionLabel: "Delete",
    };
  };

  const dialogContent = getDeleteDialogContent();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="glass"
            size={showLabel ? "sm" : "icon"}
            disabled={disabled}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "rounded-xl border-none shadow-none",
              showLabel && "h-8 gap-1.5 text-muted-foreground hover:text-foreground",
            )}
          >
            <MoreVertical className={showLabel ? "h-3.5 w-3.5" : "h-4 w-4"} />
            {showLabel && <span className="text-xs">More</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={handleBuildTool}>
            <Hammer className="mr-2 h-4 w-4" />
            Build Tool
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>{dialogContent.description}</div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await handleDelete();
                setDeleteDialogOpen(false);
              }}
              className={isLinkedProd ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {dialogContent.actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
