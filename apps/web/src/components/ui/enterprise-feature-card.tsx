import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/general-utils";

interface EnterpriseFeatureCardProps {
  title: string;
  description: string;
  className?: string;
}

export function EnterpriseFeatureCard({
  title,
  description,
  className,
}: EnterpriseFeatureCardProps) {
  return (
    <div
      className={cn("rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-4", className)}
    >
      <div className="mb-3 flex items-center gap-2">
        <Badge variant="glass-primary" className="h-5 px-2 text-[10px] uppercase tracking-[0.08em]">
          Enterprise
        </Badge>
        <span className="flex items-center gap-1.5 font-medium text-foreground text-sm">
          <Lock className="h-3.5 w-3.5" />
          {title}
        </span>
      </div>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
