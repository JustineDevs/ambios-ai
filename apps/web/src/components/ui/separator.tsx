import { cn } from "@/lib/general-utils";

export function Separator({ className }: { className?: string }) {
  return <hr className={cn("h-px w-full border-0 bg-border", className)} />;
}
