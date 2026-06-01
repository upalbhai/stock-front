"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Minus, Trash2, ShoppingBag, Printer, RotateCcw, ChevronRight, ChevronLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
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
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const catScrollRef = React.useRef<HTMLDivElement>(null);

  const [search, setSearch] = React.useState("");
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
  const [selectedParentId, setSelectedParentId] = React.useState<string | null>(null);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [prodPage, setProdPage] = React.useState(1);
  const [prodLimit, setProdLimit] = React.useState(12);
  const [prodIsRefetching, setProdIsRefetching] = React.useState(false);
  const [prodCooldownSeconds, setProdCooldownSeconds] = React.useState(0);
  const [catPage, setCatPage] = React.useState(0);

  const { data: catData } = useQuery({
    queryKey: ["categories", outletId],
    queryFn: () => getJson<{ categories?: Category[]; data?: Category[] }>("/categories", token, { flat: "true" }),
    enabled: Boolean(token)
  });

  const { data: prodData, refetch: refetchProducts } = useQuery({
    queryKey: ["products", outletId, selectedCategoryId, search, prodPage, prodLimit],
    queryFn: () => getJson<{ data: Product[]; meta?: any }>("/products", token, {
      outletId: outletId ?? undefined,
      categoryId: selectedCategoryId ?? undefined,
      search: search || undefined,
      page: prodPage,
      limit: prodLimit
    }),
    // enable when we have a token; backend accepts missing outletId
    enabled: Boolean(token)
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

  const rawCat = catData as any;
  const categories: Category[] = (rawCat && (rawCat.categories ?? rawCat.data)) ?? [];
  const topCategories = categories.filter((c) => !c.parentId);
  const rawProd = prodData as any;
  const products: Product[] = (rawProd && (rawProd.products ?? rawProd.data)) ?? [];
  const prodMeta = (rawProd)?.meta?.pagination;
  console.log("Billing categories query:", { token, categories: categories.length, catData: rawCat });
  console.log("Billing products query:", { token, outletId, selectedCategoryId, search, productsLength: products.length, prodData: rawProd });

  // Cleanup timeout ref
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Track category scroll position for pagination
  React.useEffect(() => {
    const handleScroll = () => {
      if (!catScrollRef.current) return;
      const scrollLeft = catScrollRef.current.scrollLeft;
      const itemsPerPage = 4; // Approximate based on button width
      const newPage = Math.floor(scrollLeft / 200); // 200px is scroll distance per arrow click
      setCatPage(newPage);
    };

    const scrollElement = catScrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll);
      return () => scrollElement.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Refetch handler with 15s cooldown
  const handleProdRefetch = () => {
    setProdIsRefetching(true);
    setProdCooldownSeconds(15);
    refetchProducts();
    let seconds = 15;
    timeoutRef.current = setInterval(() => {
      seconds -= 1;
      setProdCooldownSeconds(seconds);
      if (seconds === 0) {
        setProdIsRefetching(false);
        if (timeoutRef.current) clearInterval(timeoutRef.current);
      }
    }, 1000);
  };

  // Scroll category tabs
  const scrollCategoryLeft = () => {
    if (catScrollRef.current) {
      catScrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollCategoryRight = () => {
    if (catScrollRef.current) {
      catScrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

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
    if (!outletId) {
      alert("Please select an outlet before placing an order");
      return;
    }
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

  // Calculate total category pages
  const catItemsPerPage = 4;
  const totalCatPages = Math.ceil((topCategories.length + 1) / catItemsPerPage); // +1 for "All" button

  return (
    <div className="flex h-[calc(100vh-120px)] gap-2 overflow-hidden">
      {/* LEFT: Product Panel */}
      <div className="flex flex-1 flex-col gap-2 overflow-hidden">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            id="product-search"
            className="pl-9 py-2.5"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onClick={scrollCategoryLeft}
            className="h-8 w-8 shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div ref={catScrollRef} className="flex flex-1 gap-1.5 overflow-x-auto pb-0.5 scroll-smooth scrollbar-hide">
            <button
              onClick={() => { setSelectedCategoryId(null); setSelectedParentId(null); }}
              className={cn(
                "shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition",
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
                  "shrink-0 flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium transition",
                  selectedCategoryId === cat._id
                    ? "text-white shadow-soft"
                    : "bg-surface border border-border text-muted hover:text-text"
                )}
                style={selectedCategoryId === cat._id ? { backgroundColor: cat.color } : {}}
              >
                <span>{cat.icon}</span>
                {cat.name}
                {categories.some((c) => c.parentId === cat._id) && (
                  <ChevronRight className="h-2.5 w-2.5" />
                )}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={scrollCategoryRight}
            className="h-8 w-8 shrink-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Subcategory row */}
        {activeSubcategories.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {activeSubcategories.map((sub) => (
              <button
                key={sub._id}
                onClick={() => setSelectedCategoryId(sub._id)}
                className={cn(
                  "shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium transition border",
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

        {/* Pagination & Refetch */}
        <div className="flex items-center justify-between gap-2 px-1.5">
          <Button variant="outline" size="sm" onClick={handleProdRefetch} disabled={prodIsRefetching} id="refetch-prod-billing-btn">
            <RefreshCw className={`h-3 w-3 ${prodIsRefetching ? "animate-spin" : ""}`} />
            {prodIsRefetching ? `${prodCooldownSeconds}s` : "Refetch"}
          </Button>
          {prodMeta && (
            <div className="text-[10px] text-muted">
              Page {prodPage} of {prodMeta.totalPages || 1}
            </div>
          )}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-1.5">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-4xl">🛍️</p>
              <p className="mt-2 text-xs text-muted">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => {
                const cartItem = billing.items.find((i) => i.id === product._id);
                return (
                  <button
                    key={product._id}
                    onClick={() => handleAddProduct(product)}
                    className={cn(
                      "group relative rounded-2xl border p-3 text-left transition active:scale-95",
                      "bg-surface hover:border-primary/50 hover:shadow-soft",
                      cartItem ? "border-primary/40 bg-primary/5" : "border-border"
                    )}
                  >
                    {cartItem && (
                      <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow">
                        {cartItem.qty}
                      </div>
                    )}
                    {product.image && (
                      <img src={product.image} alt={product.name}
                        className="mb-2 h-14 w-full rounded-lg object-cover" />
                    )}
                    <p className="text-[12px] font-semibold leading-tight line-clamp-2">{product.name}</p>
                    <p className="mt-0.5 text-[10px] text-muted">{product.unit}</p>
                    <p className="mt-1 text-sm font-bold text-primary">{formatCurrency(product.price)}</p>
                    {product.onHandQty <= product.lowStockThreshold && (
                      <Badge variant="warning" className="mt-1 text-[9px]">Low Stock</Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {prodMeta && prodMeta.totalPages > 1 && (
            <div className="flex justify-center py-4">
              <Pagination
                page={prodPage}
                totalPages={prodMeta.totalPages}
                pageSize={prodLimit}
                onPageChange={setProdPage}
                onPageSizeChange={(size) => { setProdLimit(size); setProdPage(1); }}
              />
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart Panel */}
      <div className="flex w-72 shrink-0 flex-col gap-2 xl:w-80">
        <div className="glass-panel flex flex-1 flex-col overflow-hidden rounded-2xl border border-border/70 shadow-soft">
          {/* Billing Mode */}
          <div className="flex gap-0.5 border-b border-border/60 p-2">
            {BILLING_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => dispatch(setBillingMode(mode.value))}
                className={cn(
                  "flex-1 rounded-lg py-1 text-[10px] font-medium transition",
                  billing.billingMode === mode.value
                    ? "bg-primary text-white" : "text-muted hover:bg-border/40"
                )}
              >
                {mode.icon} {mode.label}
              </button>
            ))}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-2">
            {billing.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-6 text-center">
                <ShoppingBag className="h-10 w-10 text-muted/30" />
                <p className="mt-2 text-xs text-muted">Cart is empty</p>
                <p className="text-[10px] text-muted/60">Tap a product to add it</p>
              </div>
            ) : (
              <div className="space-y-1">
                {billing.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-1.5 rounded-lg bg-surface/60 p-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium leading-tight truncate">{item.name}</p>
                      <p className="text-[9px] text-muted">{formatCurrency(item.price)} × {item.qty}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => dispatch(updateQty({ id: item.id, qty: item.qty - 1 }))}
                        className="flex h-5 w-5 items-center justify-center rounded-md bg-border/60 hover:bg-border transition">
                        <Minus className="h-2.5 w-2.5" />
                      </button>
                      <span className="w-4 text-center text-[10px] font-semibold">{item.qty}</span>
                      <button onClick={() => dispatch(updateQty({ id: item.id, qty: item.qty + 1 }))}
                        className="flex h-5 w-5 items-center justify-center rounded-md bg-border/60 hover:bg-border transition">
                        <Plus className="h-2.5 w-2.5" />
                      </button>
                      <button onClick={() => dispatch(removeItem(item.id))}
                        className="flex h-5 w-5 items-center justify-center rounded-md text-danger/70 hover:bg-danger/10 transition">
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold">{formatCurrency(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals & Payment */}
          <div className="border-t border-border/60 p-2 space-y-1">
            <div className="flex justify-between text-[10px] text-muted">
              <span>Subtotal</span><span className="font-medium text-text">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted gap-1">
              <span>Discount (₹)</span>
              <input
                type="number" min={0} value={billing.discount || ""}
                onChange={(e) => dispatch(setDiscount(Number(e.target.value)))}
                className="w-16 rounded-lg border border-border bg-surface px-1.5 py-1 text-right text-[10px] outline-none focus:border-primary"
                placeholder="0"
              />
            </div>
            <div className="flex justify-between text-xs font-bold border-t border-border/60 pt-1">
              <span>Total</span>
              <span className="text-primary text-sm">{formatCurrency(total)}</span>
            </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-5 gap-0.5 pt-1">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.value}
                  onClick={() => dispatch(setPaymentMethod(pm.value))}
                  className={cn(
                    "flex flex-col items-center rounded-lg py-1 text-[9px] font-medium transition",
                    billing.paymentMethod === pm.value
                      ? "bg-primary text-white" : "bg-border/40 text-muted hover:bg-border"
                  )}
                >
                  <span className="text-xs">{pm.icon}</span>
                  {pm.label}
                </button>
              ))}
            </div>

            {/* Split payment inputs */}
            {billing.paymentMethod === "split" && (
              <div className="space-y-1 rounded-lg bg-surface/60 p-1.5">
                {(["cash", "upi", "card"] as const).map((method) => (
                  <div key={method} className="flex items-center gap-1.5">
                    <span className="w-8 text-[9px] text-muted capitalize">{method}</span>
                    <input
                      type="number" min={0}
                      value={billing.payment[method] || ""}
                      onChange={(e) => dispatch(setPaymentAmount({ field: method, value: Number(e.target.value) }))}
                      className="flex-1 rounded-lg border border-border bg-surface px-1.5 py-1 text-[10px] outline-none focus:border-primary"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-1.5 pt-1">
              <Button variant="outline" size="sm" className="flex-none px-2" onClick={() => dispatch(clearBill())}
                disabled={billing.items.length === 0}>
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                className="flex-1 gap-1 text-xs"
                onClick={handleCheckout}
                disabled={billing.items.length === 0 || submitOrder.isPending || !outletId}
                id="checkout-btn"
                title={!outletId ? "Please select an outlet" : ""}
              >
                {submitOrder.isPending ? (
                  <span className="animate-pulse">...Processing</span>
                ) : (
                  <><Printer className="h-3 w-3" /> Bill — {formatCurrency(total)}</>
                )}
              </Button>
            </div>

            {!outletId && (
              <div className="rounded-lg bg-warning/10 border border-warning/30 p-1.5 text-center">
                <p className="text-[9px] text-warning">⚠ Please select an outlet to place orders</p>
              </div>
            )}

            {showSuccess && (
              <div className="rounded-lg bg-border/30 border border-border p-2 text-center animate-rise text-[10px]">
                <p className="font-medium text-green-600">✓ Order created successfully!</p>
              </div>
            )}
            {submitOrder.isError && (
              <div className="rounded-lg bg-danger/10 border border-danger/30 p-1.5 text-center">
                <p className="text-[9px] text-danger">{(submitOrder.error as Error).message}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
