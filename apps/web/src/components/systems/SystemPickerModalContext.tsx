"use client";

import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useAgentModal } from "@/components/agent/AgentModalContext";
import { SystemTemplatePicker } from "@/components/systems/SystemTemplatePicker";
import { Button } from "@/components/ui/button";

interface SystemPickerModalContextValue {
  openSystemPicker: () => void;
  closeSystemPicker: () => void;
  isSystemPickerOpen: boolean;
}

const SystemPickerModalContext = createContext<SystemPickerModalContextValue | null>(null);

export function useSystemPickerModal() {
  const context = useContext(SystemPickerModalContext);
  if (!context) {
    throw new Error("useSystemPickerModal must be used within SystemPickerModalProvider");
  }
  return context;
}

interface SystemPickerModalProviderProps {
  children: ReactNode;
}

export function SystemPickerModalProvider({ children }: SystemPickerModalProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { registerOnClose } = useAgentModal();
  const _pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, []);

  const closeSystemPicker = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    return registerOnClose(closeSystemPicker);
  }, [registerOnClose, closeSystemPicker]);

  const openSystemPicker = useCallback(() => {
    setIsOpen(true);
  }, []);

  return (
    <SystemPickerModalContext.Provider
      value={{ openSystemPicker, closeSystemPicker, isSystemPickerOpen: isOpen }}
    >
      {children}
    </SystemPickerModalContext.Provider>
  );
}

export function SystemPickerModalContent() {
  const { isSystemPickerOpen, closeSystemPicker } = useSystemPickerModal();

  if (!isSystemPickerOpen) return null;

  return (
    <div className="absolute inset-0 z-40 bg-background">
      <Button
        variant="ghost"
        size="icon"
        onClick={closeSystemPicker}
        className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-muted/80 hover:bg-muted"
      >
        <X className="h-5 w-5" />
      </Button>
      <div className="flex h-full flex-col overflow-hidden p-8">
        <SystemTemplatePicker showHeader={true} className="flex-1" />
      </div>
    </div>
  );
}
