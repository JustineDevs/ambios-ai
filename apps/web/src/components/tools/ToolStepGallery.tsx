import {
  isRequestConfig,
  isTransformConfig,
  type RequestStepConfig,
  type Tool,
} from "@ambios-ai/shared";
import {
  Blocks,
  ChevronLeft,
  ChevronRight,
  Code2,
  FileJson,
  OctagonAlert,
  Plus,
  RotateCw,
  Zap,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useEnvironment } from "@/app/environment-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EnvironmentBadge } from "@/components/ui/environment-label";
import { MiniCard, StatusIndicator, TriggerCard } from "@/components/ui/mini-card";
import { SystemIcon } from "@/components/ui/system-icon";
import { buildPreviousStepResults, cn } from "@/lib/general-utils";
import { buildCategorizedSources } from "@/lib/templating-utils";
import { useRightSidebar } from "../sidebar/RightSidebarContext";
import { FinalTransformMiniStepCard, type TransformItem } from "./cards/FinalTransformCard";
import { type PayloadItem, PayloadMiniStepCard } from "./cards/PayloadCard";
import { SpotlightStepCard, type StepItem } from "./cards/SpotlightStepCard";
import { TriggersCard } from "./cards/TriggersCard";
import { useExecution, useToolConfig } from "./context";
import { useGalleryNavigation } from "./hooks/use-gallery-navigation";
import { InstructionDisplay } from "./shared/InstructionDisplay";
import { UnsavedChangesCard } from "./UnsavedChangesCard";

const RUNNING_STATUS = {
  text: "Running",
  color: "text-amber-600 dark:text-amber-400",
  dotColor: "bg-amber-600 dark:bg-amber-400",
  animate: true,
} as const;

export type ToolItem = PayloadItem | StepItem | TransformItem;

export interface ToolStepGalleryProps {
  onStepEdit?: (stepId: string, updatedStep: any, isUserInitiated?: boolean) => void;
  onExecuteStep?: (stepIndex: number) => Promise<void>;
  onExecuteStepWithLimit?: (stepIndex: number, limit: number) => Promise<void>;
  onExecuteTransform?: (schema: string, transform: string) => Promise<void>;
  onAbort?: () => void;

  onFilesUpload?: (files: File[]) => Promise<void>;
  onFileRemove?: (key: string) => void;

  // UI-specific props
  toolActionButtons?: React.ReactNode;
  headerActions?: React.ReactNode;
  navigateToFinalSignal?: number;
  showStepOutputSignal?: number;
  focusStepId?: string | null;
  isProcessingFiles?: boolean;
  totalFileSize?: number;
  isPayloadValid?: boolean;
  embedded?: boolean;
  // Unsaved changes props
  savedTool?: Tool | null;
}

export function ToolStepGallery({
  onStepEdit: originalOnStepEdit,
  onExecuteStep,
  onExecuteStepWithLimit,
  onExecuteTransform,
  onAbort,
  onFilesUpload,
  onFileRemove,
  toolActionButtons,
  headerActions,
  navigateToFinalSignal,
  showStepOutputSignal,
  focusStepId,
  isProcessingFiles,
  totalFileSize,
  isPayloadValid = true,
  embedded = false,
  savedTool,
}: ToolStepGalleryProps) {
  // === CONTEXT ===
  const {
    tool,
    steps,
    payload,
    systems,
    inputSchema,
    outputSchema,
    outputTransform,
    responseFilters,
    setSteps,
    setInstruction,
    isPayloadReferenced,
    hasUnsavedChanges,
  } = useToolConfig();

  const {
    isExecutingAny,
    currentExecutingStepIndex,
    finalResult,
    transformStatus,
    stepResultsMap,
    isRunningTransform,
    isFixingTransform,
    getStepStatusInfo,
  } = useExecution();

  const { mode: environmentMode } = useEnvironment();

  // === DERIVED VALUES FROM CONTEXT ===
  const toolId = tool.id;
  const instruction = tool.instruction;
  const payloadText = payload.manualPayloadText;
  const computedPayload = payload.computedPayload || {};
  const filePayloads = payload.filePayloads;
  const hasTransformCompleted = transformStatus === "completed";
  const hasTransformFailed = transformStatus === "failed";
  const isSavedTool = toolId && !toolId.startsWith("draft_") && toolId !== "new";

  // Build current tool for diff comparison
  const currentTool = useMemo((): Tool => {
    let parsedInputSchema = null;
    let parsedOutputSchema = null;
    try {
      if (inputSchema) parsedInputSchema = JSON.parse(inputSchema);
    } catch {
      // Invalid JSON
    }
    try {
      if (outputSchema) parsedOutputSchema = JSON.parse(outputSchema);
    } catch {
      // Invalid JSON
    }
    return {
      id: toolId,
      steps,
      inputSchema: parsedInputSchema,
      outputSchema: parsedOutputSchema,
      outputTransform,
      instruction,
      folder: tool.folder,
      archived: tool.isArchived,
      responseFilters: responseFilters.length > 0 ? responseFilters : undefined,
    } as Tool;
  }, [
    toolId,
    steps,
    inputSchema,
    outputSchema,
    outputTransform,
    instruction,
    tool.folder,
    tool.isArchived,
    responseFilters,
  ]);

  // Parse manual payload for categorized sources (memoized)
  const manualPayload = useMemo(() => {
    try {
      return JSON.parse(payloadText || "{}");
    } catch {
      return {};
    }
  }, [payloadText]);

  // === LOCAL STATE ===
  const [hiddenLeftCount, setHiddenLeftCount] = useState(0);
  const [hiddenRightCount, setHiddenRightCount] = useState(0);
  const [activeStepItemCount, setActiveStepItemCount] = useState<number | null>(null);

  // === AGENT SIDEBAR ===
  const { sendMessageToAgent } = useRightSidebar();

  // === TOOL ITEMS ===
  const toolItems = useMemo((): ToolItem[] => {
    const items: ToolItem[] = [];

    // Payload
    items.push({
      type: "payload",
      data: { payloadText, inputSchema },
      stepResult: undefined,
      transformError: undefined,
      categorizedSources: buildCategorizedSources({
        manualPayload,
        filePayloads: filePayloads || {},
      }),
    } as PayloadItem);

    // Steps
    steps.forEach((step, index) => {
      items.push({
        type: "step",
        data: step,
        stepResult: stepResultsMap[step.id],
        transformError: undefined,
        categorizedSources: buildCategorizedSources({
          manualPayload,
          filePayloads: filePayloads || {},
          previousStepResults: buildPreviousStepResults(steps, stepResultsMap, index - 1),
        }),
      } as StepItem);
    });

    // Transform
    if (outputTransform !== undefined) {
      items.push({
        type: "transform",
        data: { transform: outputTransform, outputSchema: outputSchema },
        stepResult: finalResult,
        transformError: hasTransformFailed ? stepResultsMap.__final_transform__ : null,
        hasTransformCompleted,
        categorizedSources: buildCategorizedSources({
          manualPayload,
          filePayloads: filePayloads || {},
          previousStepResults: buildPreviousStepResults(steps, stepResultsMap, steps.length - 1),
        }),
      } as TransformItem);
    }

    return items;
  }, [
    payloadText,
    inputSchema,
    steps,
    stepResultsMap,
    outputTransform,
    outputSchema,
    finalResult,
    hasTransformCompleted,
    hasTransformFailed,
    manualPayload,
    filePayloads,
  ]);

  // Trigger is separate from navigation - it's a visual prefix to the first card
  const [showTriggerContent, setShowTriggerContent] = useState(false);

  // Item count is now dynamic based on toolItems
  const itemCount = toolItems.length;

  // Calculate initial index - start at first step if valid, otherwise payload
  const initialNavIndex = useMemo(() => {
    if (steps.length > 0 && isPayloadValid) {
      return 1; // first step
    }
    return 0; // payload
  }, [steps.length, isPayloadValid]);

  // === NAVIGATION ===
  const {
    activeIndex,
    setActiveIndex,
    navigateToIndex,
    handleNavigation,
    handleCardClick,
    listRef,
    scrollContainerRef,
    containerWidth,
    isHydrated,
    isNavigatingRef,
    isConfiguratorEditing,
    setIsConfiguratorEditing,
  } = useGalleryNavigation({
    initialIndex: initialNavIndex,
    itemCount,
    embedded,
  });

  const handleDataSelectorChange = useCallback((itemCount: number | null, _isInitial: boolean) => {
    setActiveStepItemCount(itemCount);
  }, []);

  // Custom keyboard navigation that includes trigger
  useEffect(() => {
    if (!isSavedTool) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      )
        return;

      if (isConfiguratorEditing) return;

      const activeElement = document.activeElement;
      if (
        activeElement?.closest("[data-radix-popper-content-wrapper]") ||
        activeElement?.closest(".monaco-editor")
      )
        return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        if (showTriggerContent) {
          return;
        }
        if (activeIndex === 0) {
          setShowTriggerContent(true);
        } else {
          handleNavigation("prev");
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        if (showTriggerContent) {
          setShowTriggerContent(false);
        } else {
          handleNavigation("next");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isSavedTool, showTriggerContent, activeIndex, isConfiguratorEditing, handleNavigation]);

  const currentItem = toolItems[activeIndex];
  const indicatorIndices = toolItems.map((_, idx) => idx);

  // Compute the step index for the current item (if it's a step)
  const currentStepIndex = useMemo(() => {
    if (currentItem?.type !== "step") return -1;
    return toolItems.slice(0, activeIndex).filter((i) => i.type === "step").length;
  }, [currentItem, toolItems, activeIndex]);

  // === VISIBLE CARDS CALCULATION ===
  const visibleCardsData = useMemo(() => {
    const totalCards = toolItems.length;
    const CARD_WIDTH = 170;
    const BUTTON_SIZE = 32;
    const BUTTON_SPACING = 18;
    const SEPARATOR_WIDTH = BUTTON_SIZE + BUTTON_SPACING * 2;
    const EDGE_PADDING = 16;
    const TRIGGER_WIDTH = 32;
    const TRIGGER_GAP = 32;
    const triggerSpace = isSavedTool ? TRIGGER_WIDTH + TRIGGER_GAP : 0;
    const available = Math.max(0, containerWidth - EDGE_PADDING * 2 - triggerSpace);

    let cardsToShow = 1;
    const maxCandidates = Math.min(totalCards, 12);
    for (let c = 1; c <= maxCandidates; c++) {
      const needed = c * CARD_WIDTH + (c - 1) * SEPARATOR_WIDTH;
      if (needed <= available) {
        cardsToShow = c;
      } else {
        break;
      }
    }
    cardsToShow = Math.max(1, cardsToShow);

    let startIdx = 0;
    let endIdx = totalCards;
    if (totalCards > cardsToShow) {
      const halfWindow = Math.floor(cardsToShow / 2);
      startIdx = Math.max(0, Math.min(activeIndex - halfWindow, totalCards - cardsToShow));
      endIdx = startIdx + cardsToShow;
    }

    const visibleItems = toolItems.slice(startIdx, endIdx);
    const visibleIndices = visibleItems.map((_, i) => startIdx + i);

    return {
      visibleItems,
      visibleIndices,
      startIdx,
      endIdx,
      totalCards,
      hiddenLeft: startIdx,
      hiddenRight: totalCards - endIdx,
      sepWidth: SEPARATOR_WIDTH,
      cardWidth: CARD_WIDTH,
    };
  }, [toolItems, containerWidth, activeIndex, isSavedTool]);

  // Update hidden counts for badges
  useEffect(() => {
    if (visibleCardsData.hiddenLeft !== hiddenLeftCount)
      setHiddenLeftCount(visibleCardsData.hiddenLeft);
    if (visibleCardsData.hiddenRight !== hiddenRightCount)
      setHiddenRightCount(visibleCardsData.hiddenRight);
  }, [
    visibleCardsData.hiddenLeft,
    visibleCardsData.hiddenRight,
    hiddenLeftCount,
    hiddenRightCount,
  ]);

  const handleRemoveStep = (stepId: string) => {
    if (!setSteps) return;
    const newSteps = steps.filter((step) => step.id !== stepId);
    setSteps(newSteps);
    // Adjust active index if needed
    if (activeIndex >= toolItems.length - 1) {
      setActiveIndex(Math.max(0, activeIndex - 1));
    }
  };

  const handleAddStep = useCallback(
    (afterStepIndex: number) => {
      const position =
        afterStepIndex === -1
          ? "at the beginning"
          : `after step "${steps[afterStepIndex]?.id || afterStepIndex + 1}"`;

      sendMessageToAgent(
        `Please add a new step ${position}. Ask me what the step should do if you need more information.`,
      );
    },
    [steps, sendMessageToAgent],
  );

  const onStepEdit = (stepId: string, updatedStep: any, isUserInitiated = false) => {
    // Suppress user-initiated edits during navigation to prevent spurious resets
    if (isNavigatingRef.current && isUserInitiated) {
      return;
    }
    originalOnStepEdit?.(stepId, updatedStep, isUserInitiated);
  };

  // === EXTERNAL NAVIGATION SIGNALS ===
  useEffect(() => {
    if (navigateToFinalSignal) {
      navigateToIndex(toolItems.length - 1);
    }
  }, [navigateToFinalSignal, navigateToIndex, toolItems.length]);

  useEffect(() => {
    if (!showStepOutputSignal || !focusStepId) return;
    const idx = steps.findIndex((s: any) => s.id === focusStepId);
    if (idx >= 0) {
      navigateToIndex(idx + 1); // +1 for payload
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showStepOutputSignal, focusStepId, steps.findIndex, navigateToIndex]);

  return (
    <div className="flex h-full flex-col">
      {/* Fixed header section */}
      <div className="mb-6 flex-shrink-0 space-y-1.5">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex w-full min-w-0 items-center gap-3">
            {typeof toolId !== "undefined" && (
              <div className="mb-2 flex w-full items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <h1 className="truncate font-semibold text-xl">{toolId || "Untitled Tool"}</h1>
                  {toolActionButtons}
                </div>
                <div className="flex items-center gap-2">{headerActions ?? null}</div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-start justify-between gap-4">
          {instruction ? (
            <div className="min-w-0 flex-1">
              <InstructionDisplay
                instruction={instruction}
                onSave={setInstruction}
                showEditButton={true}
              />
            </div>
          ) : (
            <div className="flex-1" />
          )}
          {savedTool && (
            <div className="flex-shrink-0">
              <UnsavedChangesCard
                hasUnsavedChanges={hasUnsavedChanges}
                savedTool={savedTool}
                currentTool={currentTool}
              />
            </div>
          )}
        </div>
      </div>

      {/* Scrollable content section */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pr-4"
        style={{ scrollbarGutter: "stable" }}
      >
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="relative flex-shrink-0">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setShowTriggerContent(false);
                  handleNavigation("prev");
                }}
                disabled={activeIndex === 0}
                className={cn(
                  "h-9 w-9 shrink-0",
                  hiddenLeftCount > 0 &&
                    !isPayloadValid &&
                    "animate-pulse border-amber-500 shadow-amber-500/30 shadow-lg ring-1 ring-amber-500",
                )}
                title="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {hiddenLeftCount > 0 && (
                <Badge
                  variant="default"
                  className={cn(
                    "absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center px-1 font-bold text-[10px]",
                    !isPayloadValid || !isPayloadReferenced
                      ? "bg-amber-500 text-white"
                      : "bg-primary text-primary-foreground",
                  )}
                >
                  {hiddenLeftCount}
                </Badge>
              )}
            </div>

            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="relative">
                <div
                  ref={listRef}
                  className="relative z-10 flex items-center justify-center py-3"
                  style={{ minHeight: "140px" }}
                >
                  {!isHydrated ? (
                    <div className="flex items-center justify-center">
                      <div className="h-24 w-40 animate-pulse rounded-md bg-muted/20" />
                    </div>
                  ) : (
                    <>
                      {/* Trigger button - shown as prefix when first visible card is payload */}
                      {isSavedTool && visibleCardsData.startIdx === 0 && (
                        <>
                          <TriggerCard
                            isActive={showTriggerContent}
                            onClick={() => setShowTriggerContent(!showTriggerContent)}
                            icon={
                              <Zap
                                className={cn(
                                  "absolute h-4 w-4 transition-colors",
                                  showTriggerContent
                                    ? "text-[#FFA500]"
                                    : "text-muted-foreground group-hover:text-primary",
                                )}
                              />
                            }
                          />
                          <div className="w-8" />
                        </>
                      )}
                      {visibleCardsData.visibleItems.map((item, idx) => {
                        const globalIdx = visibleCardsData.visibleIndices[idx];
                        const cardWidth = visibleCardsData.cardWidth;
                        const isActive = globalIdx === activeIndex && !showTriggerContent;
                        const handleClick = () => {
                          setShowTriggerContent(false);
                          handleCardClick(globalIdx);
                        };

                        const canShowAddButton = setSteps && item.type !== "transform";

                        const getInsertIndex = () => {
                          if (item.type === "payload") return -1;
                          if (item.type === "step") {
                            return (
                              toolItems.slice(0, globalIdx + 1).filter((i) => i.type === "step")
                                .length - 1
                            );
                          }
                          return -1;
                        };

                        const showSeparator = idx < visibleCardsData.visibleItems.length - 1;

                        const renderCardContent = () => {
                          if (item.type === "payload") {
                            const isEmptyPayload =
                              !computedPayload ||
                              (typeof computedPayload === "object" &&
                                Object.keys(computedPayload).length === 0) ||
                              (typeof computedPayload === "string" &&
                                (!(computedPayload as string).trim() ||
                                  (computedPayload as string).trim() === "{}"));

                            const showUnreferencedWarning =
                              isPayloadValid && !isPayloadReferenced && !isEmptyPayload;

                            return (
                              <MiniCard isActive={isActive} onClick={handleClick}>
                                <div className="flex flex-1 flex-col items-center justify-center">
                                  <div
                                    className={cn(
                                      "rounded-full p-2",
                                      !isPayloadValid || showUnreferencedWarning
                                        ? "bg-amber-500/20"
                                        : "bg-primary/10",
                                    )}
                                  >
                                    {!isPayloadValid || showUnreferencedWarning ? (
                                      <svg
                                        aria-hidden="true"
                                        className="h-4 w-4 text-amber-600 dark:text-amber-400"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                        <line x1="12" y1="9" x2="12" y2="13" />
                                        <line x1="12" y1="17" x2="12.01" y2="17" />
                                      </svg>
                                    ) : (
                                      <FileJson className="h-4 w-4 text-primary" />
                                    )}
                                  </div>
                                  <span className="mt-1.5 font-semibold text-[11px]">
                                    Tool Input
                                  </span>
                                </div>
                                <div className="flex items-center justify-center">
                                  {!isPayloadValid ? (
                                    <StatusIndicator
                                      text="Required"
                                      color="text-amber-600 dark:text-amber-400"
                                      dotColor="bg-amber-600 dark:bg-amber-400"
                                      animate
                                    />
                                  ) : showUnreferencedWarning ? (
                                    <StatusIndicator
                                      text="Unused in tool"
                                      color="text-amber-600 dark:text-amber-400"
                                      dotColor="bg-amber-600 dark:bg-amber-400"
                                    />
                                  ) : (
                                    <span className="font-medium text-[9px] text-muted-foreground">
                                      {isEmptyPayload ? "Empty" : "Provided"}
                                    </span>
                                  )}
                                </div>
                              </MiniCard>
                            );
                          }

                          if (item.type === "transform") {
                            const isRunning = isRunningTransform || isFixingTransform;
                            const baseStatusInfo = getStepStatusInfo("__final_transform__");
                            const statusInfo = isRunning ? RUNNING_STATUS : baseStatusInfo;

                            return (
                              <MiniCard isActive={isActive} onClick={handleClick}>
                                <div className="flex flex-1 flex-col items-center justify-center">
                                  <div className="rounded-full border border-border/50 bg-white p-2 dark:bg-gray-100">
                                    <Code2 className="h-4 w-4 text-primary" />
                                  </div>
                                  <span className="mt-1.5 font-semibold text-[11px]">
                                    Tool Result
                                  </span>
                                </div>
                                <div className="flex items-center justify-center">
                                  <StatusIndicator
                                    text={statusInfo.text}
                                    color={statusInfo.color}
                                    dotColor={statusInfo.dotColor}
                                    animate={statusInfo.animate}
                                  />
                                </div>
                              </MiniCard>
                            );
                          }

                          const stepItem = item as StepItem;
                          const step = stepItem.data;
                          const stepsBeforeThis = toolItems
                            .slice(0, globalIdx)
                            .filter((i) => i.type === "step").length;
                          const isRunning =
                            isExecutingAny && currentExecutingStepIndex === stepsBeforeThis;
                          const isLoopStep =
                            globalIdx === activeIndex &&
                            activeStepItemCount !== null &&
                            activeStepItemCount > 0;

                          const baseStatusInfo = step.id
                            ? getStepStatusInfo(step.id)
                            : {
                                text: "Pending",
                                color: "text-gray-500 dark:text-gray-400",
                                dotColor: "bg-gray-500 dark:bg-gray-400",
                                animate: false,
                              };
                          const statusInfo = isRunning ? RUNNING_STATUS : baseStatusInfo;
                          const stepSystemId =
                            step.config && isRequestConfig(step.config)
                              ? (step.config as RequestStepConfig).systemId
                              : undefined;
                          const isTransformStep = isTransformConfig(step.config);

                          // Find systems for this step - check both environments
                          const devSystem =
                            stepSystemId && systems
                              ? systems.find(
                                  (sys) => sys.id === stepSystemId && sys.environment === "dev",
                                )
                              : undefined;
                          const prodSystem =
                            stepSystemId && systems
                              ? systems.find(
                                  (sys) => sys.id === stepSystemId && sys.environment === "prod",
                                )
                              : undefined;

                          // Resolve which system to display based on environment mode
                          // In dev mode: prefer dev, fall back to prod
                          // In prod mode: prefer prod, fall back to dev
                          const linkedSystem =
                            environmentMode === "dev"
                              ? devSystem || prodSystem
                              : prodSystem || devSystem;

                          // Determine environment badge to show:
                          // - If both exist: show the one matching current mode
                          // - If only one exists: show that one
                          // - If none exist: no badge
                          const systemEnvBadge: "dev" | "prod" | null = (() => {
                            if (!stepSystemId || !linkedSystem) return null;
                            if (devSystem && prodSystem) {
                              // Both exist - show the one we're using based on mode
                              return environmentMode === "dev" ? "dev" : "prod";
                            }
                            // Only one exists - show which one it is
                            return linkedSystem.environment as "dev" | "prod";
                          })();

                          const systemLabel =
                            linkedSystem?.name ||
                            stepSystemId ||
                            (isTransformStep ? "Transform" : undefined);

                          return (
                            <MiniCard isActive={isActive} onClick={handleClick}>
                              <div className="relative flex h-full w-full flex-col">
                                <div className="absolute top-0 left-0 flex h-4 items-center">
                                  <span className="rounded bg-primary/10 px-1 py-0.5 font-medium text-[9px] text-primary">
                                    {stepsBeforeThis + 1}
                                  </span>
                                </div>
                                <div className="absolute top-0 right-0 flex h-4 items-center gap-0.5">
                                  {systemEnvBadge && (
                                    <EnvironmentBadge type={systemEnvBadge} size="sm" />
                                  )}
                                  {step?.modify === true && (
                                    <OctagonAlert
                                      className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400"
                                      aria-label="Modifies data"
                                    />
                                  )}
                                  {isLoopStep && !(step?.modify === true) && (
                                    <RotateCw
                                      className="h-3 w-3 text-amber-600 dark:text-amber-400"
                                      aria-label="Loop step"
                                    />
                                  )}
                                </div>
                                <div className="flex flex-1 flex-col items-center justify-center">
                                  <div className="rounded-full border border-border/50 bg-white p-2 dark:bg-gray-100">
                                    {linkedSystem ? (
                                      <SystemIcon system={linkedSystem} size={18} />
                                    ) : isTransformStep ? (
                                      <Code2 className="h-4 w-4 text-primary" />
                                    ) : (
                                      <Blocks className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </div>
                                  {systemLabel && (
                                    <div className="mt-1 flex items-center gap-1">
                                      <span
                                        className="max-w-[100px] truncate text-[9px] text-muted-foreground"
                                        title={systemLabel}
                                      >
                                        {systemLabel}
                                      </span>
                                    </div>
                                  )}
                                  <span
                                    className="mt-1 max-w-[140px] truncate font-semibold text-[11px]"
                                    title={step.id || `Step ${globalIdx}`}
                                  >
                                    {step.id || `Step ${globalIdx}`}
                                  </span>
                                </div>
                                <div className="flex items-center justify-center">
                                  <StatusIndicator
                                    text={statusInfo.text}
                                    color={statusInfo.color}
                                    dotColor={statusInfo.dotColor}
                                    animate={statusInfo.animate}
                                  />
                                </div>
                              </div>
                            </MiniCard>
                          );
                        };

                        return (
                          <React.Fragment key={globalIdx}>
                            <div
                              className="flex items-center justify-center"
                              style={{
                                flex: `0 0 ${cardWidth}px`,
                                width: `${cardWidth}px`,
                                maxWidth: `${cardWidth}px`,
                              }}
                            >
                              {renderCardContent()}
                            </div>
                            {showSeparator && (
                              <div
                                style={{
                                  flex: `0 0 ${visibleCardsData.sepWidth}px`,
                                  width: `${visibleCardsData.sepWidth}px`,
                                }}
                                className="flex items-center justify-center"
                              >
                                {canShowAddButton ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddStep(getInsertIndex());
                                    }}
                                    className="group relative flex h-8 w-8 items-center justify-center rounded-full border border-muted-foreground/15 transition-colors hover:border-muted-foreground/25 hover:bg-muted/40"
                                    title="Add step here"
                                  >
                                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-opacity group-hover:opacity-0" />
                                    <Plus className="absolute h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                  </button>
                                ) : null}
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="relative flex-shrink-0">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setShowTriggerContent(false);
                  handleNavigation("next");
                }}
                disabled={activeIndex === toolItems.length - 1}
                className="h-9 w-9 shrink-0"
                title="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              {hiddenRightCount > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center bg-primary px-1 font-bold text-[10px] text-primary-foreground"
                >
                  {hiddenRightCount}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <div className="flex gap-1">
              {indicatorIndices.map((globalIdx) => (
                <button
                  type="button"
                  key={`dot-${globalIdx}`}
                  onClick={() => {
                    if (isConfiguratorEditing) return;
                    setShowTriggerContent(false);
                    navigateToIndex(globalIdx);
                  }}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-colors",
                    globalIdx === activeIndex ? "bg-primary" : "bg-muted",
                  )}
                  aria-label={`Go to item ${globalIdx + 1}`}
                  title={`Go to item ${globalIdx + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="mx-auto min-h-[220px] max-w-6xl">
            {isSavedTool && (
              <div className={showTriggerContent ? "" : "hidden"}>
                <TriggersCard toolId={toolId} payload={computedPayload} compact />
              </div>
            )}
            {!showTriggerContent && currentItem && currentItem.type === "payload" ? (
              <PayloadMiniStepCard
                onFilesUpload={onFilesUpload}
                onFileRemove={onFileRemove}
                isProcessingFiles={isProcessingFiles}
                totalFileSize={totalFileSize}
                isPayloadValid={isPayloadValid}
              />
            ) : !showTriggerContent && currentItem && currentItem.type === "transform" ? (
              <FinalTransformMiniStepCard
                onExecuteTransform={onExecuteTransform}
                onAbort={isRunningTransform || isFixingTransform ? onAbort : undefined}
              />
            ) : !showTriggerContent && currentItem && currentItem.type === "step" ? (
              <SpotlightStepCard
                key={currentItem.data.id}
                step={currentItem.data}
                stepIndex={currentStepIndex}
                onEdit={onStepEdit}
                onRemove={() => handleRemoveStep(currentItem.data.id)}
                onExecuteStep={onExecuteStep ? () => onExecuteStep(currentStepIndex) : undefined}
                onExecuteStepWithLimit={
                  onExecuteStepWithLimit
                    ? (limit) => onExecuteStepWithLimit(currentStepIndex, limit)
                    : undefined
                }
                onAbort={currentExecutingStepIndex === currentStepIndex ? onAbort : undefined}
                isExecuting={currentExecutingStepIndex === currentStepIndex}
                showOutputSignal={
                  focusStepId === currentItem.data.id ? showStepOutputSignal : undefined
                }
                onConfigEditingChange={setIsConfiguratorEditing}
                onDataSelectorChange={handleDataSelectorChange}
                isFirstStep={currentStepIndex === 0}
                isPayloadValid={isPayloadValid}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
