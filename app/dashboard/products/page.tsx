"use client";

import * as React from "react";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search, Package, Loader2, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import AsyncSelect from "@/components/ui/async-select";
import { DataTable } from "@/components/ui/data-table";
import { BarcodeScanner } from "@/components/ui/barcode-scanner";
import { useAuth } from "@/components/auth/auth-provider";
import { useFeature, useBusinessProfile } from "@/hooks/useFeature";
import { getJson, getJsonWithMeta, apiFetch, apiFetchData } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import type { Product, Category, Unit } from "@/lib/types";
import { getErrorMessage } from "@/lib/error";
import { productService } from "@/services/product.service";
import { unitService } from "@/services/unit.service";
import { outletService } from "@/services/outlet.service";
import { categoryService } from "@/services/category.service";
import { brandService } from "@/services/brand.service";
import Pagination from "@/components/ui/pagination";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";

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
  unitId: z.string().optional(), // Can be empty if it's a new unit
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

  let items = (res.data ?? []).map((c) => ({
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
  let items = (res.data ?? []).map((b) => ({
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
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const [query, setQuery] = useQueryStates({
    search: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(10)
  });

  const [catFilter, setCatFilter] = React.useState<{ id: string, name: string, label: string } | null>(null);
  const [brandFilter, setBrandFilter] = React.useState<{ id: string, name: string, label: string } | null>(null);
  const [formCategoryOption, setFormCategoryOption] = React.useState<{ id: string, name: string, label: string } | null>(null);
  const [formBrandOption, setFormBrandOption] = React.useState<{ id: string, name: string, label: string } | null>(null);
  const [showModal, setShowModal] = React.useState(false);
  const [showScanner, setShowScanner] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const businessProfile = useBusinessProfile();
  const hasPackaging = useFeature("packaging_units") || businessProfile === "retail";
  const hasGstInvoices = useFeature("gst_invoices");
  const showHsn = hasPackaging || hasGstInvoices;

  const { register, control, handleSubmit, reset, setValue, watch, clearErrors, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", description: "", sku: "", barcode: "", unit: "pcs", unitId: "", price: "", costPrice: "", categoryId: "", brandId: "", taxRate: "0", gstRate: "0", hsnCode: "", onHandQty: "0", lowStockThreshold: "10", sortOrder: "0", packagingUnits: [] }
  });

  const { fields: pkgFields, append: appendPkg, remove: removePkg } = useFieldArray({
    control,
    name: "packagingUnits"
  });

  const formUnit = watch("unit");
  const formUnitId = watch("unitId");
  const formCategoryId = watch("categoryId");
  const formBarcode = watch("barcode");


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
    enabled: Boolean(token)
  });



  const save = useMutation({
    mutationFn: (body: unknown) => {
      if (editId) {
        return productService.updateProduct(editId, body, token);
      }
      return productService.createProduct(token!, body);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setShowModal(false); setEditId(null); toast.success(editId ? "Product updated" : "Product created"); },
    onError: (err) => { toast.error(getErrorMessage(err, "Failed to save product")); }
  });
  const remove = useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setDeleteId(null); toast.success("Product deleted"); },
    onError: (err) => { toast.error(getErrorMessage(err, "Failed to delete product")); }
  });

  const products: Product[] = productsData?.data ?? [];
  const meta = productsData?.meta?.pagination;
  const totalItems = meta?.total ?? products.length;
  const totalPages = meta?.totalPages ?? 1;

  const loadCategoryFilterOptions = React.useCallback(
    async (params: { page: number; limit: number; q?: string }) => {
      const res = await qc.fetchQuery({
        queryKey: ["categories", "options", params.page, params.limit, params.q],
        queryFn: () => loadCategories(token, { ...params, search: params.q }),
        staleTime: 1000 * 60 * 5,
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
        staleTime: 1000 * 60 * 5,
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
        staleTime: 1000 * 60 * 5,
      }),
    [token, qc]
  );

  const loadCategoryFormOptions = React.useCallback(
    (params: { page: number; limit: number; search?: string }) => 
      qc.fetchQuery({
        queryKey: ["categories", "options", params.page, params.limit, params.search],
        queryFn: () => loadCategories(token, params),
        staleTime: 1000 * 60 * 5,
      }),
    [token, qc]
  );

  const loadUnitOptions = React.useCallback(
    (params: { page: number; limit: number; search?: string }) => 
      qc.fetchQuery({
        queryKey: ["units", "options", outletId, params.page, params.limit, params.search],
        queryFn: () => loadUnits(token, outletId, params),
        staleTime: 1000 * 60 * 5,
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
    reset({ name: "", description: "", sku: "", barcode: "", unit: "pcs", unitId: "", price: "", costPrice: "", categoryId: "", brandId: "", taxRate: "0", gstRate: "0", hsnCode: "", onHandQty: "0", lowStockThreshold: "10", sortOrder: "0", packagingUnits: [] });
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Products</h1><p className="text-sm text-muted">{totalItems} products</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/products/import")}><Package className="h-4 w-4 mr-2" /> Import from Catalog</Button>
          <Button id="create-product-btn" onClick={openCreate}><Plus className="h-4 w-4" /> Add Product</Button>
        </div>
      </div>

      <DataTable
        isLoading={isLoading}
        data={products}
        keyExtractor={(p) => p._id}
        emptyStateText="No products yet. Add your first product."
        totalItems={totalItems}
        page={query.page}
        limit={query.limit}
        onPageChange={(p) => setQuery({ page: p })}
        onLimitChange={(l) => setQuery({ limit: l, page: 1 })}
        searchQuery={query.search}
        onSearchChange={(s) => setQuery({ search: s, page: 1 })}
        onRefetch={() => refetchProducts()}
        filters={
          <div className="flex items-center gap-4">
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
                className="h-10"
              />
            </div>
            <div className="w-48 shrink-0">
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
                className="h-10"
              />
            </div>
          </div>
        }
        columns={[
          { key: "name", header: "Product", render: (p) => (<div className="flex items-center gap-4 py-2">{p.image && <img src={p.image} className="h-14 w-14 rounded-lg object-cover flex-shrink-0" />}<div className="flex-1 min-w-0"><p className="font-semibold text-base">{p.name}</p>{p.sku && <p className="text-xs text-muted mt-1 inline-block mr-2">SKU: {p.sku}</p>}{p.brandId && typeof p.brandId === "object" && <Badge variant="soft" className="text-[9px] px-1 py-0 h-4 mt-1">{(p.brandId as any).name}</Badge>}</div></div>) },
          { key: "category", header: "Category", render: (p) => typeof p.categoryId === "object" && p.categoryId ? <span className="text-sm font-medium">{p.categoryId.icon} {p.categoryId.name}</span> : <span className="text-xs text-muted">—</span> },
          { key: "price", header: "Price", render: (p) => <span className="font-bold text-lg">{formatCurrency(p.price, currency)}</span> },
          { key: "onHandQty", header: "Stock", render: (p) => (<div><p className={p.onHandQty <= p.lowStockThreshold ? "font-bold text-danger text-base" : "font-bold text-base"}>{p.onHandQty} {(p as any).unitId?.abbreviation ?? p.unit}</p>{p.packagingUnits && p.packagingUnits.length > 0 && <div className="mt-0.5">{p.packagingUnits.map((pkg: any, idx: number) => <p key={idx} className="text-[11px] text-muted-foreground font-semibold">{pkg.onHandBulkQty ?? Math.floor(p.onHandQty / (pkg.qtyPerUnit || 1))} {typeof pkg.unitId === 'object' ? (pkg.unitId?.abbreviation || pkg.unitId?.name) : ''}</p>)}</div>}{p.onHandQty <= p.lowStockThreshold && <Badge variant="warning" className="text-[10px] mt-1">Low Stock</Badge>}</div>) },
          { key: "isActive", header: "Status", render: (p) => <Badge variant={p.isActive ? "soft" : "danger"}>{p.isActive ? "Active" : "Inactive"}</Badge> },
          { key: "actions", header: "", render: (p) => (<div className="flex gap-2"><Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-danger" onClick={() => setDeleteId(p._id)}><Trash2 className="h-4 w-4" /></Button></div>) }
        ]}
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editId ? "Edit Product" : "Add Product"}
        size="full"
        className="max-w-3xl md:max-w-4xl lg:max-w-5xl"
        bodyClassName="pb-0 sm:pb-0"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" form="product-form" disabled={save.isPending}>{save.isPending ? "Saving..." : (editId ? "Save Changes" : "Add Product")}</Button>
            <div className="w-48 shrink-0">
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
                className="h-10"
              />
            </div>
          </div>
        }
      >
        <form id="product-form" className="space-y-4 pb-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="col-span-2 md:col-span-3">
              <label className="mb-1 block text-xs font-medium text-muted">Product Name *</label>
              <Input id="product-name" {...register("name", { onChange: () => clearErrors("name") })} placeholder="e.g. Mango Lassi" className={errors.name ? "border-danger" : ""} />
              {errors.name && <p className="text-danger text-[10px] mt-1">{errors.name.message}</p>}
            </div>
            <div className="col-span-2 md:col-span-3">
              <label className="mb-1 block text-xs font-medium text-muted">Description</label>
              <Input id="product-description" {...register("description")} placeholder="Optional description" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="mb-1 block text-xs font-medium text-muted">Category *</label>
              <AsyncSelect
                value={formCategoryOption}
                onChange={(opt: any) => {
                  setFormCategoryOption(opt);
                  setValue("categoryId", opt?.id || opt?._id || "", { shouldValidate: true });
                }}
                loadOptions={loadCategoryFormOptions}
                placeholder="Select category"
                searchable
                pageSize={25}
              />
              {errors.categoryId && <p className="text-danger text-[10px] mt-1">{errors.categoryId.message}</p>}
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="mb-1 block text-xs font-medium text-muted">Brand</label>
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
                placeholder="Select or create brand"
                searchable
                creatable
                pageSize={25}
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="mb-1 block text-xs font-medium text-muted">Unit *</label>
              <AsyncSelect
                value={formUnitId ? { id: formUnitId, name: formUnit, label: formUnit } : null}
                onChange={handleUnitChange}
                loadOptions={loadUnitOptions}
                placeholder="Select unit"
                searchable
                pageSize={25}
                creatable
              />
              {errors.unit && <p className="text-danger text-[10px] mt-1">{errors.unit.message}</p>}
              {formUnit && ["crate", "peti", "box", "case", "carton", "pack", "bundle"].some(w => formUnit.toLowerCase().includes(w)) && (
                <p className="mt-1 text-[10px] text-amber-500 dark:text-amber-400 font-semibold flex items-start gap-1 leading-tight animate-in fade-in duration-300">
                  <span>⚠️ Base units should be individual items (e.g. piece, bottle, kg). Add bulk units (Crate/Peti) under "Packaging Units" below.</span>
                </p>
              )}
            </div>
            <div className="col-span-1">
              <label className="mb-1 block text-xs font-medium text-muted">Selling Price ({currency}) *</label>
              <Input id="product-price" type="number" min={0} step="0.001" {...register("price", { onChange: () => clearErrors("price") })} placeholder="0.00" className={errors.price ? "border-danger" : ""} />
              {errors.price && <p className="text-danger text-[10px] mt-1">{errors.price.message}</p>}
            </div>
            <div className="col-span-1">
              <label className="mb-1 block text-xs font-medium text-muted">Cost Price ({currency}) *</label>
              <Input id="product-cost" type="number" min={0} step="0.001" {...register("costPrice", { onChange: () => clearErrors("costPrice") })} placeholder="0.00" className={errors.costPrice ? "border-danger" : ""} />
              {errors.costPrice && <p className="text-danger text-[10px] mt-1">{errors.costPrice.message}</p>}
            </div>
            {/* <div className="col-span-1"><label className="mb-1 block text-xs font-medium text-muted">Opening Stock</label><Input id="product-qty" type="number" min={0} {...register("onHandQty")} /></div> */}
            <div className="col-span-1"><label className="mb-1 block text-xs font-medium text-muted">Low Stock Alert</label><Input id="product-threshold" type="number" min={0} {...register("lowStockThreshold")} /></div>
            <div className="col-span-2 md:col-span-1"><label className="mb-1 block text-xs font-medium text-muted">SKU</label><Input id="product-sku" {...register("sku")} placeholder="Optional" /></div>
            <div className="col-span-2 md:col-span-1">
              <label className="mb-1 block text-xs font-medium text-muted">Barcode</label>
              <div className="relative">
                <Input id="product-barcode" {...register("barcode")} placeholder="Scan or type" className="pr-10" />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted z-10" onPointerDown={(e) => { e.preventDefault(); setShowScanner(true); }} onClick={(e) => { e.preventDefault(); setShowScanner(true); }}>
                  <span className="text-lg">📷</span>
                </Button>
              </div>
            </div>
            <div className="col-span-2 md:col-span-1"><label className="mb-1 block text-xs font-medium text-muted">GST Rate (%)</label><Input id="product-gst" type="number" min={0} max={100} step="any" {...register("gstRate")} /></div>

            {hasPackaging && (
              <div className="col-span-2 md:col-span-3 space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-3.5 sm:p-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider">Packaging Units (Peti/Crate)</label>
                  <Button type="button" variant="soft" size="sm" onClick={() => appendPkg({ unitId: "", unitName: "", qtyPerUnit: "", price: "", costPrice: "" })}>
                    + Add
                  </Button>
                </div>
                {errors.packagingUnits?.root && (
                  <p className="text-danger font-medium text-xs mt-1 animate-pulse bg-danger/10 px-2 py-1 rounded">
                    {errors.packagingUnits.root.message}
                  </p>
                )}
                {pkgFields.length === 0 && (
                  <p className="text-xs text-muted leading-relaxed">Optional — bulk units with qty per peti/crate, selling price, and cost price for margin tracking.</p>
                )}
                {pkgFields.length > 0 && (
                  <div className="hidden sm:grid sm:grid-cols-[1.4fr_0.8fr_1fr_1fr_2.5rem] gap-2 px-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                    <span>Unit</span>
                    <span>Qty / unit</span>
                    <span>Sell price ({currency})</span>
                    <span>Cost price ({currency})</span>
                    <span />
                  </div>
                )}
                {pkgFields.map((row, idx) => (
                  <div key={row.id} className="grid grid-cols-1 sm:grid-cols-[1.4fr_0.8fr_1fr_1fr_2.5rem] gap-3 sm:gap-2 items-end border-b border-border/40 pb-3 sm:border-0 sm:pb-0">
                    <div className="min-w-0">
                      <label className="mb-1 block text-[10px] font-bold text-muted uppercase tracking-wider sm:hidden">Unit</label>
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
                          />
                        )}
                      />
                      {errors.packagingUnits?.[idx]?.unitId && <p className="text-danger text-[10px] mt-1">{errors.packagingUnits[idx]?.unitId?.message}</p>}
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-muted uppercase tracking-wider sm:hidden">Qty / unit</label>
                      <Input type="number" min={1} placeholder="Qty" {...register(`packagingUnits.${idx}.qtyPerUnit`, { onChange: () => { clearErrors(`packagingUnits.${idx}.qtyPerUnit`); clearErrors("packagingUnits.root" as any); } })} className={errors.packagingUnits?.[idx]?.qtyPerUnit ? "border-danger" : ""} />
                      {errors.packagingUnits?.[idx]?.qtyPerUnit && <p className="text-danger text-[10px] mt-1">{errors.packagingUnits[idx]?.qtyPerUnit?.message}</p>}
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-muted uppercase tracking-wider sm:hidden">Sell price ({currency})</label>
                      <Input type="number" min={0} step="0.01" placeholder={`Sell ${currency}`} {...register(`packagingUnits.${idx}.price`)} />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-muted uppercase tracking-wider sm:hidden">Cost price ({currency})</label>
                      <Input type="number" min={0} step="0.01" placeholder={`Cost ${currency}`} {...register(`packagingUnits.${idx}.costPrice`)} />
                    </div>
                    <div className="flex justify-end">
                      <Button type="button" variant="ghost" size="icon" className="text-danger shrink-0 h-9 w-9 sm:h-8 sm:w-8" onClick={() => removePkg(idx)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showHsn && (
              <div className="col-span-2 md:col-span-1"><label className="mb-1 block text-xs font-medium text-muted">HSN Code</label><Input {...register("hsnCode")} placeholder="e.g. 2202" /></div>
            )}
          </div>
        </form>
        <BarcodeScanner open={showScanner} onClose={() => setShowScanner(false)} onScan={(text) => setValue("barcode", text)} continuous={true} />
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && remove.mutate(deleteId)} title="Delete Product?" message="This product will be hidden from billing." confirmLabel="Delete" loading={remove.isPending} />
    </div>
  );
}
