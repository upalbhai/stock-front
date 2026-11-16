"use client";

import * as React from "react";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";

type MobileCartBarProps = {
  itemCount: number;
  total: number;
  hidden?: boolean;
  onOpenCheckout: () => void;
};

export function MobileCartBar({ itemCount, total, hidden, onOpenCheckout }: MobileCartBarProps) {
  const { user } = useAuth();
  const currency = user?.currency || "INR";

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-card/95 px-3 py-2.5 backdrop-blur-md lg:hidden shadow-lg",
        "pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
        hidden && "pointer-events-none translate-y-full opacity-0",
        "transition-all duration-200"
      )}
    >
      <Button
        type="button"
        className="h-13 w-full justify-between rounded-xl px-4 text-sm font-bold bg-primary hover:bg-primary/95 text-primary-foreground shadow-md active:scale-[0.99] cursor-pointer"
        onClick={onOpenCheckout}
        disabled={itemCount === 0}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/20 text-primary-foreground">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div className="text-left leading-tight">
            <p className="text-xs font-semibold">
              {itemCount === 0 ? "Cart is empty" : `${itemCount} item${itemCount === 1 ? "" : "s"} selected`}
            </p>
            <p className="font-mono text-sm font-black">
              {formatCurrency(total, currency)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg bg-primary-foreground/20 px-3 py-1.5 text-xs font-bold text-primary-foreground">
          <span>Review & Pay</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </Button>
    </div>
  );
}
