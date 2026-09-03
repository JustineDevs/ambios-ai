import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Copy,
  Info,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  ShieldAlert,
  Timer,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/general-utils";

const developmentAuthBypass =
  process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_AUTH_DISABLE === "true";

type PageTone = "neutral" | "success" | "warning" | "danger";

const toneClasses: Record<PageTone, string> = {
  neutral: "border-border/60 bg-card/60",
  success: "border-emerald-500/30 bg-emerald-500/5",
  warning: "border-amber-500/30 bg-amber-500/5",
  danger: "border-destructive/40 bg-destructive/5",
};

export function EnterprisePage({
  eyebrow,
  title,
  description,
  actions,
  breadcrumb = "Operations",
  environment = developmentAuthBypass ? "Development · auth bypass" : "Production",
  workspace = developmentAuthBypass ? "No authenticated workspace" : "Current workspace",
  showContext = true,
  updatedAt,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: string;
  environment?: string;
  workspace?: string;
  showContext?: boolean;
  updatedAt?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("grid min-h-full gap-6 p-6 sm:p-8", className)}>
      <header className="flex flex-col justify-between gap-4 border-border/60 border-b pb-5 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs">
            {breadcrumb} <span className="px-1">/</span> {workspace}
          </p>
          {eyebrow && (
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.16em]">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-1 font-semibold text-3xl tracking-tight">{title}</h1>
          {description && (
            <p className="mt-2 max-w-3xl text-muted-foreground text-sm leading-6">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </header>
      {showContext && (
        <div className="-mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground text-xs">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            {environment}
          </span>
          <span>{workspace}</span>
          {updatedAt && <Freshness updatedAt={updatedAt} />}
        </div>
      )}
      {children}
    </section>
  );
}

export function EnterpriseSummary({
  items,
}: {
  items: Array<{ label: string; value: ReactNode; detail?: string; tone?: PageTone }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn("rounded-xl border p-4", toneClasses[item.tone ?? "neutral"])}
        >
          <p className="text-muted-foreground text-xs uppercase tracking-wide">{item.label}</p>
          <p className="mt-2 font-semibold text-2xl tracking-tight">{item.value}</p>
          {item.detail && <p className="mt-1 text-muted-foreground text-xs">{item.detail}</p>}
        </div>
      ))}
    </div>
  );
}

export function Freshness({
  updatedAt,
  onRefresh,
  loading = false,
}: {
  updatedAt?: string;
  onRefresh?: () => void;
  loading?: boolean;
}) {
  const label = updatedAt ? `Updated ${updatedAt}` : "Update time unavailable";
  return (
    <div className="flex items-center gap-2 text-muted-foreground text-xs" aria-live="polite">
      <Clock3 className="size-3.5" aria-hidden="true" />
      <span>{label}</span>
      {onRefresh && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh data"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

export function EnterpriseState({
  tone = "neutral",
  title,
  description,
  action,
  loading = false,
}: {
  tone?: PageTone;
  title: string;
  description?: string;
  action?: ReactNode;
  loading?: boolean;
}) {
  const Icon = loading
    ? Loader2
    : tone === "danger"
      ? AlertCircle
      : tone === "success"
        ? CheckCircle2
        : tone === "warning"
          ? Clock3
          : Info;
  return (
    <div
      className={cn("rounded-xl border p-6", toneClasses[tone])}
      role={tone === "danger" ? "alert" : undefined}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={cn("mt-0.5 size-5 shrink-0", loading && "animate-spin")}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="font-medium">{title}</p>
          {description && (
            <p className="mt-1 text-muted-foreground text-sm leading-6">{description}</p>
          )}
          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return <EnterpriseState title={title} description={description} action={action} />;
}

export function ErrorState({ title, description, action }: EmptyStateProps) {
  return <EnterpriseState tone="danger" title={title} description={description} action={action} />;
}

export function PermissionState({ description, action }: Omit<EmptyStateProps, "title">) {
  return (
    <EnterpriseState
      tone="warning"
      title="Permission required"
      description={description}
      action={action}
    />
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function StaleDataBanner({
  message = "Some data may be stale. Refresh to confirm the current provider state.",
  onRefresh,
}: {
  message?: string;
  onRefresh?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-amber-700 text-sm dark:text-amber-300">
      <span className="inline-flex items-center gap-2">
        <Timer className="size-4" aria-hidden="true" />
        {message}
      </span>
      {onRefresh && (
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="mr-2 size-3.5" aria-hidden="true" /> Refresh
        </Button>
      )}
    </div>
  );
}

export function PageToolbar({
  children,
  onRefresh,
  refreshing = false,
}: {
  children?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/40 p-3">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div>
      {onRefresh && (
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw
            className={cn("mr-2 size-3.5", refreshing && "animate-spin")}
            aria-hidden="true"
          />
          Refresh
        </Button>
      )}
    </div>
  );
}

export function RiskBadge({ risk }: { risk: string }) {
  const normalized = risk.toLowerCase();
  const tone =
    normalized === "critical" || normalized === "high"
      ? "danger"
      : normalized === "medium"
        ? "warning"
        : "success";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs capitalize",
        toneClasses[tone],
      )}
    >
      <ShieldAlert className="size-3" aria-hidden="true" /> {risk}
    </span>
  );
}

export function ScopeSummary({
  scopes,
  emptyLabel = "No scopes recorded",
}: {
  scopes: string[];
  emptyLabel?: string;
}) {
  if (scopes.length === 0)
    return <span className="text-muted-foreground text-sm">{emptyLabel}</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {scopes.map((scope) => (
        <span key={scope} className="rounded-md border bg-muted/40 px-2 py-1 font-mono text-xs">
          {scope}
        </span>
      ))}
    </div>
  );
}

export type TimelineItem = {
  title: string;
  description?: string;
  timestamp?: string;
  status?: string;
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="space-y-4">
      {items.map((item, index) => (
        <li key={`${item.title}-${item.timestamp ?? "step"}`} className="relative flex gap-3">
          {index < items.length - 1 && (
            <span
              className="absolute top-7 left-2.5 h-[calc(100%+0.5rem)] w-px bg-border"
              aria-hidden="true"
            />
          )}
          <span className="relative z-10 mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border bg-background">
            {item.status ? (
              <OperationDot status={item.status} />
            ) : (
              <span className="size-1.5 rounded-full bg-muted-foreground" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium text-sm">{item.title}</p>
              {item.timestamp && (
                <time className="text-muted-foreground text-xs">{item.timestamp}</time>
              )}
            </div>
            {item.description && (
              <p className="mt-1 text-muted-foreground text-xs leading-5">{item.description}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function OperationDot({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const className =
    normalized.includes("fail") || normalized.includes("deny")
      ? "bg-destructive"
      : normalized.includes("success") || normalized.includes("complete")
        ? "bg-emerald-500"
        : "bg-primary";
  return (
    <span
      className={cn("size-1.5 rounded-full", className)}
      data-status={status}
      aria-hidden="true"
    />
  );
}

export function DetailDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="mt-6">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

export function AuditEvent({
  actor,
  action,
  resource,
  timestamp,
  result,
}: {
  actor: string;
  action: string;
  resource?: string;
  timestamp?: string;
  result?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0 flex-1 text-sm">
        <p>
          <span className="font-medium">{actor}</span> {action}
          {resource ? ` · ${resource}` : ""}
        </p>
        {result && <p className="mt-1 text-muted-foreground text-xs">{result}</p>}
      </div>
      {timestamp && <time className="shrink-0 text-muted-foreground text-xs">{timestamp}</time>}
    </div>
  );
}

export function ExecutionProgress({ status, steps }: { status: string; steps: TimelineItem[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 font-medium text-sm">
        <OperationDot status={status} /> {status}
      </div>
      <Timeline items={steps} />
    </div>
  );
}

export function ApprovalCard({
  action,
  risk,
  expiresAt,
  children,
}: {
  action: string;
  risk: string;
  expiresAt?: string;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-sm">{action}</p>
        <RiskBadge risk={risk} />
      </div>
      {expiresAt && <p className="text-muted-foreground text-xs">Expires {expiresAt}</p>}
      {children}
    </div>
  );
}

export function ChangeDiff({ before, after }: { before: string; after: string }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
        <p className="mb-2 font-medium text-xs uppercase tracking-wide">Before</p>
        <pre className="whitespace-pre-wrap break-words text-xs">{before}</pre>
      </div>
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
        <p className="mb-2 font-medium text-xs uppercase tracking-wide">After</p>
        <pre className="whitespace-pre-wrap break-words text-xs">{after}</pre>
      </div>
    </div>
  );
}

export function EnvironmentSwitcher({ value = "Production" }: { value?: string }) {
  return (
    <span className="rounded-md border bg-muted/30 px-2 py-1 text-xs">Environment: {value}</span>
  );
}

export function WorkspaceSwitcher({ value = "Current workspace" }: { value?: string }) {
  return (
    <span className="rounded-md border bg-muted/30 px-2 py-1 text-xs">Workspace: {value}</span>
  );
}

export function EnterpriseContextBar() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/10 px-6 py-2 text-muted-foreground text-xs">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
          Control plane active
        </span>
        <EnvironmentSwitcher
          value={developmentAuthBypass ? "Development · auth bypass" : "Production"}
        />
        <WorkspaceSwitcher
          value={developmentAuthBypass ? "No authenticated workspace" : "Current workspace"}
        />
      </div>
      <span>
        {developmentAuthBypass
          ? "Local test identity only · sign in for workspace data"
          : "State changes require policy and audit evidence"}
      </span>
    </div>
  );
}

export function CommandMenu({
  label = "More actions",
  children,
}: {
  label?: string;
  children?: ReactNode;
}) {
  return (
    <details className="relative">
      <summary
        className="flex size-9 cursor-pointer list-none items-center justify-center rounded-md border hover:bg-muted"
        aria-label={label}
      >
        <MoreHorizontal className="size-4" />
      </summary>
      <div className="absolute top-11 right-0 z-20 min-w-48 rounded-lg border bg-popover p-1 shadow-lg">
        {children ?? (
          <span className="block px-3 py-2 text-muted-foreground text-xs">
            No additional actions
          </span>
        )}
      </div>
    </details>
  );
}

export function CopyValue({ value }: { value: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-7"
      aria-label={`Copy ${value}`}
      onClick={() => void navigator.clipboard?.writeText(value)}
    >
      <Copy className="size-3.5" />
    </Button>
  );
}
