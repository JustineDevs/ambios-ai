import Document from "@tiptap/extension-document";
import History from "@tiptap/extension-history";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { EditorContent, useEditor } from "@tiptap/react";
import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/general-utils";
import { templateStringToTiptap, tiptapToTemplateString } from "@/lib/templating-utils";
import { useExecution } from "../tools/context/tool-execution-context";
import { useTemplateAwareEditor } from "../tools/hooks/use-template-aware-editor";
import { TemplateEditPopover } from "../tools/templates/TemplateEditPopover";
import { TemplateExtension } from "../tools/templates/TemplateExtension";
import { VariableSuggestion } from "../tools/templates/TemplateVariableSuggestion";

interface TemplateAwareTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  stepId: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const SingleLineDocument = Document.extend({ content: "paragraph" });

const DEBOUNCE_MS = 200;

function coerceExtension(extension: unknown): any {
  // CI can end up with multiple physical @tiptap/core installs in the workspace tree,
  // which makes otherwise-compatible extensions fail nominal type checks.
  return extension as any;
}

function coerceEditorOptions(options: unknown): Parameters<typeof useEditor>[0] {
  // Cast the entire options object at the hook boundary so mixed @tiptap/core
  // identities in CI cannot leak through nested extension arrays.
  return options as Parameters<typeof useEditor>[0];
}

export function TemplateAwareTextEditor({
  value,
  onChange,
  stepId,
  placeholder,
  className,
  disabled = false,
}: TemplateAwareTextEditorProps) {
  const { getStepTemplateData } = useExecution();
  const { categorizedVariables, categorizedSources } = getStepTemplateData(stepId);

  const isUpdatingRef = useRef(false);
  const lastValueRef = useRef(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitializedRef = useRef(false);

  const debouncedOnChange = useCallback(
    (newValue: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onChange(newValue), DEBOUNCE_MS);
    },
    [onChange],
  );

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const {
    suggestionConfig,
    codePopoverOpen,
    setCodePopoverOpen,
    popoverAnchorRect,
    handleCodeSave,
    editorRef,
    cleanupSuggestion,
  } = useTemplateAwareEditor({ categorizedVariables, categorizedSources });

  useEffect(() => cleanupSuggestion, [cleanupSuggestion]);

  const editor = useEditor(
    coerceEditorOptions({
      extensions: [
        SingleLineDocument,
        Paragraph,
        Text,
        History,
        coerceExtension(TemplateExtension.configure({ stepId })),
        coerceExtension(VariableSuggestion.configure({ suggestion: suggestionConfig })),
      ] as unknown as Parameters<typeof useEditor>[0]["extensions"],
      content: templateStringToTiptap(value),
      editable: !disabled,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: cn(
            "min-h-9 w-full rounded-lg border bg-muted/30 px-3 py-2 font-mono text-xs shadow-sm",
            "scrollbar-thin overflow-x-auto overflow-y-hidden focus:outline-none",
            disabled && "cursor-not-allowed opacity-50",
          ),
          style: "line-height: 20px;",
        },
      },
      onUpdate: ({ editor }) => {
        if (isUpdatingRef.current) return;
        // Skip the initial update that fires when the editor is created
        if (!isInitializedRef.current) {
          isInitializedRef.current = true;
          // Update lastValueRef to the normalized value to prevent spurious onChange
          lastValueRef.current = tiptapToTemplateString(editor.getJSON());
          return;
        }
        const newValue = tiptapToTemplateString(editor.getJSON());
        if (newValue !== lastValueRef.current) {
          lastValueRef.current = newValue;
          debouncedOnChange(newValue);
        }
      },
    }),
  );

  useEffect(() => {
    editorRef.current = editor;
  }, [editor, editorRef]);

  useEffect(() => {
    if (!editor || value === lastValueRef.current) return;
    isUpdatingRef.current = true;
    lastValueRef.current = value;
    queueMicrotask(() => {
      editor.commands.setContent(templateStringToTiptap(value));
      isUpdatingRef.current = false;
    });
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  return (
    <div className={cn("relative min-w-0 flex-1", className)}>
      <EditorContent
        editor={editor}
        className={cn(
          "[&_.tiptap]:w-full [&_.tiptap]:outline-none",
          "[&_.tiptap>p]:!whitespace-nowrap [&_.tiptap>p]:m-0 [&_.tiptap>p]:inline",
          "[&_.react-renderer]:!whitespace-nowrap [&_.react-renderer]:inline",
          "[&_[data-node-view-wrapper]]:!inline [&_[data-node-view-wrapper]]:!whitespace-nowrap",
          "[&_.ProseMirror-separator]:!hidden [&_br.ProseMirror-trailingBreak]:!hidden",
        )}
      />
      {!value?.trim() && placeholder && (
        <div className="pointer-events-none absolute top-2 left-3 font-mono text-muted-foreground text-xs">
          {placeholder}
        </div>
      )}
      <TemplateEditPopover
        template=""
        onSave={handleCodeSave}
        stepId={stepId}
        externalOpen={codePopoverOpen}
        onExternalOpenChange={setCodePopoverOpen}
        anchorRect={popoverAnchorRect}
      />
    </div>
  );
}
