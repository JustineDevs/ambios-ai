"use client";

import { Eye, EyeOff, KeyRound, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseCredentialsHelper } from "@/lib/client-utils";
import { cn } from "@/lib/general-utils";

type Credential = {
  key: string;
  value: string;
};

interface CredentialsManagerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string; // Placeholder text for field name input
  templateMode?: boolean; // If true, only accept field names (no values)
}

function getDuplicateIndexesExceptFirst(creds: Credential[]): Set<number> {
  const keyMap = new Map<string, number[]>();
  creds.forEach((cred, idx) => {
    if (!cred.key.trim()) return;
    if (!keyMap.has(cred.key)) keyMap.set(cred.key, []);
    keyMap.get(cred.key)?.push(idx);
  });
  const dups = new Set<number>();
  for (const arr of keyMap.values()) {
    if (arr.length > 1) {
      for (const idx of arr.slice(1)) dups.add(idx);
    }
  }
  return dups;
}

export function CredentialsManager({
  value,
  onChange,
  className,
  placeholder = "e.g., api_key, bearer_token, client_secret",
  templateMode = false,
}: CredentialsManagerProps) {
  const [credentials, setCredentials] = useState<Credential[]>(() => {
    try {
      const parsedCreds = parseCredentialsHelper(value);
      return Object.entries(parsedCreds).map(([key, value]) => ({
        key,
        value: String(value),
      }));
    } catch {
      return [];
    }
  });
  const [showValues, setShowValues] = useState<Record<number, boolean>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCredName, setNewCredName] = useState("");
  const [newCredValue, setNewCredValue] = useState("");
  const [showNewCredValue, setShowNewCredValue] = useState(false);
  const lastPushedValueRef = useRef(value);

  useEffect(() => {
    if (value === lastPushedValueRef.current) return;
    lastPushedValueRef.current = value;
    try {
      const parsedCreds = parseCredentialsHelper(value);
      const entries = Object.entries(parsedCreds).map(([key, value]) => ({
        key,
        value: String(value),
      }));
      setCredentials(entries);
    } catch (_e) {
      setCredentials([]);
    }
  }, [value]);

  const duplicateIndexes = useMemo(
    () => getDuplicateIndexesExceptFirst(credentials),
    [credentials],
  );

  const updateCredentials = (newCredentials: Credential[]) => {
    setCredentials(newCredentials);
    const seen = new Set<string>();
    const validCreds = newCredentials.filter((cred, idx) => {
      if (!cred.key.trim()) return false;
      if (duplicateIndexes.has(idx)) return false;
      if (seen.has(cred.key)) return false;
      seen.add(cred.key);
      return true;
    });
    const credObject = validCreds.reduce(
      (obj, cred) => {
        obj[cred.key] = cred.value;
        return obj;
      },
      {} as Record<string, string>,
    );
    onChange(JSON.stringify(credObject, null, 2));
    lastPushedValueRef.current = JSON.stringify(credObject, null, 2);
  };

  const handleAddCredential = () => {
    if (!newCredName.trim()) return;

    const isDuplicate = credentials.some((c) => c.key === newCredName.trim());
    if (isDuplicate) return;

    updateCredentials([
      ...credentials,
      { key: newCredName.trim(), value: templateMode ? "" : newCredValue },
    ]);
    setNewCredName("");
    setNewCredValue("");
    setShowNewCredValue(false);
    setIsAddDialogOpen(false);
  };

  const removeCredential = (index: number) => {
    updateCredentials(credentials.filter((_, i) => i !== index));
  };

  const updateCredentialValue = (index: number, newValue: string) => {
    const newCredentials = credentials.map((cred, i) =>
      i === index ? { ...cred, value: newValue } : cred,
    );
    updateCredentials(newCredentials);
  };

  const toggleShowValue = (index: number) => {
    setShowValues((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const isDuplicateName = credentials.some((c) => c.key === newCredName.trim());

  return (
    <div className={cn(className)}>
      {credentials.length === 0 ? (
        <button
          type="button"
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-background/40 py-8 backdrop-blur-sm transition-colors hover:bg-background/60"
          onClick={() => setIsAddDialogOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setIsAddDialogOpen(true);
          }}
        >
          <div className="mb-3 rounded-full bg-muted p-3">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mb-1 font-medium text-muted-foreground text-sm">
            No credentials configured
          </p>
          <p className="text-muted-foreground/70 text-xs">Click to add your first credential</p>
        </button>
      ) : (
        <div className="space-y-2">
          {credentials.map((cred, index) => (
            <div
              key={cred.key}
              className={cn(
                "group flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-muted/60 to-muted/30 p-3 transition-all",
                "hover:from-muted/70 hover:to-muted/40",
                duplicateIndexes.has(index) && "border-red-500/50 bg-red-500/5",
              )}
            >
              <div className="flex-shrink-0 rounded-md p-2">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="truncate font-medium text-sm">{cred.key}</span>
                  {duplicateIndexes.has(index) && (
                    <span className="font-medium text-[10px] text-red-500">Duplicate</span>
                  )}
                </div>
                {!templateMode && (
                  <div className="relative">
                    <Input
                      type={showValues[index] ? "text" : "password"}
                      value={cred.value}
                      onChange={(e) => updateCredentialValue(index, e.target.value)}
                      placeholder="Enter value..."
                      autoComplete="new-password"
                      className="h-8 bg-background pr-8 text-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-0 right-0 h-8 w-8 hover:bg-transparent"
                      onClick={() => toggleShowValue(index)}
                    >
                      {showValues[index] ? (
                        <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                onClick={() => removeCredential(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            variant="glass"
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
            className="h-10 border-dashed transition-all hover:border-solid hover:bg-muted/50"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Credential
          </Button>
        </div>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="rounded-md bg-primary/10 p-2">
                <KeyRound className="h-4 w-4 text-primary" />
              </div>
              {templateMode ? "Add Credential Field" : "Add Credential"}
            </DialogTitle>
            <DialogDescription>
              {templateMode
                ? "Add the name of a credential field that end users will provide."
                : "Add a new API key, token, or secret for this system."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cred-name" className="font-medium text-sm">
                {templateMode ? "Field Name" : "Credential Name"}
              </Label>
              <Input
                id="cred-name"
                value={newCredName}
                onChange={(e) => setNewCredName(e.target.value)}
                placeholder={placeholder}
                autoComplete="off"
                className={cn(
                  "h-10",
                  isDuplicateName &&
                    newCredName.trim() &&
                    "border-red-500 focus-visible:ring-red-500",
                )}
              />
              {isDuplicateName && newCredName.trim() && (
                <p className="text-red-500 text-xs">A credential with this name already exists</p>
              )}
            </div>
            {!templateMode && (
              <div className="space-y-2">
                <Label htmlFor="cred-value" className="font-medium text-sm">
                  Value
                </Label>
                <div className="relative">
                  <Input
                    id="cred-value"
                    type={showNewCredValue ? "text" : "password"}
                    value={newCredValue}
                    onChange={(e) => setNewCredValue(e.target.value)}
                    placeholder="Enter your credential value"
                    autoComplete="new-password"
                    className="h-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-0 right-0 h-10 w-10 hover:bg-transparent"
                    onClick={() => setShowNewCredValue(!showNewCredValue)}
                  >
                    {showNewCredValue ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="glass"
              onClick={() => {
                setIsAddDialogOpen(false);
                setNewCredName("");
                setNewCredValue("");
                setShowNewCredValue(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddCredential} disabled={!newCredName.trim() || isDuplicateName}>
              {templateMode ? "Add Field" : "Add Credential"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
