"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { BillingCartPanel } from "@/components/billing/billing-cart-panel";
import type { ComponentProps } from "react";

type CheckoutSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
} & Omit<ComponentProps<typeof BillingCartPanel>, "variant" | "onClose">;

export function CheckoutSheet({ open, onOpenChange, ...cartProps }: CheckoutSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="flex h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] flex-col gap-0 rounded-t-2xl border-t p-0 sm:max-w-none"
      >
        <BillingCartPanel
          variant="sheet"
          onClose={() => onOpenChange(false)}
          {...cartProps}
        />
      </SheetContent>
    </Sheet>
  );
}
