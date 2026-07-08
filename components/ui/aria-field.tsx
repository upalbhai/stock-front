"use client";

import * as React from "react";
import { Label as AriaLabel, LabelProps as AriaLabelProps, FieldError as AriaFieldError, FieldErrorProps as AriaFieldErrorProps, Group, GroupProps, composeRenderProps } from "react-aria-components";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const fieldGroupVariants = cva(
  "flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
        ghost: "border-none shadow-none focus-within:ring-0",
      }
    },
    defaultVariants: {
      variant: "default",
    }
  }
);

function Label(props: AriaLabelProps) {
  return <AriaLabel {...props} className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", props.className)} />;
}

function FieldError(props: AriaFieldErrorProps) {
  return <AriaFieldError {...props} className={composeRenderProps(props.className, (className) => cn("text-[0.8rem] font-medium text-destructive", className))} />;
}

function FieldGroup({ className, variant, ...props }: GroupProps & { variant?: "default" | "ghost" }) {
  return <Group className={composeRenderProps(className, (className) => cn(fieldGroupVariants({ variant }), className))} {...props} />;
}

export { Label, FieldError, FieldGroup, fieldGroupVariants };
