"use client";

import { safeStringify } from "@ambios-ai/shared";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn, copyToClipboard } from "@/lib/general-utils";

export { copyToClipboard };

export const CopyButton = ({
  text,
  getData,
  className,
}: {
  text?: string;
  getData?: () => any;
  className?: string;
}) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const textToCopy = getData
      ? typeof getData() === "string"
        ? getData()
        : safeStringify(getData(), 2)
      : text || "";
    const success = await copyToClipboard(textToCopy);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };
  return (
    <button
      onClick={handleCopy}
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded backdrop-blur transition-colors hover:bg-background/80",
        className,
      )}
      title="Copy"
      type="button"
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-600" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
    </button>
  );
};
