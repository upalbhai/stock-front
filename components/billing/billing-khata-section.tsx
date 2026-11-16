"use client";

import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomerPicker } from "@/components/billing/customer-picker";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import type { Customer } from "@/lib/types";

type BillingKhataSectionProps = {
  total: number;
  amountReceived: number;
  amountDuePreview: number;
  hasCustomer: boolean;
  onAmountChange: (amount: number) => void;
  token?: string | null;
  outletId?: string | null;
  customerId?: string | null;
  onSelectCustomer?: (customer: Customer | null) => void;
  customerPickerOpen?: boolean;
  onCustomerPickerOpenChange?: (open: boolean) => void;
};

const QUICK_AMOUNTS = [500, 1000] as const;

export function BillingKhataSection({
  total,
  amountReceived,
  amountDuePreview,
  hasCustomer,
  onAmountChange,
  token,
  outletId,
  customerId,
  onSelectCustomer,
  customerPickerOpen,
  onCustomerPickerOpenChange,
}: BillingKhataSectionProps) {
  const { user } = useAuth();
  const currency = user?.currency || "INR";

  return (
    <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5">
      {/* Customer Account Picker inside Khata Section */}
      {!hasCustomer ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
              <User className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>Select Customer for Khata Credit</span>
              <span className="text-destructive">*</span>
            </span>
            <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
              Required
            </span>
          </div>

          <CustomerPicker
            token={token ?? null}
            outletId={outletId ?? null}
            selectedId={customerId ?? null}
            required
            open={customerPickerOpen}
            onOpenChange={onCustomerPickerOpenChange}
            onSelect={onSelectCustomer ?? (() => {})}
            showLabel={false}
            placeholder="Click to select or register customer..."
            buttonClassName="bg-card border-amber-500/40 hover:bg-amber-500/15 text-foreground shadow-2xs"
          />

          <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90">
            Deferred credit balance will be recorded directly under this customer's khata account.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/80 bg-card p-3 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              <span>Linked Khata Customer</span>
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              Account Linked
            </span>
          </div>

          <CustomerPicker
            token={token ?? null}
            outletId={outletId ?? null}
            selectedId={customerId ?? null}
            open={customerPickerOpen}
            onOpenChange={onCustomerPickerOpenChange}
            onSelect={onSelectCustomer ?? (() => {})}
            showLabel={false}
          />
        </div>
      )}

      {/* Quick Settlement Presets */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
          Settlement Breakdown
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 px-3 text-xs font-semibold bg-card cursor-pointer"
            onClick={() => onAmountChange(0)}
          >
            Full Khata
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 px-3 text-xs font-semibold bg-card cursor-pointer"
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
              className="h-9 px-3 text-xs font-semibold bg-card cursor-pointer"
              onClick={() => onAmountChange(Math.min(amt, total))}
            >
              {formatCurrency(amt, currency)}
            </Button>
          ))}
        </div>
      </div>

      {/* Amount Receiving Now */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
          Amount Receiving Now ({currency})
        </label>
        <Input
          type="number"
          min={0}
          max={total}
          value={amountReceived || ""}
          onChange={(e) => onAmountChange(Number(e.target.value))}
          className="h-10 text-sm font-mono bg-card"
          placeholder={`Leave 0 for full khata (${formatCurrency(total, currency)})`}
        />
      </div>

      {/* Dues Calculation Summary */}
      <div
        className={cn(
          "rounded-xl border p-2.5 text-xs flex items-center justify-between",
          amountDuePreview > 0
            ? "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200"
            : "border-border/60 bg-card/80 text-muted-foreground"
        )}
      >
        <div>
          <span>Paying now: </span>
          <span className="font-bold text-foreground">
            {formatCurrency(amountReceived || 0, currency)}
          </span>
        </div>
        <div>
          <span>On Khata: </span>
          <span className="font-bold text-amber-600 dark:text-amber-400">
            {formatCurrency(amountDuePreview, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
