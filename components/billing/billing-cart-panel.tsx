import React, { useState, useEffect } from "react";
import { ShoppingBag, Printer, RotateCcw, Settings2, ArrowRight, ArrowLeft } from "lucide-react";
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
  onOpenPrinterSettings,
  printerConnected,
}: BillingCartPanelProps) {
  const { user } = useAuth();
  const userCurrency = user?.currency || "INR";
  
  const isSheet = variant === "sheet";
  const [step, setStep] = useState<"cart" | "payment">("cart");

  useEffect(() => {
    if (billing.items.length === 0 && step === "payment") {
      setStep("cart");
    }
  }, [billing.items.length, step]);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden bg-card",
        isSheet ? "h-full" : "h-full rounded-xl border border-border shadow-sm",
      )}
    >
      {isSheet && (
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-base font-bold">{step === "cart" ? "Your Cart" : "Payment Options"}</h2>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      )}

      {/* {!isWholesale && (
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
      )} */}

      {isWholesale && (
        <div className="shrink-0 border-b border-border/60 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Wholesale Bill
          </p>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {step === "cart" ? (
          billing.items.length === 0 ? (
            <div className="flex h-full min-h-[12rem] flex-col items-center justify-center py-8 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">Cart is empty</p>
              <p className="text-xs text-muted-foreground/70">
                Tap a product to add it
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
          )
        ) : (
          <div className="space-y-4 pb-4 animate-in slide-in-from-right-4 fade-in duration-300">
            <BillingPaymentSection
              paymentMethods={paymentMethods}
              selectedMethod={
                billing.paymentMethod as (typeof PAYMENT_METHODS)[number]["value"]
              }
              isKhataPayment={isKhataPayment}
              payment={billing.payment}
              onSelectMethod={(method) => {
                dispatch.setPaymentMethod(method);
                if (method === "credit") dispatch.setCreditSale(true);
              }}
              onSplitAmountChange={(field, value) =>
                dispatch.setPaymentAmount({ field, value })
              }
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
                    c
                      ? {
                        id: c._id,
                        name: c.name,
                        phone: c.phone,
                        defaultTaxMode: c.defaultTaxMode,
                      }
                      : null,
                  )
                }
              />
            )}

            {hasGstInvoices && billing.taxEnabled && (
              <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-muted/30 px-3 py-2.5 text-xs">
                <input
                  type="checkbox"
                  checked={billing.generateGstInvoice}
                  onChange={(e) =>
                    dispatch.setGenerateGstInvoice(e.target.checked)
                  }
                />
                <span>
                  Generate GST Invoice
                  {!billing.customerId && billing.generateGstInvoice && (
                    <span className="ml-1 text-amber-600">
                      (select customer with GSTIN)
                    </span>
                  )}
                </span>
              </label>
            )}

            <div className="space-y-2 pt-4 border-t border-border/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order Summary</h3>
              <div className="space-y-1.5 bg-muted/10 rounded-xl p-3 border border-border/50 max-h-[235px] overflow-y-auto">
                {billing.items.map((item) => {
                  const lineQty = item.soldQty ?? item.qty;
                  return (
                    <div key={item.cartLineId} className="flex justify-between items-start gap-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground/90">{lineQty}x {item.name}</p>
                        <p className="text-[11px] text-muted-foreground/70">{formatCurrency(item.price, userCurrency)} / {item.soldUnit ?? item.unit}</p>
                      </div>
                      <span className="shrink-0 font-semibold text-foreground/90">
                        {formatCurrency(item.price * lineQty, userCurrency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 space-y-3 border-t border-border p-3">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-medium text-foreground">
              {formatCurrency(subtotal, userCurrency)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-muted-foreground">
            <span className="font-medium">Discount</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">{userCurrency}</span>
              <Input
                type="number"
                min={0}
                value={billing.discount || ""}
                onChange={(e) => dispatch.setDiscount(Number(e.target.value))}
                className="h-[38px] w-[100px] pl-7 pr-3 text-right text-sm font-semibold bg-muted/20 border-border/60 hover:bg-muted/40 transition-colors focus:bg-background"
                placeholder="0"
              />
            </div>
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
                    onChange={(e) =>
                      dispatch.setTaxRate(Number(e.target.value))
                    }
                    className="h-9 w-16 text-right text-xs"
                    placeholder="%"
                  />
                )}
              </div>
              {isWholesale && billing.taxEnabled && (
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={billing.taxMode === "exclusive"}
                      onChange={() => dispatch.setTaxMode("exclusive")}
                    />
                    GST Extra
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={billing.taxMode === "inclusive"}
                      onChange={() => dispatch.setTaxMode("inclusive")}
                    />
                    GST Included
                  </label>
                </div>
              )}

              {billing.taxEnabled &&
                taxAmount > 0 &&
                (settings.gstEnabled || isWholesale) && (
                  <div className="space-y-1 border-t border-border/40 pt-2 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Taxable</span>
                      <span>{formatCurrency(cartTotals.taxableAmount, userCurrency)}</span>
                    </div>
                    {isInterState ? (
                      <div className="flex justify-between">
                        <span>IGST</span>
                        <span>{formatCurrency(igst, userCurrency)}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span>CGST</span>
                          <span>{formatCurrency(cgst, userCurrency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>SGST</span>
                          <span>{formatCurrency(sgst, userCurrency)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between font-medium text-foreground">
                      <span>Tax</span>
                      <span>{formatCurrency(taxAmount, userCurrency)}</span>
                    </div>
                  </div>
                )}
            </div>
          )}

          <div className="flex justify-between items-end border-t border-border pt-3 mt-1 text-base font-bold">
            <span className="mb-0.5">Total</span>
            <span key={total} className="text-[22px] tracking-tight text-primary animate-rise">
              {formatCurrency(total, userCurrency)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {step === "cart" ? (
            <>
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
                className="h-12 flex-1 gap-2 text-[15px] font-bold"
                onClick={() => setStep("payment")}
                disabled={billing.items.length === 0}
              >
                <span>Proceed to Payment</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 shrink-0"
                onClick={() => setStep("cart")}
                aria-label="Back to Cart"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {onOpenPrinterSettings && (
                <Button
                  variant="outline"
                  size="icon"
                  className="relative h-12 w-12 shrink-0"
                  onClick={onOpenPrinterSettings}
                  title="Printer settings"
                  aria-label="Printer settings"
                >
                  <Settings2 className="h-4 w-4" />
                  <span
                    className={cn(
                      "absolute right-1.5 top-1.5 h-2 w-2 rounded-full",
                      printerConnected ? "bg-green-500" : "bg-muted-foreground/30",
                    )}
                  />
                </Button>
              )}
              <Button
                className="h-12 flex-1 gap-2 text-[15px] font-bold bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20"
                onClick={onCheckout}
                disabled={
                  billing.items.length === 0 || submitPending || outletMissing
                }
                title={outletMissing ? "Please select an outlet" : undefined}
              >
                {submitPending ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  <>
                    <Printer className="h-4.5 w-4.5" />
                    Place Bill — {formatCurrency(total, userCurrency)}
                  </>
                )}
              </Button>
            </>
          )}
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
