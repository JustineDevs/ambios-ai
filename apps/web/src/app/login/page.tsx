"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { BloubBot } from "@/components/animation/bloub/BloubBot";
import { Auth6 } from "@/components/ui/auth-06";
import { useAuthClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const { signInWithOAuth, signInWithPassword, isLoading } = useAuthClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("error");
    const description = params.get("error_description");
    if (value) {
      setError(
        value === "auth-code-error"
          ? description || "Authentication could not be completed. Please try again."
          : description || value,
      );
    }
  }, []);

  async function continueWithGoogle() {
    setError(null);
    const result = await signInWithOAuth("google");
    if (result.error) setError(result.error.message);
  }

  async function continueWithPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPasswordSubmitting(true);
    const result = await signInWithPassword(email.trim(), password);
    setIsPasswordSubmitting(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    const next = new URLSearchParams(window.location.search).get("next");
    const destination = next?.startsWith("/") && !next.startsWith("//") ? next : "/";
    router.replace(destination);
  }

  return (
    <div>
      <Auth6
        brandIcon={<BloubBot state="idle" size={40} label="AmbiOS login assistant" />}
        heading="Welcome to AmbiOS AI"
        description="Connect your workspace and collaborate with your AI operations team."
        socialProviders={[
          {
            label: isLoading ? "Connecting…" : "Continue with Google",
            icon: <FcGoogle className="h-5 w-5" />,
            onClick: () => void continueWithGoogle(),
          },
        ]}
        legalPrefix="By continuing, you agree to our"
        legalLinks={[
          { text: "Terms of Service", href: "/terms" },
          { text: "Privacy Policy", href: "/privacy" },
        ]}
      />
      <form
        className="mx-auto mt-6 flex w-full max-w-sm flex-col gap-3 px-6"
        onSubmit={(event) => void continueWithPassword(event)}
      >
        <label className="text-sm" htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <label className="text-sm" htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isPasswordSubmitting || isLoading}
          className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground text-sm disabled:opacity-60"
        >
          {isPasswordSubmitting ? "Signing in…" : "Sign in with email"}
        </button>
      </form>
      {error && (
        <p
          aria-live="polite"
          className="fixed bottom-8 left-1/2 -translate-x-1/2 text-destructive text-sm"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
