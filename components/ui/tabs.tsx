"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "flex gap-1 rounded-2xl border border-border bg-surface/70 p-1.5 backdrop-blur",
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "flex-1 rounded-xl px-4 py-2 text-sm font-medium text-muted transition",
        "hover:text-text",
        "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-soft",
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("mt-4 animate-rise outline-none", className)}
      {...props}
    />
  );
}
