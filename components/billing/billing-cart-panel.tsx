"use client";

import { ShoppingBag, Printer, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomerPicker } from "@/components/billing/customer-picker";
import { BillingCartLine } from "@/components/billing/billing-cart-line";
import { BillingPaymentSection } from "@/components/billing/billing-payment-section";
import { BillingKhataSection } from "@/components/billing/billing-khata-section";
import { BILLING_MODES } from "@/components/billing/billing-constants";
import { formatCurrency } from "@/lib/format";
import { getErrorMessage } from "@/lib/error";
import { cn } from "@/lib/utils";
import type { LineItem } from "@/store/billingSlice";
import type { Customer } from "@/lib/types";
import type { PAYMENT_METHODS } from "@/components/billing/billing-constants";

type PaymentMethodItem = (typeof PAYMENT_METHODS)[number];

type BillingCartPanelProps = {
  variant?: "desktop" | "sheet";
  onClose?: () => void;
  billing: {
    items: LineItem[];
    billingMode: string;
    discount: number;
    taxEnabled: boolean;
    taxRate: number;
    taxMode: "exclusive" | "inclusive";
    paymentMethod: string;
    payment: { cash: number; upi: number; card: number; wallet: number };
    customerId: string | null;
    amountReceived: number;
    generateGstInvoice: boolean;
    creditSale: boolean;
  };
  isWholesale: boolean;
  isKhataPayment: boolean;
  showCustomerSection: boolean;
  hasCreditKhata: boolean;
  hasGstInvoices: boolean;
  paymentMethods: readonly PaymentMethodItem[];
  token: string | null;
  outletId: string | null;
  subtotal: number;
  taxAmount: number;
  total: number;
  amountDuePreview: number;
  cartTotals: { taxableAmount: number };
  cgst: number;
  sgst: number;
  igst: number;
  isInterState: boolean;
  settings: { gstEnabled?: boolean };
  editingPriceId: string | null;
  editPriceValue: string;
  showSuccess: boolean;
  outletMissing: boolean;
  submitPending: boolean;
  submitError: unknown;
  dispatch: {
    setBillingMode: (mode: (typeof BILLING_MODES)[number]["value"]) => void;
    setDiscount: (n: number) => void;
    setTaxEnabled: (v: boolean) => void;
    setTaxRate: (n: number) => void;
    setTaxMode: (m: "exclusive" | "inclusive") => void;
    setPaymentMethod: (m: (typeof PAYMENT_METHODS)[number]["value"]) => void;
    setCreditSale: (v: boolean) => void;
    setAmountReceived: (n: number) => void;
    setGenerateGstInvoice: (v: boolean) => void;
    setPaymentAmount: (p: { field: "cash" | "upi" | "card"; value: number }) => void;
    selectCustomer: (
      c: { id: string; name: string; phone?: string; defaultTaxMode?: "exclusive" | "inclusive" } | null
    ) => void;
    updateQty: (p: { cartLineId: string; qty: number }) => void;
    updateLinePrice: (p: { cartLineId: string; price: number }) => void;
    removeItem: (id: string) => void;
    clearBill: () => void;
  };
  setEditingPriceId: (id: string | null) => void;
  setEditPriceValue: (v: string) => void;
  onCheckout: () => void;
};

export function BillingCartPanel({
  variant = "desktop",
  onClose,
  billing,
  isWholesale,
  isKhataPayment,
  showCustomerSection,
  hasCreditKhata,
  hasGstInvoices,
  paymentMethods,
  token,
  outletId,
  subtotal,
  taxAmount,
  total,
  amountDuePreview,
  cartTotals,
  cgst,
  sgst,
  igst,
  isInterState,
  settings,
  editingPriceId,
  editPriceValue,
  showSuccess,
  outletMissing,
  submitPending,
  submitError,
  dispatch,
  setEditingPriceId,
  setEditPriceValue,
  onCheckout,
}: BillingCartPanelProps) {
  const isSheet = variant === "sheet";

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden bg-card",
        isSheet ? "h-full" : "h-full rounded-xl border border-border shadow-sm"
      )}
    >
      {isSheet && (
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-base font-bold">Checkout</h2>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      )}

      {!isWholesale && (
        <div className="flex shrink-0 gap-1 border-b border-border/60 p-2">
          {BILLING_MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => dispatch.setBillingMode(mode.value)}
              className={cn(
                "flex-1 rounded-lg py-2 text-xs font-medium transition",
                billing.billingMode === mode.value
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {mode.icon} {mode.label}
            </button>
          ))}
        </div>
      )}

      {isWholesale && (
        <div className="shrink-0 border-b border-border/60 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Wholesale Bill</p>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {billing.items.length === 0 ? (
          <div className="flex h-full min-h-[12rem] flex-col items-center justify-center py-8 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
            <p className="mt-3 text-sm text-muted-foreground">Cart is empty</p>
            <p className="text-xs text-muted-foreground/70">Tap a product to add it</p>
          </div>
        ) : (
          <div className="space-y-2">
            {billing.items.map((item) => (
              <BillingCartLine
                key={item.cartLineId}
                item={item}
                isWholesale={isWholesale}
                isEditing={editingPriceId === item.cartLineId}
                editPriceValue={editPriceValue}
                onEditPriceValue={setEditPriceValue}
                onStartEdit={() => {
                  setEditingPriceId(item.cartLineId);
                  setEditPriceValue(String(item.price));
                }}
                onCommitEdit={(price) => {
                  dispatch.updateLinePrice({ cartLineId: item.cartLineId, price });
                  setEditingPriceId(null);
                }}
                onCancelEdit={() => setEditingPriceId(null)}
                onUpdateQty={(qty) => dispatch.updateQty({ cartLineId: item.cartLineId, qty })}
                onRemove={() => dispatch.removeItem(item.cartLineId)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 space-y-3 border-t border-border p-3">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-muted-foreground">
            <span>Discount (₹)</span>
            <Input
              type="number"
              min={0}
              value={billing.discount || ""}
              onChange={(e) => dispatch.setDiscount(Number(e.target.value))}
              className="h-10 w-24 text-right text-sm"
              placeholder="0"
            />
          </div>

          {(isWholesale || billing.taxEnabled) && (
            <div className="space-y-2 rounded-xl bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={billing.taxEnabled}
                    onChange={(e) => dispatch.setTaxEnabled(e.target.checked)}
                  />
                  GST
                </label>
                {billing.taxEnabled && (
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={billing.taxRate || ""}
                    onChange={(e) => dispatch.setTaxRate(Number(e.target.value))}
                    className="h-9 w-16 text-right text-xs"
                    placeholder="%"
                  />
                )}
              </div>
              {isWholesale && billing.taxEnabled && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => dispatch.setTaxMode("exclusive")}
                    className={cn(
                      "flex-1 rounded-lg py-2 text-xs font-medium",
                      billing.taxMode === "exclusive"
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    GST Extra
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch.setTaxMode("inclusive")}
                    className={cn(
                      "flex-1 rounded-lg py-2 text-xs font-medium",
                      billing.taxMode === "inclusive"
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    GST Included
                  </button>
                </div>
              )}
              {billing.taxEnabled && taxAmount > 0 && (settings.gstEnabled || isWholesale) && (
                <div className="space-y-1 border-t border-border/40 pt-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Taxable</span>
                    <span>{formatCurrency(cartTotals.taxableAmount)}</span>
                  </div>
                  {isInterState ? (
                    <div className="flex justify-between">
                      <span>IGST</span>
                      <span>{formatCurrency(igst)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>CGST</span>
                        <span>{formatCurrency(cgst)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST</span>
                        <span>{formatCurrency(sgst)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between font-medium text-foreground">
                    <span>Tax</span>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        <BillingPaymentSection
          paymentMethods={paymentMethods}
          selectedMethod={billing.paymentMethod as (typeof PAYMENT_METHODS)[number]["value"]}
          isKhataPayment={isKhataPayment}
          payment={billing.payment}
          onSelectMethod={(method) => {
            dispatch.setPaymentMethod(method);
            if (method === "credit") dispatch.setCreditSale(true);
          }}
          onSplitAmountChange={(field, value) => dispatch.setPaymentAmount({ field, value })}
        />

        {isKhataPayment && hasCreditKhata && (
          <BillingKhataSection
            total={total}
            amountReceived={billing.amountReceived}
            amountDuePreview={amountDuePreview}
            hasCustomer={Boolean(billing.customerId)}
            onAmountChange={(n) => dispatch.setAmountReceived(n)}
          />
        )}

        {showCustomerSection && (
          <CustomerPicker
            token={token}
            outletId={outletId}
            selectedId={billing.customerId}
            required={isKhataPayment || billing.generateGstInvoice}
            onSelect={(c: Customer | null) =>
              dispatch.selectCustomer(
                c ? { id: c._id, name: c.name, phone: c.phone, defaultTaxMode: c.defaultTaxMode } : null
              )
            }
          />
        )}

        {hasGstInvoices && billing.taxEnabled && (
          <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-muted/30 px-3 py-2.5 text-xs">
            <input
              type="checkbox"
              checked={billing.generateGstInvoice}
              onChange={(e) => dispatch.setGenerateGstInvoice(e.target.checked)}
            />
            <span>
              Generate GST Invoice
              {!billing.customerId && billing.generateGstInvoice && (
                <span className="ml-1 text-amber-600">(select customer with GSTIN)</span>
              )}
            </span>
          </label>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 shrink-0"
            onClick={() => dispatch.clearBill()}
            disabled={billing.items.length === 0}
            aria-label="Clear cart"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            className="h-12 flex-1 gap-2 text-sm font-bold"
            onClick={onCheckout}
            disabled={billing.items.length === 0 || submitPending || outletMissing}
            title={outletMissing ? "Please select an outlet" : undefined}
          >
            {submitPending ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                <Printer className="h-4 w-4" />
                Place Bill — {formatCurrency(total)}
              </>
            )}
          </Button>
        </div>

        {outletMissing && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-700 dark:text-amber-400">
            Please select an outlet to place orders
          </p>
        )}

        {showSuccess && (
          <p className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-center text-xs font-medium text-green-700 dark:text-green-400">
            Order created successfully
          </p>
        )}

        {submitError != null && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-xs text-destructive">
            {getErrorMessage(submitError)}
          </p>
        )}
      </div>
    </div>
  );
}
