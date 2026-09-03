import {
  Code2,
  FileBracesCorner,
  FileInput,
  FilePlay,
  Filter,
  Loader2,
  MessagesSquare,
  Play,
  Square,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import JsonSchemaEditor from "@/components/editors/JsonSchemaEditor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBytes } from "@/lib/file-utils";
import { isEmptyData } from "@/lib/general-utils";
import type { buildCategorizedSources } from "@/lib/templating-utils";
import { JavaScriptCodeEditor } from "../../editors/JavaScriptCodeEditor";
import { JsonEditor } from "../../editors/JsonEditor";
import { useRightSidebar } from "../../sidebar/RightSidebarContext";
import { useExecution, useToolConfig } from "../context";
import { useDataProcessor } from "../hooks/use-data-processor";
import { ResponseFiltersCard } from "./ResponseFiltersCard";

export interface TransformItem {
  type: "transform";
  data: { transform: string; outputSchema: string };
  stepResult: any;
  transformError: any;
  hasTransformCompleted: boolean;
  categorizedSources: ReturnType<typeof buildCategorizedSources>;
}

interface FinalTransformMiniStepCardProps {
  onExecuteTransform?: (schema: string, transform: string) => void;
  onAbort?: () => void;
}

export const FinalTransformMiniStepCard = ({
  onExecuteTransform,
  onAbort,
}: FinalTransformMiniStepCardProps) => {
  const {
    outputTransform,
    outputSchema,
    setOutputTransform,
    setOutputSchema,
    responseFilters,
    setResponseFilters,
    steps,
  } = useToolConfig();
  const {
    finalResult,
    finalError,
    getStepInput,
    isRunningTransform,
    isFixingTransform,
    canExecuteTransform,
    transformStatus,
  } = useExecution();
  const { sendMessageToAgent } = useRightSidebar();

  const transform = outputTransform;
  const transformResult = finalResult;
  const transformError = finalError;
  const canExecute = canExecuteTransform;
  const hasTransformCompleted = transformStatus === "completed";

  const stepInputs = getStepInput();
  const [activeTab, setActiveTab] = useState("transform");
  const [localTransform, setLocalTransform] = useState(transform || "");
  const [localSchema, setLocalSchema] = useState(outputSchema || "");
  const [schemaInitialized, setSchemaInitialized] = useState(false);
  const [isPendingExecution, setIsPendingExecution] = useState(false);
  const isInternalChangeRef = useRef(false);

  useEffect(() => {
    if (!isInternalChangeRef.current) {
      setLocalTransform(transform || "");
    }
    isInternalChangeRef.current = false;
  }, [transform]);

  useEffect(() => {
    if (isRunningTransform || isFixingTransform) {
      setIsPendingExecution(false);
      setActiveTab("output");
    }
  }, [isRunningTransform, isFixingTransform]);

  useEffect(() => {
    if (!schemaInitialized) {
      setLocalSchema(outputSchema || "");
      setSchemaInitialized(true);
    }
  }, [outputSchema, schemaInitialized]);

  useEffect(() => {
    if (hasTransformCompleted) {
      setActiveTab("output");
    }
  }, [hasTransformCompleted]);

  // Reset to transform tab when status goes back to idle (e.g., when steps are invalidated)
  useEffect(() => {
    if (transformStatus === "idle") {
      setActiveTab("transform");
    }
  }, [transformStatus]);

  const inputProcessor = useDataProcessor(stepInputs, activeTab === "inputs");

  const outputProcessor = useDataProcessor(transformResult, activeTab === "output");

  const inputData = {
    displayString: inputProcessor.preview?.displayString || "",
    truncated: inputProcessor.preview?.truncated || false,
    bytes: inputProcessor.bytes,
  };

  const outputData = {
    displayString: outputProcessor.preview?.displayString || "",
    truncated: outputProcessor.preview?.truncated || false,
    bytes: outputProcessor.bytes,
  };

  function handleTransformChange(value: string): void {
    isInternalChangeRef.current = true;
    setLocalTransform(value);
    setOutputTransform(value);
  }

  function handleSchemaChange(value: string | null): void {
    if (value === null || value === "") {
      setLocalSchema("");
      setOutputSchema("");
    } else {
      setLocalSchema(value);
      setOutputSchema(value);
    }
  }

  const handleAskAgentToFix = useCallback(() => {
    const truncatedError =
      transformError && transformError.length > 500
        ? `${transformError.slice(0, 500)}...`
        : transformError;
    sendMessageToAgent(
      `The transform failed with the following error:\n\n${truncatedError}\n\nPlease fix the transform code.`,
    );
  }, [transformError, sendMessageToAgent]);

  function handleExecuteTransform(): void {
    if (onExecuteTransform) {
      setIsPendingExecution(true);
      setActiveTab("output");
      onExecuteTransform(localSchema, localTransform);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-6xl overflow-hidden border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 shadow-md backdrop-blur-sm dark:border-border/70 dark:from-muted/40 dark:to-muted/20">
      <div className="p-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="mb-3 flex items-center justify-between">
            <TabsList className="h-9 rounded-md p-1">
              <TabsTrigger
                value="inputs"
                className="flex h-full items-center gap-1 rounded-sm px-3 text-xs data-[state=active]:rounded-sm"
              >
                <FileInput className="h-4 w-4" /> Step Input
              </TabsTrigger>
              <TabsTrigger
                value="transform"
                className="flex h-full items-center gap-1 rounded-sm px-3 text-xs data-[state=active]:rounded-sm"
              >
                <Code2 className="h-4 w-4" /> Transform Code
              </TabsTrigger>
              <TabsTrigger
                value="schema"
                className="flex h-full items-center gap-1 rounded-sm px-3 text-xs data-[state=active]:rounded-sm"
              >
                <FileBracesCorner className="h-4 w-4" /> Result Schema
              </TabsTrigger>
              <TabsTrigger
                value="filters"
                className="flex h-full items-center gap-1 rounded-sm px-3 text-xs data-[state=active]:rounded-sm"
              >
                <Filter className="h-4 w-4" /> Filters
              </TabsTrigger>
              <TabsTrigger
                value="output"
                className="flex h-full items-center gap-1 rounded-sm px-3 text-xs data-[state=active]:rounded-sm"
              >
                {isRunningTransform || isFixingTransform ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FilePlay className="h-4 w-4" />
                )}
                Result
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              {transformError && (
                <Button
                  variant="glass-primary"
                  onClick={handleAskAgentToFix}
                  className="h-8 gap-2 rounded-xl px-3"
                >
                  <MessagesSquare className="h-3.5 w-3.5" />
                  <span className="font-medium text-[13px]">Fix in chat</span>
                </Button>
              )}
              {onExecuteTransform && (
                <span
                  title={
                    !canExecute
                      ? "Execute all steps first"
                      : isRunningTransform
                        ? onAbort
                          ? "Stop transform"
                          : "Transform is running..."
                        : "Test final transform"
                  }
                >
                  {isRunningTransform && onAbort ? (
                    <Button variant="glass" onClick={onAbort} className="h-8 gap-2 rounded-xl px-3">
                      <Square className="h-3 w-3" />
                      <span className="font-medium text-[13px]">Stop</span>
                    </Button>
                  ) : (
                    <Button
                      variant="glass"
                      onClick={handleExecuteTransform}
                      disabled={!canExecute || isRunningTransform || isFixingTransform}
                      className="h-8 gap-2 rounded-xl px-3"
                    >
                      <Play className="h-3 w-3" />
                      <span className="font-medium text-[13px]">Run Transform</span>
                    </Button>
                  )}
                </span>
              )}
            </div>
          </div>
          <TabsContent value="inputs" className="mt-0">
            {!canExecute ? (
              <div className="flex flex-col items-center justify-center rounded-md border bg-muted/5 py-8 text-muted-foreground">
                <div className="mb-1 text-xs">No input yet</div>
                <p className="text-[10px]">Run all previous steps to see inputs</p>
              </div>
            ) : (
              <>
                <JsonEditor
                  value={inputData.displayString}
                  readOnly={true}
                  minHeight="150px"
                  maxHeight="500px"
                  resizable={true}
                  overlay={
                    <div className="flex items-center gap-2">
                      {inputProcessor.isComputingPreview && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {formatBytes(inputData.bytes)}
                      </span>
                    </div>
                  }
                />
                {inputData.truncated && (
                  <div className="mt-1 px-2 text-[10px] text-amber-600 dark:text-amber-300">
                    Preview truncated for display performance
                  </div>
                )}
              </>
            )}
          </TabsContent>
          <TabsContent value="transform" className="mt-0">
            <JavaScriptCodeEditor
              value={localTransform}
              onChange={handleTransformChange}
              readOnly={false}
              minHeight="150px"
              maxHeight="500px"
              resizable={true}
              isTransformEditor={true}
              autoFormatOnMount={false}
            />
          </TabsContent>
          <TabsContent value="schema" className="mt-0">
            <div className="space-y-3">
              <JsonSchemaEditor
                value={localSchema || ""}
                onChange={handleSchemaChange}
                isOptional={true}
                showModeToggle={true}
              />
            </div>
          </TabsContent>
          <TabsContent value="filters" className="mt-0">
            <ResponseFiltersCard
              filters={responseFilters}
              onChange={setResponseFilters}
              disabled={isRunningTransform || isFixingTransform}
            />
          </TabsContent>
          <TabsContent value="output" className="mt-0">
            {isPendingExecution || isRunningTransform || isFixingTransform ? (
              <div className="flex flex-col items-center justify-center rounded-lg border py-12 text-muted-foreground">
                <Loader2 className="mb-2 h-8 w-8 animate-spin" />
                <p className="text-sm">
                  {isFixingTransform ? "Fixing transform..." : "Running transform..."}
                </p>
                <p className="mt-1 text-xs">Please wait while the transform executes</p>
              </div>
            ) : transformError ? (
              <div className="flex flex-col items-start justify-start rounded-lg border border-border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <X className="h-4 w-4 text-red-500 dark:text-red-400" />
                  <p className="font-semibold text-red-500 text-sm dark:text-red-400">
                    Transform Error
                  </p>
                </div>
                <pre className="w-full overflow-x-auto whitespace-pre-wrap font-mono text-xs">
                  {transformError}
                </pre>
              </div>
            ) : transformResult === undefined ? (
              <div className="flex flex-col items-center justify-center rounded-lg border py-12 text-muted-foreground">
                <FilePlay className="mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">No result yet</p>
                <p className="mt-1 text-xs">Run the tool or test the transform to see results</p>
              </div>
            ) : outputProcessor.isComputingPreview ? (
              <div className="flex items-center justify-center rounded-lg border py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <JsonEditor
                  value={outputData.displayString}
                  readOnly
                  minHeight="250px"
                  maxHeight="600px"
                  resizable={true}
                  overlay={
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">
                        {formatBytes(outputData.bytes)}
                      </span>
                    </div>
                  }
                />
                {isEmptyData(outputData.displayString) && (
                  <div className="mt-2 text-amber-700 text-xs dark:text-amber-300">
                    ⚠ No data returned. Is this expected?
                  </div>
                )}
                {outputData.truncated && (
                  <div className="mt-2 text-amber-600 text-xs dark:text-amber-300">
                    Preview truncated for display performance. Download for full data. data.
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};
