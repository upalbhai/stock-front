"use client";

import { ShoppingBag } from "lucide-react";
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
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-3 py-2.5 backdrop-blur-md lg:hidden",
        "pb-[calc(0.625rem+env(safe-area-inset-bottom))]",
        hidden && "pointer-events-none translate-y-full opacity-0"
      )}
    >
      <Button
        type="button"
        className="h-12 w-full gap-2 rounded-xl text-sm font-bold"
        onClick={onOpenCheckout}
        disabled={itemCount === 0}
      >
        <ShoppingBag className="h-5 w-5 shrink-0" />
        <span className="flex-1 text-left">
          {itemCount === 0 ? "Cart is empty" : `${itemCount} item${itemCount === 1 ? "" : "s"}`}
        </span>
        <span className="font-bold">{formatCurrency(total, currency)}</span>
        <span className="rounded-lg bg-white/20 px-2 py-0.5 text-xs">Review & Pay</span>
      </Button>
    </div>
  );
}
