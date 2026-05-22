import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50 disabled:pointer-events-none active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-border bg-transparent text-text hover:bg-surface/80 hover:border-text/20",
        ghost: "bg-transparent text-text hover:bg-border/30",
        soft: "bg-surface text-text hover:bg-border/30",
        secondary: "bg-border/60 text-text hover:bg-border",
        link: "underline-offset-4 hover:underline text-muted hover:text-text p-0 h-auto"
      },
      size: {
        xs: "text-xs px-2.5 py-1.5 rounded-xl",
        sm: "text-sm px-3 py-2",
        default: "text-sm px-4 py-2.5",
        lg: "text-sm px-5 py-3",
        xl: "text-base px-6 py-3.5",
        icon: "h-9 w-9 p-0"
      }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
