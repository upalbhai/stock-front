"use client";

import * as React from "react";
import { Button as AriaButton, ButtonProps as AriaButtonProps, composeRenderProps } from "react-aria-components";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { VariantProps } from "class-variance-authority";

interface ButtonProps extends AriaButtonProps, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => {
  return (
    <AriaButton
      ref={ref}
      {...props}
      className={composeRenderProps(className, (className) => 
        cn(buttonVariants({ variant, size, className }))
      )}
    />
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
