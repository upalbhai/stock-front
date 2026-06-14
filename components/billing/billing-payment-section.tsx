"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

export function BillingPaymentSection({
  paymentMethods,
  selectedMethod,
  isKhataPayment,
  payment,
  onSelectMethod,
  onSplitAmountChange,
}: BillingPaymentSectionProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground">Payment method</p>
      <div className="flex gap-2">
        {paymentMethods.map((pm) => (
          <Button
            key={pm.value}
            type="button"
            onClick={() => onSelectMethod(pm.value)}
            variant={selectedMethod === pm.value ? (pm.value === "credit" ? "outline" : "default") : "outline"}
            className={cn(
              "flex h-auto min-h-11 flex-col items-center  justify-center gap-0.5 rounded-xl text-xs font-medium transition",
              selectedMethod === pm.value
                ? pm.value === "credit"
                  ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
                  : "border-primary bg-primary text-white"
                : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
            )}
          >
            {/* <span className="text-base">{pm.icon}</span> */}
            {pm.label}
          </Button>
        ))}
      </div>

      {selectedMethod === "split" && !isKhataPayment && (
        <div className="space-y-2 rounded-xl bg-muted/30 p-3">
          {(["cash", "upi", "card"] as const).map((method) => (
            <div key={method} className="flex items-center gap-2">
              <span className="w-10 text-xs capitalize text-muted-foreground">{method}</span>
              <Input
                type="number"
                min={0}
                value={payment[method] || ""}
                onChange={(e) => onSplitAmountChange(method, Number(e.target.value))}
                className="h-10 flex-1 text-sm"
                placeholder="0"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
