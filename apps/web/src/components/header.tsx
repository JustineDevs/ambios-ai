"use client";
import Link from "next/link";

import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";
import UserMenu from "./user-menu";

export default function Header() {
  const links = [
    { to: "/", label: "Overview" },
    { to: "/workspace", label: "Workspace" },
    { to: "/incidents", label: "Incidents" },
    { to: "/console", label: "Activity" },
    { to: "/ai", label: "AI" },
  ] as const;

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-2 py-1">
        <nav className="flex gap-4 text-lg">
          {links.map(({ to, label }) => {
            return (
              <Link key={to} href={to}>
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeTogglerButton direction="ltr" aria-label="Toggle theme" />
          <UserMenu />
        </div>
      </div>
      <hr />
    </div>
  );
}
