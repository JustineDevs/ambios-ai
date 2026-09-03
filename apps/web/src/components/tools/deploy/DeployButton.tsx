"use client";

import type { Tool } from "@ambios-ai/shared";
import { CloudUpload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ToolDeployModal } from "./ToolDeployModal";

interface DeployButtonProps {
  tool: Tool;
  payload?: Record<string, any>;
  onBeforeOpen?: () => Promise<unknown> | undefined;
  disabled?: boolean;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "glass" | "outline" | "default" | "ghost";
  className?: string;
}

export function DeployButton({
  tool,
  payload = {},
  onBeforeOpen,
  disabled,
  size = "sm",
  variant = "glass",
  className,
}: DeployButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBeforeOpen) {
      setIsLoading(true);
      try {
        const result = await onBeforeOpen();
        if (result === false) return;
      } finally {
        setIsLoading(false);
      }
    }
    setIsOpen(true);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={className}
      >
        <CloudUpload className="h-4 w-4" />
        Deploy
      </Button>
      <ToolDeployModal
        currentTool={tool}
        payload={payload}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
