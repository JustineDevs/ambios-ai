import { Check } from "lucide-react";
import { cn } from "@/lib/general-utils";

export type StepperStep = "basic" | "try_and_output" | "save";
export type ToolCreateStep = "systems" | "build" | "run" | "save";

interface StepConfig {
  id: StepperStep | ToolCreateStep;
  title: string;
}

export const API_CREATE_STEPS: StepConfig[] = [
  {
    id: "basic",
    title: "Basic Info",
  },
  {
    id: "try_and_output",
    title: "Try It!",
  },
  {
    id: "save",
    title: "Complete",
  },
];

export const TOOL_CREATE_STEPS: StepConfig[] = [
  {
    id: "systems",
    title: "Systems",
  },
  {
    id: "build",
    title: "Build",
  },
  {
    id: "run",
    title: "Run",
  },
  {
    id: "save",
    title: "Save",
  },
];

interface StepIndicatorProps {
  currentStep: StepperStep | ToolCreateStep;
  steps: StepConfig[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="py-3">
      <div className="relative">
        <div className="absolute top-3.5 left-0 z-0 h-0.5 w-full bg-muted" />

        <div
          className="absolute top-3.5 left-0 z-0 h-0.5 bg-primary transition-all duration-500 ease-in-out"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />

        <div
          className={"relative z-10 grid w-full"}
          style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
        >
          {steps.map((step, index) => {
            const isActive = index === currentIndex;
            const isCompleted = index < currentIndex;

            return (
              <div key={step.id} className="z-10 flex flex-col items-center">
                <div className="z-10 flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      "z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 font-medium text-sm transition-all duration-300",
                      isCompleted && "border-primary bg-primary text-primary-foreground",
                      isActive && "border-primary bg-background text-foreground",
                      !isCompleted && !isActive && "border-muted bg-muted text-muted-foreground",
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-3.5" /> : index + 1}
                  </div>
                  <span
                    className={cn(
                      "px-1 text-center font-medium text-xs transition-colors duration-300",
                      isActive || isCompleted ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {step.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
