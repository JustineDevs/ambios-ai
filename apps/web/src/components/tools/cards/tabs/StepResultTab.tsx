import { Loader2, OctagonX, X } from "lucide-react";
import { formatBytes } from "@/lib/file-utils";
import { isAbortError, isEmptyData } from "@/lib/general-utils";
import { JsonEditor } from "../../../editors/JsonEditor";
import { useExecution } from "../../context";
import { useDataProcessor } from "../../hooks/use-data-processor";

interface StepResultTabProps {
  step: any;
  stepIndex: number;
  isExecuting?: boolean;
  isActive?: boolean;
}

export function StepResultTab({
  step,
  stepIndex,
  isExecuting,
  isActive = true,
}: StepResultTabProps) {
  const { getStepResult, isStepFailed, isStepAborted, isExecutingAny, currentExecutingStepIndex } =
    useExecution();

  const stepResult = getStepResult(step.id);
  const stepFailed = isStepFailed(step.id);
  const stepAborted = isStepAborted(step.id);

  const outputProcessor = useDataProcessor(stepResult, isActive);

  const errorResult =
    (stepFailed || stepAborted) && (!stepResult || typeof stepResult === "string");
  const isPending = !stepFailed && !stepAborted && stepResult == null;
  const isActivelyRunning = !!(
    isExecuting ||
    (isExecutingAny && currentExecutingStepIndex === stepIndex)
  );

  let outputString = "";
  let isTruncated = false;

  if (!isPending) {
    if (errorResult) {
      if (stepResult) {
        outputString =
          stepResult.length > 50000
            ? `${stepResult.substring(0, 50000)}\n... [Error message truncated]`
            : stepResult;
      } else {
        outputString = '{\n  "error": "Step execution failed"\n}';
      }
    } else {
      outputString = outputProcessor.preview?.displayString || "";
      isTruncated = outputProcessor.preview?.truncated || false;
    }
  }

  const showEmptyWarning =
    !stepFailed && !stepAborted && !isPending && !errorResult && isEmptyData(outputString || "");

  const aborted = stepAborted || (errorResult && isAbortError(stepResult));

  return (
    <div>
      {errorResult ? (
        aborted ? (
          <div className="flex flex-col items-start justify-start rounded-lg border border-border bg-muted/30 p-4">
            <div className="mb-2 flex items-center gap-2">
              <OctagonX className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <p className="font-semibold text-amber-600 text-sm dark:text-amber-400">
                Execution Aborted
              </p>
            </div>
            <p className="text-muted-foreground text-xs">
              Step execution was manually stopped. Run the step again to get results.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-start justify-start rounded-lg border border-border bg-muted/30 p-4">
            <div className="mb-2 flex items-center gap-2">
              <X className="h-4 w-4 text-red-500 dark:text-red-400" />
              <p className="font-semibold text-red-500 text-sm dark:text-red-400">Step Error</p>
            </div>
            <pre className="w-full overflow-x-auto whitespace-pre-wrap font-mono text-xs">
              {outputString || "Step execution failed"}
            </pre>
          </div>
        )
      ) : isPending ? (
        isActivelyRunning ? (
          <div className="flex flex-col items-center justify-center rounded-md border bg-muted/5 py-8 text-muted-foreground">
            <div className="mb-1 flex items-center gap-2">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              <span className="text-xs">Currently running...</span>
            </div>
            <p className="text-[10px]">Step results will be shown shortly</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-md border bg-muted/5 py-8 text-muted-foreground">
            <div className="mb-1 text-xs">No result yet</div>
            <p className="text-[10px]">Run this step to see results</p>
          </div>
        )
      ) : outputProcessor.isComputingPreview && !outputProcessor.preview?.displayString ? (
        <div className="flex items-center justify-center rounded-md border bg-muted/5 py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <JsonEditor
            value={outputString}
            readOnly={true}
            minHeight="350px"
            maxHeight="600px"
            resizable={true}
            overlay={
              <div className="flex items-center gap-2">
                {outputProcessor.isComputingPreview && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                <span className="text-[10px] text-muted-foreground">
                  {formatBytes(outputProcessor.bytes)}
                </span>
              </div>
            }
          />
          {showEmptyWarning && (
            <div className="mt-1 px-2 text-[11px] text-amber-700 dark:text-amber-300">
              ⚠ No data returned. Is this expected?
            </div>
          )}
          {isTruncated && (
            <div className="mt-1 px-2 text-[10px] text-amber-600 dark:text-amber-300">
              Preview truncated for display performance
            </div>
          )}
        </>
      )}
    </div>
  );
}
