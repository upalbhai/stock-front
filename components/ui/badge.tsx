import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "soft" | "warning" | "danger" | "secondary" | "info" | "success" | "outline";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  const styles: Record<BadgeVariant, string> = {
    default: "bg-primary text-primary-foreground",
    soft: "border border-border bg-secondary text-secondary-foreground",
    warning: "bg-warning/15 text-warning",
    danger: "bg-destructive/10 text-destructive",
    secondary: "bg-muted text-muted-foreground",
    info: "border border-border bg-accent text-accent-foreground",
    success: "bg-info/15 text-info",
    outline: "border border-border text-foreground bg-transparent",
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
