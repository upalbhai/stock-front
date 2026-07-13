"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";

type BillingKhataSectionProps = {
  total: number;
  amountReceived: number;
  amountDuePreview: number;
  hasCustomer: boolean;
  onAmountChange: (amount: number) => void;
};

const QUICK_AMOUNTS = [500, 1000] as const;

export function BillingKhataSection({
  total,
  amountReceived,
  amountDuePreview,
  hasCustomer,
  onAmountChange,
}: BillingKhataSectionProps) {
  const { user } = useAuth();
  const currency = user?.currency || "INR";

  return (
    <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
      <div>
        <p className="text-sm font-semibold text-primary">Khata / credit bill</p>
        {!hasCustomer && (
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
            Select a customer below — required for khata
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 text-xs"
          onClick={() => onAmountChange(0)}
        >
          Full Khata
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 text-xs"
          onClick={() => onAmountChange(Math.round(total / 2))}
        >
          Half
        </Button>
        {QUICK_AMOUNTS.map((amt) => (
          <Button
            key={amt}
            type="button"
            size="sm"
            variant="outline"
            className="h-9 text-xs"
            onClick={() => onAmountChange(Math.min(amt, total))}
          >
            {formatCurrency(amt, currency)}
          </Button>
        ))}
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Amount receiving now ({currency})</label>
        <Input
          type="number"
          min={0}
          max={total}
          value={amountReceived || ""}
          onChange={(e) => onAmountChange(Number(e.target.value))}
          className="mt-1.5 h-11 text-sm"
          placeholder={`Leave 0 for full khata (${formatCurrency(total, currency)})`}
        />
      </div>

      <div
        className={cn(
          "rounded-lg bg-card/80 px-3 py-2 text-xs",
          amountDuePreview > 0 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"
        )}
      >
        Paying now: <span className="font-semibold">{formatCurrency(amountReceived || 0, currency)}</span>
        {" · "}
        On khata: <span className="font-semibold">{formatCurrency(amountDuePreview, currency)}</span>
      </div>
    </div>
  );
}
