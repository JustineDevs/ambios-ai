import { AnimatePresence, motion } from "framer-motion";
import { Check, Info } from "lucide-react";
import { useState } from "react";

export type PlanId = string;

export interface Feature {
  text: string;
  hasInfo?: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  priceMonthly: string;
  priceYearly: string;
  badge?: string;
  featuresLabel?: string;
  features: Feature[];
}

export interface ChangeablePricingSectionProps {
  /** The main title of the section */
  title?: string;
  /** Array of pricing plans to display */
  plans: Plan[];
  /** Optional ID of the default selected plan */
  defaultPlanId?: PlanId;
  /** Default billing cycle */
  defaultBillingCycle?: "monthly" | "yearly";
  /** Custom label for monthly toggle */
  monthlyLabel?: string;
  /** Custom label for yearly toggle */
  yearlyLabel?: string;
  /** Footer text below plans */
  footerText?: string;
  /** CTA button text */
  buttonText?: string;
  /** Callback fired when continue button is clicked */
  onContinue?: (planId: PlanId, billingCycle: "monthly" | "yearly") => void;
}

export default function ChangeablePricingSection({
  title = "Select a plan",
  plans,
  defaultPlanId,
  defaultBillingCycle = "monthly",
  monthlyLabel = "Monthly",
  yearlyLabel = "Yearly",
  footerText = "Cancel anytime. No long-term contract.",
  buttonText = "Continue",
  onContinue,
}: ChangeablePricingSectionProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(
    defaultPlanId || (plans.length > 0 ? plans[0].id : ""),
  );
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(defaultBillingCycle);

  return (
    <div className="w-full max-w-[460px] rounded-[24px] bg-neutral-100 p-1.5 shadow-sm ring-1 ring-neutral-200/50 dark:bg-neutral-950 dark:ring-neutral-800/50">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4">
        <h2 className="font-medium text-[17px] text-neutral-800 tracking-tighter dark:text-neutral-100">
          {title}
        </h2>
        <div className="relative z-0 flex items-center rounded-full bg-neutral-200 p-1 ring-1 ring-transparent dark:bg-neutral-950 dark:ring-neutral-600/50">
          <motion.div
            className="absolute top-1 bottom-1 -z-10 w-[calc(50%-4px)] rounded-full bg-white shadow-sm dark:bg-orange-500/15 dark:shadow-none"
            animate={{
              x: billingCycle === "monthly" ? 0 : "100%",
            }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.7 }}
            style={{ left: 4 }}
          />
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`jet z-10 w-[72px] rounded-full py-1.5 font-bold text-[10px] uppercase tracking-widest transition-colors ${billingCycle === "monthly" ? "text-neutral-800 dark:text-orange-500" : "text-neutral-400 dark:text-neutral-500"}`}
          >
            {monthlyLabel}
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={`jet z-10 w-[72px] rounded-full py-1.5 font-bold text-[10px] uppercase tracking-widest transition-colors ${billingCycle === "yearly" ? "text-neutral-800 dark:text-orange-500" : "text-neutral-400 dark:text-neutral-500"}`}
          >
            {yearlyLabel}
          </button>
        </div>
      </div>

      {/* Plans */}
      <div className="flex flex-col gap-1">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;

          return (
            <motion.div
              layout
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              transition={{ type: "spring", bounce: 0.45, duration: 0.7 }}
              className={`relative cursor-pointer overflow-hidden rounded-[18px] bg-white transition-colors duration-300 dark:bg-neutral-800/50 ${
                isSelected
                  ? "shadow-[0_4px_16px_rgba(249,115,22,0.06)] ring-[1px] ring-orange-500 dark:shadow-none dark:ring-orange-500"
                  : "shadow-sm ring-1 ring-neutral-200/80 hover:ring-neutral-300 dark:shadow-none dark:ring-neutral-800 dark:hover:ring-neutral-700"
              }`}
            >
              <div className="px-4 py-3.5 sm:px-5 sm:py-4">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-1 gap-3">
                    {/* Radio button */}
                    <div className="mt-0.5 shrink-0">
                      <div
                        className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border transition-colors ${
                          isSelected
                            ? "border-orange-500 bg-orange-500"
                            : "border-neutral-300 bg-white dark:border-neutral-700 dark:bg-transparent"
                        }`}
                      >
                        {isSelected && <Check size={11} strokeWidth={3.5} className="text-white" />}
                      </div>
                    </div>

                    {/* Plan Info */}
                    <div className="flex flex-1 flex-col">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-[16px] text-neutral-800 leading-none dark:text-neutral-100">
                          {plan.name}
                        </span>
                        {plan.badge && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 font-bold text-[9px] text-green-600 uppercase leading-none tracking-wider dark:bg-green-500/10">
                            {plan.badge}
                          </span>
                        )}
                      </div>
                      <span className="mt-1.5 text-[11px] text-neutral-500 leading-snug sm:leading-none dark:text-neutral-400">
                        {plan.description}
                      </span>
                    </div>
                  </div>

                  {/* Price Info */}
                  <div className="flex shrink-0 flex-col items-end">
                    <div className="flex h-[18px] items-center justify-end overflow-hidden font-medium text-[15px] text-neutral-800 leading-none sm:text-[16px] dark:text-neutral-100">
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                          key={billingCycle}
                          initial={{
                            y: billingCycle === "yearly" ? 20 : -20,
                            opacity: 0,
                            filter: "blur(4px)",
                          }}
                          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                          exit={{
                            y: billingCycle === "monthly" ? -20 : 20,
                            opacity: 0,
                            filter: "blur(4px)",
                          }}
                          transition={{
                            type: "spring",
                            bounce: 0,
                            duration: 0.4,
                          }}
                          className="inline-block whitespace-nowrap"
                        >
                          {billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                    <span className="jet mt-1.5 font-bold text-[10px] text-neutral-400 uppercase leading-none tracking-widest">
                      per user/month
                    </span>
                  </div>
                </div>

                {/* Expandable Features */}
                <AnimatePresence initial={false}>
                  {isSelected && (
                    <motion.div
                      key="features"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        opacity: { duration: 0.2 },
                        height: { duration: 0.3, ease: "easeOut" },
                      }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3.5 mb-1 border-neutral-200 border-t border-dashed pt-3.5 sm:mt-4 sm:pt-4 dark:border-neutral-800">
                        {plan.featuresLabel && (
                          <p className="jet mb-3 font-bold text-[10px] text-neutral-400 uppercase tracking-widest">
                            {plan.featuresLabel}
                          </p>
                        )}
                        <div className="flex flex-col gap-2.5">
                          {plan.features.map((feature) => (
                            <div key={feature.text} className="flex items-center gap-2.5">
                              <Check
                                size={14}
                                strokeWidth={3}
                                className="shrink-0 text-green-500"
                              />
                              <span className="text-[12px] text-neutral-600 leading-tight dark:text-neutral-300">
                                {feature.text}
                              </span>
                              {feature.hasInfo && (
                                <Info
                                  size={13}
                                  className="ml-0.5 text-neutral-300 dark:text-neutral-600"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer info & CTA */}
      <div className="mt-5 flex flex-col items-center gap-4 px-3 pb-2 sm:flex-row sm:justify-between">
        <span className="jet text-center text-[10px] text-neutral-400 uppercase leading-relaxed tracking-[0.05em] sm:text-left">
          {footerText}
        </span>
        <button
          type="button"
          onClick={() => onContinue?.(selectedPlan, billingCycle)}
          className="w-full rounded-full bg-orange-500 px-8 py-2.5 font-medium text-[13px] text-white outline-none transition-all hover:bg-orange-600 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 active:scale-95 sm:w-auto"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
