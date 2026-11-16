"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  RefreshCw,
  Boxes,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Barcode,
  Layers,
  Percent,
  Tag,
  DollarSign,
  Camera,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import AsyncSelect from "@/components/ui/async-select";
import { DataTable } from "@/components/ui/data-table";
import { BarcodeScanner } from "@/components/ui/barcode-scanner";
import { useAuth } from "@/components/auth/auth-provider";
import { useFeature, useBusinessProfile } from "@/hooks/useFeature";
import { getJsonWithMeta } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import type { Product, Unit } from "@/lib/types";
import { getErrorMessage } from "@/lib/error";
import { productService } from "@/services/product.service";
import { unitService } from "@/services/unit.service";
import { categoryService } from "@/services/category.service";
import { brandService } from "@/services/brand.service";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";
import { cn } from "@/lib/utils";

const packagingUnitSchema = z.object({
  unitId: z.string().min(1, "Required"),
  unitName: z.string(),
  qtyPerUnit: z.string().min(1, "Required"),
  price: z.string().optional(),
  costPrice: z.string().optional()
});

const productSchema = z.object({
  name: z.string().min(1, "Product Name is required"),
  description: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  unit: z.string().min(1, "Unit name is required"),
  unitId: z.string().optional(),
  price: z.string().min(1, "Selling Price is required").refine(val => !isNaN(Number(val)) && Number(val) >= 0, "Invalid price"),
  costPrice: z.string().min(1, "Cost Price is required").refine(val => !isNaN(Number(val)) && Number(val) >= 0, "Invalid cost price"),
  categoryId: z.string().min(1, "Category is required"),
  brandId: z.string().optional(),
  taxRate: z.string().optional(),
  gstRate: z.string().optional(),
  hsnCode: z.string().optional(),
  onHandQty: z.string().optional(),
  lowStockThreshold: z.string().optional(),
  sortOrder: z.string().optional(),
  packagingUnits: z.array(packagingUnitSchema).optional()
}).superRefine((data, ctx) => {
  if (data.packagingUnits && data.packagingUnits.length > 0) {
    const validUnits = data.packagingUnits.filter((p) => p.unitId && p.qtyPerUnit);
    if (validUnits.some(p => p.unitId === data.unitId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Packaging unit cannot be the same as the base unit.",
        path: ["packagingUnits"]
      });
    }
    const uniqueUnitIds = new Set(validUnits.map(p => p.unitId));
    if (uniqueUnitIds.size !== validUnits.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Each packaging unit must have a unique unit name.",
        path: ["packagingUnits"]
      });
    }
  }
});

type ProductFormValues = z.infer<typeof productSchema>;

function unitLabel(u: Pick<Unit, "name" | "abbreviation">) {
  return u.abbreviation || u.name;
}

async function loadUnits(
  token: string | null,
  outletId: string | null | undefined,
  { page, limit, search }: { page: number; limit: number; search?: string }
) {
  const res = await unitService.getUnitsWithMeta(token, {
    flat: "true",
    page,
    limit,
    outletId: outletId ?? undefined,
    search: search || undefined
  });

  const items = (res.data ?? []).map((u) => ({
    ...u,
    id: u._id,
    name: unitLabel(u),
    label: u.abbreviation && u.abbreviation !== u.name ? `${u.abbreviation} (${u.name})` : u.name
  }));

  return { data: items, meta: res.meta ?? undefined };
}

async function loadCategories(
  token: string | null,
  { page, limit, search }: { page: number; limit: number; search?: string }
) {
  const res = await categoryService.getCategoriesWithMeta(token, { flat: "true", page, limit, search: search || undefined });

  const items = (res.data ?? []).map((c) => ({
    ...c,
    id: c._id,
    name: `${c.icon ? `${c.icon} ` : ""}${c.name}`,
    label: `${c.icon ? `${c.icon} ` : ""}${c.name}`
  }));

  return { data: items, meta: res.meta ?? undefined };
}

async function loadBrands(
  token: string | null,
  { page, limit, search }: { page: number; limit: number; search?: string }
) {
  const res = await brandService.getBrandsWithMeta(token, { page, limit, search: search || undefined });
  const items = (res.data ?? []).map((b) => ({
    ...b,
    id: b._id,
    name: b.name,
    label: b.name
  }));
  return { data: items, meta: res.meta ?? undefined };
}

export default function ProductsPage() {
  const { user, token, outletId } = useAuth();
  const currency = user?.currency || "INR";
  const qc = useQueryClient();
  const router = useRouter();

  const [query, setQuery] = useQueryStates({
    search: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(20)
  });

  const [stockTab, setStockTab] = React.useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const [catFilter, setCatFilter] = React.useState<{ id: string, name: string, label: string } | null>(null);
  const [brandFilter, setBrandFilter] = React.useState<{ id: string, name: string, label: string } | null>(null);
  const [formCategoryOption, setFormCategoryOption] = React.useState<{ id: string, name: string, label: string } | null>(null);
  const [formBrandOption, setFormBrandOption] = React.useState<{ id: string, name: string, label: string } | null>(null);
  const [showModal, setShowModal] = React.useState(false);
  const [showScanner, setShowScanner] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const businessProfile = useBusinessProfile();
  const hasPackaging = useFeature("packaging_units") || businessProfile === "retail";
  const hasGstInvoices = useFeature("gst_invoices");
  const showHsn = hasPackaging || hasGstInvoices;

  const { register, control, handleSubmit, reset, setValue, watch, clearErrors, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", description: "", sku: "", barcode: "", unit: "pc", unitId: "", price: "", costPrice: "", categoryId: "", brandId: "", taxRate: "0", gstRate: "0", hsnCode: "", onHandQty: "0", lowStockThreshold: "10", sortOrder: "0", packagingUnits: [] }
  });

  const { fields: pkgFields, append: appendPkg, remove: removePkg } = useFieldArray({
    control,
    name: "packagingUnits"
  });

  const formUnit = watch("unit");
  const formUnitId = watch("unitId");
  const watchPrice = Number(watch("price")) || 0;
  const watchCostPrice = Number(watch("costPrice")) || 0;
  const grossProfit = watchPrice - watchCostPrice;
  const grossMarginPercent = watchPrice > 0 ? Math.round((grossProfit / watchPrice) * 100) : 0;

  const { data: productsData, isLoading, refetch: refetchProducts } = useQuery({
    queryKey: ["products", outletId, query.search, catFilter?.id, brandFilter?.id, query.page, query.limit],
    queryFn: () =>
      getJsonWithMeta<Product[]>("/products", token, {
        outletId: outletId ?? undefined,
        search: query.search || undefined,
        categoryId: catFilter?.id || undefined,
        brandId: brandFilter?.id || undefined,
        page: query.page,
        limit: query.limit
      }),
    enabled: Boolean(token),
    staleTime: 5_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const handleManualRefetch = async () => {
    setIsRefreshing(true);
    qc.invalidateQueries({ queryKey: ["products"] });
    await refetchProducts();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const save = useMutation({
    mutationFn: (body: unknown) => {
      if (editId) {
        return productService.updateProduct(editId, body, token);
      }
      return productService.createProduct(token!, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setShowModal(false);
      setEditId(null);
      toast.success(editId ? "Product updated successfully" : "Product created successfully");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Failed to save product"));
    }
  });

  const remove = useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setDeleteId(null);
      toast.success("Product deleted successfully");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Failed to delete product"));
    }
  });

  const products: Product[] = productsData?.data ?? [];
  const meta = productsData?.meta?.pagination;
  const totalItems = meta?.total ?? products.length;

  // KPI Calculations
  const activeCount = React.useMemo(() => products.filter((p) => p.isActive).length, [products]);
  const lowStockCount = React.useMemo(() => products.filter((p) => (p.onHandQty ?? 0) <= (p.lowStockThreshold || 10) && (p.onHandQty ?? 0) > 0).length, [products]);
  const outOfStockCount = React.useMemo(() => products.filter((p) => (p.onHandQty ?? 0) === 0).length, [products]);
  const estimatedStockValue = React.useMemo(() => {
    return products.reduce((acc, p) => acc + ((p.onHandQty ?? 0) * (p.costPrice || p.price || 0)), 0);
  }, [products]);

  // Tabbed Filter Slicing
  const displayedProducts = React.useMemo(() => {
    if (stockTab === "in_stock") {
      return products.filter((p) => (p.onHandQty ?? 0) > (p.lowStockThreshold || 10));
    }
    if (stockTab === "low_stock") {
      return products.filter((p) => (p.onHandQty ?? 0) <= (p.lowStockThreshold || 10) && (p.onHandQty ?? 0) > 0);
    }
    if (stockTab === "out_of_stock") {
      return products.filter((p) => (p.onHandQty ?? 0) === 0);
    }
    return products;
  }, [products, stockTab]);

  const loadCategoryFilterOptions = React.useCallback(
    async (params: { page: number; limit: number; q?: string }) => {
      const res = await qc.fetchQuery({
        queryKey: ["categories", "options", params.page, params.limit, params.q],
        queryFn: () => loadCategories(token, { ...params, search: params.q }),
        staleTime: 5_000,
      });
      if (params.page === 1 && !params.q) {
        return {
          ...res,
          data: [{ id: "", _id: "", name: "All Categories", label: "All Categories" }, ...res.data]
        };
      }
      return res;
    },
    [token, qc]
  );

  const loadBrandFilterOptions = React.useCallback(
    async (params: { page: number; limit: number; q?: string }) => {
      const res = await qc.fetchQuery({
        queryKey: ["brands", "options", params.page, params.limit, params.q],
        queryFn: () => loadBrands(token, { ...params, search: params.q }),
        staleTime: 5_000,
      });
      if (params.page === 1 && !params.q) {
        return {
          ...res,
          data: [{ id: "", _id: "", name: "All Brands", label: "All Brands" }, ...res.data]
        };
      }
      return res;
    },
    [token, qc]
  );

  const loadBrandFormOptions = React.useCallback(
    (params: { page: number; limit: number; search?: string }) => 
      qc.fetchQuery({
        queryKey: ["brands", "options", params.page, params.limit, params.search],
        queryFn: () => loadBrands(token, params),
        staleTime: 5_000,
      }),
    [token, qc]
  );

  const loadCategoryFormOptions = React.useCallback(
    (params: { page: number; limit: number; search?: string }) => 
      qc.fetchQuery({
        queryKey: ["categories", "options", params.page, params.limit, params.search],
        queryFn: () => loadCategories(token, params),
        staleTime: 5_000,
      }),
    [token, qc]
  );

  const loadUnitOptions = React.useCallback(
    (params: { page: number; limit: number; search?: string }) => 
      qc.fetchQuery({
        queryKey: ["units", "options", outletId, params.page, params.limit, params.search],
        queryFn: () => loadUnits(token, outletId, params),
        staleTime: 5_000,
      }),
    [token, outletId, qc]
  );

  const resolveUnitSelection = React.useCallback(
    async (opt: { id?: string; _id?: string; name?: string; label?: string; abbreviation?: string }) => {
      if (String(opt.id).startsWith("new_")) {
        const name = (opt.name ?? opt.label ?? "").trim();
        if (!name || !token) return null;
        const res = await unitService.createUnit({ name, abbreviation: name, outletId: outletId ?? undefined }, token);
        const unit = res?.unit;
        if (unit) {
          qc.invalidateQueries({ queryKey: ["units"] });
          return { unitId: unit._id, unitName: unitLabel(unit) };
        }
        return null;
      }
      return {
        unitId: opt.id ?? opt._id ?? "",
        unitName: opt.abbreviation ?? opt.name ?? opt.label ?? ""
      };
    },
    [token, outletId, qc]
  );

  const handleUnitChange = async (opt: Parameters<NonNullable<React.ComponentProps<typeof AsyncSelect>["onChange"]>>[0]) => {
    clearErrors("unit");
    if (!opt) {
      setValue("unit", "");
      setValue("unitId", "");
      return;
    }
    const o = Array.isArray(opt) ? opt[0] : opt;
    if (String(o.id).startsWith("new_")) {
      const name = (o.name ?? o.label ?? "").trim();
      if (!name) return;
      try {
        const resolved = await resolveUnitSelection(o);
        if (resolved) {
          setValue("unit", resolved.unitName);
          setValue("unitId", resolved.unitId);
          return;
        }
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to create unit"));
      }
      setValue("unit", name);
      setValue("unitId", "");
      return;
    }
    setValue("unit", o.abbreviation ?? o.name ?? o.label ?? "");
    setValue("unitId", o.id ?? o._id ?? "");
  };

  const openCreate = () => {
    setEditId(null);
    setFormCategoryOption(null);
    setFormBrandOption(null);
    reset({ name: "", description: "", sku: "", barcode: "", unit: "pc", unitId: "", price: "", costPrice: "", categoryId: "", brandId: "", taxRate: "0", gstRate: "0", hsnCode: "", onHandQty: "0", lowStockThreshold: "10", sortOrder: "0", packagingUnits: [] });
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditId(p._id);
    let catOpt = null;
    if (typeof p.categoryId === "object" && p.categoryId) {
      const label = `${p.categoryId.icon ? `${p.categoryId.icon} ` : ""}${p.categoryId.name}`;
      catOpt = { id: p.categoryId._id, name: label, label };
    }
    setFormCategoryOption(catOpt);
    let brandOpt = null;
    if (typeof p.brandId === "object" && p.brandId) {
      brandOpt = { id: (p.brandId as any)._id, name: (p.brandId as any).name, label: (p.brandId as any).name };
    }
    setFormBrandOption(brandOpt);
    reset({
      name: p.name,
      description: p.description ?? "",
      sku: p.sku ?? "",
      barcode: p.barcode ?? "",
      unit: (p as any).unitId?.abbreviation ?? p.unit,
      unitId: (p as any).unitId?._id ?? "",
      price: String(p.price),
      costPrice: String(p.costPrice ?? 0),
      categoryId: typeof p.categoryId === "object" ? p.categoryId?._id ?? "" : p.categoryId ?? "",
      brandId: typeof p.brandId === "object" ? (p.brandId as any)?._id ?? "" : p.brandId ?? "",
      taxRate: String(p.taxRate ?? 0),
      gstRate: String(p.gstRate ?? 0),
      hsnCode: p.hsnCode ?? "",
      onHandQty: String(p.onHandQty ?? 0),
      lowStockThreshold: String(p.lowStockThreshold || 10),
      sortOrder: String(p.sortOrder ?? 0),
      packagingUnits: (p.packagingUnits ?? []).map((pkg) => ({
        unitId: typeof pkg.unitId === "object" ? pkg.unitId._id : pkg.unitId,
        unitName: typeof pkg.unitId === "object" ? (pkg.unitId.abbreviation || pkg.unitId.name) : "",
        qtyPerUnit: String(pkg.qtyPerUnit),
        price: pkg.price != null ? String(pkg.price) : "",
        costPrice: pkg.costPrice != null ? String(pkg.costPrice) : ""
      }))
    });
    setShowModal(true);
  };

  const onSubmit = (data: ProductFormValues) => {
    const body: Record<string, unknown> = {
      ...data,
      outletId,
      price: Number(data.price),
      costPrice: Number(data.costPrice || 0),
      taxRate: Number(data.taxRate || 0),
      gstRate: Number(data.gstRate || 0),
      onHandQty: Number(data.onHandQty || 0),
      lowStockThreshold: Number(data.lowStockThreshold || 0),
      sortOrder: Number(data.sortOrder || 0),
      categoryId: data.categoryId || undefined,
      brandId: data.brandId || undefined,
      hsnCode: data.hsnCode || undefined
    };
    if (hasPackaging && data.packagingUnits && data.packagingUnits.length) {
      const validUnits = data.packagingUnits.filter((p) => p.unitId && p.qtyPerUnit);
      body.packagingUnits = validUnits.map((p) => ({
        unitId: p.unitId,
        qtyPerUnit: Number(p.qtyPerUnit),
        price: p.price ? Number(p.price) : undefined,
        costPrice: p.costPrice ? Number(p.costPrice) : 0
      }));
    }
    save.mutate(body);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Product Catalog</h1>
            <Badge variant="soft" className="text-xs font-semibold px-2 py-0.5">
              {totalItems} items registered
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Manage store merchandise, barcodes, margins, base units, and bulk packaging.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefetch}
            disabled={isRefreshing || isLoading}
            className="h-10 px-3 gap-1.5 text-xs font-semibold border-border/80 hover:bg-muted/50 cursor-pointer"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", (isRefreshing || isLoading) && "animate-spin text-primary")} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/products/import")}
            className="h-10 px-3.5 gap-2 text-xs font-semibold border-border/80 hover:bg-muted/50 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            <span>Import Catalog</span>
          </Button>

          <Button
            id="create-product-btn"
            size="sm"
            onClick={openCreate}
            className="h-10 px-4 gap-2 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-xl cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Catalog Total</p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {totalItems} Products
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {activeCount} active in POS register
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <Boxes className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Inventory Valuation</p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {formatCurrency(estimatedStockValue, currency)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Current outlet stock worth
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Low Stock Alert</p>
              <p className={cn("text-xl font-extrabold tracking-tight mt-1 truncate", lowStockCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground")}>
                {lowStockCount} Products
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {lowStockCount > 0 ? "Reorder recommended" : "Stock healthy"}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Stock Depleted</p>
              <p className={cn("text-xl font-extrabold tracking-tight mt-1 truncate", outOfStockCount > 0 ? "text-destructive" : "text-foreground")}>
                {outOfStockCount} Products
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {outOfStockCount > 0 ? "Requires restock" : "All items available"}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0 border border-destructive/20">
              <Package className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Table Section */}
      <DataTable
        isLoading={isLoading}
        data={displayedProducts}
        keyExtractor={(p) => p._id}
        emptyStateText="No products found matching the current search or filters."
        totalItems={totalItems}
        page={query.page}
        limit={query.limit}
        onPageChange={(p) => setQuery({ page: p })}
        onLimitChange={(l) => setQuery({ limit: l, page: 1 })}
        searchQuery={query.search}
        onSearchChange={(s) => setQuery({ search: s, page: 1 })}
        onRefetch={handleManualRefetch}
        filters={
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
            {/* Status Slicing Tabs */}
            <Tabs value={stockTab} onValueChange={(v) => setStockTab(v as any)} className="w-auto shrink-0">
              <TabsList className="h-9 bg-muted/60 p-0.5 border border-border/40 shrink-0">
                <TabsTrigger
                  value="all"
                  className="h-full text-xs px-3.5 font-semibold whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                >
                  All ({products.length})
                </TabsTrigger>
                <TabsTrigger
                  value="in_stock"
                  className="h-full text-xs px-3.5 font-semibold whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                >
                  In Stock
                </TabsTrigger>
                <TabsTrigger
                  value="low_stock"
                  className="h-full text-xs px-3.5 font-semibold whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                >
                  Low Stock {lowStockCount > 0 && `(${lowStockCount})`}
                </TabsTrigger>
                <TabsTrigger
                  value="out_of_stock"
                  className="h-full text-xs px-3.5 font-semibold whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                >
                  Out of Stock {outOfStockCount > 0 && `(${outOfStockCount})`}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Category and Brand Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-48 shrink-0">
                <AsyncSelect
                  value={catFilter}
                  onChange={(opt: any) => {
                    if (!opt || (Array.isArray(opt) && opt.length === 0)) {
                      setCatFilter(null);
                    } else {
                      const selected = Array.isArray(opt) ? opt[0] : opt;
                      setCatFilter(selected.id === "" ? null : selected);
                    }
                    setQuery({ page: 1 });
                  }}
                  loadOptions={loadCategoryFilterOptions}
                  placeholder="All Categories"
                  className="h-9 text-xs"
                />
              </div>

              <div className="w-44 shrink-0">
                <AsyncSelect
                  value={brandFilter}
                  onChange={(opt: any) => {
                    if (!opt || (Array.isArray(opt) && opt.length === 0)) {
                      setBrandFilter(null);
                    } else {
                      const selected = Array.isArray(opt) ? opt[0] : opt;
                      setBrandFilter(selected.id === "" ? null : selected);
                    }
                    setQuery({ page: 1 });
                  }}
                  loadOptions={loadBrandFilterOptions}
                  placeholder="All Brands"
                  className="h-9 text-xs"
                />
              </div>

              {(catFilter || brandFilter || query.search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-2 text-xs text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setCatFilter(null);
                    setBrandFilter(null);
                    setQuery({ search: "", page: 1 });
                  }}
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Reset
                </Button>
              )}
            </div>
          </div>
        }
        columns={[
          {
            key: "name",
            header: "Product & Codes",
            render: (p) => {
              const catColor = typeof p.categoryId === "object" ? p.categoryId?.color : "#6366f1";
              const catIcon = typeof p.categoryId === "object" ? p.categoryId?.icon : "📦";
              return (
                <div className="flex items-center gap-3 py-1">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="h-12 w-12 rounded-xl object-cover shrink-0 border border-border/60" />
                  ) : (
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center text-xl shrink-0 border border-border/50 shadow-2xs"
                      style={{ backgroundColor: `${catColor || "#6366f1"}15` }}
                    >
                      {catIcon || "📦"}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="font-bold text-sm text-foreground hover:text-primary transition-colors text-left line-clamp-1 block cursor-pointer"
                    >
                      {p.name}
                    </button>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {p.sku && (
                        <span className="font-mono text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border/60">
                          SKU: {p.sku}
                        </span>
                      )}
                      {p.barcode && (
                        <span className="font-mono text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border/60 flex items-center gap-1">
                          <Barcode className="h-2.5 w-2.5 text-muted-foreground" />
                          {p.barcode}
                        </span>
                      )}
                      {p.brandId && typeof p.brandId === "object" && (
                        <Badge variant="outline" className="text-[10px] font-semibold px-1.5 py-0 border-border/70">
                          {(p.brandId as any).name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
          },
          {
            key: "category",
            header: "Category",
            render: (p) => {
              if (typeof p.categoryId === "object" && p.categoryId) {
                return (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border"
                    style={{
                      backgroundColor: `${p.categoryId.color || "#6366f1"}15`,
                      color: p.categoryId.color || "inherit",
                      borderColor: `${p.categoryId.color || "#6366f1"}30`
                    }}
                  >
                    <span>{p.categoryId.icon || "🍽️"}</span>
                    <span>{p.categoryId.name}</span>
                  </span>
                );
              }
              return <span className="text-xs text-muted-foreground">-</span>;
            }
          },
          {
            key: "price",
            header: "Price & Margins",
            render: (p) => {
              const sellPrice = Number(p.price) || 0;
              const costPrice = Number(p.costPrice) || 0;
              const profit = sellPrice - costPrice;
              const margin = sellPrice > 0 ? Math.round((profit / sellPrice) * 100) : 0;
              return (
                <div className="flex flex-col">
                  <span className="font-mono text-sm font-extrabold text-foreground">
                    {formatCurrency(sellPrice, currency)}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      Cost: {formatCurrency(costPrice, currency)}
                    </span>
                    {profit > 0 && (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0 rounded">
                        +{margin}%
                      </span>
                    )}
                  </div>
                </div>
              );
            }
          },
          {
            key: "onHandQty",
            header: "Stock Level",
            render: (p) => {
              const qty = p.onHandQty ?? 0;
              const threshold = p.lowStockThreshold || 10;
              const unit = (p as any).unitId?.abbreviation ?? p.unit;
              const isOut = qty === 0;
              const isLow = qty <= threshold && !isOut;
              return (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "font-mono text-sm font-black",
                      isOut && "text-destructive",
                      isLow && "text-amber-600 dark:text-amber-400",
                      !isOut && !isLow && "text-foreground"
                    )}>
                      {qty} {unit}
                    </span>
                    {isOut && <Badge variant="danger" className="text-[10px] px-1.5 py-0">Out of Stock</Badge>}
                    {isLow && <Badge variant="warning" className="text-[10px] px-1.5 py-0">Low (≤{threshold})</Badge>}
                  </div>

                  {p.packagingUnits && p.packagingUnits.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.packagingUnits.map((pkg: any, idx: number) => {
                        const bulkQty = pkg.onHandBulkQty ?? Math.floor(qty / (pkg.qtyPerUnit || 1));
                        const pkgName = typeof pkg.unitId === "object" ? (pkg.unitId?.abbreviation || pkg.unitId?.name) : "";
                        return (
                          <span key={idx} className="font-mono text-[10px] font-semibold text-muted-foreground bg-muted/40 px-1.5 py-0.2 rounded border border-border/50">
                            {bulkQty} {pkgName}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
          },
          {
            key: "tax",
            header: "GST Rate",
            className: "hidden lg:table-cell",
            render: (p) => (
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">
                  GST {p.gstRate || p.taxRate || 0}%
                </span>
                {p.hsnCode && (
                  <span className="font-mono text-[10px] text-muted-foreground mt-0.5">
                    HSN: {p.hsnCode}
                  </span>
                )}
              </div>
            )
          },
          {
            key: "isActive",
            header: "Status",
            render: (p) => (
              <Badge variant={p.isActive ? "soft" : "danger"} className="text-[10px] font-bold px-2 py-0.5">
                {p.isActive ? "Active" : "Inactive"}
              </Badge>
            )
          },
          {
            key: "actions",
            header: "",
            render: (p) => (
              <div className="flex items-center gap-1 justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-muted text-foreground cursor-pointer"
                  onClick={() => openEdit(p)}
                  title="Edit Product"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 cursor-pointer"
                  onClick={() => setDeleteId(p._id)}
                  title="Delete Product"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          }
        ]}
      />

      {/* Add / Edit Product Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editId ? "Edit Catalog Item" : "Register New Product"}
        size="full"
        className="max-w-3xl md:max-w-4xl lg:max-w-5xl"
        bodyClassName="pb-0 sm:pb-0"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)} className="h-10 px-4">
              Cancel
            </Button>
            <Button
              type="submit"
              form="product-form"
              disabled={save.isPending}
              className="h-10 px-5 font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {save.isPending ? "Saving..." : (editId ? "Save Changes" : "Create Product")}
            </Button>
          </div>
        }
      >
        <form id="product-form" className="space-y-6 pb-4" onSubmit={handleSubmit(onSubmit)}>
          {/* Section 1: General Product Information */}
          <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-4 shadow-2xs">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-primary" />
              General Details
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-foreground">Product Name *</label>
                <Input
                  id="product-name"
                  {...register("name", { onChange: () => clearErrors("name") })}
                  placeholder="e.g. 7-Select Classic Hot Dog"
                  className={cn("h-10 text-sm", errors.name && "border-destructive")}
                />
                {errors.name && <p className="text-destructive text-[10px] mt-1 font-medium">{errors.name.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">Category *</label>
                <AsyncSelect
                  value={formCategoryOption}
                  onChange={(opt: any) => {
                    setFormCategoryOption(opt);
                    setValue("categoryId", opt?.id || opt?._id || "", { shouldValidate: true });
                  }}
                  loadOptions={loadCategoryFormOptions}
                  placeholder="Select Category"
                  searchable
                  pageSize={25}
                  className="h-10 text-xs"
                />
                {errors.categoryId && <p className="text-destructive text-[10px] mt-1 font-medium">{errors.categoryId.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">Brand (Optional)</label>
                <AsyncSelect
                  value={formBrandOption}
                  onChange={async (opt: any) => {
                    const o = Array.isArray(opt) ? opt[0] : opt;
                    if (!o) {
                      setFormBrandOption(null);
                      setValue("brandId", "", { shouldValidate: true });
                      return;
                    }
                    if (String(o.id).startsWith("new_")) {
                      const name = (o.name ?? o.label ?? "").trim();
                      if (!name) return;
                      try {
                        const res = await brandService.createBrand({ name }, token!);
                        if (res.brand) {
                          const newBrand = res.brand;
                          setFormBrandOption({ id: newBrand._id, name: newBrand.name, label: newBrand.name });
                          setValue("brandId", newBrand._id, { shouldValidate: true });
                        }
                      } catch (err) {
                        toast.error("Failed to create brand");
                      }
                    } else {
                      setFormBrandOption(o);
                      setValue("brandId", o.id || o._id || "", { shouldValidate: true });
                    }
                  }}
                  loadOptions={loadBrandFormOptions}
                  placeholder="Select or Create Brand"
                  searchable
                  creatable
                  pageSize={25}
                  className="h-10 text-xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-foreground">Description (Optional)</label>
                <Input
                  id="product-description"
                  {...register("description")}
                  placeholder="Ingredients, packaging type, flavor notes, etc."
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pricing, Cost & Margins */}
          <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-4 shadow-2xs">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              Pricing & Margins
            </span>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">Selling Price ({currency}) *</label>
                <Input
                  id="product-price"
                  type="number"
                  min={0}
                  step="any"
                  {...register("price", { onChange: () => clearErrors("price") })}
                  placeholder="0.00"
                  className={cn("h-10 font-mono font-bold text-sm", errors.price && "border-destructive")}
                />
                {errors.price && <p className="text-destructive text-[10px] mt-1 font-medium">{errors.price.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">Cost Price ({currency}) *</label>
                <Input
                  id="product-cost"
                  type="number"
                  min={0}
                  step="any"
                  {...register("costPrice", { onChange: () => clearErrors("costPrice") })}
                  placeholder="0.00"
                  className={cn("h-10 font-mono text-sm", errors.costPrice && "border-destructive")}
                />
                {errors.costPrice && <p className="text-destructive text-[10px] mt-1 font-medium">{errors.costPrice.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">GST Tax Rate (%)</label>
                <Input
                  id="product-gst"
                  type="number"
                  min={0}
                  max={100}
                  step="any"
                  {...register("gstRate")}
                  placeholder="0"
                  className="h-10 text-sm"
                />
              </div>

              {showHsn && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">HSN Code (Optional)</label>
                  <Input
                    {...register("hsnCode")}
                    placeholder="e.g. 1905"
                    className="h-10 text-sm font-mono"
                  />
                </div>
              )}

              {/* Dynamic Live Margin Preview */}
              {watchPrice > 0 && watchCostPrice > 0 && (
                <div className={cn(
                  "col-span-2 md:col-span-4 rounded-xl border p-3 flex items-center justify-between text-xs transition-colors",
                  grossProfit >= 0
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
                )}>
                  <span className="font-semibold flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4" />
                    Unit Gross Profit Margin:
                  </span>
                  <span className="font-mono font-black text-sm">
                    {formatCurrency(grossProfit, currency)} ({grossMarginPercent}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Units, Inventory & Barcodes */}
          <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-4 shadow-2xs">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Boxes className="h-3.5 w-3.5 text-primary" />
              Measurement, Stock & Codes
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">Base Unit *</label>
                <AsyncSelect
                  value={formUnitId ? { id: formUnitId, name: formUnit, label: formUnit } : null}
                  onChange={handleUnitChange}
                  loadOptions={loadUnitOptions}
                  placeholder="e.g. pc, kg"
                  searchable
                  pageSize={25}
                  creatable
                  className="h-10 text-xs"
                />
                {errors.unit && <p className="text-destructive text-[10px] mt-1 font-medium">{errors.unit.message}</p>}
                {formUnit && ["crate", "peti", "box", "case", "carton", "pack", "bundle"].some(w => formUnit.toLowerCase().includes(w)) && (
                  <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-start gap-1 leading-tight">
                    <span>Base units should be single pieces. Configure bulk Peti/Crate packaging below.</span>
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">Low Stock Alert (Qty)</label>
                <Input
                  id="product-threshold"
                  type="number"
                  min={0}
                  {...register("lowStockThreshold")}
                  placeholder="10"
                  className="h-10 text-sm font-mono"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">SKU Code</label>
                <Input
                  id="product-sku"
                  {...register("sku")}
                  placeholder="e.g. 7E-SNK-001"
                  className="h-10 text-xs font-mono"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">Barcode (EAN/UPC)</label>
                <div className="relative">
                  <Input
                    id="product-barcode"
                    {...register("barcode")}
                    placeholder="Scan or enter code"
                    className="h-10 text-xs font-mono pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={() => setShowScanner(true)}
                    title="Scan Barcode via Camera"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Bulk Packaging Units (Wholesale / Retail Crates) */}
          {hasPackaging && (
            <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    Packaging Units (Bulk Peti / Crate / Cartons)
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Define conversion factors and bulk pricing for wholesale peti or multi-pack cases.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs font-semibold gap-1.5"
                  onClick={() => appendPkg({ unitId: "", unitName: "", qtyPerUnit: "", price: "", costPrice: "" })}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Unit</span>
                </Button>
              </div>

              {errors.packagingUnits?.root && (
                <p className="text-destructive font-medium text-xs bg-destructive/10 px-3 py-1.5 rounded-lg">
                  {errors.packagingUnits.root.message}
                </p>
              )}

              {pkgFields.length === 0 && (
                <div className="rounded-xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
                  No bulk packaging units defined. Click "+ Add Unit" to configure wholesale crate, peti, or carton units.
                </div>
              )}

              {pkgFields.length > 0 && (
                <div className="space-y-2.5">
                  <div className="hidden sm:grid sm:grid-cols-[1.4fr_0.8fr_1fr_1fr_2.5rem] gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span>Bulk Unit Name</span>
                    <span>Units / Peti</span>
                    <span>Selling Price ({currency})</span>
                    <span>Cost Price ({currency})</span>
                    <span />
                  </div>

                  {pkgFields.map((row, idx) => (
                    <div
                      key={row.id}
                      className="grid grid-cols-1 sm:grid-cols-[1.4fr_0.8fr_1fr_1fr_2.5rem] gap-2.5 sm:gap-2 items-center rounded-xl border border-border/60 bg-muted/20 p-2.5"
                    >
                      <div className="min-w-0">
                        <label className="mb-1 block text-[10px] font-bold text-muted-foreground uppercase sm:hidden">Bulk Unit</label>
                        <Controller
                          control={control}
                          name={`packagingUnits.${idx}.unitId`}
                          render={({ field }) => (
                            <AsyncSelect
                              value={field.value ? { id: field.value, name: watch(`packagingUnits.${idx}.unitName`) } : null}
                              onChange={async (opt) => {
                                const o = Array.isArray(opt) ? opt[0] : opt as any;
                                if (!o) {
                                  field.onChange("");
                                  setValue(`packagingUnits.${idx}.unitName`, "");
                                  return;
                                }
                                try {
                                  const resolved = String(o.id).startsWith("new_")
                                    ? await resolveUnitSelection(o)
                                    : { unitId: o.id ?? o._id, unitName: o.name ?? o.label };
                                  if (!resolved?.unitId) return;
                                  field.onChange(resolved.unitId);
                                  setValue(`packagingUnits.${idx}.unitName`, resolved.unitName);
                                  clearErrors(`packagingUnits.${idx}.unitId`);
                                  clearErrors("packagingUnits.root" as any);
                                } catch (err) {
                                  toast.error(getErrorMessage(err, "Failed to create unit"));
                                }
                              }}
                              loadOptions={loadUnitOptions}
                              placeholder="e.g. Crate"
                              searchable
                              pageSize={25}
                              creatable
                              className="h-9 text-xs"
                            />
                          )}
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-muted-foreground uppercase sm:hidden">Units / Peti</label>
                        <Input
                          type="number"
                          min={1}
                          placeholder="Qty"
                          {...register(`packagingUnits.${idx}.qtyPerUnit`)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-muted-foreground uppercase sm:hidden">Sell Price</label>
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          placeholder="Price"
                          {...register(`packagingUnits.${idx}.price`)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-muted-foreground uppercase sm:hidden">Cost Price</label>
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          placeholder="Cost"
                          {...register(`packagingUnits.${idx}.costPrice`)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => removePkg(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>

        <BarcodeScanner
          open={showScanner}
          onClose={() => setShowScanner(false)}
          onScan={(text) => setValue("barcode", text)}
          continuous={true}
        />
      </Modal>

      {/* Delete Product Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove.mutate(deleteId)}
        title="Delete Catalog Product?"
        message="This product will be archived and hidden from POS registers and billing catalogues."
        confirmLabel="Confirm Delete"
        loading={remove.isPending}
      />
    </div>
  );
}
