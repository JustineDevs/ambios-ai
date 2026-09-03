import { LockKeyhole } from "lucide-react";
import type { ReactNode } from "react";

export function LockedPage({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <div aria-hidden="true" className="h-full select-none overflow-hidden blur-[3px]" inert>
        {children}
      </div>
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/45 p-6 backdrop-blur-[1px]">
        <div
          className="w-full max-w-sm rounded-2xl border border-border/70 bg-background/90 p-6 text-center shadow-xl backdrop-blur-xl"
          role="status"
          aria-label="Page locked"
        >
          <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </div>
          <h1 className="mt-4 font-semibold text-lg">Page locked</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            This area is temporarily unavailable. Contact your workspace administrator to unlock it.
          </p>
        </div>
      </div>
    </div>
  );
}
