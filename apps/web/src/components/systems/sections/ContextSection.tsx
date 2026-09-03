"use client";

import { ALLOWED_FILE_EXTENSIONS } from "@ambios-ai/shared";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  FileText,
  Globe,
  Link,
  Loader2,
  Pencil,
  RotateCw,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileContentViewer } from "@/components/ui/FileContentViewer";
import { HelpTooltip } from "@/components/utils/HelpTooltip";
import { formatBytes } from "@/lib/file-utils";
import { cn } from "@/lib/general-utils";
import type { DocFile } from "@/queries/doc-files";
import { useAmbiOSClient } from "@/queries/use-client";
import { useSystemConfig } from "../context";
import { useDocFiles } from "../hooks/use-doc-files";
import { useFilePreview } from "../hooks/use-file-preview";

const BLOCKED_DOC_EXTENSIONS = [".zip", ".gz"];

function formatRelativeDate(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function DocCard({
  file,
  onRequestDelete,
  onPreview,
}: {
  file: DocFile;
  onRequestDelete: (file: DocFile) => void;
  onPreview: (file: DocFile) => void;
}) {
  const isProcessing = file.status === "PROCESSING" || file.status === "PENDING";
  const isFailed = file.status === "FAILED";
  const isCompleted = file.status === "COMPLETED";

  const SourceIcon =
    file.source === "scrape" ? Globe : file.source === "openapi" ? BookOpen : FileText;

  const displayName =
    file.source === "scrape" && file.sourceUrl
      ? (() => {
          try {
            return new URL(file.sourceUrl).hostname.replace(/^www\./, "");
          } catch {
            return file.sourceUrl;
          }
        })()
      : file.fileName.length > 32
        ? (() => {
            const dotIdx = file.fileName.lastIndexOf(".");
            return dotIdx > 0
              ? `${file.fileName.slice(0, 28)}…${file.fileName.slice(dotIdx)}`
              : `${file.fileName.slice(0, 29)}…`;
          })()
        : file.fileName;

  const fullName = file.source === "scrape" && file.sourceUrl ? file.sourceUrl : file.fileName;

  const sourceLabel =
    file.source === "openapi" ? "OpenAPI" : file.source === "scrape" ? "Web" : "File";

  return (
    <div
      className={cn(
        "group relative flex w-[120px] cursor-default select-none flex-col items-center rounded-xl px-2 py-3 transition-all duration-200",
        "hover:bg-muted/40",
      )}
      title={fullName}
    >
      {!isProcessing && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRequestDelete(file);
          }}
          className="absolute top-1 right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-border/50 bg-background/80 text-muted-foreground opacity-0 shadow-sm transition-all hover:border-border hover:text-foreground group-hover:opacity-100"
          title="Delete"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}

      <button
        type="button"
        className={cn(
          "relative flex h-[84px] w-[72px] flex-col items-center justify-center gap-1.5 rounded-lg transition-all duration-200",
          "border border-border/40 bg-gradient-to-b from-muted/60 to-muted/30",
          "shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
          isCompleted && "cursor-pointer group-hover:border-border/50 group-hover:shadow-md",
          isProcessing && "opacity-35",
          isFailed && "border-destructive/20 opacity-35",
        )}
        onClick={() => isCompleted && onPreview(file)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && isCompleted) onPreview(file);
        }}
      >
        {isProcessing ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
        ) : isFailed ? (
          <X className="h-6 w-6 text-destructive/50" />
        ) : (
          <SourceIcon className="h-6 w-6 text-muted-foreground/40" />
        )}
        <span className="font-medium text-[8px] text-muted-foreground/40 uppercase tracking-wider">
          {sourceLabel}
        </span>
      </button>

      <div className="mt-2 w-full px-0.5 text-center">
        <span
          className={cn(
            "block truncate font-medium text-[11px] leading-tight",
            isProcessing ? "text-muted-foreground/35" : "text-foreground/70",
            isFailed && "text-destructive/50",
          )}
        >
          {displayName}
        </span>
        {isProcessing && (
          <span className="mt-0.5 block text-[9px] text-muted-foreground/30">Processing…</span>
        )}
        {isFailed && (
          <span className="mt-0.5 block truncate text-[9px] text-destructive/40" title={file.error}>
            Failed
          </span>
        )}
        {isCompleted && file.createdAt && (
          <span className="mt-0.5 block text-[9px] text-muted-foreground/25">
            {formatRelativeDate(file.createdAt)}
          </span>
        )}
      </div>
    </div>
  );
}

function UsageInstructions({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editValue.length, editValue.length);
    }
  }, [isEditing, editValue.length]);

  const handleSave = () => {
    onChange(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") handleCancel();
    if (e.key === "Enter" && e.metaKey) handleSave();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm">Usage Instructions</span>
        <HelpTooltip text="These instructions are emphasized when ambios builds or fixes tools for this system. Use them for rate limits, pagination rules, auth quirks, special endpoints, etc." />
        {!isEditing && (
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-muted"
              title="Edit instructions"
            >
              <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
      {isEditing ? (
        <div className="relative rounded-lg border bg-muted/30 shadow-sm">
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={10000}
            className="min-h-[72px] w-full resize-y border-0 bg-transparent px-3 py-2 pr-20 text-[13px] shadow-none focus:outline-none focus:ring-0"
            placeholder="e.g., Always use pagination with max 50 items per page. Rate limit is 100 req/min..."
          />
          <div className="absolute top-1 right-1 flex items-center gap-1">
            <button
              type="button"
              onClick={handleSave}
              className="flex h-6 w-6 items-center justify-center rounded text-green-600 transition-colors hover:bg-green-500/20"
              title="Save (⌘+Enter)"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex h-6 w-6 items-center justify-center rounded text-red-600 transition-colors hover:bg-red-500/20"
              title="Cancel (Esc)"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="absolute right-2 bottom-1.5 rounded bg-background/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {editValue.length.toLocaleString()}/10,000
          </div>
        </div>
      ) : value ? (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setIsEditing(true);
          }}
          className="line-clamp-3 cursor-pointer text-[13px] text-muted-foreground leading-relaxed transition-colors hover:text-foreground"
        >
          {value}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setIsEditing(true);
          }}
          className="cursor-pointer rounded-lg border border-border/50 border-dashed bg-muted/10 px-3 py-4 transition-colors hover:border-border/70"
        >
          <p className="text-[13px] text-muted-foreground/60 italic transition-colors hover:text-muted-foreground">
            No instructions set — click to add
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground/40">
            e.g., rate limits, pagination rules, auth quirks, special endpoints...
          </p>
        </button>
      )}
    </div>
  );
}

export function ContextSection({ showRefreshButton = true }: { showRefreshButton?: boolean }) {
  const { context, system, setSpecificInstructions, setDocFileCount } = useSystemConfig();

  const createClient = useAmbiOSClient();
  const client = useMemo(() => createClient(), [createClient]);

  const {
    docFiles,
    isLoadingDocs,
    hasFetched,
    deleteTarget,
    setDeleteTarget,
    isDeleting,
    isAddingUrl,
    inlineMessage,
    looksLikeOpenApi,
    handleFileUpload,
    handleAddUrl,
    handleConfirmDelete,
    refreshDocFiles,
  } = useDocFiles(system.id);

  const { previewFile, previewContent, previewLoading, handlePreview, closePreview } =
    useFilePreview(client);

  const [addUrl, setAddUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (hasFetched) setDocFileCount(docFiles.length);
  }, [docFiles.length, setDocFileCount, hasFetched]);

  useEffect(() => {
    if (hasFetched) setLastRefreshedAt(new Date());
  }, [hasFetched]);

  const onSubmitUrl = () => {
    const url = addUrl.trim();
    if (!url) return;
    setAddUrl("");
    setShowUrlInput(false);
    handleAddUrl(url);
  };

  if (previewFile) {
    return (
      <div className="flex h-[calc(100vh-280px)] min-h-[400px] flex-col">
        {previewLoading ? (
          <>
            <div className="mb-3 flex items-center gap-3">
              <button
                type="button"
                onClick={closePreview}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.06] text-muted-foreground backdrop-blur-sm transition-all hover:bg-white/[0.12] hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
              <span className="truncate font-medium text-[13px]">
                {previewFile.source === "scrape" && previewFile.sourceUrl
                  ? previewFile.sourceUrl
                  : previewFile.fileName}
              </span>
            </div>
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          </>
        ) : previewContent ? (
          <FileContentViewer content={previewContent} file={previewFile} onClose={closePreview} />
        ) : (
          <>
            <div className="mb-3 flex items-center gap-3">
              <button
                type="button"
                onClick={closePreview}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.06] text-muted-foreground backdrop-blur-sm transition-all hover:bg-white/[0.12] hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="py-12 text-center text-muted-foreground text-sm">No content available</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Usage Instructions */}
      <div className="group">
        <UsageInstructions
          value={context.specificInstructions}
          onChange={setSpecificInstructions}
        />
      </div>

      {/* Knowledge Base */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">Knowledge Base</span>
            <HelpTooltip text="Documentation files that ambios uses to understand this system. Files can be uploaded, or fetched from URLs (OpenAPI specs are auto-detected)." />
          </div>
          {system.id && (
            <div className="flex items-center gap-2">
              {!isLoadingDocs && docFiles.length > 0 && (
                <span className="text-[11px] text-muted-foreground/70 tabular-nums">
                  {(() => {
                    const totalBytes = docFiles.reduce((sum, f) => sum + (f.contentLength ?? 0), 0);
                    return totalBytes > 0
                      ? formatBytes(totalBytes)
                      : `${docFiles.length} file${docFiles.length !== 1 ? "s" : ""}`;
                  })()}
                </span>
              )}
              {lastRefreshedAt && (
                <span className="text-[11px] text-muted-foreground/60">
                  Refreshed {formatRelativeDate(lastRefreshedAt.toISOString())}
                </span>
              )}
              {showRefreshButton && (
                <button
                  type="button"
                  onClick={async () => {
                    await refreshDocFiles();
                    setLastRefreshedAt(new Date());
                  }}
                  disabled={isLoadingDocs}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg border border-border/40 bg-muted/20",
                    "text-muted-foreground transition-colors hover:bg-muted/35 hover:text-foreground",
                    "disabled:pointer-events-none disabled:opacity-50",
                  )}
                  title="Refresh knowledge base"
                  aria-label="Refresh knowledge base"
                >
                  {isLoadingDocs ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCw className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {system.id && !isLoadingDocs && (
          <div className="relative">
            {docFiles.length > 0 ? (
              <div className="flex min-h-[280px] flex-wrap content-start gap-2 rounded-xl border border-border/35 bg-muted/10 p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-sm">
                {docFiles.map((file) => (
                  <DocCard
                    key={file.id}
                    file={file}
                    onRequestDelete={setDeleteTarget}
                    onPreview={handlePreview}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-border/40 border-dashed bg-muted/10 backdrop-blur-sm">
                <div className="mb-3 flex gap-4 opacity-15">
                  <FileText className="h-9 w-9" />
                  <Globe className="h-9 w-9" />
                  <BookOpen className="h-9 w-9" />
                </div>
                <p className="text-[13px] text-muted-foreground/40">No files yet</p>
                <p className="mt-1 text-[11px] text-muted-foreground/25">
                  Upload files or add URLs below
                </p>
              </div>
            )}

            {inlineMessage && (
              <div className="fade-in slide-in-from-bottom-2 absolute right-0 bottom-12 left-0 z-10 flex animate-in justify-center px-2 duration-200">
                <div className="max-w-full rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-2 font-medium text-[12px] text-amber-800 shadow-md dark:text-amber-200">
                  {inlineMessage}
                </div>
              </div>
            )}

            {/* Bottom toolbar */}
            <div className="mt-2 flex items-center gap-2">
              {showUrlInput ? (
                <div className="fade-in flex flex-1 animate-in items-center gap-2 rounded-xl border border-border/55 bg-muted/25 px-3 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-sm duration-150">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/30 bg-muted/50">
                    <Link className="h-3.5 w-3.5 text-muted-foreground/60" />
                  </div>
                  <input
                    ref={urlInputRef}
                    value={addUrl}
                    onChange={(e) => setAddUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isAddingUrl && addUrl.trim()) onSubmitUrl();
                      if (e.key === "Escape") {
                        setShowUrlInput(false);
                        setAddUrl("");
                      }
                    }}
                    type="url"
                    className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/40"
                    placeholder="Paste URL — OpenAPI auto-detected, other pages scraped"
                    disabled={isAddingUrl}
                  />
                  {isAddingUrl ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground/50" />
                  ) : (
                    <div className="flex shrink-0 items-center gap-1.5">
                      {addUrl.trim() && (
                        <span className="rounded-md border border-border/20 bg-muted/40 px-1.5 py-0.5 font-medium text-[10px] text-muted-foreground/50">
                          {looksLikeOpenApi(addUrl.trim()) ? "OpenAPI" : "Scrape"}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={onSubmitUrl}
                        disabled={!addUrl.trim()}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/20 bg-primary/15 text-primary transition-colors hover:bg-primary/25 disabled:pointer-events-none disabled:opacity-30"
                        title="Add (Enter)"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowUrlInput(false);
                          setAddUrl("");
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/40 bg-muted/30 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                        title="Cancel (Esc)"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowUrlInput(true)}
                  className="flex items-center gap-2 rounded-xl border border-border/45 bg-muted/15 px-3.5 py-2 font-medium text-[12px] text-muted-foreground shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-border/60 hover:bg-muted/25 hover:text-foreground"
                >
                  <Link className="h-3.5 w-3.5" />
                  Add Documentation URL
                </button>
              )}
              {!showUrlInput && (
                <button
                  type="button"
                  onClick={() => document.getElementById("doc-file-upload")?.click()}
                  className="flex items-center gap-2 rounded-xl border border-border/45 bg-muted/15 px-3.5 py-2 font-medium text-[12px] text-muted-foreground shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-border/60 hover:bg-muted/25 hover:text-foreground"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload
                </button>
              )}
            </div>
          </div>
        )}

        {isLoadingDocs && docFiles.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      <input
        type="file"
        id="doc-file-upload"
        hidden
        multiple
        onChange={handleFileUpload}
        accept={ALLOWED_FILE_EXTENSIONS.filter((ext) => !BLOCKED_DOC_EXTENSIONS.includes(ext)).join(
          ",",
        )}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.source === "scrape" && deleteTarget?.sourceUrl
                  ? deleteTarget.sourceUrl
                  : deleteTarget?.fileName}
              </span>{" "}
              from the knowledge base? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
