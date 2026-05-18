import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "outline" | "ghost" | "soft" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon" | "xl";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:brightness-110",
  outline:
    "border border-border/70 bg-transparent text-text hover:bg-surface",
  ghost: "bg-transparent text-text hover:bg-surface",
  soft: "bg-primary/10 text-primary hover:bg-primary/20",
  danger: "bg-danger text-white hover:brightness-110"
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
  xl: "h-14 px-6 text-base",
  icon: "h-10 w-10"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", asChild, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
