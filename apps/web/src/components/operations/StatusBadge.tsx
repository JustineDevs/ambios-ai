import { AlertCircle, CheckCircle2, Clock3, Info, Loader2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STATUS_META = {
  ready: { label: "Ready", icon: CheckCircle2, variant: "secondary" as const },
  connected: { label: "Connected", icon: CheckCircle2, variant: "secondary" as const },
  succeeded: { label: "Succeeded", icon: CheckCircle2, variant: "secondary" as const },
  pending: { label: "Pending", icon: Clock3, variant: "outline" as const },
  awaiting_approval: { label: "Awaiting approval", icon: Clock3, variant: "outline" as const },
  blocked: { label: "Blocked", icon: AlertCircle, variant: "outline" as const },
  failed: { label: "Failed", icon: XCircle, variant: "destructive" as const },
  unavailable: { label: "Unavailable", icon: AlertCircle, variant: "destructive" as const },
  unsupported: { label: "Unsupported", icon: Info, variant: "outline" as const },
  loading: { label: "Loading", icon: Loader2, variant: "outline" as const },
} as const;

type StatusKey = keyof typeof STATUS_META;

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const key = (status?.toLowerCase().replaceAll("-", "_") ?? "unavailable") as StatusKey;
  const meta = STATUS_META[key] ?? {
    label: status?.replaceAll("_", " ") ?? "Unavailable",
    icon: Info,
    variant: "outline" as const,
  };
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant} aria-label={`Status: ${meta.label}`}>
      <Icon className="mr-1 size-3.5" aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}
