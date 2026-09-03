"use client";

import { useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { BloubBot } from "@/components/animation/bloub/BloubBot";
import { Auth6 } from "@/components/ui/auth-06";
import { useAuthClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const { signInWithOAuth, isLoading } = useAuthClient();

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
    try {
      const result = await signInWithOAuth("google");
      if (result.error) setError(result.error.message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Google sign-in could not be started.");
    }
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
            href: "/auth/google",
            onClick: () => void continueWithGoogle(),
          },
        ]}
        legalPrefix="By continuing, you agree to our"
        legalLinks={[
          { text: "Terms of Service", href: "/terms" },
          { text: "Privacy Policy", href: "/privacy" },
        ]}
      />
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
