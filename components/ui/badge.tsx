import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "soft" | "warning" | "danger";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  const styles: Record<BadgeVariant, string> = {
    default: "bg-primary text-white",
    soft: "bg-primary/10 text-primary",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/15 text-danger"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}
