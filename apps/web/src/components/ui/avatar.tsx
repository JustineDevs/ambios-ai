import type * as React from "react";
import { cn } from "@/lib/general-utils";

const Avatar = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn("relative flex size-10 shrink-0 overflow-hidden rounded-full", className)}
    {...props}
  />
);
const AvatarFallback = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      "flex size-full items-center justify-center rounded-full bg-muted text-sm",
      className,
    )}
    {...props}
  />
);

export { Avatar, AvatarFallback };
