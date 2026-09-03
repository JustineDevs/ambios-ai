import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/general-utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 font-semibold text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow",
        secondary: "border border-border/50 bg-primary/50 text-primary-foreground shadow",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow",
        outline: "text-foreground",
        glass:
          "border border-border/50 bg-gradient-to-br from-muted/50 to-muted/30 text-foreground/90 shadow-sm backdrop-blur-sm transition-all duration-200 dark:border-border/70 dark:from-muted/50 dark:to-muted/30 dark:text-foreground/95",
        "glass-primary":
          "!bg-foreground !text-background border border-foreground shadow-sm backdrop-blur-sm transition-all duration-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
