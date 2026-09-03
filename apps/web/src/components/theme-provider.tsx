"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import type * as React from "react";
import { useEffect } from "react";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <ThemeAttributeSync />
      {children}
    </NextThemesProvider>
  );
}

function ThemeAttributeSync() {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    if (resolvedTheme === "light" || resolvedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", resolvedTheme);
    }
  }, [resolvedTheme]);
  return null;
}
