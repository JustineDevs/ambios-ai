"use client";

import type { User } from "@supabase/supabase-js";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function useUser() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial user
    void supabase.auth
      .getUser()
      .then(({ data: { user } }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, isLoading };
}

export function useAuthClient() {
  const supabase = createClient();
  const { user, isLoading } = useUser();

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    signOut: async () => {
      await supabase.auth.signOut();
    },
    signInWithOAuth: async (provider: "google") => {
      const next = `${window.location.pathname}${window.location.search}`;
      const result = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          // Keep URL generation separate from navigation. This makes the
          // redirect reliable in embedded browsers and lets the caller show
          // a useful error when the provider cannot be initialized.
          skipBrowserRedirect: true,
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (!result.error && result.data.url) {
        window.location.replace(result.data.url);
      }

      return result;
    },
  };
}
