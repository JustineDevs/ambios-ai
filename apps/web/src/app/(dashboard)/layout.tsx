import { EnterpriseContextBar } from "@/components/ui/enterprise-page";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <EnterpriseContextBar />
      <div className="mx-auto w-full max-w-7xl flex-1 p-6">{children}</div>
    </div>
  );
}
