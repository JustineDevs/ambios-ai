"use client";

import {
  Activity,
  Blocks,
  Book,
  Bot,
  Building2,
  ChevronDown,
  Code2,
  ExternalLink,
  Hammer,
  KeyRound,
  ListChecks,
  LogIn,
  LogOut,
  Menu,
  MessagesSquare,
  Plug,
  Settings2,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";
import { PlansButton } from "@/components/billing/PlansDialog";
import { useAuthClient } from "@/lib/auth-client";
import { cn } from "@/lib/general-utils";

type NavItem = {
  icon: typeof MessagesSquare;
  label: string;
  href: string;
  target?: string;
};

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Build",
    items: [
      { icon: MessagesSquare, label: "Agent", href: "/" },
      { icon: Bot, label: "Agents", href: "/agents" },
      { icon: Hammer, label: "Tools", href: "/tools" },
      { icon: Code2, label: "API definitions", href: "/api-definitions" },
    ],
  },
  {
    label: "Operate",
    items: [
      { icon: Blocks, label: "Systems", href: "/systems" },
      { icon: ListChecks, label: "Runs", href: "/runs" },
      { icon: Activity, label: "Console", href: "/console" },
      { icon: TriangleAlert, label: "Incidents", href: "/incidents" },
      { icon: ShieldCheck, label: "Approvals", href: "/approvals" },
      { icon: Activity, label: "Deployment", href: "/deployment" },
    ],
  },
  {
    label: "Connect",
    items: [
      { icon: Plug, label: "Services", href: "/services" },
      { icon: Plug, label: "Plugins", href: "/plugins" },
      { icon: Settings2, label: "Setup", href: "/setup" },
    ],
  },
  {
    label: "Manage",
    items: [
      { icon: Settings2, label: "Account", href: "/settings" },
      { icon: KeyRound, label: "API keys", href: "/settings/api-keys" },
      { icon: Building2, label: "Organization", href: "/workspace" },
      { icon: Activity, label: "Budget", href: "/budget" },
      { icon: TriangleAlert, label: "Support", href: "/support" },
    ],
  },
];

const docsNavItem = {
  icon: Book,
  label: "Docs",
  href: "/docs",
};

export function LeftSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, isLoading } = useAuthClient();
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      navGroups.map((group) => [
        group.label,
        group.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)),
      ]),
    ),
  );

  useEffect(() => {
    setIsOpen(false);
    setExpanded((current) =>
      Object.fromEntries(
        navGroups.map((group) => [
          group.label,
          current[group.label] ||
            group.items.some(
              (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
            ),
        ]),
      ),
    );
  }, [pathname]);

  async function handleAuth() {
    if (!user) {
      router.push("/login");
      return;
    }
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="ambios-primary-navigation"
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
        className="fixed top-3 right-3 z-50 flex h-11 w-11 items-center justify-center rounded-md border border-border bg-background p-2 lg:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>

      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        id="ambios-primary-navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-48 flex-shrink-0 transform flex-col border-border border-r bg-background transition-transform duration-200 ease-in-out lg:static lg:transform-none ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="p-5">
          <div className="relative mx-auto flex h-16 w-[160px] items-center justify-center overflow-visible">
            <Link href="/">
              <img
                src="/assets/image/banner-black-transparent.png"
                alt="AmbiOS AI logo"
                width={150}
                height={40}
                className="mx-auto block h-auto w-[150px] max-w-none cursor-pointer object-contain dark:hidden"
              />
              <img
                src="/assets/image/banner-white-transparent.png"
                alt="AmbiOS AI logo"
                width={150}
                height={40}
                className="mx-auto hidden h-auto w-[150px] max-w-none cursor-pointer object-contain dark:block"
              />
            </Link>
          </div>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto px-2 pt-2">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4">
              <button
                type="button"
                aria-expanded={expanded[group.label]}
                onClick={() =>
                  setExpanded((current) => ({ ...current, [group.label]: !current[group.label] }))
                }
                className="flex w-full items-center justify-between px-3 pb-2 text-left font-semibold text-[10px] text-muted-foreground/60 uppercase tracking-[0.16em]"
              >
                {group.label}
                <ChevronDown
                  className={cn(
                    "size-3 transition-transform",
                    expanded[group.label] && "rotate-180",
                  )}
                />
              </button>
              {expanded[group.label] &&
                group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      target={item.target || "_self"}
                      className={cn(
                        "mb-1 flex items-center rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                        isActive
                          ? "border border-border/50 bg-gradient-to-br from-muted/70 to-muted/50 font-medium text-foreground shadow-sm dark:border-border/70 dark:from-muted/70 dark:to-muted/50"
                          : "text-muted-foreground hover:bg-gradient-to-br hover:from-muted/40 hover:to-muted/20 hover:text-foreground dark:hover:from-muted/40 dark:hover:to-muted/20",
                      )}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {item.label}
                      {item.target === "_blank" && (
                        <ExternalLink className="ml-1.5 h-3 w-3 opacity-70" />
                      )}
                    </Link>
                  );
                })}
            </div>
          ))}

          {/* Docs Link */}
          <Link
            href={docsNavItem.href}
            className="mb-1 flex items-center rounded-xl px-3 py-2.5 text-muted-foreground text-sm transition-all duration-200 hover:bg-gradient-to-br hover:from-muted/40 hover:to-muted/20 hover:text-foreground dark:hover:from-muted/40 dark:hover:to-muted/20"
          >
            <docsNavItem.icon className="mr-3 h-4 w-4" />
            {docsNavItem.label}
          </Link>
        </nav>
        <div className="mt-auto border-border border-t p-3">
          <div className="mb-2 flex items-center gap-1">
            <ThemeTogglerButton
              direction="rtl"
              modes={["light", "dark"]}
              onImmediateChange={(theme) => {
                if (theme === "light" || theme === "dark") {
                  document.documentElement.setAttribute("data-theme", theme);
                }
              }}
              variant="ghost"
              size="sm"
              aria-label="Toggle theme"
              className="size-9 shrink-0"
            />
            <PlansButton className="h-9 min-w-0 flex-1 px-2 text-xs" />
          </div>
          <button
            type="button"
            onClick={handleAuth}
            disabled={isLoading}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            {user ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            {isLoading ? "Loading…" : user ? "Sign out" : "Sign in"}
          </button>
        </div>
      </div>
    </>
  );
}
