import { Hammer } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";

interface EmptyStateActionsProps {
  handleTool: () => void;
}

const EmptyStateActions: React.FC<EmptyStateActionsProps> = ({ handleTool }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="grid w-full max-w-2xl grid-cols-1 gap-8">
        <Button
          onClick={handleTool}
          className="group flex hidden h-auto w-full flex-col justify-center rounded-2xl border border-primary/20 bg-card p-6 shadow-md transition-all duration-300 hover:border-primary/30 hover:shadow-lg md:flex md:h-80"
          variant="outline"
          size="lg"
        >
          <div className="flex flex-col items-center justify-center gap-4 md:gap-7">
            <div className="rounded-full bg-primary/25 p-4 transition-colors duration-300 md:p-6">
              <Hammer
                className="h-12 w-12 text-foreground group-hover:text-foreground md:h-16 md:w-16"
                strokeWidth={1.5}
              />
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="mb-1 max-w-full font-semibold text-lg md:mb-2 md:text-2xl">
                Tool
              </span>
              <span className="max-w-full text-muted-foreground text-xs md:text-sm">
                Execute a series of steps
              </span>
            </div>
          </div>
        </Button>
        <div className="text-center text-muted-foreground text-sm md:hidden">
          No tools have been saved yet
        </div>
      </div>
    </div>
  );
};

export default EmptyStateActions;
