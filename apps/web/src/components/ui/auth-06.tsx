"use client";

import { MdRocketLaunch } from "react-icons/md";
import { Button } from "@/components/ui/button";

export interface SocialProviderItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

export interface LegalLink {
  text: string;
  href?: string;
  onClick?: () => void;
}

export interface Auth6Props {
  brandIcon?: React.ReactNode;
  heading?: string;
  description?: string;
  socialProviders?: SocialProviderItem[];
  legalPrefix?: string;
  legalLinks?: LegalLink[];
  legalConjunction?: string;
}

export function Auth6({
  brandIcon,
  heading = "Get started with Orbit",
  description = "Launch your next project in seconds. Sign up or log in below.",
  socialProviders = [],
  legalPrefix = "By proceeding, you accept our",
  legalLinks = [
    { text: "Terms of Service", href: "#" },
    { text: "Privacy Policy", href: "#" },
  ],
  legalConjunction = "and the",
}: Auth6Props) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-16">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
          {brandIcon ?? <MdRocketLaunch className="h-7 w-7 text-primary-foreground" />}
        </div>

        <div className="space-y-2 text-center">
          <h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
            {heading}
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        </div>

        {socialProviders.length > 0 && (
          <div className="flex w-full flex-wrap items-center justify-center gap-2.5">
            {socialProviders.map((provider) => (
              <Button
                key={provider.label}
                asChild={Boolean(provider.href)}
                variant="outline"
                type="button"
                className="h-10 cursor-pointer gap-2 rounded-full bg-muted px-5 font-medium text-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0px_0px_0px_0.5px_rgba(0,0,0,0.08),0px_1px_2px_-1px_rgba(0,0,0,0.08),0px_2px_4px_0px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0px_0px_0px_0.5px_rgba(255,255,255,0.03),0px_1px_2px_-1px_rgba(255,255,255,0.08),0px_2px_4px_0px_rgba(255,255,255,0.08)]"
                onClick={provider.href ? undefined : provider.onClick}
              >
                {provider.href ? (
                  <a href={provider.href}>
                    {provider.icon}
                    {provider.label}
                  </a>
                ) : (
                  <>
                    {provider.icon}
                    {provider.label}
                  </>
                )}
              </Button>
            ))}
          </div>
        )}

        {legalLinks.length > 0 && (
          <p className="max-w-xs text-center text-muted-foreground text-xs leading-relaxed">
            {legalPrefix}{" "}
            {legalLinks.map((link, index) => (
              <span key={link.text}>
                {index > 0 && <span> {legalConjunction} </span>}
                <a
                  href={link.href}
                  onClick={link.onClick}
                  className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
                >
                  {link.text}
                </a>
              </span>
            ))}
            .
          </p>
        )}
      </div>
    </div>
  );
}
