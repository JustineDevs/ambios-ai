"use client";

import { CreditCard, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import ChangeablePricingSection, { type Plan } from "@/components/ui/changeable-pricing-section";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/general-utils";

const MVP_PLAN: Plan = {
  id: "free",
  name: "Free",
  description: "AmbiOS Phase 0 MVP workspace",
  priceMonthly: "$0",
  priceYearly: "$0",
  badge: "MVP",
  featuresLabel: "Included",
  features: [
    { text: "Context-aware hot-fix workflow" },
    { text: "Guardrails and approvals" },
    { text: "Immutable activity audit" },
  ],
};

export function PlansButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="ghost"
        className={cn("justify-start", className)}
        onClick={() => setOpen(true)}
      >
        <CreditCard className="h-4 w-4" />
        Plans
      </Button>
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto overscroll-contain p-5 sm:p-6">
        <DialogClose asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3"
            aria-label="Close plans"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </DialogClose>
        <DialogHeader>
          <DialogTitle>Choose the workspace capacity · AmbiOS plans</DialogTitle>
          <DialogDescription>Plans are locked to Free during the Phase 0 MVP.</DialogDescription>
        </DialogHeader>
        <ChangeablePricingSection
          title="Your plan"
          plans={[MVP_PLAN]}
          defaultPlanId="free"
          footerText="Pricing is locked while AmbiOS is in MVP."
          buttonText="Free plan selected"
        />
      </DialogContent>
    </Dialog>
  );
}
