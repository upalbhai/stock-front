"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectOption = { value: string; label: string; icon?: string };

type SelectProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  id?: string;
  size?: "default" | "sm";
};

export function Select({
  value,
  onValueChange,
  placeholder,
  options,
  disabled,
  className,
  triggerClassName,
  id,
  size = "default",
}: SelectProps) {
  const mappedValue = value === "" ? "__empty__" : value;

  const handleValueChange = (val: string) => {
    if (onValueChange) {
      onValueChange(val === "__empty__" ? "" : val);
    }
  };

  return (
    <div className={cn("inline-flex min-w-0", className)}>
      <SelectPrimitive.Root value={mappedValue} onValueChange={handleValueChange} disabled={disabled}>
        <SelectPrimitive.Trigger
          id={id}
          className={cn(
            "flex w-full items-center justify-between gap-2 border border-border bg-background text-foreground shadow-xs outline-none transition",
            "hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "data-[placeholder]:text-muted-foreground",
            size === "sm" ? "h-8 rounded-md px-2.5 text-xs" : "h-9 rounded-lg px-3 text-sm",
            triggerClassName
          )}
        >
          <SelectPrimitive.Value
            placeholder={placeholder || "Select..."}
            className="min-w-0 flex-1 truncate text-left"
          />
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="size-4 shrink-0 opacity-50" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md animate-rise"
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((opt) => {
                const itemValue = opt.value === "" ? "__empty__" : opt.value;
                return (
                  <SelectPrimitive.Item
                    key={itemValue}
                    value={itemValue}
                    className="relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                  >
                    {opt.icon && <span>{opt.icon}</span>}
                    <SelectPrimitive.ItemText className="truncate">{opt.label}</SelectPrimitive.ItemText>
                    <SelectPrimitive.ItemIndicator className="ml-auto">
                      <Check className="size-4" />
                    </SelectPrimitive.ItemIndicator>
                  </SelectPrimitive.Item>
                );
              })}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
}
