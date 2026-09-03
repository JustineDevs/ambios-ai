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
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });

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
      return supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
    },
    signInWithPassword: async (email: string, password: string) => {
      return supabase.auth.signInWithPassword({ email, password });
    },
  };
}
