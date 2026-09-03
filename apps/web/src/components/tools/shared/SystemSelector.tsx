"use client";

import type { System } from "@ambios-ai/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SystemIcon } from "@/components/ui/system-icon";
import { useSystems } from "@/queries/systems";

interface SystemSelectorProps {
  value: string;
  onValueChange: (value: string, system?: System) => void;
  disabled?: boolean;
  placeholder?: string;
  contentClassName?: string;
  triggerClassName?: string;
  showCreateNew?: boolean;
  onCreateNew?: () => void;
  systems?: System[];
}

export function SystemSelector({
  value,
  onValueChange,
  disabled = false,
  placeholder = "Select system",
  contentClassName,
  triggerClassName = "h-9",
  showCreateNew = false,
  onCreateNew,
  systems: providedSystems,
}: SystemSelectorProps) {
  const { systems: contextSystems } = useSystems();
  const systems = providedSystems || contextSystems;

  const handleValueChange = (selectedValue: string) => {
    if (selectedValue === "CREATE_NEW" && onCreateNew) {
      onCreateNew();
    } else {
      const selectedSystem = systems?.find((i) => i.id === selectedValue);
      onValueChange(selectedValue, selectedSystem);
    }
  };

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger
        className={`${triggerClassName} shadow-none ring-offset-0 focus:ring-0`}
        disabled={disabled}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={`${contentClassName} shadow-none`}>
        {systems?.map((system) => (
          <SelectItem key={system.id} value={system.id}>
            <div className="flex w-full items-center gap-2">
              <SystemIcon system={system} size={16} />
              <span className="flex-grow">{system.name || system.id}</span>
              {system.url && (
                <span className="ml-auto text-muted-foreground text-xs">({system.url})</span>
              )}
            </div>
          </SelectItem>
        ))}
        {showCreateNew && onCreateNew && (
          <SelectItem value="CREATE_NEW" className="text-primary">
            + Add New System
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
