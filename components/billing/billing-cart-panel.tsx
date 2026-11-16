"use client";

import * as React from "react";
import {
  ShoppingBag,
  RotateCcw,
  Settings2,
  ArrowRight,
  Receipt,
  User,
  Percent,
  ChevronDown,
  ChevronUp,
  Tag,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CustomerPicker } from "@/components/billing/customer-picker";
import { BillingCartLine } from "@/components/billing/billing-cart-line";
import { BILLING_MODES } from "@/components/billing/billing-constants";
import { formatCurrency } from "@/lib/format";
import { getErrorMessage } from "@/lib/error";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
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
    setPaymentAmount: (p: {
      field: "cash" | "upi" | "card";
      value: number;
    }) => void;
    selectCustomer: (
      c: {
        id: string;
        name: string;
        phone?: string;
        defaultTaxMode?: "exclusive" | "inclusive";
      } | null,
    ) => void;
    updateQty: (p: { cartLineId: string; qty: number }) => void;
    updateLinePrice: (p: { cartLineId: string; price: number }) => void;
    removeItem: (id: string) => void;
    clearBill: () => void;
  };
  setEditingPriceId: (id: string | null) => void;
  setEditPriceValue: (v: string) => void;
  onCheckout: () => void;
  onProceedToPayment?: () => void;
  onOpenPrinterSettings?: () => void;
  printerConnected?: boolean;
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
  onProceedToPayment,
  onOpenPrinterSettings,
  printerConnected,
}: BillingCartPanelProps) {
  const { user } = useAuth();
  const userCurrency = user?.currency || "INR";
  const [showTaxDetails, setShowTaxDetails] = React.useState(false);

  const isSheet = variant === "sheet";
  const totalItemCount = billing.items.reduce((acc, item) => acc + (item.soldQty ?? item.qty), 0);

  // Quick discount calculation helpers
  const handleQuickPercentDiscount = (percent: number) => {
    if (subtotal <= 0) return;
    const discountVal = Math.round((subtotal * percent) / 100);
    dispatch.setDiscount(discountVal);
  };

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden bg-card",
        isSheet ? "h-full" : "h-full rounded-2xl border border-border/80 shadow-xs"
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/70 px-4 py-3 bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-foreground">
              {isWholesale ? "Wholesale Order" : "Current Cart"}
            </h2>
            <p className="text-[11px] text-muted-foreground font-medium">
              {totalItemCount} {totalItemCount === 1 ? "unit" : "units"} ({billing.items.length} unique)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {billing.items.length > 0 && (
            <button
              type="button"
              onClick={() => dispatch.clearBill()}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
              title="Reset current cart"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Clear</span>
            </button>
          )}
          {isSheet && onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 px-2 text-xs">
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {billing.items.length === 0 ? (
          <div className="flex h-full min-h-[14rem] flex-col items-center justify-center text-center p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground shadow-inner">
              <ShoppingBag className="h-6 w-6 opacity-60" />
            </div>
            <p className="mt-3 text-sm font-bold text-foreground">Your cart is empty</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-[200px]">
              Tap products from the catalog or scan a barcode to start billing.
            </p>
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
                  dispatch.updateLinePrice({
                    cartLineId: item.cartLineId,
                    price,
                  });
                  setEditingPriceId(null);
                }}
                onCancelEdit={() => setEditingPriceId(null)}
                onUpdateQty={(qty) =>
                  dispatch.updateQty({ cartLineId: item.cartLineId, qty })
                }
                onRemove={() => dispatch.removeItem(item.cartLineId)}
              />
            ))}
          </div>
        )}

        {/* Customer Selector & GST Invoicing Option */}
        <div className="space-y-3 pt-3 border-t border-border/50">
          {showCustomerSection && (
            <div className="rounded-xl border border-border/70 bg-muted/20 p-2.5">
              <CustomerPicker
                token={token}
                outletId={outletId}
                selectedId={billing.customerId}
                required={isKhataPayment || billing.generateGstInvoice}
                onSelect={(c: Customer | null) =>
                  dispatch.selectCustomer(
                    c
                      ? {
                          id: c._id,
                          name: c.name,
                          phone: c.phone,
                          defaultTaxMode: c.defaultTaxMode,
                        }
                      : null
                  )
                }
              />
            </div>
          )}

          {hasGstInvoices && billing.taxEnabled && (
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted/50">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={billing.generateGstInvoice}
                  onChange={(e) => dispatch.setGenerateGstInvoice(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
                <span>Generate Official GST Invoice</span>
              </div>
              {!billing.customerId && billing.generateGstInvoice && (
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  Customer Required
                </span>
              )}
            </label>
          )}
        </div>
      </div>

      {/* Financial Summary & Settlement Footer */}
      <div className="shrink-0 space-y-3 border-t border-border/80 bg-card p-3 shadow-sm">
        <div className="space-y-2 text-xs">
          {/* Subtotal */}
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-mono font-semibold text-foreground">
              {formatCurrency(subtotal, userCurrency)}
            </span>
          </div>

          {/* Discount Section with Quick Buttons */}
          <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/20 p-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <Tag className="h-3 w-3 text-primary" />
                Discount
              </span>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted-foreground">
                  {userCurrency}
                </span>
                <Input
                  type="number"
                  min={0}
                  value={billing.discount || ""}
                  onChange={(e) => dispatch.setDiscount(Number(e.target.value))}
                  className="h-7.5 w-24 pl-8 pr-2 text-right font-mono text-xs font-bold bg-background rounded-lg border-border"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Quick Discount Percent Pills */}
            <div className="flex items-center gap-1.5 pt-0.5">
              {[5, 10, 15].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleQuickPercentDiscount(pct)}
                  className="flex-1 rounded-md border border-border/70 bg-background/80 py-0.5 text-[10px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  {pct}%
                </button>
              ))}
              {billing.discount > 0 && (
                <button
                  type="button"
                  onClick={() => dispatch.setDiscount(0)}
                  className="rounded-md border border-destructive/20 bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold text-destructive hover:bg-destructive/20 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* GST Tax Control */}
          {(isWholesale || billing.taxEnabled) && (
            <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-2">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={billing.taxEnabled}
                    onChange={(e) => dispatch.setTaxEnabled(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <span>GST Applicable</span>
                </label>
                {billing.taxEnabled && (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={billing.taxRate || ""}
                      onChange={(e) => dispatch.setTaxRate(Number(e.target.value))}
                      className="h-7 w-14 text-right font-mono text-xs font-bold bg-background rounded-md border-border"
                      placeholder="%"
                    />
                    <span className="text-[11px] font-bold text-muted-foreground">%</span>
                  </div>
                )}
              </div>

              {/* Wholesale Mode: GST Included vs Extra */}
              {isWholesale && billing.taxEnabled && (
                <div className="flex items-center gap-3 pt-1 text-[11px]">
                  <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground select-none">
                    <input
                      type="radio"
                      name="wholesaleTaxMode"
                      checked={billing.taxMode === "exclusive"}
                      onChange={() => dispatch.setTaxMode("exclusive")}
                      className="cursor-pointer text-primary"
                    />
                    <span>GST Extra</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground select-none">
                    <input
                      type="radio"
                      name="wholesaleTaxMode"
                      checked={billing.taxMode === "inclusive"}
                      onChange={() => dispatch.setTaxMode("inclusive")}
                      className="cursor-pointer text-primary"
                    />
                    <span>GST MRP Included</span>
                  </label>
                </div>
              )}

              {/* Collapsible Tax Ledger */}
              {billing.taxEnabled && taxAmount > 0 && (
                <div className="border-t border-border/40 pt-1.5 text-[11px] text-muted-foreground">
                  <div className="flex items-center justify-between py-0.5">
                    <span>Taxable Amount</span>
                    <span className="font-mono">{formatCurrency(cartTotals.taxableAmount, userCurrency)}</span>
                  </div>
                  {isInterState ? (
                    <div className="flex items-center justify-between py-0.5">
                      <span>IGST ({billing.taxRate}%)</span>
                      <span className="font-mono">{formatCurrency(igst, userCurrency)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between py-0.5">
                        <span>CGST ({billing.taxRate / 2}%)</span>
                        <span className="font-mono">{formatCurrency(cgst, userCurrency)}</span>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span>SGST ({billing.taxRate / 2}%)</span>
                        <span className="font-mono">{formatCurrency(sgst, userCurrency)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between font-semibold text-foreground pt-1 border-t border-border/30">
                    <span>Total Tax</span>
                    <span className="font-mono">{formatCurrency(taxAmount, userCurrency)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Grand Total Display */}
          <div className="flex items-baseline justify-between border-t border-border/80 pt-2.5">
            <div>
              <span className="text-sm font-bold text-foreground">Grand Total</span>
              <p className="text-[10px] text-muted-foreground">Payable by customer</p>
            </div>
            <span
              key={total}
              className="font-mono text-2xl font-black tracking-tight text-primary animate-rise"
            >
              {formatCurrency(total, userCurrency)}
            </span>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex items-center gap-2 pt-1">
          {/* Printer Settings Quick Trigger */}
          {onOpenPrinterSettings && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="relative h-11 w-11 shrink-0 rounded-xl border-border/80 bg-background hover:bg-muted cursor-pointer shadow-2xs"
              onClick={onOpenPrinterSettings}
              title={printerConnected ? "Thermal printer connected" : "Thermal printer offline"}
              aria-label="Printer settings"
            >
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <span
                className={cn(
                  "absolute right-2 top-2 h-2 w-2 rounded-full",
                  printerConnected ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30"
                )}
              />
            </Button>
          )}

          {/* Proceed to Payment Action Button */}
          <Button
            type="button"
            className="h-11 flex-1 gap-2 rounded-xl text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs active:scale-[0.99] cursor-pointer"
            onClick={() => onProceedToPayment?.()}
            disabled={billing.items.length === 0}
          >
            <span>Proceed to Payment</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Status Alerts */}
        {outletMissing && (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-700 dark:text-amber-400">
            Please select an outlet to place orders
          </p>
        )}

        {showSuccess && (
          <p className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Order created successfully
          </p>
        )}

        {submitError != null && (
          <p className="flex items-center justify-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-xs font-medium text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{getErrorMessage(submitError)}</span>
          </p>
        )}
      </div>
    </div>
  );
}
