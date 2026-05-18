import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "soft" | "warning" | "danger" | "secondary" | "info";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  const styles: Record<BadgeVariant, string> = {
    default: "bg-primary text-white",
    soft: "bg-primary/10 text-primary",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/15 text-danger",
    secondary: "bg-border/80 text-muted",
    info: "bg-info/15 text-info"
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
