"use client";

import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CustomerPicker } from "@/components/billing/customer-picker";
import { BillingPaymentSection } from "@/components/billing/billing-payment-section";
import { BillingKhataSection } from "@/components/billing/billing-khata-section";
import { formatCurrency } from "@/lib/format";
import { useAuth } from "@/components/auth/auth-provider";
import type { LineItem } from "@/store/billingSlice";
import type { PAYMENT_METHODS } from "@/components/billing/billing-constants";
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

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[95vw] md:max-w-4xl lg:max-w-5xl w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col gap-0 rounded-2xl bg-card border border-border/60 shadow-2xl">
        <DialogTitle className="sr-only">Checkout Payment</DialogTitle>
        <DialogDescription className="sr-only">Review your order and select a payment method.</DialogDescription>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-muted">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold tracking-tight">Complete Payment</h2>
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            {billing.items.length} items
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="flex flex-1 min-h-0 flex-col md:flex-row">
          
          {/* Left Column: Order Summary (60%) */}
          <div className="flex flex-col flex-1 border-r border-border min-h-0 bg-background/50 relative">
            <div className="px-6 py-4 border-b border-border/40 shrink-0 bg-card z-10">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Order Summary</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {billing.items.map((item) => {
                const lineQty = item.soldQty ?? item.qty;
                return (
                  <div key={item.cartLineId} className="flex justify-between items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground/90 text-base leading-snug break-words">
                        {lineQty}x {item.name}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {formatCurrency(item.price, userCurrency)} / {item.soldUnit ?? item.unit}
                      </p>
                    </div>
                    <span className="shrink-0 font-bold text-foreground text-lg">
                      {formatCurrency(item.price * lineQty, userCurrency)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Sticky Footer: Totals */}
            <div className="shrink-0 space-y-3 border-t border-border bg-card p-6 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.05)]">
              <div className="space-y-2 text-[15px]">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(subtotal, userCurrency)}
                  </span>
                </div>
                
                {/* Discount */}
                <div className="flex items-center justify-between gap-2 text-muted-foreground">
                  <span className="font-medium">Discount</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">{userCurrency}</span>
                    <Input
                      type="number"
                      min={0}
                      value={billing.discount || ""}
                      onChange={(e) => dispatch.setDiscount(Number(e.target.value))}
                      className="h-10 w-[140px] pl-9 pr-3 text-right font-semibold border-input bg-background placeholder:font-normal focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      placeholder="Discount"
                    />
                  </div>
                </div>

                {/* Taxes */}
                {(isWholesale || billing.taxEnabled) && (
                  <div className="space-y-2 rounded-xl bg-muted/30 p-3 mt-2 border border-border/50">
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          checked={billing.taxEnabled}
                          onChange={(e) => dispatch.setTaxEnabled(e.target.checked)}
                        />
                        GST Applied
                      </label>
                      {billing.taxEnabled && (
                        <Input
                          type="number"
                          value={billing.taxRate}
                          onChange={(e) => dispatch.setTaxRate(Number(e.target.value))}
                          className="h-8 w-16 px-2 py-1 text-right text-xs bg-background"
                          min={0}
                          max={100}
                        />
                      )}
                    </div>
                    {billing.taxEnabled && taxAmount > 0 && (
                      <div className="space-y-1 pt-1 text-xs text-muted-foreground pl-6">
                        <div className="flex justify-between">
                          <span>Taxable Amount</span>
                          <span>{formatCurrency(cartTotals.taxableAmount, userCurrency)}</span>
                        </div>
                        {isInterState ? (
                          <div className="flex justify-between">
                            <span>IGST ({billing.taxRate}%)</span>
                            <span>{formatCurrency(igst, userCurrency)}</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between">
                              <span>CGST ({billing.taxRate / 2}%)</span>
                              <span>{formatCurrency(cgst, userCurrency)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>SGST ({billing.taxRate / 2}%)</span>
                              <span>{formatCurrency(sgst, userCurrency)}</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border/40 mt-1">
                          <span>Total Tax</span>
                          <span>{formatCurrency(taxAmount, userCurrency)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-end border-t border-border/80 pt-4 mt-2">
                <span className="text-lg font-semibold text-muted-foreground">Total Amount</span>
                <span className="text-3xl font-black tracking-tight text-foreground">
                  {formatCurrency(total, userCurrency)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Payment (40%) */}
          <div className="flex w-full md:w-[450px] shrink-0 flex-col min-h-0 bg-card">
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Payment Methods */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Select Payment Method</h3>
                <BillingPaymentSection
                  paymentMethods={paymentMethods}
                  selectedMethod={billing.paymentMethod as (typeof PAYMENT_METHODS)[number]["value"]}
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
              </div>

              {/* Khata / Customer Details */}
              {isKhataPayment && hasCreditKhata && (
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Khata Details</h3>
                  <BillingKhataSection
                    total={total}
                    amountReceived={billing.amountReceived}
                    amountDuePreview={amountDuePreview}
                    hasCustomer={Boolean(billing.customerId)}
                    onAmountChange={(n) => dispatch.setAmountReceived(n)}
                  />
                </div>
              )}

              {/* Customer Selector for regular sales if needed */}
              {showCustomerSection && (
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Customer (Optional)</h3>
                  <CustomerPicker
                    token={token}
                    outletId={outletId}
                    selectedId={billing.customerId}
                    onSelect={(c) => dispatch.selectCustomer(c)}
                  />
                  {hasGstInvoices && (
                    <label className="flex items-center gap-2 text-sm cursor-pointer mt-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={billing.generateGstInvoice}
                        onChange={(e) => dispatch.setGenerateGstInvoice(e.target.checked)}
                      />
                      <span>Generate GST Invoice</span>
                    </label>
                  )}
                </div>
              )}

              {/* Additional Details */}
              <div className="space-y-4 pt-4 border-t border-border/50">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Sale Notes</h3>
                <Input
                  placeholder="Optional notes for this bill..."
                  value={billing.notes || ""}
                  onChange={(e) => dispatch.setNotes(e.target.value)}
                  className="bg-muted/30"
                />
                <div className="flex items-center gap-3 mt-4">
                  <Switch
                    checked={billing.creditSale}
                    onCheckedChange={(c) => dispatch.setCreditSale(c)}
                  />
                  <span className="text-sm font-medium">Mark as Credit Sale</span>
                </div>
              </div>
            </div>

            {/* Checkout Action */}
            <div className="shrink-0 p-6 border-t border-border bg-card">
              <Button
                className="w-full h-16 gap-3 text-lg font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 rounded-xl transition-all active:scale-[0.98]"
                onClick={() => {
                  if (outletMissing) {
                    toast.error("Your account has no outlets assigned. Please contact the administrator.");
                    return;
                  }
                  onCheckout();
                }}
                disabled={billing.items.length === 0 || submitPending || outletMissing}
              >
                {submitPending ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Printer className="h-6 w-6" />
                    Place Bill — {formatCurrency(total, userCurrency)}
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
