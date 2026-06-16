"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addItem,
  removeItem,
  updateQty,
  updateLinePrice,
  setDiscount,
  setBillingMode,
  setPaymentMethod,
  setPaymentAmount,
  clearBill,
  setSaleMode,
  setTaxMode,
  setTaxEnabled,
  setTaxRate,
  selectCustomer,
  setCreditSale,
  setAmountReceived,
  setGenerateGstInvoice,
} from "@/store/billingSlice";
import { useFeature, useBusinessProfile } from "@/hooks/useFeature";
import { useSettings } from "@/components/settings/settings-provider";
import type { UnitPickOption } from "@/components/billing/unit-picker";
import { calculateCartTotals, resolveSupplyType } from "@/lib/taxCalculator";
import { getErrorMessage } from "@/lib/error";
import { PAYMENT_METHODS } from "@/components/billing/billing-constants";
import type {
  Product,
  Category,
  Outlet,
  Customer,
  Business,
} from "@/lib/types";

import { outletService } from "@/services/outlet.service";
import { categoryService } from "@/services/category.service";
import { productService } from "@/services/product.service";
import { businessService } from "@/services/business.service";
import { customerService } from "@/services/customer.service";
import { orderService } from "@/services/order.service";
import { usePOSPrinter } from "@/hooks/use-pos-printer";
import type { ReceiptData } from "@/lib/pos-receipt";

export function useBillingPage() {
  const { token, outletId } = useAuth();
  const businessProfile = useBusinessProfile();
  const hasWholesale = useFeature("wholesale_billing");
  const hasRetail = useFeature("retail_billing");
  const hasCustomers = useFeature("customers");
  const hasCreditKhata = useFeature("credit_khata");
  const hasGstInvoices = useFeature("gst_invoices");
  const { settings } = useSettings();
  const dispatch = useAppDispatch();
  const qc = useQueryClient();
  const billing = useAppSelector((s) => s.billing);

  const printer = usePOSPrinter(token);
  // Keep a stable ref to printer so the mutation onSuccess closure never goes stale
  const printerRef = React.useRef(printer);
  printerRef.current = printer;
  const receiptSnapshotRef = React.useRef<ReceiptData | null>(null);

  const showSaleModeTabs = hasRetail && hasWholesale;
  const wholesaleOnly = hasWholesale && !hasRetail;
  const isWholesale = billing.saleMode === "wholesale";
  const isKhataPayment =
    billing.paymentMethod === "credit" || billing.creditSale;
  const showCustomerSection =
    (hasCustomers || hasCreditKhata) &&
    (isWholesale || isKhataPayment || billing.generateGstInvoice);
  const paymentMethods = hasCreditKhata
    ? PAYMENT_METHODS
    : PAYMENT_METHODS.filter((m) => m.value !== "credit");

  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const catScrollRef = React.useRef<HTMLDivElement>(null);
  const saleModeInitialized = React.useRef(false);

  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<
    string | null
  >(null);
  const [selectedParentId, setSelectedParentId] = React.useState<string | null>(
    null,
  );
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [showCheckout, setShowCheckout] = React.useState(false);
  const [showScanner, setShowScanner] = React.useState(false);
  const [prodPage, setProdPage] = React.useState(1);
  const [prodLimit, setProdLimit] = React.useState(12);
  const [prodIsRefetching, setProdIsRefetching] = React.useState(false);
  const [prodCooldownSeconds, setProdCooldownSeconds] = React.useState(0);
  const [unitPickProduct, setUnitPickProduct] = React.useState<Product | null>(
    null,
  );
  const [editingPriceId, setEditingPriceId] = React.useState<string | null>(
    null,
  );
  const [editPriceValue, setEditPriceValue] = React.useState("");
  const [pendingSaleMode, setPendingSaleMode] = React.useState<
    "retail" | "wholesale" | null
  >(null);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    setProdPage(1);
  }, [debouncedSearch]);

  const { data: outletsData } = useQuery({
    queryKey: ["outlets"],
    queryFn: () => outletService.getOutlets(token),
    enabled: Boolean(token),
  });
  const currentOutlet = outletsData?.outlets?.find((o) => o._id === outletId);

  const { data: catData } = useQuery({
    queryKey: ["categories", "flat", outletId],
    queryFn: () =>
      categoryService.getCategories(token, { flat: "true", limit: 200 }),
    enabled: Boolean(token),
  });

  const {
    data: prodData,
    refetch: refetchProducts,
    isFetching: productsFetching,
  } = useQuery({
    queryKey: [
      "products",
      outletId,
      selectedCategoryId,
      debouncedSearch,
      prodPage,
      prodLimit,
    ],
    queryFn: () =>
      productService.getProductsWithOffset(token || "", {
        outletId: outletId ?? undefined,
        categoryId: selectedCategoryId ?? undefined,
        search: debouncedSearch || undefined,
        page: prodPage,
        limit: prodLimit,
      }),
    enabled: Boolean(token),
  });

  const { data: bizData } = useQuery({
    queryKey: ["business-mine"],
    queryFn: () => businessService.getMyBusiness(token),
    enabled: Boolean(token),
  });

  const { data: selectedCustomerData } = useQuery({
    queryKey: ["customer", billing.customerId],
    queryFn: () => customerService.getCustomer(billing.customerId!, token),
    enabled: Boolean(token && billing.customerId),
  });

  const supplyType = resolveSupplyType(
    bizData?.business?.gstNumber,
    selectedCustomerData?.customer?.gstin,
  );
  const isInterState = supplyType === "inter";

  const cartTotals = calculateCartTotals(billing.items, {
    taxEnabled: billing.taxEnabled,
    taxRate: billing.taxRate,
    taxMode: billing.taxMode,
    discount: billing.discount,
    supplyType,
  });
  const { subtotal, tax: taxAmount, cgst, sgst, igst, total } = cartTotals;
  const amountDuePreview = isKhataPayment
    ? Math.max(0, total - (billing.amountReceived || 0))
    : 0;
  const cartItemCount = billing.items.reduce(
    (acc, i) => acc + (i.soldQty ?? i.qty),
    0,
  );

  const submitOrder = useMutation({
    mutationFn: (body: unknown) => orderService.createOrder(body, token),
    onSuccess: (data: unknown) => {
      // Auto-print receipt if the printer is configured and auto-print is on
      const orderNum =
        (data as Record<string, Record<string, Record<string, string>>>)?.data
          ?.order?.orderNumber ?? "";
      const snapshot = receiptSnapshotRef.current;
      receiptSnapshotRef.current = null;
      if (snapshot && printerRef.current.config.autoPrint) {
        printerRef.current
          .print({ ...snapshot, orderNumber: orderNum })
          .catch((e: Error) => toast.error(`Print failed: ${e.message}`));
      }
      dispatch(clearBill());
      setShowSuccess(true);
      setShowCheckout(false);
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
    },
  });

  React.useEffect(() => {
    if (!hasWholesale && billing.saleMode === "wholesale") {
      dispatch(setSaleMode("retail"));
      return;
    }
    if (!hasRetail && hasWholesale && billing.saleMode === "retail") {
      dispatch(setSaleMode("wholesale"));
      return;
    }
    if (saleModeInitialized.current) return;
    if (wholesaleOnly || (businessProfile === "wholesale" && hasWholesale)) {
      dispatch(setSaleMode("wholesale"));
    } else {
      dispatch(setSaleMode("retail"));
    }
    saleModeInitialized.current = true;
  }, [
    businessProfile,
    hasWholesale,
    hasRetail,
    wholesaleOnly,
    billing.saleMode,
    dispatch,
  ]);

  React.useEffect(() => {
    if (!currentOutlet) return;
    dispatch(setTaxEnabled(currentOutlet.taxEnabled ?? false));
    dispatch(setTaxRate(currentOutlet.defaultTaxRate ?? 0));
  }, [
    currentOutlet?._id,
    currentOutlet?.taxEnabled,
    currentOutlet?.defaultTaxRate,
    dispatch,
  ]);

  React.useEffect(() => {
    if (isWholesale && currentOutlet?.taxEnabled) {
      dispatch(setTaxEnabled(true));
    }
  }, [isWholesale, currentOutlet?.taxEnabled, dispatch]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const categories: Category[] = Array.isArray(catData)
    ? catData
    : ((catData as { categories?: Category[] } | undefined)?.categories ?? []);
  const topCategories = categories.filter((c) => !c.parentId);
  const products: Product[] = prodData?.data ?? [];
  const prodMeta = prodData?.meta?.pagination;
  const activeSubcategories = selectedParentId
    ? categories.filter((c) => c.parentId === selectedParentId)
    : [];

  const handleBarcodeScanned = React.useCallback(
    async (scannedBarcode: string) => {
      if (!token) return;
      try {
        const res = await productService.getProductsWithOffset(token || "", {
          outletId: outletId ?? undefined,
          search: scannedBarcode,
          limit: 2,
        });
        const prods = res.data ?? [];
        const exactMatch = prods.find(
          (p) => p.barcode === scannedBarcode || p.sku === scannedBarcode,
        );

        if (exactMatch) {
          if (isWholesale && (exactMatch.packagingUnits?.length ?? 0) > 0) {
            setUnitPickProduct(exactMatch);
          } else {
            dispatch(
              addItem({
                id: exactMatch._id,
                name: exactMatch.name,
                price: exactMatch.price,
                taxRate: exactMatch.gstRate || exactMatch.taxRate,
                unit: exactMatch.unit,
                image: exactMatch.image,
                categoryId:
                  typeof exactMatch.categoryId === "object"
                    ? exactMatch.categoryId?._id
                    : (exactMatch.categoryId ?? undefined),
              }),
            );
          }
          setSearch("");
        } else {
          setSearch(scannedBarcode);
          toast.error("Product not found");
        }
      } catch (err) {
        console.error("Barcode scan failed", err);
      }
    },
    [token, outletId, dispatch, isWholesale],
  );

  React.useEffect(() => {
    let buffer = "";
    let lastTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      const currentTime = new Date().getTime();
      if (currentTime - lastTime > 50) buffer = "";

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

  const scrollCategoryLeft = () => {
    catScrollRef.current?.scrollBy({ left: -200, behavior: "smooth" });
  };

  const scrollCategoryRight = () => {
    catScrollRef.current?.scrollBy({ left: 200, behavior: "smooth" });
  };

  const addProductToCart = (
    product: Product,
    option?: UnitPickOption,
    qty = 1,
  ) => {
    const taxRate = product.gstRate || product.taxRate || 0;
    if (option) {
      dispatch(
        addItem({
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
          categoryId:
            typeof product.categoryId === "object"
              ? product.categoryId?._id
              : (product.categoryId ?? undefined),
          qty,
        }),
      );
      return;
    }
    dispatch(
      addItem({
        id: product._id,
        name: product.name,
        price: product.price,
        taxRate,
        unit: product.unit,
        image: product.image,
        categoryId:
          typeof product.categoryId === "object"
            ? product.categoryId?._id
            : (product.categoryId ?? undefined),
      }),
    );
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

    const paymentSplit =
      billing.paymentMethod === "split"
        ? {
            cash: billing.payment.cash,
            upi: billing.payment.upi,
            card: billing.payment.card,
          }
        : undefined;

    let amountReceived = total;
    if (isKhataPayment) {
      amountReceived = billing.amountReceived ?? 0;
    } else if (billing.paymentMethod === "split" && paymentSplit) {
      amountReceived = Object.values(paymentSplit).reduce(
        (s, v) => s + (Number(v) || 0),
        0,
      );
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

    const payMethod =
      isKhataPayment && amountReceived === 0
        ? "credit"
        : isKhataPayment && amountReceived > 0
          ? "cash"
          : billing.paymentMethod;

    // Capture receipt snapshot before the cart is cleared on success
    receiptSnapshotRef.current = {
      businessName: bizData?.business?.name ?? "Shop",
      outletName: currentOutlet?.name ?? undefined,
      businessPhone: bizData?.business?.phone ?? undefined,
      businessAddress: bizData?.business?.address ?? undefined,
      businessGst: bizData?.business?.gstNumber ?? undefined,
      orderNumber: "", // filled from server response in onSuccess
      createdAt: new Date().toISOString(),
      customerName:
        selectedCustomerData?.customer?.name ||
        billing.customerName ||
        undefined,
      customerPhone:
        selectedCustomerData?.customer?.phone ||
        billing.customerPhone ||
        undefined,
      items: billing.items.map((i) => ({
        name: i.name,
        qty: i.soldQty ?? i.qty,
        unit: i.soldUnit ?? i.unit,
        price: i.price,
        lineTotal: i.price * (i.soldQty ?? i.qty),
      })),
      subtotal,
      discount: billing.discount,
      tax: taxAmount,
      total,
      paymentMethod: payMethod,
      amountPaid: amountReceived,
      amountDue,
      isWholesale,
      paperWidth: printerRef.current.config.paperWidth,
    };

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
        taxRate: billing.taxEnabled ? i.taxRate || billing.taxRate : 0,
        unit: i.soldUnit ?? i.unit,
        lineTotal: i.price * (i.soldQty ?? i.qty),
        taxTotal: calculateCartTotals([i], {
          taxEnabled: billing.taxEnabled,
          taxRate: billing.taxRate,
          taxMode: billing.taxMode,
          discount: 0,
          supplyType,
        }).tax,
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
        split: paymentSplit,
      },
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

  return {
    token,
    outletId,
    billing,
    dispatch,
    hasWholesale,
    hasRetail,
    hasCustomers,
    hasCreditKhata,
    hasGstInvoices,
    settings,
    showSaleModeTabs,
    wholesaleOnly,
    isWholesale,
    isKhataPayment,
    showCustomerSection,
    paymentMethods,
    search,
    setSearch,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedParentId,
    setSelectedParentId,
    showSuccess,
    showCheckout,
    setShowCheckout,
    showScanner,
    setShowScanner,
    prodPage,
    setProdPage,
    prodLimit,
    setProdLimit,
    prodIsRefetching,
    prodCooldownSeconds,
    unitPickProduct,
    setUnitPickProduct,
    editingPriceId,
    setEditingPriceId,
    editPriceValue,
    setEditPriceValue,
    pendingSaleMode,
    setPendingSaleMode,
    catScrollRef,
    categories,
    topCategories,
    products,
    prodMeta,
    productsFetching,
    activeSubcategories,
    supplyType,
    isInterState,
    cartTotals,
    subtotal,
    taxAmount,
    cgst,
    sgst,
    igst,
    total,
    amountDuePreview,
    cartItemCount,
    submitOrder,
    handleBarcodeScanned,
    handleProdRefetch,
    scrollCategoryLeft,
    scrollCategoryRight,
    addProductToCart,
    handleAddProduct,
    handleCheckout,
    printer,
    handleSaleModeChange,
    setDiscount,
    setBillingMode,
    setPaymentMethod,
    setPaymentAmount,
    clearBill,
    setSaleMode,
    setTaxMode,
    setTaxEnabled,
    setTaxRate,
    selectCustomer,
    setCreditSale,
    setAmountReceived,
    setGenerateGstInvoice,
    updateQty,
    updateLinePrice,
    removeItem,
  };
}
