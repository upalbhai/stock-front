import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "h-11 w-full rounded-2xl border border-border/80 bg-surface/90 px-3 text-sm text-text placeholder:text-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-0",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";
