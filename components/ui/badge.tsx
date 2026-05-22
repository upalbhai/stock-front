import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "soft" | "warning" | "danger" | "secondary" | "info";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  const styles: Record<BadgeVariant, string> = {
    default: "bg-primary text-primary-foreground",
    soft: "bg-surface text-text border border-border",
    warning: "bg-border/70 text-text",
    danger: "bg-destructive text-destructive-foreground",
    secondary: "bg-border/50 text-muted",
    info: "bg-surface text-muted border border-border"
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
