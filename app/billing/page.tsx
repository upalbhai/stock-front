"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Minus, Trash2, ShoppingBag, Printer, RotateCcw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addItem, removeItem, updateQty, setDiscount, setNotes,
  setCustomer, setBillingMode, setPaymentMethod, setPaymentAmount, clearBill
} from "@/store/billingSlice";
import { getJson, apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product, Category } from "@/lib/types";

const BILLING_MODES = [
  { value: "quick", label: "Quick", icon: "⚡" },
  { value: "takeaway", label: "Takeaway", icon: "🛍️" },
  { value: "dine_in", label: "Dine-in", icon: "🪑" },
  { value: "parcel", label: "Parcel", icon: "📦" }
] as const;

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash", icon: "💵" },
  { value: "upi", label: "UPI", icon: "📱" },
  { value: "card", label: "Card", icon: "💳" },
  { value: "wallet", label: "Wallet", icon: "👛" },
  { value: "split", label: "Split", icon: "✂️" }
] as const;

export default function BillingPage() {
  const { token, outletId } = useAuth();
  const dispatch = useAppDispatch();
  const qc = useQueryClient();
  const billing = useAppSelector((s) => s.billing);

  const [search, setSearch] = React.useState("");
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
  const [selectedParentId, setSelectedParentId] = React.useState<string | null>(null);
  const [showSuccess, setShowSuccess] = React.useState(false);

  const { data: catData } = useQuery({
    queryKey: ["categories", outletId],
    queryFn: () => getJson<{ categories: Category[] }>("/categories", token, { outletId: outletId ?? undefined }),
    enabled: Boolean(token && outletId)
  });

  const { data: prodData } = useQuery({
    queryKey: ["products", outletId, selectedCategoryId, search],
    queryFn: () => getJson<{ products: Product[] }>("/products", token, {
      outletId: outletId ?? undefined,
      categoryId: selectedCategoryId ?? undefined,
      search: search || undefined
    }),
    enabled: Boolean(token && outletId)
  });

  const submitOrder = useMutation({
    mutationFn: (body: unknown) => apiFetch("/orders", { method: "POST", body, token }),
    onSuccess: () => {
      dispatch(clearBill());
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      qc.invalidateQueries({ queryKey: ["report"] });
      qc.invalidateQueries({ queryKey: ["stock-alerts"] });
    }
  });

  const categories = catData?.categories ?? [];
  const topCategories = categories.filter((c) => !c.parentId);
  const products = prodData?.products ?? [];

  const subtotal = billing.items.reduce((s, i) => s + i.price * i.qty, 0);
  const taxAmount = billing.taxEnabled ? subtotal * billing.taxRate : 0;
  const total = Math.max(0, subtotal + taxAmount - billing.discount);

  const handleAddProduct = (product: Product) => {
    dispatch(addItem({
      id: product._id,
      name: product.name,
      price: product.price,
      taxRate: product.taxRate,
      unit: product.unit,
      image: product.image,
      categoryId: typeof product.categoryId === "object" ? product.categoryId?._id : product.categoryId ?? undefined
    }));
  };

  const handleCheckout = () => {
    if (billing.items.length === 0) return;
    const paymentSplit = billing.paymentMethod === "split"
      ? { cash: billing.payment.cash, upi: billing.payment.upi, card: billing.payment.card }
      : undefined;
    submitOrder.mutate({
      outletId,
      billingMode: billing.billingMode,
      items: billing.items.map((i) => ({
        productId: i.id,
        name: i.name,
        qty: i.qty,
        price: i.price,
        taxRate: i.taxRate,
        lineTotal: i.price * i.qty,
        taxTotal: i.price * i.qty * i.taxRate
      })),
      subtotal,
      discount: billing.discount,
      tax: taxAmount,
      total,
      notes: billing.notes,
      customerName: billing.customerName || undefined,
      payment: {
        method: billing.paymentMethod,
        amount: total,
        split: paymentSplit
      }
    });
  };

  const activeSubcategories = selectedParentId
    ? categories.filter((c) => c.parentId === selectedParentId)
    : [];

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4 overflow-hidden">
      {/* LEFT: Product Panel */}
      <div className="flex flex-1 flex-col gap-3 overflow-hidden">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            id="product-search"
            className="pl-9"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => { setSelectedCategoryId(null); setSelectedParentId(null); }}
            className={cn(
              "shrink-0 rounded-2xl px-4 py-2 text-sm font-medium transition",
              !selectedCategoryId ? "bg-primary text-white" : "bg-surface border border-border text-muted hover:text-text"
            )}
          >
            All
          </button>
          {topCategories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => {
                const hasChildren = categories.some((c) => c.parentId === cat._id);
                if (hasChildren) {
                  setSelectedParentId(selectedParentId === cat._id ? null : cat._id);
                  setSelectedCategoryId(cat._id);
                } else {
                  setSelectedCategoryId(cat._id);
                  setSelectedParentId(null);
                }
              }}
              className={cn(
                "shrink-0 flex items-center gap-1.5 rounded-2xl px-4 py-2 text-sm font-medium transition",
                selectedCategoryId === cat._id
                  ? "text-white shadow-soft"
                  : "bg-surface border border-border text-muted hover:text-text"
              )}
              style={selectedCategoryId === cat._id ? { backgroundColor: cat.color } : {}}
            >
              <span>{cat.icon}</span>
              {cat.name}
              {categories.some((c) => c.parentId === cat._id) && (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          ))}
        </div>

        {/* Subcategory row */}
        {activeSubcategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {activeSubcategories.map((sub) => (
              <button
                key={sub._id}
                onClick={() => setSelectedCategoryId(sub._id)}
                className={cn(
                  "shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition border",
                  selectedCategoryId === sub._id
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-surface border-border text-muted hover:text-text"
                )}
              >
                {sub.icon} {sub.name}
              </button>
            ))}
          </div>
        )}

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-4xl">🛍️</p>
              <p className="mt-2 text-sm text-muted">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => {
                const cartItem = billing.items.find((i) => i.id === product._id);
                return (
                  <button
                    key={product._id}
                    onClick={() => handleAddProduct(product)}
                    className={cn(
                      "group relative rounded-3xl border p-4 text-left transition active:scale-95",
                      "bg-surface hover:border-primary/50 hover:shadow-soft",
                      cartItem ? "border-primary/40 bg-primary/5" : "border-border"
                    )}
                  >
                    {cartItem && (
                      <div className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow">
                        {cartItem.qty}
                      </div>
                    )}
                    {product.image && (
                      <img src={product.image} alt={product.name}
                        className="mb-2 h-16 w-full rounded-2xl object-cover" />
                    )}
                    <p className="text-sm font-semibold leading-tight line-clamp-2">{product.name}</p>
                    <p className="mt-1 text-xs text-muted">{product.unit}</p>
                    <p className="mt-2 text-base font-bold text-primary">{formatCurrency(product.price)}</p>
                    {product.onHandQty <= product.lowStockThreshold && (
                      <Badge variant="warning" className="mt-1 text-[10px]">Low Stock</Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart Panel */}
      <div className="flex w-80 shrink-0 flex-col gap-3 xl:w-96">
        <div className="glass-panel flex flex-1 flex-col overflow-hidden rounded-3xl border border-border/70 shadow-soft">
          {/* Billing Mode */}
          <div className="flex gap-1 border-b border-border/60 p-3">
            {BILLING_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => dispatch(setBillingMode(mode.value))}
                className={cn(
                  "flex-1 rounded-xl py-1.5 text-xs font-medium transition",
                  billing.billingMode === mode.value
                    ? "bg-primary text-white" : "text-muted hover:bg-border/40"
                )}
              >
                {mode.icon} {mode.label}
              </button>
            ))}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-3">
            {billing.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                <ShoppingBag className="h-12 w-12 text-muted/30" />
                <p className="mt-3 text-sm text-muted">Cart is empty</p>
                <p className="text-xs text-muted/60">Tap a product to add it</p>
              </div>
            ) : (
              <div className="space-y-2">
                {billing.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 rounded-2xl bg-surface/60 p-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-tight truncate">{item.name}</p>
                      <p className="text-xs text-muted">{formatCurrency(item.price)} × {item.qty}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => dispatch(updateQty({ id: item.id, qty: item.qty - 1 }))}
                        className="flex h-6 w-6 items-center justify-center rounded-lg bg-border/60 hover:bg-border transition">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-semibold">{item.qty}</span>
                      <button onClick={() => dispatch(updateQty({ id: item.id, qty: item.qty + 1 }))}
                        className="flex h-6 w-6 items-center justify-center rounded-lg bg-border/60 hover:bg-border transition">
                        <Plus className="h-3 w-3" />
                      </button>
                      <button onClick={() => dispatch(removeItem(item.id))}
                        className="flex h-6 w-6 items-center justify-center rounded-lg text-danger/70 hover:bg-danger/10 transition">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="shrink-0 text-xs font-bold">{formatCurrency(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals & Payment */}
          <div className="border-t border-border/60 p-3 space-y-2">
            <div className="flex justify-between text-xs text-muted">
              <span>Subtotal</span><span className="font-medium text-text">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Discount (₹)</span>
              <input
                type="number" min={0} value={billing.discount || ""}
                onChange={(e) => dispatch(setDiscount(Number(e.target.value)))}
                className="w-20 rounded-xl border border-border bg-surface px-2 py-1 text-right text-xs outline-none focus:border-primary"
                placeholder="0"
              />
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-border/60 pt-2">
              <span>Total</span>
              <span className="text-primary text-base">{formatCurrency(total)}</span>
            </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-5 gap-1 pt-1">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.value}
                  onClick={() => dispatch(setPaymentMethod(pm.value))}
                  className={cn(
                    "flex flex-col items-center rounded-xl py-1.5 text-[10px] font-medium transition",
                    billing.paymentMethod === pm.value
                      ? "bg-primary text-white" : "bg-border/40 text-muted hover:bg-border"
                  )}
                >
                  <span className="text-sm">{pm.icon}</span>
                  {pm.label}
                </button>
              ))}
            </div>

            {/* Split payment inputs */}
            {billing.paymentMethod === "split" && (
              <div className="space-y-1.5 rounded-2xl bg-surface/60 p-2">
                {(["cash", "upi", "card"] as const).map((method) => (
                  <div key={method} className="flex items-center gap-2">
                    <span className="w-10 text-xs text-muted capitalize">{method}</span>
                    <input
                      type="number" min={0}
                      value={billing.payment[method] || ""}
                      onChange={(e) => dispatch(setPaymentAmount({ field: method, value: Number(e.target.value) }))}
                      className="flex-1 rounded-xl border border-border bg-surface px-2 py-1 text-xs outline-none focus:border-primary"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="flex-none" onClick={() => dispatch(clearBill())}
                disabled={billing.items.length === 0}>
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="lg"
                className="flex-1 gap-2"
                onClick={handleCheckout}
                disabled={billing.items.length === 0 || submitOrder.isPending}
                id="checkout-btn"
              >
                {submitOrder.isPending ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  <><Printer className="h-4 w-4" /> Bill — {formatCurrency(total)}</>
                )}
              </Button>
            </div>

            {showSuccess && (
              <div className="rounded-2xl bg-green-500/10 border border-green-500/30 p-3 text-center animate-rise">
                <p className="text-sm font-medium text-green-600">✓ Order created successfully!</p>
              </div>
            )}
            {submitOrder.isError && (
              <div className="rounded-2xl bg-danger/10 border border-danger/30 p-2 text-center">
                <p className="text-xs text-danger">{(submitOrder.error as Error).message}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
