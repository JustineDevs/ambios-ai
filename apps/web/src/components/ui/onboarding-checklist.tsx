"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, ChevronUp } from "lucide-react";
import type React from "react";
import { useState } from "react";

interface Step {
  id: number;
  title: string;
  isCompleted: boolean;
}

interface ChecklistProps {
  steps: Step[];
  title?: string;
}

export const OnboardingChecklist: React.FC<ChecklistProps> = ({
  steps,
  title = "Getting started",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [theme] = useState<"light" | "dark">("light");

  const completedCount = steps.filter((s) => s.isCompleted).length;
  const totalSteps = steps.length;
  const springConfig = { type: "spring", stiffness: 300, damping: 30 } as const;

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="relative flex min-h-full flex-col items-center justify-center space-y-12 bg-transparent p-4 xs:p-6 transition-colors duration-500 sm:p-10">
        <motion.div
          layout
          transition={springConfig}
          className="w-full max-w-100 overflow-hidden rounded-xl border border-[#E5E5E5] bg-[#F5F5F7] shadow-lg lg:w-100 dark:border-white/10 dark:bg-[#161616]"
        >
          {/* Header Section */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setIsExpanded(!isExpanded);
            }}
            className="flex cursor-pointer select-none items-center justify-between p-3 sm:p-3.5"
          >
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <motion.div
                animate={{ rotate: isExpanded ? 0 : 180 }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#A1A1A1] sm:h-8 sm:w-8"
              >
                <ChevronUp size={20} className="sm:hidden" />
                <ChevronUp size={22} className="hidden sm:block" />
              </motion.div>
              <span className="truncate pr-1 font-bold text-[#1A1A1A] text-[14px] sm:text-[15px] dark:text-[#EDEDED]">
                {title}
              </span>
            </div>

            <div className="ml-1 flex shrink-0 items-center gap-2 sm:gap-3">
              <div className="flex gap-0.5 xs:gap-[3px]">
                {Array.from({ length: 14 }, (_, i) => i).map((segment) => (
                  <div
                    key={`segment-${segment}`}
                    className={`h-3.5 w-[2.5px] rounded-full transition-colors duration-500 sm:h-4 sm:w-[3.5px] ${
                      segment < (completedCount / totalSteps) * 14
                        ? "bg-[#22C55E]"
                        : "bg-[#E5E5E7] dark:bg-[#2A2A2A]"
                    }`}
                  />
                ))}
              </div>

              <span className="min-w-7 text-right font-bold text-[#71717A] text-[12px] sm:min-w-7.5 sm:text-[13px] dark:text-[#888]">
                {completedCount}/{totalSteps}
              </span>
            </div>
          </button>

          {/* Expanded Checklist Items */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={springConfig}
                className="rounded-t-4xl border-[#E9E8EF] border-t-[1.4px] bg-white sm:rounded-t-[24px] dark:border-white/5 dark:bg-[#1C1C1C]"
              >
                <div className="sm:y-1 space-y-0.5 p-1.5 sm:p-2">
                  {steps.map((step) => (
                    <div
                      key={step.id}
                      className="group flex cursor-pointer items-center justify-between rounded-xl p-2.5 px-3 transition-all hover:bg-[#F9F9F9] active:scale-[0.98] sm:p-3 sm:px-4 sm:active:scale-100 dark:hover:bg-white/5"
                    >
                      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                        {step.isCompleted ? (
                          <div className="flex h-4.5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00B613] shadow-[#238848] shadow-sm sm:h-5 sm:w-6">
                            <Check size={10} strokeWidth={4} className="text-white sm:hidden" />
                            <Check
                              size={12}
                              strokeWidth={4}
                              className="hidden text-white sm:block"
                            />
                          </div>
                        ) : (
                          <div
                            className={`flex h-4.5 w-5 shrink-0 items-center justify-center rounded-full border-2 font-bold text-[10px] sm:h-5 sm:w-6 sm:text-[12px] ${
                              step.id === 3
                                ? "border-[#292929] bg-[#292929] text-white shadow-[#1a1919] shadow-sm dark:border-[#EDEDED] dark:bg-[#EDEDED] dark:text-[#1A1A1A]"
                                : "border-[#E5E5E7] text-[#A1A1A1] shadow-[#8f8e8e]/40 shadow-sm dark:border-[#333] dark:text-[#555]"
                            }`}
                          >
                            {step.id}
                          </div>
                        )}
                        <span
                          className={`truncate font-medium text-[13px] transition-colors sm:text-[14px] ${
                            step.isCompleted
                              ? "text-[#A1A1A1] dark:text-[#555]"
                              : "text-[#1A1A1A] dark:text-[#D4D4D4]"
                          }`}
                        >
                          {step.title}
                        </span>
                      </div>

                      {!step.isCompleted && (
                        <ChevronRight
                          size={14}
                          className="shrink-0 text-[#D1D1D6] sm:size-4 dark:text-[#444]"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};
