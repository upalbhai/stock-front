"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Banknote, QrCode, CreditCard, Wallet, Split, BookOpen } from "lucide-react";
import type { PAYMENT_METHODS } from "@/components/billing/billing-constants";

type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];
type PaymentMethodItem = (typeof PAYMENT_METHODS)[number];

type BillingPaymentSectionProps = {
  paymentMethods: readonly PaymentMethodItem[];
  selectedMethod: PaymentMethod;
  isKhataPayment: boolean;
  payment: { cash: number; upi: number; card: number; wallet: number };
  onSelectMethod: (method: PaymentMethod) => void;
  onSplitAmountChange: (field: "cash" | "upi" | "card", value: number) => void;
};

const getMethodIcon = (value: string) => {
  switch (value) {
    case "cash":
      return <Banknote className="h-4 w-4" />;
    case "upi":
      return <QrCode className="h-4 w-4" />;
    case "card":
      return <CreditCard className="h-4 w-4" />;
    case "wallet":
      return <Wallet className="h-4 w-4" />;
    case "split":
      return <Split className="h-4 w-4" />;
    case "credit":
      return <BookOpen className="h-4 w-4" />;
    default:
      return <Banknote className="h-4 w-4" />;
  }
};

export function BillingPaymentSection({
  paymentMethods,
  selectedMethod,
  isKhataPayment,
  payment,
  onSelectMethod,
  onSplitAmountChange,
}: BillingPaymentSectionProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
        {paymentMethods.map((pm) => {
          const isSelected = selectedMethod === pm.value;
          return (
            <button
              key={pm.value}
              type="button"
              onClick={() => onSelectMethod(pm.value)}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition-all duration-150 cursor-pointer shadow-2xs",
                isSelected
                  ? pm.value === "credit"
                    ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500/30"
                    : "border-primary bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/30"
                  : "border-border/70 bg-card text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                  isSelected
                    ? pm.value === "credit"
                      ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                      : "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-foreground/70"
                )}
              >
                {getMethodIcon(pm.value)}
              </div>
              <span>{pm.label}</span>
            </button>
          );
        })}
      </div>

      {/* Split Payment Allocations */}
      {selectedMethod === "split" && !isKhataPayment && (
        <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Split Breakdown
          </p>
          {(["cash", "upi", "card"] as const).map((method) => (
            <div key={method} className="flex items-center gap-2">
              <span className="w-14 text-xs font-medium capitalize text-muted-foreground flex items-center gap-1">
                {getMethodIcon(method)}
                <span>{method}</span>
              </span>
              <Input
                type="number"
                min={0}
                value={payment[method] || ""}
                onChange={(e) => onSplitAmountChange(method, Number(e.target.value))}
                className="h-9 flex-1 font-mono text-xs font-bold bg-background rounded-lg border-border"
                placeholder="0.00"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
