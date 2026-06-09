"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Minus, Trash2, ShoppingBag, Printer, RotateCcw, ChevronRight, ChevronLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { BarcodeScanner } from "@/components/ui/barcode-scanner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "react-hot-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addItem, removeItem, updateQty, updateLinePrice, setDiscount,
  setBillingMode, setPaymentMethod, setPaymentAmount, clearBill,
  setSaleMode, setTaxMode, setTaxEnabled, setTaxRate,
  selectCustomer, setCreditSale, setAmountReceived, setGenerateGstInvoice
} from "@/store/billingSlice";
import { useFeature, useBusinessProfile } from "@/hooks/useFeature";
import { useSettings } from "@/components/settings/settings-provider";
import { UnitPickerModal, type UnitPickOption } from "@/components/billing/unit-picker";
import { CustomerPicker } from "@/components/billing/customer-picker";
import { calculateCartTotals, resolveSupplyType } from "@/lib/taxCalculator";
import { getProductUnitLabel, getWholesalePriceHint, getActivePackagingUnits } from "@/lib/productUtils";
import { getJson, getJsonWithMeta, apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/error";
import type { Product, Category, Outlet, Customer, Business } from "@/lib/types";

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
  { value: "split", label: "Split", icon: "✂️" },
  { value: "credit", label: "Khata", icon: "📒" }
] as const;

export default function BillingPage() {
  const { token, outletId } = useAuth();
  const businessProfile = useBusinessProfile();
  const hasWholesale = useFeature("wholesale_billing");
  const hasRetail = useFeature("retail_billing");
  const hasCustomers = useFeature("customers");
  const hasCreditKhata = useFeature("credit_khata");
  const hasGstInvoices = useFeature("gst_invoices");
  const { settings } = useSettings();
  const showSaleModeTabs = businessProfile === "hybrid" && hasRetail && hasWholesale;
  const dispatch = useAppDispatch();
  const qc = useQueryClient();
  const billing = useAppSelector((s) => s.billing);
  const isWholesale = billing.saleMode === "wholesale";
  const isKhataPayment = billing.paymentMethod === "credit" || billing.creditSale;
  const showCustomerSection =
    (hasCustomers || hasCreditKhata) &&
    (isWholesale || isKhataPayment || billing.generateGstInvoice);
  const paymentMethods = hasCreditKhata
    ? PAYMENT_METHODS
    : PAYMENT_METHODS.filter((m) => m.value !== "credit");
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const catScrollRef = React.useRef<HTMLDivElement>(null);

  const [search, setSearch] = React.useState("");
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
  const [selectedParentId, setSelectedParentId] = React.useState<string | null>(null);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [showMobileCart, setShowMobileCart] = React.useState(false);
  const [showScanner, setShowScanner] = React.useState(false);
  const [prodPage, setProdPage] = React.useState(1);
  const [prodLimit, setProdLimit] = React.useState(12);
  const [prodIsRefetching, setProdIsRefetching] = React.useState(false);
  const [prodCooldownSeconds, setProdCooldownSeconds] = React.useState(0);
  const [unitPickProduct, setUnitPickProduct] = React.useState<Product | null>(null);
  const [editingPriceId, setEditingPriceId] = React.useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = React.useState("");
  const [catPage, setCatPage] = React.useState(0);
  const [pendingSaleMode, setPendingSaleMode] = React.useState<"retail" | "wholesale" | null>(null);
  const saleModeInitialized = React.useRef(false);

  const { data: outletsData } = useQuery({
    queryKey: ["outlets"],
    queryFn: () => getJson<{ outlets: Outlet[] }>("/outlets", token),
    enabled: Boolean(token)
  });
  const currentOutlet = outletsData?.outlets?.find((o) => o._id === outletId);

  const { data: catData } = useQuery({
    queryKey: ["categories", "flat", outletId],
    queryFn: () => getJson<Category[]>("/categories", token, { flat: "true", limit: 200 }),
    enabled: Boolean(token)
  });

  const { data: prodData, refetch: refetchProducts } = useQuery({
    queryKey: ["products", outletId, selectedCategoryId, search, prodPage, prodLimit],
    queryFn: () => getJsonWithMeta<Product[]>("/products", token, {
      outletId: outletId ?? undefined,
      categoryId: selectedCategoryId ?? undefined,
      search: search || undefined,
      page: prodPage,
      limit: prodLimit
    }),
    // enable when we have a token; backend accepts missing outletId
    enabled: Boolean(token)
  });

  const { data: bizData } = useQuery({
    queryKey: ["business-mine"],
    queryFn: () => getJson<{ business: Business }>("/businesses/mine", token),
    enabled: Boolean(token)
  });

  const { data: selectedCustomerData } = useQuery({
    queryKey: ["customer", billing.customerId],
    queryFn: () => getJson<{ customer: Customer }>(`/customers/${billing.customerId}`, token),
    enabled: Boolean(token && billing.customerId)
  });

  const supplyType = resolveSupplyType(
    bizData?.business?.gstNumber,
    selectedCustomerData?.customer?.gstin
  );
  const isInterState = supplyType === "inter";

  const cartTotals = calculateCartTotals(billing.items, {
    taxEnabled: billing.taxEnabled,
    taxRate: billing.taxRate,
    taxMode: billing.taxMode,
    discount: billing.discount,
    supplyType
  });
  const { subtotal, tax: taxAmount, cgst, sgst, igst, total } = cartTotals;
  const amountDuePreview = isKhataPayment ? Math.max(0, total - (billing.amountReceived || 0)) : 0;

  const submitOrder = useMutation({
    mutationFn: (body: unknown) => apiFetch("/orders", { method: "POST", body, token }),
    onSuccess: () => {
      dispatch(clearBill());
      setShowSuccess(true);
      toast.success("Bill placed successfully");
      setTimeout(() => setShowSuccess(false), 3000);
      qc.invalidateQueries({ queryKey: ["report"] });
      qc.invalidateQueries({ queryKey: ["stock-alerts"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Failed to place order"));
    }
  });

  React.useEffect(() => {
    if (saleModeInitialized.current) return;
    if (businessProfile === "wholesale" && hasWholesale) {
      dispatch(setSaleMode("wholesale"));
    } else if (businessProfile === "retail" && hasRetail) {
      dispatch(setSaleMode("retail"));
    }
    saleModeInitialized.current = true;
  }, [businessProfile, hasWholesale, hasRetail, dispatch]);

  React.useEffect(() => {
    if (!currentOutlet) return;
    dispatch(setTaxEnabled(currentOutlet.taxEnabled ?? false));
    dispatch(setTaxRate(currentOutlet.defaultTaxRate ?? 0));
  }, [currentOutlet?._id, currentOutlet?.taxEnabled, currentOutlet?.defaultTaxRate, dispatch]);

  React.useEffect(() => {
    if (isWholesale && currentOutlet?.taxEnabled) {
      dispatch(setTaxEnabled(true));
    }
  }, [isWholesale, currentOutlet?.taxEnabled, dispatch]);

  const categories: Category[] = Array.isArray(catData)
    ? catData
    : ((catData as { categories?: Category[] } | undefined)?.categories ?? []);
  const topCategories = categories.filter((c) => !c.parentId);
  const products: Product[] = prodData?.data ?? [];
  const prodMeta = prodData?.meta?.pagination;

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

  const handleBarcodeScanned = React.useCallback(async (scannedBarcode: string) => {
    if (!token) return;
    try {
      const res = await getJsonWithMeta<Product[]>("/products", token, {
        outletId: outletId ?? undefined,
        search: scannedBarcode,
        limit: 2
      });
      const prods = res.data ?? [];
      const exactMatch = prods.find((p) => p.barcode === scannedBarcode || p.sku === scannedBarcode);
      
      if (exactMatch) {
        if (isWholesale && (exactMatch.packagingUnits?.length ?? 0) > 0) {
          setUnitPickProduct(exactMatch);
        } else {
          dispatch(addItem({
            id: exactMatch._id,
            name: exactMatch.name,
            price: exactMatch.price,
            taxRate: exactMatch.gstRate || exactMatch.taxRate,
            unit: exactMatch.unit,
            image: exactMatch.image,
            categoryId: typeof exactMatch.categoryId === "object" ? exactMatch.categoryId?._id : exactMatch.categoryId ?? undefined
          }));
        }
        setSearch("");
        setShowScanner(false);
      } else {
        setSearch(scannedBarcode);
        setShowScanner(false);
      }
    } catch (err) {
      console.error("Barcode scan failed", err);
    }
  }, [token, outletId, dispatch, isWholesale]);

  // Hardware Scanner Global Listener
  React.useEffect(() => {
    let buffer = "";
    let lastTime = 0;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const currentTime = new Date().getTime();
      
      if (currentTime - lastTime > 50) { 
        // Real hardware scanners type very fast (<30ms between keys)
        buffer = "";
      }
      
      if (e.key === "Enter" && buffer.length > 0) {
        e.preventDefault();
        handleBarcodeScanned(buffer);
        buffer = "";
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
      
      lastTime = currentTime;
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBarcodeScanned]);

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

  const addProductToCart = (product: Product, option?: UnitPickOption, qty = 1) => {
    const taxRate = product.gstRate || product.taxRate || 0;
    if (option) {
      dispatch(addItem({
        id: product._id,
        name: product.name,
        price: option.price,
        taxRate,
        unit: option.soldUnit,
        soldUnit: option.soldUnit,
        soldQty: qty,
        baseQty: qty * option.conversionFactor,
        conversionFactor: option.conversionFactor,
        packagingUnitId: option.packagingUnitId,
        image: product.image,
        categoryId: typeof product.categoryId === "object" ? product.categoryId?._id : product.categoryId ?? undefined,
        qty
      }));
      return;
    }
    dispatch(addItem({
      id: product._id,
      name: product.name,
      price: product.price,
      taxRate,
      unit: product.unit,
      image: product.image,
      categoryId: typeof product.categoryId === "object" ? product.categoryId?._id : product.categoryId ?? undefined
    }));
  };

  const handleAddProduct = (product: Product) => {
    if (isWholesale && (product.packagingUnits?.length ?? 0) > 0) {
      setUnitPickProduct(product);
      return;
    }
    addProductToCart(product);
  };

  const handleCheckout = () => {
    if (billing.items.length === 0) return;
    if (!outletId) {
      toast.error("Please select an outlet before placing an order");
      return;
    }

    const paymentSplit = billing.paymentMethod === "split"
      ? { cash: billing.payment.cash, upi: billing.payment.upi, card: billing.payment.card }
      : undefined;

    let amountReceived = total;
    if (isKhataPayment) {
      amountReceived = billing.amountReceived ?? 0;
    } else if (billing.paymentMethod === "split" && paymentSplit) {
      amountReceived = Object.values(paymentSplit).reduce((s, v) => s + (Number(v) || 0), 0);
    }

    const amountDue = Math.max(0, total - amountReceived);

    if ((amountDue > 0 || isKhataPayment) && !billing.customerId) {
      toast.error("Select a customer — required for khata / partial payment");
      return;
    }

    if (billing.generateGstInvoice) {
      if (!billing.customerId) {
        toast.error("Select a customer with GSTIN for GST invoice");
        return;
      }
      if (!billing.taxEnabled || taxAmount <= 0) {
        toast.error("Enable GST on the bill to generate a tax invoice");
        return;
      }
    }

    const payMethod = isKhataPayment && amountReceived === 0
      ? "credit"
      : isKhataPayment && amountReceived > 0
        ? "cash"
        : billing.paymentMethod;

    submitOrder.mutate({
      outletId,
      billingMode: isWholesale ? "wholesale" : billing.billingMode,
      taxMode: billing.taxMode,
      customerId: billing.customerId || undefined,
      customerName: billing.customerName || undefined,
      customerPhone: billing.customerPhone || undefined,
      amountPaid: amountReceived,
      amountDue,
      generateGstInvoice: billing.generateGstInvoice && hasGstInvoices,
      items: billing.items.map((i) => ({
        productId: i.id,
        name: i.name,
        qty: i.soldQty ?? i.qty,
        soldQty: i.soldQty ?? i.qty,
        soldUnit: i.soldUnit ?? i.unit,
        baseQty: i.baseQty ?? i.qty,
        conversionFactor: i.conversionFactor ?? 1,
        packagingUnitId: i.packagingUnitId,
        price: i.price,
        taxRate: i.taxRate,
        unit: i.soldUnit ?? i.unit,
        lineTotal: i.price * (i.soldQty ?? i.qty),
        taxTotal: calculateCartTotals([i], {
          taxEnabled: billing.taxEnabled,
          taxRate: billing.taxRate,
          taxMode: billing.taxMode,
          discount: 0,
          supplyType
        }).tax
      })),
      subtotal,
      discount: billing.discount,
      tax: taxAmount,
      taxableAmount: cartTotals.taxableAmount,
      cgst,
      sgst,
      igst,
      supplyType,
      total,
      notes: billing.notes,
      payment: {
        method: payMethod,
        amount: amountReceived,
        split: paymentSplit
      }
    });
  };

  const handleSaleModeChange = (mode: "retail" | "wholesale") => {
    if (mode === billing.saleMode) return;
    if (billing.items.length > 0) {
      setPendingSaleMode(mode);
      return;
    }
    dispatch(setSaleMode(mode));
  };

  const cartItemCount = billing.items.reduce((acc, i) => acc + (i.soldQty ?? i.qty), 0);

  const activeSubcategories = selectedParentId
    ? categories.filter((c) => c.parentId === selectedParentId)
    : [];

  // Calculate total category pages
  const catItemsPerPage = 4;
  const totalCatPages = Math.ceil((topCategories.length + 1) / catItemsPerPage); // +1 for "All" button

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col gap-2 overflow-hidden">
      {/* Sale mode header */}
      {(showSaleModeTabs || isWholesale) && (
        <div className="flex shrink-0 items-center justify-between gap-3 px-0.5">
          {showSaleModeTabs ? (
            <div className="flex w-full max-w-xs rounded-xl border border-border bg-surface p-0.5">
              <button
                type="button"
                onClick={() => handleSaleModeChange("retail")}
                className={cn(
                  "flex-1 rounded-lg py-1.5 text-xs font-semibold transition",
                  !isWholesale ? "bg-primary text-white" : "text-muted hover:text-text"
                )}
              >
                Retail
              </button>
              <button
                type="button"
                onClick={() => handleSaleModeChange("wholesale")}
                className={cn(
                  "flex-1 rounded-lg py-1.5 text-xs font-semibold transition",
                  isWholesale ? "bg-primary text-white" : "text-muted hover:text-text"
                )}
              >
                Wholesale
              </button>
            </div>
          ) : (
            <Badge variant="soft" className="text-xs">Wholesale billing</Badge>
          )}
          {isWholesale && billing.taxEnabled && (
            <span className="hidden text-[10px] text-muted sm:inline">
              GST {billing.taxMode === "inclusive" ? "included in prices" : "added on top"}
            </span>
          )}
        </div>
      )}

      <div className="relative flex min-h-0 flex-1 flex-col gap-2 overflow-hidden lg:flex-row">
      {/* LEFT: Product Panel */}
      <div className="flex flex-1 flex-col gap-2 overflow-hidden pb-16 lg:pb-0">
        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              id="product-search"
              className="pl-9 py-2.5"
              placeholder="Search products or scan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                 if (e.key === "Enter" && search.trim().length > 0) {
                    handleBarcodeScanned(search.trim());
                 }
              }}
            />
          </div>
          <Button variant="outline" className="px-3 shrink-0" onClick={() => setShowScanner(true)} title="Scan Barcode">
            <span className="text-lg">📷</span>
          </Button>
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
                const cartQty = billing.items
                  .filter((i) => i.id === product._id)
                  .reduce((s, i) => s + (i.soldQty ?? i.qty), 0);
                const unitLabel = getProductUnitLabel(product);
                const packHint = isWholesale ? getWholesalePriceHint(product) : null;
                const hasPackaging = getActivePackagingUnits(product).length > 0;
                return (
                  <button
                    key={product._id}
                    onClick={() => handleAddProduct(product)}
                    className={cn(
                      "group relative flex flex-col rounded-2xl border p-3 text-left transition active:scale-95",
                      "bg-surface hover:border-primary/50 hover:shadow-soft",
                      cartQty > 0 ? "border-primary/40 bg-primary/5" : "border-border"
                    )}
                  >
                    {cartQty > 0 && (
                      <div className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow">
                        {cartQty}
                      </div>
                    )}
                    {product.image && (
                      <img src={product.image} alt={product.name}
                        className="mb-2 h-14 w-full rounded-lg object-cover" />
                    )}
                    <div className="flex items-start justify-between gap-1.5 min-w-0">
                      <p className="text-[12px] font-semibold leading-tight line-clamp-2 flex-1 min-w-0">
                        {product.name}
                      </p>
                      {isWholesale && hasPackaging && (
                        <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-primary">
                          Bulk
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[10px] text-muted">
                      {unitLabel} · {product.onHandQty} in stock
                    </p>
                    <p className="mt-1.5 text-sm font-bold text-primary leading-none">
                      {formatCurrency(product.price)}
                      <span className="text-[10px] font-normal text-muted">/{unitLabel}</span>
                    </p>
                    {packHint && (
                      <p className="mt-1.5 text-[9px] leading-snug text-muted line-clamp-2 border-t border-border/40 pt-1.5">
                        {packHint}
                      </p>
                    )}
                    {product.onHandQty <= product.lowStockThreshold && (
                      <Badge variant="warning" className="mt-1.5 w-fit text-[9px]">Low Stock</Badge>
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
      <div className={cn(
        "flex shrink-0 flex-col gap-2 transition-all duration-300",
        // Desktop
        "lg:w-72 xl:w-80 lg:static lg:h-auto lg:border-t-0 lg:pt-0 lg:bg-transparent lg:p-0",
        // Mobile
        "fixed inset-0 z-[60] bg-background/95 backdrop-blur-md p-4 pt-16 pb-20 lg:z-auto",
        showMobileCart ? "flex translate-y-0" : "hidden lg:flex"
      )}>
        <div className="glass-panel flex flex-1 flex-col overflow-hidden rounded-2xl border border-border/70 shadow-soft">
          {/* Mobile Header */}
          <div className="flex lg:hidden justify-between items-center px-4 py-2 border-b border-border/60 bg-surface">
            <span className="font-bold">Current Order</span>
            <Button variant="ghost" size="sm" onClick={() => setShowMobileCart(false)}>Close</Button>
          </div>
          
          {/* Billing Mode — retail only */}
          {!isWholesale && (
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
          )}
          {isWholesale && (
            <div className="border-b border-border/60 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">Wholesale Bill</p>
            </div>
          )}

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
                  <div key={item.cartLineId} className="flex items-center gap-1.5 rounded-lg bg-surface/60 p-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium leading-tight truncate">{item.name}</p>
                      <p className="text-[9px] text-muted">
                        {item.soldQty ?? item.qty} {item.soldUnit ?? item.unit}
                        {item.conversionFactor && item.conversionFactor > 1
                          ? ` (${item.baseQty ?? item.qty * item.conversionFactor} base)`
                          : ""}
                      </p>
                      {isWholesale && editingPriceId === item.cartLineId ? (
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          autoFocus
                          value={editPriceValue}
                          onChange={(e) => setEditPriceValue(e.target.value)}
                          onBlur={() => {
                            const newPrice = Number(editPriceValue) || item.price;
                            dispatch(updateLinePrice({ cartLineId: item.cartLineId, price: newPrice }));
                            setEditingPriceId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const newPrice = Number(editPriceValue) || item.price;
                              dispatch(updateLinePrice({ cartLineId: item.cartLineId, price: newPrice }));
                              setEditingPriceId(null);
                            }
                            if (e.key === "Escape") setEditingPriceId(null);
                          }}
                          className="mt-0.5 w-24 rounded border border-primary bg-surface px-1 py-0.5 text-[10px]"
                        />
                      ) : (
                        <button
                          type="button"
                          className={cn(
                            "text-[9px] mt-0.5",
                            isWholesale && "underline decoration-dotted hover:text-primary"
                          )}
                          onClick={() => {
                            if (!isWholesale) return;
                            setEditingPriceId(item.cartLineId);
                            setEditPriceValue(String(item.price));
                          }}
                        >
                          {formatCurrency(item.price)} / {item.soldUnit ?? item.unit}
                          {item.priceOverride && " *"}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => dispatch(updateQty({ cartLineId: item.cartLineId, qty: item.qty - 1 }))}
                        className="flex h-5 w-5 items-center justify-center rounded-md bg-border/60 hover:bg-border transition">
                        <Minus className="h-2.5 w-2.5" />
                      </button>
                      <span className="w-4 text-center text-[10px] font-semibold">{item.qty}</span>
                      <button onClick={() => dispatch(updateQty({ cartLineId: item.cartLineId, qty: item.qty + 1 }))}
                        className="flex h-5 w-5 items-center justify-center rounded-md bg-border/60 hover:bg-border transition">
                        <Plus className="h-2.5 w-2.5" />
                      </button>
                      <button onClick={() => dispatch(removeItem(item.cartLineId))}
                        className="flex h-5 w-5 items-center justify-center rounded-md text-danger/70 hover:bg-danger/10 transition">
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold">{formatCurrency(item.price * (item.soldQty ?? item.qty))}</span>
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

            {/* GST controls — wholesale or when tax enabled */}
            {(isWholesale || billing.taxEnabled) && (
              <div className="rounded-lg bg-surface/60 p-2 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-1.5 text-[10px]">
                    <input
                      type="checkbox"
                      checked={billing.taxEnabled}
                      onChange={(e) => dispatch(setTaxEnabled(e.target.checked))}
                    />
                    GST
                  </label>
                  {billing.taxEnabled && (
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={billing.taxRate || ""}
                      onChange={(e) => dispatch(setTaxRate(Number(e.target.value)))}
                      className="w-12 rounded border border-border px-1 py-0.5 text-[10px] text-right"
                      placeholder="%"
                    />
                  )}
                </div>
                {isWholesale && billing.taxEnabled && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => dispatch(setTaxMode("exclusive"))}
                      className={cn(
                        "flex-1 rounded py-1 text-[9px] font-medium",
                        billing.taxMode === "exclusive" ? "bg-primary text-white" : "bg-border/40 text-muted"
                      )}
                    >
                      GST Extra
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatch(setTaxMode("inclusive"))}
                      className={cn(
                        "flex-1 rounded py-1 text-[9px] font-medium",
                        billing.taxMode === "inclusive" ? "bg-primary text-white" : "bg-border/40 text-muted"
                      )}
                    >
                      GST Included
                    </button>
                  </div>
                )}
                {billing.taxEnabled && taxAmount > 0 && (settings.gstEnabled || isWholesale) && (
                  <div className="text-[9px] text-muted space-y-0.5 pt-0.5 border-t border-border/40">
                    <div className="flex justify-between"><span>Taxable</span><span>{formatCurrency(cartTotals.taxableAmount)}</span></div>
                    {isInterState ? (
                      <div className="flex justify-between"><span>IGST</span><span>{formatCurrency(igst)}</span></div>
                    ) : (
                      <>
                        <div className="flex justify-between"><span>CGST</span><span>{formatCurrency(cgst)}</span></div>
                        <div className="flex justify-between"><span>SGST</span><span>{formatCurrency(sgst)}</span></div>
                      </>
                    )}
                    {isInterState && billing.customerId && (
                      <p className="text-[8px] text-amber-700 pt-0.5">Inter-state supply (IGST)</p>
                    )}
                    <div className="flex justify-between font-medium text-text"><span>Tax</span><span>{formatCurrency(taxAmount)}</span></div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between text-xs font-bold border-t border-border/60 pt-1">
              <span>Total</span>
              <span className="text-primary text-sm">{formatCurrency(total)}</span>
            </div>

            {/* Payment Methods — pick before customer on khata so flow is clear */}
            <div className={cn("grid gap-0.5 pt-1", paymentMethods.length > 5 ? "grid-cols-6" : "grid-cols-5")}>
              {paymentMethods.map((pm) => (
                <button
                  key={pm.value}
                  type="button"
                  onClick={() => {
                    dispatch(setPaymentMethod(pm.value));
                    if (pm.value === "credit") dispatch(setCreditSale(true));
                  }}
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

            {isKhataPayment && hasCreditKhata && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-2 space-y-2">
                <p className="text-[10px] font-semibold text-primary">Khata / credit bill</p>
                {!billing.customerId && (
                  <p className="text-[9px] text-warning">Select a customer below — required for khata</p>
                )}
                <div>
                  <label className="text-[10px] font-medium text-muted">Amount receiving now (₹)</label>
                  <Input
                    type="number"
                    min={0}
                    max={total}
                    value={billing.amountReceived || ""}
                    onChange={(e) => dispatch(setAmountReceived(Number(e.target.value)))}
                    className="mt-1 h-8 text-[11px]"
                    placeholder={`Leave 0 for full khata (${formatCurrency(total)})`}
                  />
                </div>
                {amountDuePreview > 0 && (
                  <p className="text-[9px] text-warning">
                    On khata: {formatCurrency(amountDuePreview)}
                  </p>
                )}
                {billing.customerId && amountDuePreview === total && (
                  <p className="text-[9px] text-muted">Full amount will go on customer khata</p>
                )}
              </div>
            )}

            {showCustomerSection && (
              <CustomerPicker
                token={token}
                outletId={outletId}
                selectedId={billing.customerId}
                required={isKhataPayment || billing.generateGstInvoice}
                onSelect={(c: Customer | null) =>
                  dispatch(
                    selectCustomer(
                      c
                        ? {
                            id: c._id,
                            name: c.name,
                            phone: c.phone,
                            defaultTaxMode: c.defaultTaxMode
                          }
                        : null
                    )
                  )
                }
              />
            )}

            {hasGstInvoices && billing.taxEnabled && (
              <label className="flex items-center gap-2 rounded-lg bg-surface/60 px-2 py-1.5 text-[10px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={billing.generateGstInvoice}
                  onChange={(e) => dispatch(setGenerateGstInvoice(e.target.checked))}
                />
                <span>
                  Generate GST Invoice
                  {!billing.customerId && billing.generateGstInvoice && (
                    <span className="text-warning ml-1">(select customer with GSTIN)</span>
                  )}
                </span>
              </label>
            )}

            {/* Split payment — only when split is selected, not for khata */}
            {billing.paymentMethod === "split" && !isKhataPayment && (
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
                <p className="text-[9px] text-danger">{getErrorMessage(submitOrder.error)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Mobile Floating Cart Toggle */}
      <div className="fixed bottom-4 left-4 right-4 z-[60] lg:hidden">
        <Button 
          className="w-full h-14 shadow-2xl gap-2 font-bold text-sm bg-primary text-white border border-primary/20 rounded-2xl" 
          onClick={() => setShowMobileCart(!showMobileCart)}
        >
          <ShoppingBag className="h-5 w-5" />
          {showMobileCart ? "Back to Products" : `View Cart (${cartItemCount}) — ${formatCurrency(total)}`}
        </Button>
      </div>

      <BarcodeScanner open={showScanner} onClose={() => setShowScanner(false)} onScan={handleBarcodeScanned} />

      <UnitPickerModal
        open={Boolean(unitPickProduct)}
        product={unitPickProduct}
        onClose={() => setUnitPickProduct(null)}
        onConfirm={(option, qty) => {
          if (unitPickProduct) addProductToCart(unitPickProduct, option, qty);
        }}
      />

      <ConfirmDialog
        open={pendingSaleMode !== null}
        onClose={() => setPendingSaleMode(null)}
        onConfirm={() => {
          if (pendingSaleMode) dispatch(setSaleMode(pendingSaleMode));
          setPendingSaleMode(null);
        }}
        title="Switch billing mode?"
        message="Your current cart will be cleared when switching between Retail and Wholesale."
        confirmLabel="Switch & clear cart"
        variant="warning"
      />
    </div>
  );
}
