"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Printer, Loader2, Receipt, Banknote, CheckCircle, Calculator, FileText, User, BookOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CustomerPicker } from "@/components/billing/customer-picker";
import { BillingPaymentSection } from "@/components/billing/billing-payment-section";
import { BillingKhataSection } from "@/components/billing/billing-khata-section";
import { formatCurrency } from "@/lib/format";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";
import type { LineItem } from "@/store/billingSlice";
import type { PAYMENT_METHODS } from "@/components/billing/billing-constants";
import type { Customer } from "@/lib/types";
import { toast } from "react-hot-toast";

type PaymentMethodItem = (typeof PAYMENT_METHODS)[number];

type BillingPaymentModalProps = {
  open: boolean;
  onClose: () => void;
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
    customerName?: string;
    customerPhone?: string;
    amountReceived: number;
    generateGstInvoice: boolean;
    creditSale: boolean;
    notes?: string;
    isCreditSale?: boolean;
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
  outletMissing: boolean;
  submitPending: boolean;
  dispatch: any;
  onCheckout: () => void;
};

export function BillingPaymentModal({
  open,
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
  outletMissing,
  submitPending,
  dispatch,
  onCheckout,
}: BillingPaymentModalProps) {
  const { user } = useAuth();
  const userCurrency = user?.currency || "INR";

  // Cash tender calculator state
  const [cashTendered, setCashTendered] = useState<number | "">("");
  const [khataCustomerModalOpen, setKhataCustomerModalOpen] = useState(false);

  // Quick cash tender preset chips
  const quickCashOptions = React.useMemo(() => {
    const roundedTotal = Math.ceil(total);
    const presets = new Set<number>();
    presets.add(roundedTotal);
    if (roundedTotal < 500) presets.add(500);
    if (roundedTotal < 1000) presets.add(1000);
    if (roundedTotal < 2000) presets.add(2000);
    return Array.from(presets).sort((a, b) => a - b);
  }, [total]);

  const changeDue = typeof cashTendered === "number" && cashTendered > total ? cashTendered - total : 0;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[95vw] md:max-w-4xl lg:max-w-5xl w-[95vw] h-[92vh] max-h-[850px] p-0 overflow-hidden flex flex-col gap-0 rounded-2xl bg-card border border-border/80 shadow-2xl">
        <DialogTitle className="sr-only">Checkout Settlement</DialogTitle>
        <DialogDescription className="sr-only">
          Verify items, calculate tax, select payment method, and complete bill.
        </DialogDescription>

        {/* Modal Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border/70 bg-muted/20 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-lg hover:bg-muted cursor-pointer"
              aria-label="Back to billing"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Checkout Settlement
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {billing.items.length} {billing.items.length === 1 ? "line item" : "line items"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-muted-foreground">Amount Payable:</span>
            <span className="font-mono text-lg font-black tracking-tight text-primary">
              {formatCurrency(total, userCurrency)}
            </span>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="flex flex-1 min-h-0 flex-col md:flex-row overflow-hidden">
          {/* Left Column: Order Itemization & Financial Ledger */}
          <div className="flex flex-col flex-1 border-b md:border-b-0 md:border-r border-border/70 min-h-0 bg-background/50">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 bg-card px-5 py-2.5 shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5 text-primary" />
                Receipt Summary
              </span>
              <span className="text-[11px] text-muted-foreground">
                {billing.items.reduce((s, i) => s + (i.soldQty ?? i.qty), 0)} Total Units
              </span>
            </div>

            {/* Line items scroll list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin">
              {billing.items.map((item) => {
                const lineQty = item.soldQty ?? item.qty;
                return (
                  <div
                    key={item.cartLineId}
                    className="flex justify-between items-start gap-3 rounded-xl border border-border/60 bg-card p-2.5 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground/90 leading-snug line-clamp-2">
                        {lineQty}x {item.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                        {formatCurrency(item.price, userCurrency)} / {item.soldUnit ?? item.unit}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-black text-foreground">
                      {formatCurrency(item.price * lineQty, userCurrency)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Totals & Taxes Footer */}
            <div className="shrink-0 space-y-2.5 border-t border-border/70 bg-card p-4 shadow-sm">
              <div className="space-y-1.5 text-xs">
                {/* Subtotal */}
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono font-semibold text-foreground">
                    {formatCurrency(subtotal, userCurrency)}
                  </span>
                </div>

                {/* Discount */}
                <div className="flex items-center justify-between gap-2 text-muted-foreground">
                  <span className="font-semibold text-foreground">Discount</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                      {userCurrency}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      value={billing.discount || ""}
                      onChange={(e) => dispatch.setDiscount(Number(e.target.value))}
                      className="h-7 w-24 pl-8 pr-2 text-right font-mono text-xs font-bold bg-background rounded-md border-border"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* GST Tax Breakdown */}
                {(isWholesale || billing.taxEnabled) && (
                  <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                          checked={billing.taxEnabled}
                          onChange={(e) => dispatch.setTaxEnabled(e.target.checked)}
                        />
                        <span>GST Applied</span>
                      </label>
                      {billing.taxEnabled && (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={billing.taxRate}
                            onChange={(e) => dispatch.setTaxRate(Number(e.target.value))}
                            className="h-6.5 w-12 text-right font-mono text-xs bg-background rounded-md"
                            min={0}
                            max={100}
                          />
                          <span className="text-[10px] text-muted-foreground">%</span>
                        </div>
                      )}
                    </div>

                    {billing.taxEnabled && taxAmount > 0 && (
                      <div className="space-y-1 pt-1 text-[11px] text-muted-foreground border-t border-border/30">
                        <div className="flex justify-between">
                          <span>Taxable Value</span>
                          <span className="font-mono">{formatCurrency(cartTotals.taxableAmount, userCurrency)}</span>
                        </div>
                        {isInterState ? (
                          <div className="flex justify-between">
                            <span>IGST ({billing.taxRate}%)</span>
                            <span className="font-mono">{formatCurrency(igst, userCurrency)}</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between">
                              <span>CGST ({billing.taxRate / 2}%)</span>
                              <span className="font-mono">{formatCurrency(cgst, userCurrency)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>SGST ({billing.taxRate / 2}%)</span>
                              <span className="font-mono">{formatCurrency(sgst, userCurrency)}</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between font-bold text-foreground pt-0.5 border-t border-border/30">
                          <span>Total GST</span>
                          <span className="font-mono">{formatCurrency(taxAmount, userCurrency)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Total Row */}
              <div className="flex items-baseline justify-between border-t border-border/80 pt-2">
                <span className="text-sm font-bold text-foreground">Grand Total</span>
                <span className="font-mono text-2xl font-black tracking-tight text-primary">
                  {formatCurrency(total, userCurrency)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Payment Settlement Controls */}
          <div className="flex w-full md:w-[460px] shrink-0 flex-col min-h-0 bg-card">
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
              {/* Customer Selector (Shown for standard sales; for Khata sales, it is embedded directly inside Khata Ledger below) */}
              {!isKhataPayment && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-primary" />
                      Customer Account
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Optional (Walk-in)
                    </span>
                  </div>

                  <CustomerPicker
                    token={token}
                    outletId={outletId}
                    selectedId={billing.customerId}
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

                  {hasGstInvoices && (
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer pt-1 text-foreground">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                        checked={billing.generateGstInvoice}
                        onChange={(e) => dispatch.setGenerateGstInvoice(e.target.checked)}
                      />
                      <span>Generate GST Tax Invoice</span>
                    </label>
                  )}
                </div>
              )}

              {/* Payment Method Selector */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Payment Method
                </span>
                <BillingPaymentSection
                  paymentMethods={paymentMethods}
                  selectedMethod={billing.paymentMethod as (typeof PAYMENT_METHODS)[number]["value"]}
                  isKhataPayment={isKhataPayment}
                  payment={billing.payment}
                  onSelectMethod={(method) => {
                    dispatch.setPaymentMethod(method);
                    const isCredit = method === "credit";
                    dispatch.setCreditSale(isCredit);
                    if (isCredit && !billing.customerId) {
                      setKhataCustomerModalOpen(true);
                    }
                  }}
                  onSplitAmountChange={(field, value) =>
                    dispatch.setPaymentAmount({ field, value })
                  }
                />
              </div>

              {/* Cash Calculator (When Cash Selected) */}
              {billing.paymentMethod === "cash" && !isKhataPayment && (
                <div className="space-y-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <Banknote className="h-3.5 w-3.5" />
                      Cash Tendered
                    </span>
                    {changeDue > 0 && (
                      <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-black text-white shadow-xs">
                        Change: {formatCurrency(changeDue, userCurrency)}
                      </span>
                    )}
                  </div>

                  {/* Quick Tender Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {quickCashOptions.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashTendered(amt)}
                        className="rounded-lg border border-emerald-500/30 bg-card px-2.5 py-1 text-xs font-bold text-foreground hover:bg-emerald-500/10 transition-colors cursor-pointer"
                      >
                        {formatCurrency(amt, userCurrency)}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                      {userCurrency}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value === "" ? "" : Number(e.target.value))}
                      className="h-9 pl-9 pr-3 text-right font-mono text-sm font-bold bg-background rounded-lg border-emerald-500/30"
                      placeholder="Amount given by customer"
                    />
                  </div>
                </div>
              )}

              {/* Khata / Credit Details */}
              {isKhataPayment && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-amber-600" />
                    Khata Credit Ledger
                  </span>
                  <BillingKhataSection
                    total={total}
                    amountReceived={billing.amountReceived}
                    amountDuePreview={amountDuePreview}
                    hasCustomer={Boolean(billing.customerId)}
                    token={token}
                    outletId={outletId}
                    customerId={billing.customerId}
                    onSelectCustomer={(c: Customer | null) =>
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
                    customerPickerOpen={khataCustomerModalOpen}
                    onCustomerPickerOpenChange={setKhataCustomerModalOpen}
                    onAmountChange={(n) => dispatch.setAmountReceived(n)}
                  />

                  {hasGstInvoices && (
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer pt-1 text-foreground">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                        checked={billing.generateGstInvoice}
                        onChange={(e) => dispatch.setGenerateGstInvoice(e.target.checked)}
                      />
                      <span>Generate GST Tax Invoice</span>
                    </label>
                  )}
                </div>
              )}

              {/* Credit Sale Toggle & Sale Notes */}
              <div className="space-y-3 pt-2 border-t border-border/50">
                <div className={cn(
                  "flex items-center justify-between rounded-xl border p-2.5 transition-colors",
                  isKhataPayment
                    ? "border-amber-500/40 bg-amber-500/10"
                    : "border-border/60 bg-muted/20"
                )}>
                  <div>
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-amber-600" />
                      Mark as Credit Sale
                    </p>
                    <p className="text-[10px] text-muted-foreground">Deferred payment recorded in customer khata balance</p>
                  </div>
                  <Switch
                    checked={isKhataPayment}
                    onCheckedChange={(c) => {
                      dispatch.setCreditSale(c);
                      dispatch.setPaymentMethod(c ? "credit" : "cash");
                      if (c && !billing.customerId) {
                        setKhataCustomerModalOpen(true);
                      }
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Sale Notes (Optional)
                  </span>
                  <Input
                    placeholder="e.g. Purchase order ref, delivery remark, etc."
                    value={billing.notes || ""}
                    onChange={(e) => dispatch.setNotes(e.target.value)}
                    className="h-9 text-xs bg-muted/20 rounded-lg border-border"
                  />
                </div>
              </div>
            </div>

            {/* Place Bill Action Button (Zero em dashes!) */}
            <div className="shrink-0 p-4 border-t border-border/80 bg-card">
              <Button
                className={cn(
                  "w-full h-14 gap-2.5 text-base font-bold text-white shadow-lg rounded-xl transition-all active:scale-[0.98] cursor-pointer",
                  isKhataPayment && !billing.customerId
                    ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                )}
                onClick={() => {
                  if (outletMissing) {
                    toast.error("Your account has no outlets assigned. Please contact the administrator.");
                    return;
                  }
                  if (isKhataPayment && !billing.customerId) {
                    setKhataCustomerModalOpen(true);
                    toast.error("Select a customer: required for khata / partial payment");
                    return;
                  }
                  onCheckout();
                }}
                disabled={billing.items.length === 0 || submitPending || outletMissing}
              >
                {submitPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processing Bill...</span>
                  </>
                ) : isKhataPayment && !billing.customerId ? (
                  <>
                    <User className="h-5 w-5" />
                    <span>Select Customer for Credit ({formatCurrency(total, userCurrency)})</span>
                  </>
                ) : (
                  <>
                    <Printer className="h-5 w-5" />
                    <span>Place Bill: {formatCurrency(total, userCurrency)}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
