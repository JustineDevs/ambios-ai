import Editor from "@monaco-editor/react";
import { Plus, Trash2 } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMonacoTheme } from "@/hooks/use-monaco-theme";
import { cn, MAX_DISPLAY_LINES, MAX_DISPLAY_SIZE } from "@/lib/general-utils";
import { CopyButton } from "../tools/shared/CopyButton";

interface JsonSchemaEditorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  isOptional?: boolean;
  title?: string;
  readOnly?: boolean;
  onBlur?: () => void;
  forceCodeMode?: boolean;
  showModeToggle?: boolean;
  errorPrefix?: string;
}

const SCHEMA_TYPES = [
  "object",
  "string",
  "number",
  "boolean",
  "integer",
  "any",
  "string[]",
  "number[]",
  "boolean[]",
  "integer[]",
  "object[]",
  "any[]",
];
const SCHEMA_TYPE_DISPLAY = {
  object: "object",
  string: "string",
  number: "number",
  boolean: "bool",
  integer: "integer",
  any: "any",
  "string[]": "string[]",
  "number[]": "number[]",
  "boolean[]": "bool[]",
  "integer[]": "integer[]",
  "object[]": "object[]",
  "any[]": "any[]",
};

const ARRAY_ITEM_TYPES = ["object", "string", "number", "boolean", "integer", "any"];
const ARRAY_ITEM_TYPE_DISPLAY = {
  object: "object[]",
  string: "string[]",
  number: "number[]",
  boolean: "bool[]",
  integer: "integer[]",
  any: "any[]",
};

const JsonSchemaEditor: React.FC<JsonSchemaEditorProps> = ({
  value,
  onChange,
  isOptional = false,
  readOnly = false,
  onBlur,
  forceCodeMode = false,
  showModeToggle = true,
  errorPrefix,
}) => {
  const { theme, onMount } = useMonacoTheme();
  const [isCodeMode, setIsCodeMode] = React.useState(forceCodeMode || false);
  const [jsonError, setJsonError] = React.useState<string | null>(null);
  const [localIsEnabled, setLocalIsEnabled] = React.useState<boolean>(() => {
    if (!isOptional) {
      return true;
    }
    return (
      value !== null &&
      value !== "" &&
      value !== undefined &&
      value !== "{}" &&
      value !== '{"type":"object","properties":{}}'
    );
  });

  React.useEffect(() => {
    if (forceCodeMode) {
      setIsCodeMode(true);
      return;
    }
    const savedMode = localStorage?.getItem("jsonSchemaEditorCodeMode");
    if (savedMode !== null) {
      setIsCodeMode(savedMode === "true");
    }
  }, [forceCodeMode]);

  React.useEffect(() => {
    if (forceCodeMode) return;
    if (typeof window !== "undefined") {
      localStorage.setItem("jsonSchemaEditorCodeMode", isCodeMode.toString());
    }
  }, [isCodeMode, forceCodeMode]);

  React.useEffect(() => {
    if (isOptional && !localIsEnabled) {
      const shouldBeEnabled =
        value !== null &&
        value !== "" &&
        value !== undefined &&
        value !== "{}" &&
        value !== '{"type":"object","properties":{}}';
      if (shouldBeEnabled) {
        setLocalIsEnabled(true);
      }
    }
  }, [value, isOptional, localIsEnabled]);

  const [visualSchema, setVisualSchema] = React.useState<any>({});
  const [editingField, setEditingField] = React.useState<string | null>(null);
  // Store field name during editing in case of duplicate keys
  const [tempFieldName, setTempFieldName] = React.useState<string>("");
  // Track if current field name is a duplicate/invalid
  const [isDuplicateField, setIsDuplicateField] = React.useState(false);
  // Track the path of the currently hovered description field
  const [hoveredDescField, setHoveredDescField] = React.useState<string | null>(null);
  // Ref to store timeout IDs for hover delay
  const hoverTimeoutRef = React.useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Clear all hover timeouts when component unmounts
  React.useEffect(() => {
    return () => {
      for (const timeoutId of Object.values(hoverTimeoutRef.current)) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  React.useEffect(() => {
    if (value === null) {
      setVisualSchema({});
      setJsonError(null);
      return;
    }
    if (value === "") {
      setVisualSchema({});
      setJsonError(null);
      return;
    }
    try {
      const val = typeof value === "string" ? value : String(value);
      const parsed = JSON.parse(val);
      setVisualSchema(parsed);
      setJsonError(null);
    } catch (e) {
      setJsonError((e as Error).message);
    }
  }, [value]);

  const updateVisualSchema = (path: string[], newValue: any) => {
    const newSchema = { ...visualSchema };
    let current = newSchema;

    // Navigate to the target location
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }

    const lastKey = path[path.length - 1];
    const oldValue = current[lastKey];

    // If updating type field, remove properties/items
    if (lastKey === "type" && oldValue !== newValue) {
      if (current.properties) {
        current.properties = {};
      }
      if (current.items) {
        current.items = {};
      }
    }

    current[lastKey] = newValue;
    setVisualSchema(newSchema);
    onChange(JSON.stringify(newSchema, null, 2));
  };

  // Handle mouse enter with delay
  const handleMouseEnter = (fieldId: string) => {
    // Clear any existing timeout for this field
    if (hoverTimeoutRef.current[fieldId]) {
      clearTimeout(hoverTimeoutRef.current[fieldId]);
    }

    // Set a new timeout to show tooltip after 2 seconds
    hoverTimeoutRef.current[fieldId] = setTimeout(() => {
      setHoveredDescField(fieldId);
    }, 1000);
  };

  // Handle mouse leave
  const handleMouseLeave = (fieldId: string) => {
    // Clear the timeout if mouse leaves before delay completes
    if (hoverTimeoutRef.current[fieldId]) {
      clearTimeout(hoverTimeoutRef.current[fieldId]);
      delete hoverTimeoutRef.current[fieldId];
    }

    // Hide the tooltip if it's currently shown for this field
    if (hoveredDescField === fieldId) {
      setHoveredDescField(null);
    }
  };

  const generateUniqueFieldName = (properties: any) => {
    let index = 1;
    let fieldName = "newField";
    while (properties?.[fieldName]) {
      fieldName = `newField${index}`;
      index++;
    }
    return fieldName;
  };

  const renderSchemaField = (
    fieldName: string,
    schema: any,
    path: string[] = [],
    isArrayChild = false,
  ) => {
    if (!schema) return null;

    const isRoot = path.length === 0;
    const isEditing = editingField === path.join(".");
    // Create a unique ID for this field's description
    const descFieldId = [...path, "description"].join(".");

    // Helper function to check if field is required
    const isFieldRequired = () => {
      if (isRoot || isArrayChild) return false;
      const parentPath = path.slice(0, -2);
      let parent = visualSchema;
      for (const segment of parentPath) {
        parent = parent[segment];
      }
      return parent.required?.includes(fieldName) || false;
    };

    const finishEditing = () => {
      // Only update the schema if the field name is not a duplicate and not empty
      if (!isDuplicateField && tempFieldName !== fieldName && tempFieldName.trim() !== "") {
        const newSchema = { ...visualSchema };
        let current = newSchema;
        for (let i = 0; i < path.length - 2; i++) {
          current = current[path[i]];
        }

        const properties = current[path[path.length - 2]];
        const newProperties: Record<string, any> = {};

        // Apply the name change
        for (const key of Object.keys(properties)) {
          if (key === fieldName) {
            newProperties[tempFieldName] = properties[fieldName];
          } else {
            newProperties[key] = properties[key];
          }
        }

        // Update required fields if needed
        if (current.required?.includes(fieldName)) {
          current.required = current.required.map((f: string) =>
            f === fieldName ? tempFieldName : f,
          );
        }

        current[path[path.length - 2]] = newProperties;
        setVisualSchema(newSchema);
        onChange(JSON.stringify(newSchema, null, 2));
      }

      // Always reset states when done editing
      setTempFieldName("");
      setEditingField(null);
      setIsDuplicateField(false);
    };

    return (
      <div key={fieldName} className="mb-2 space-y-1 border-gray-400 border-l-2 pl-2">
        <div className="flex items-center gap-2">
          {isEditing && !isArrayChild ? (
            <Input
              // Use the temporary state for the input value without updating schema
              value={tempFieldName}
              onChange={(e) => {
                // Just update the temporary field name for visual display
                // WITHOUT modifying the actual schema until editing is complete
                setTempFieldName(e.target.value);

                let current = visualSchema;
                for (let i = 0; i < path.length - 2; i++) {
                  current = current[path[i]];
                }
                const properties = current[path[path.length - 2]];

                // it's a duplicate if a property with that name exists and it's not the current field
                const isDuplicateKey = properties[e.target.value] && fieldName !== e.target.value;
                setIsDuplicateField(isDuplicateKey); // for UI highlighting
                // DO NOT update the schema while typing - only when editing is complete
              }}
              className={cn(
                "min-h-[32px] w-36 text-xs sm:text-sm",
                isDuplicateField &&
                  "border-red-500 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
              )}
              placeholder="Field name"
              autoFocus
              onBlur={finishEditing}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  finishEditing();
                }
              }}
            />
          ) : (
            !isArrayChild &&
            !isRoot && (
              <button
                type="button"
                className={cn(
                  "flex min-h-[32px] w-36 cursor-pointer items-center gap-0.5 rounded px-2 py-0.5 hover:bg-secondary",
                  "truncate text-[11px] xs:text-[12px] sm:text-[14px]",
                )}
                title={fieldName}
                onClick={() => {
                  // Initialize the temp field name with the current field name
                  setTempFieldName(fieldName);
                  setEditingField(path.join("."));
                  // Reset duplicate field indicator when starting to edit
                  setIsDuplicateField(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") e.currentTarget.click();
                }}
              >
                {isRoot ? "root" : fieldName}
                {isFieldRequired() && (
                  <span
                    className="font-bold text-[14px] text-red-500 sm:text-[18px]"
                    title="Required field"
                  >
                    *
                  </span>
                )}
              </button>
            )
          )}
          {isRoot && (
            <div
              className={cn(
                "flex min-h-[32px] w-36 items-center gap-0.5 rounded px-2 py-0.5",
                "text-[11px] text-muted-foreground xs:text-[12px] sm:text-[14px]",
              )}
            >
              root
            </div>
          )}
          <Select
            value={
              isArrayChild
                ? typeof schema.type === "string"
                  ? schema.type
                  : "any"
                : schema.type === "array" && schema.items?.type
                  ? `${schema.items.type}[]`
                  : typeof schema.type === "string"
                    ? schema.type
                    : "any"
            }
            onValueChange={(value) => {
              if (isArrayChild) {
                updateVisualSchema([...path, "type"], value);
              } else if (value.endsWith("[]")) {
                // Handle array types like 'string[]'
                const itemType = value.slice(0, -2);
                if (isRoot) {
                  // Handle root array type specially
                  const newSchema = {
                    type: "array",
                    items: { type: itemType },
                  };
                  setVisualSchema(newSchema);
                  onChange(JSON.stringify(newSchema, null, 2));
                } else {
                  const newSchema = { ...visualSchema };
                  let current = newSchema;
                  for (let i = 0; i < path.length - 1; i++) {
                    current = current[path[i]];
                  }
                  current[path[path.length - 1]] = {
                    type: "array",
                    items: { type: itemType },
                  };
                  setVisualSchema(newSchema);
                  onChange(JSON.stringify(newSchema, null, 2));
                }
              } else {
                updateVisualSchema([...path, "type"], value);
              }
            }}
          >
            <SelectTrigger className="h-8 w-28 text-xs sm:text-sm">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="text-xs sm:text-sm">
              {(isArrayChild ? ARRAY_ITEM_TYPES : SCHEMA_TYPES).map((type) => (
                <SelectItem key={type} value={type}>
                  {isArrayChild ? ARRAY_ITEM_TYPE_DISPLAY[type] : SCHEMA_TYPE_DISPLAY[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <TooltipProvider>
            <Tooltip open={hoveredDescField === descFieldId}>
              <TooltipTrigger asChild>
                <Input
                  value={schema.description || ""}
                  onChange={(e) => {
                    updateVisualSchema([...path, "description"], e.target.value);
                    // Clear any pending timeout
                    if (hoverTimeoutRef.current[descFieldId]) {
                      clearTimeout(hoverTimeoutRef.current[descFieldId]);
                      delete hoverTimeoutRef.current[descFieldId];
                    }
                    // Hide tooltip when typing
                    setHoveredDescField(null);
                  }}
                  className="w-full min-w-[200px] flex-1 border-muted text-xs hover:border-primary/50 focus:border-primary/50 sm:text-sm"
                  placeholder="Add AI instructions or filters"
                  onFocus={() => {
                    // Clear timeout and hide tooltip on focus
                    if (hoverTimeoutRef.current[descFieldId]) {
                      clearTimeout(hoverTimeoutRef.current[descFieldId]);
                      delete hoverTimeoutRef.current[descFieldId];
                    }
                    setHoveredDescField(null);
                  }}
                  onMouseEnter={() => handleMouseEnter(descFieldId)}
                  onMouseLeave={() => handleMouseLeave(descFieldId)}
                />
              </TooltipTrigger>
              <TooltipContent side="top">
                <span className="text-xs sm:text-sm">
                  Add instructions to help AI understand how to map data to this field
                </span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {!isRoot && !isArrayChild && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative z-10">
                    <Switch
                      className="custom-switch"
                      id={`required-${path.join("-")}`}
                      checked={isFieldRequired()}
                      onCheckedChange={(checked) => {
                        const parentPath = path.slice(0, -2);
                        const newSchema = { ...visualSchema };
                        let parent = newSchema;
                        for (const segment of parentPath) {
                          parent = parent[segment];
                        }

                        if (checked) {
                          parent.required = [...(parent.required || []), fieldName];
                        } else {
                          parent.required = (parent.required || []).filter(
                            (f: string) => f !== fieldName,
                          );
                          if (parent.required.length === 0) {
                            delete parent.required;
                          }
                        }

                        setVisualSchema(newSchema);
                        onChange(JSON.stringify(newSchema, null, 2));
                      }}
                    />
                    <span className="pointer-events-none absolute top-[2px] left-[2px] flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-lg ring-0 transition-transform peer-data-[state=checked]:translate-x-4 peer-data-[state=unchecked]:translate-x-0">
                      {isFieldRequired() ? (
                        <span className="mt-2 font-bold text-[12px] text-red-500 leading-none sm:text-[16px]">
                          *
                        </span>
                      ) : (
                        <span className="font-semibold text-[10px] text-muted-foreground leading-none sm:text-[12px]">
                          ?
                        </span>
                      )}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="z-50 text-xs sm:text-sm">
                  {isFieldRequired() ? "Make field optional" : "Make field required"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {!isRoot && path.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 min-h-[2rem] w-8 min-w-[2rem] text-destructive"
              onClick={() => {
                const newSchema = { ...visualSchema };
                let current = newSchema;

                // Navigate to the parent to handle required fields
                const parentPath = path.slice(0, -2);
                let parent = newSchema;
                for (const segment of parentPath) {
                  parent = parent[segment];
                }

                // If this field was required, remove it from the required array
                if (parent.required?.includes(fieldName)) {
                  parent.required = parent.required.filter((f: string) => f !== fieldName);
                  // Remove the required array if it's empty
                  if (parent.required.length === 0) {
                    delete parent.required;
                  }
                }

                // Delete the field itself
                for (let i = 0; i < path.length - 1; i++) current = current[path[i]];
                delete current[
                  path[path.length - 1] === "properties" ? fieldName : path[path.length - 1]
                ];

                setVisualSchema(newSchema);
                onChange(JSON.stringify(newSchema, null, 2));
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {schema.type === "object" && (
          <div className={`pl-2 ${!isRoot && "mt-1"}`}>
            <div className="overflow-x-auto">
              {schema.properties &&
                Object.entries(schema.properties).map(([key, value]) =>
                  renderSchemaField(key, value, [...path, "properties", key]),
                )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 text-xs sm:text-sm"
              onClick={() =>
                updateVisualSchema([...path, "properties"], {
                  ...(schema.properties || {}),
                  [generateUniqueFieldName(schema.properties)]: { type: "string" },
                })
              }
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Add Property</span>
            </Button>
          </div>
        )}

        {schema.type === "array" && schema.items?.type === "object" && (
          <div className="mt-1 pl-2">
            <div className="overflow-x-auto">
              {schema.items.properties &&
                Object.entries(schema.items.properties).map(([key, value]) =>
                  renderSchemaField(key, value, [...path, "items", "properties", key]),
                )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 text-xs sm:text-sm"
              onClick={() =>
                updateVisualSchema([...path, "items", "properties"], {
                  ...(schema.items.properties || {}),
                  [generateUniqueFieldName(schema.items.properties)]: { type: "string" },
                })
              }
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Add Property</span>
            </Button>
          </div>
        )}
      </div>
    );
  };

  const ensureObjectStructure = (schema: any) => {
    if (!schema.type) schema.type = "any";
    if (!schema.properties) schema.properties = {};
    return schema;
  };

  const handleEnabledChange = (enabled: boolean) => {
    if (isOptional) {
      setLocalIsEnabled(enabled);
      if (!enabled) {
        onChange(null);
      } else {
        // If enabling and current parent value is null or empty, provide a default
        // This ensures a fresh start if re-enabled
        if (value === null || value === "") {
          onChange(JSON.stringify(ensureObjectStructure({ type: "any" }), null, 2));
        }
        // Otherwise keep the existing value
      }
    }
  };

  const shouldShowHeader = (showModeToggle && (localIsEnabled || !isOptional)) || isOptional;

  return (
    <div className="mb-4 flex h-full min-h-[300px] flex-col gap-2 space-y-1">
      {shouldShowHeader && (
        <div className="ml-auto flex shrink-0 items-center gap-4">
          <div className="flex items-center gap-4">
            {showModeToggle && (localIsEnabled || !isOptional) && (
              <div className="flex items-center gap-2">
                <Label htmlFor="editorMode" className="text-xs">
                  Code Mode
                </Label>
                <Switch
                  className="custom-switch"
                  id="editorMode"
                  checked={isCodeMode}
                  onCheckedChange={setIsCodeMode}
                />
              </div>
            )}
            {isOptional && (
              <div className="flex items-center gap-2">
                <Label htmlFor="schemaOptionalToggle" className="text-xs">
                  Enabled
                </Label>
                <Switch
                  className="custom-switch"
                  id="schemaOptionalToggle"
                  checked={localIsEnabled}
                  onCheckedChange={handleEnabledChange}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {isCodeMode && jsonError && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-2 text-destructive text-xs">
          {errorPrefix && <div>{errorPrefix}</div>}
          Error: {jsonError}
        </div>
      )}
      {isCodeMode &&
        readOnly &&
        value &&
        (value.length > MAX_DISPLAY_SIZE || value.split("\n").length > MAX_DISPLAY_LINES) && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-800 text-xs dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            Preview may be truncated for performance
          </div>
        )}

      {localIsEnabled ? (
        <div className="flex-1 rounded-md border">
          {isCodeMode ? (
            <div className="relative h-full bg-transparent px-3 font-mono">
              <div className="absolute top-1 right-1 z-10 mr-5">
                <CopyButton text={value ?? ""} />
              </div>
              <Editor
                height="300px"
                defaultLanguage="json"
                value={value ?? ""}
                onChange={(code) => {
                  try {
                    if (code === "" || code === null) {
                      setJsonError(null);
                      onChange(code || "");
                    } else {
                      JSON.parse(code);
                      setJsonError(null);
                      onChange(code || "");
                    }
                  } catch (e) {
                    setJsonError((e as Error).message);
                  }
                }}
                onMount={onMount}
                options={{
                  readOnly,
                  minimap: { enabled: false },
                  fontSize: 12,
                  lineNumbers: "off",
                  glyphMargin: false,
                  folding: false,
                  lineDecorationsWidth: 0,
                  lineNumbersMinChars: 0,
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  contextmenu: false,
                  renderLineHighlight: "none",
                  scrollbar: {
                    vertical: "auto",
                    horizontal: "auto",
                    verticalScrollbarSize: 8,
                    horizontalScrollbarSize: 8,
                    alwaysConsumeMouseWheel: false,
                  },
                  overviewRulerLanes: 0,
                  padding: { top: 12, bottom: 12 },
                  tabSize: 2,
                  quickSuggestions: false,
                  parameterHints: { enabled: false },
                  codeLens: false,
                  links: false,
                  colorDecorators: false,
                  occurrencesHighlight: "off",
                  renderValidationDecorations: "off",
                  stickyScroll: { enabled: false },
                }}
                theme={theme}
                className="bg-transparent"
              />
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-col">
              {Object.keys(visualSchema).length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                  <p className="mt-6 mb-4 text-xs sm:text-sm">No schema defined yet</p>
                  <Button
                    variant="outline"
                    className="text-xs sm:text-sm"
                    onClick={() => {
                      const initialSchema = ensureObjectStructure({ type: "any" });
                      setVisualSchema(initialSchema);
                      onChange(JSON.stringify(initialSchema, null, 2));
                    }}
                  >
                    <span className="text-xs sm:text-sm">Add Root Property</span>
                  </Button>
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <div className="p-4">
                    <div className="overflow-x-auto">
                      {renderSchemaField("root", visualSchema, [])}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex min-h-[4rem] flex-grow items-center justify-center rounded-md border bg-muted/50 p-3 text-muted-foreground text-sm">
          Schema definition is disabled.
        </div>
      )}
    </div>
  );
};

export default JsonSchemaEditor;
