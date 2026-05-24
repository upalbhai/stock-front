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
  id?: string;
};

export function Select({ value, onValueChange, placeholder, options, disabled, className, id }: SelectProps) {
  const mappedValue = value === "" ? "__empty__" : value;

  const handleValueChange = (val: string) => {
    if (onValueChange) {
      onValueChange(val === "__empty__" ? "" : val);
    }
  };

  return (
    <SelectPrimitive.Root value={mappedValue} onValueChange={handleValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        id={id}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-2xl border border-border",
          "bg-surface px-3 py-2.5 text-sm text-text shadow-sm outline-none",
          "hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
      >
        <SelectPrimitive.Value placeholder={<span className="text-muted">{placeholder || "Select..."}</span>} />
        <SelectPrimitive.Icon>
          <ChevronDown className="h-4 w-4 text-muted" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="z-50 min-w-[8rem] overflow-hidden rounded-2xl border border-border bg-surface shadow-soft animate-rise"
          position="popper"
          sideOffset={4}
        >
          <SelectPrimitive.Viewport className="p-1.5">
            {options.map((opt) => {
              const itemValue = opt.value === "" ? "__empty__" : opt.value;
              return (
                <SelectPrimitive.Item
                  key={itemValue}
                  value={itemValue}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm outline-none hover:bg-border/40 hover:text-text data-[state=checked]:text-text"
                >
                  {opt.icon && <span>{opt.icon}</span>}
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="ml-auto">
                    <Check className="h-3.5 w-3.5" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              );
            })}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
