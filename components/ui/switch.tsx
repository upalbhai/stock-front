"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

type SwitchProps = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
};

export function Switch({ checked, onCheckedChange, disabled, id, className }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-6 w-11 cursor-pointer rounded-full border-2 border-transparent",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        "data-[state=checked]:bg-primary data-[state=unchecked]:bg-border",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-soft",
          "ring-0 transition-transform",
          "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitive.Root>
  );
}
