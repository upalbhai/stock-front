"use client";

import * as React from "react";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { Plus, Pencil, Trash2, Search, Package, Loader2, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import AsyncSelect from "@/components/ui/async-select";
import { DataTable } from "@/components/ui/data-table";
import { BarcodeScanner } from "@/components/ui/barcode-scanner";
import { useAuth } from "@/components/auth/auth-provider";
import { useFeature } from "@/hooks/useFeature";
import { getJson, getJsonWithMeta, apiFetch, apiFetchData } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import type { Product, Category, Unit } from "@/lib/types";
import { getErrorMessage } from "@/lib/error";
import { productService } from "@/services/product.service";
import { unitService } from "@/services/unit.service";
import { outletService } from "@/services/outlet.service";
import { categoryService } from "@/services/category.service";
import Pagination from "@/components/ui/pagination";

function unitLabel(u: Pick<Unit, "name" | "abbreviation">) {
  return u.abbreviation || u.name;
}

async function loadUnits(
  token: string | null,
  outletId: string | null | undefined,
  { page, limit, q }: { page: number; limit: number; q?: string }
) {
  const res = await unitService.getUnitsWithMeta(token, {
    flat: "true",
    page,
    limit,
    outletId: outletId ?? undefined,
    q: q || undefined
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
  { page, limit, q }: { page: number; limit: number; q?: string }
) {
  const res = await categoryService.getCategoriesWithMeta(token, { flat: "true", page, limit });

  let items = (res.data ?? []).map((c) => ({
    ...c,
    id: c._id,
    name: `${c.icon ? `${c.icon} ` : ""}${c.name}`,
    label: `${c.icon ? `${c.icon} ` : ""}${c.name}`
  }));

  if (q) {
    const lower = q.toLowerCase();
    items = items.filter((c) => c.name.toLowerCase().includes(lower));
  }

  return { data: items, meta: res.meta ?? undefined };
}

export default function ProductsPage() {
  const { token, outletId } = useAuth();
  const qc = useQueryClient();
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [search, setSearch] = React.useState("");
  const [catFilter, setCatFilter] = React.useState("");
  const [showModal, setShowModal] = React.useState(false);
  const [showScanner, setShowScanner] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const hasPackaging = useFeature("packaging_units");
  const hasGstInvoices = useFeature("gst_invoices");
  const showHsn = hasPackaging || hasGstInvoices;
  const [packagingUnits, setPackagingUnits] = React.useState<{ unitId: string; unitName: string; qtyPerUnit: string; price: string; costPrice: string }[]>([]);
  const [form, setForm] = React.useState({ name: "", description: "", sku: "", barcode: "", unit: "pcs", unitId: "", price: "", costPrice: "", categoryId: "", taxRate: "0", gstRate: "0", hsnCode: "", onHandQty: "0", lowStockThreshold: "10", sortOrder: "0" });
  const { ref, inView } = useInView();

  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(50);

  const { data: unitsData } = useQuery({
    queryKey: ["units"],
    queryFn: () => unitService.getUnits(token),
    enabled: Boolean(token),
  });

  const { data: outletsData } = useQuery({
    queryKey: ["outlets"],
    queryFn: () => outletService.getOutlets(token),
    enabled: Boolean(token),
  });

  const { data: catData } = useQuery({
    queryKey: ["categories", "flat"],
    queryFn: () => categoryService.getCategoriesWithMeta(token, { flat: "true", page: 1, limit: 100 }),
    enabled: Boolean(token),
  });

  const { data: prodData, isLoading, isError, error, refetch: refetchProducts } = useQuery({
    queryKey: ["products", outletId, catFilter, search, page, limit],
    queryFn: () => productService.getProductsWithOffset(token!, { outletId: outletId ?? undefined, categoryId: catFilter || undefined, search: search || undefined, page, limit }),
    enabled: Boolean(token)
  });

  const { data: allCats } = useQuery({
    queryKey: ["all-categories"],
    queryFn: () => categoryService.getCategories(token, { flat: "true", limit: 200 }),
    enabled: Boolean(token),
  });

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);


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

  const products: Product[] = prodData?.data ?? [];
  const pagination = prodData?.meta?.pagination ?? { page: 1, limit, total: products.length, totalPages: 1 };
  const categories = Array.isArray(catData)
    ? catData
    : ((catData as { categories?: Category[] } | undefined)?.categories ?? []);

  const loadCategoryFilterOptions = React.useCallback(
    async (params: { page: number; limit: number; q?: string }) => {
      const res = await loadCategories(token, params);
      if (params.page === 1 && !params.q) {
        return {
          ...res,
          data: [{ id: "", _id: "", name: "All Categories", label: "All Categories" }, ...res.data]
        };
      }
      return res;
    },
    [token]
  );

  const selectedCatFilter = React.useMemo(() => {
    if (!catFilter) return { id: "", name: "All Categories", label: "All Categories" };
    const cat = categories.find((c) => c._id === catFilter);
    const label = cat ? `${cat.icon ? `${cat.icon} ` : ""}${cat.name}` : "Category";
    return { id: catFilter, name: label, label };
  }, [catFilter, categories]);

  const loadCategoryFormOptions = React.useCallback(
    (params: { page: number; limit: number; q?: string }) => loadCategories(token, params),
    [token]
  );

  const loadUnitOptions = React.useCallback(
    (params: { page: number; limit: number; q?: string }) => loadUnits(token, outletId, params),
    [token, outletId]
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
    if (!opt) return setForm((f) => ({ ...f, unit: "", unitId: "" }));
    const o = Array.isArray(opt) ? opt[0] : opt;
    if (String(o.id).startsWith("new_")) {
      const name = (o.name ?? o.label ?? "").trim();
      if (!name) return;
      try {
        const resolved = await resolveUnitSelection(o);
        if (resolved) {
          setForm((f) => ({ ...f, unit: resolved.unitName, unitId: resolved.unitId }));
          return;
        }
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to create unit"));
      }
      setForm((f) => ({ ...f, unit: name, unitId: "" }));
      return;
    }
    setForm((f) => ({
      ...f,
      unit: o.abbreviation ?? o.name ?? o.label ?? "",
      unitId: o.id ?? o._id ?? ""
    }));
  };

  const selectedFormCategory = React.useMemo(() => {
    if (!form.categoryId) return null;
    const cat = categories.find((c) => c._id === form.categoryId);
    if (cat) {
      const label = `${cat.icon ? `${cat.icon} ` : ""}${cat.name}`;
      return { id: cat._id, name: label, label };
    }
    if (editId) {
      const product = products.find((p) => p._id === editId);
      const pc = product?.categoryId;
      if (typeof pc === "object" && pc && pc._id === form.categoryId) {
        const label = `${pc.icon ? `${pc.icon} ` : ""}${pc.name}`;
        return { id: pc._id, name: label, label };
      }
    }
    return { id: form.categoryId, name: "Category", label: "Category" };
  }, [form.categoryId, categories, editId, products]);

  const openCreate = () => {
    setEditId(null);
    setPackagingUnits([]);
    setForm({ name: "", description: "", sku: "", barcode: "", unit: "pcs", unitId: "", price: "", costPrice: "", categoryId: "", taxRate: "0", gstRate: "0", hsnCode: "", onHandQty: "0", lowStockThreshold: "10", sortOrder: "0" });
    setShowModal(true);
  };
  const openEdit = (p: Product) => {
    setEditId(p._id);
    setPackagingUnits(
      (p.packagingUnits ?? []).map((pkg) => ({
        unitId: typeof pkg.unitId === "object" ? pkg.unitId._id : pkg.unitId,
        unitName: typeof pkg.unitId === "object" ? (pkg.unitId.abbreviation || pkg.unitId.name) : "",
        qtyPerUnit: String(pkg.qtyPerUnit),
        price: pkg.price != null ? String(pkg.price) : "",
        costPrice: pkg.costPrice != null ? String(pkg.costPrice) : ""
      }))
    );
    setForm({
      name: p.name,
      description: p.description ?? "",
      sku: p.sku ?? "",
      barcode: p.barcode ?? "",
      unit: (p as any).unitId?.abbreviation ?? p.unit,
      unitId: (p as any).unitId?._id ?? "",
      price: String(p.price),
      costPrice: String(p.costPrice ?? 0),
      categoryId: typeof p.categoryId === "object" ? p.categoryId?._id ?? "" : p.categoryId ?? "",
      taxRate: String(p.taxRate),
      gstRate: String(p.gstRate),
      hsnCode: p.hsnCode ?? "",
      onHandQty: String(p.onHandQty),
      lowStockThreshold: String(p.lowStockThreshold),
      sortOrder: String(p.sortOrder)
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, unknown> = {
      ...form,
      outletId,
      price: Number(form.price),
      costPrice: Number(form.costPrice),
      taxRate: Number(form.taxRate),
      gstRate: Number(form.gstRate),
      onHandQty: Number(form.onHandQty),
      lowStockThreshold: Number(form.lowStockThreshold),
      sortOrder: Number(form.sortOrder),
      categoryId: form.categoryId || undefined,
      hsnCode: form.hsnCode || undefined
    };
    if (hasPackaging && packagingUnits.length) {
      const validUnits = packagingUnits.filter((p) => p.unitId && p.qtyPerUnit);
      
      // Validation: Packaging unit cannot be the same as the base product unit
      if (validUnits.some(p => p.unitId === form.unitId)) {
        toast.error("Packaging unit cannot be the same as the base unit. Please type a new unit name like 'Crate' or 'Box'.");
        return;
      }
      
      // Validation: Packaging units must be unique
      const uniqueUnitIds = new Set(validUnits.map(p => p.unitId));
      if (uniqueUnitIds.size !== validUnits.length) {
        toast.error("Each packaging unit must have a unique unit name.");
        return;
      }

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
        <div><h1 className="text-2xl font-bold">Products</h1><p className="text-sm text-muted">{pagination.total} products</p></div>
        <div className="flex gap-2">
          <Button id="create-product-btn" onClick={openCreate}><Plus className="h-4 w-4" /> Add Product</Button>
        </div>
      </div>

      <DataTable
        isLoading={isLoading}
        error={isError}
        errorMessage={error ? getErrorMessage(error) : undefined}
        data={products}
        keyExtractor={(p) => p._id}
        emptyStateText="No products yet. Add your first product."
        totalItems={pagination.total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        searchQuery={search}
        onSearchChange={setSearch}
        onRefetch={() => refetchProducts()}
        filters={
          <AsyncSelect
            className="sm:w-56 min-w-[200px]"
            value={selectedCatFilter}
            onChange={(opt) => {
              const o = Array.isArray(opt) ? opt[0] : opt;
              setCatFilter(o?.id ?? o?._id ?? "");
              setPage(1);
            }}
            loadOptions={loadCategoryFilterOptions}
            placeholder="All Categories"
            searchable
            pageSize={25}
          />
        }
        columns={[
          { key: "name", header: "Product", render: (p) => (<div className="flex items-center gap-4 py-2">{p.image && <img src={p.image} className="h-14 w-14 rounded-lg object-cover flex-shrink-0" />}{/* No placeholder icon */}<div className="flex-1 min-w-0"><p className="font-semibold text-base">{p.name}</p>{p.sku && <p className="text-xs text-muted mt-1">SKU: {p.sku}</p>}</div></div>) },
          { key: "category", header: "Category", render: (p) => typeof p.categoryId === "object" && p.categoryId ? <span className="text-sm font-medium">{p.categoryId.icon} {p.categoryId.name}</span> : <span className="text-xs text-muted">—</span> },
          { key: "price", header: "Price", render: (p) => <span className="font-bold text-lg">{formatCurrency(p.price)}</span> },
          { key: "onHandQty", header: "Stock", render: (p) => (<div><p className={p.onHandQty <= p.lowStockThreshold ? "font-bold text-danger text-base" : "font-bold text-base"}>{p.onHandQty} {(p as any).unitId?.abbreviation ?? p.unit}</p>{p.onHandQty <= p.lowStockThreshold && <Badge variant="warning" className="text-[10px] mt-1">Low Stock</Badge>}</div>) },
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
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-3"><label className="mb-1 block text-xs font-medium text-muted">Product Name *</label><Input id="product-name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Mango Lassi" /></div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Category</label>
              <AsyncSelect
                value={selectedFormCategory}
                onChange={(opt) => {
                  if (!opt) return setForm((f) => ({ ...f, categoryId: "" }));
                  const o = Array.isArray(opt) ? opt[0] : opt;
                  setForm((f) => ({ ...f, categoryId: o.id ?? o._id ?? "" }));
                }}
                loadOptions={loadCategoryFormOptions}
                placeholder="Select category"
                searchable
                pageSize={25}
              />
            </div>
            <div><label className="mb-1 block text-xs font-medium text-muted">Unit</label>
              <AsyncSelect
                value={form.unitId ? { id: form.unitId, name: form.unit, label: form.unit } : null}
                onChange={handleUnitChange}
                loadOptions={loadUnitOptions}
                placeholder="Select unit"
                searchable
                pageSize={25}
                creatable
              />
            </div>
            <div><label className="mb-1 block text-xs font-medium text-muted">Selling Price (₹) *</label><Input id="product-price" required type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="0.00" /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted">Cost Price (₹)</label><Input id="product-cost" type="number" min={0} value={form.costPrice} onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))} placeholder="0.00" /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted">Opening Stock</label><Input id="product-qty" type="number" min={0} value={form.onHandQty} onChange={(e) => setForm((f) => ({ ...f, onHandQty: e.target.value }))} /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted">Low Stock Alert</label><Input id="product-threshold" type="number" min={0} value={form.lowStockThreshold} onChange={(e) => setForm((f) => ({ ...f, lowStockThreshold: e.target.value }))} /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted">SKU</label><Input id="product-sku" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} placeholder="Optional" /></div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Barcode</label>
              <div className="relative">
                <Input id="product-barcode" value={form.barcode} onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))} placeholder="Scan or type" className="pr-10" />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted z-10" onPointerDown={(e) => { e.preventDefault(); setShowScanner(true); }} onClick={(e) => { e.preventDefault(); setShowScanner(true); }}>
                  <span className="text-lg">📷</span>
                </Button>
              </div>
            </div>
            <div><label className="mb-1 block text-xs font-medium text-muted">GST Rate (%)</label><Input id="product-gst" type="number" min={0} max={100} value={form.gstRate} onChange={(e) => setForm((f) => ({ ...f, gstRate: e.target.value }))} /></div>
            {hasPackaging && (
              <div className="md:col-span-3 space-y-2 rounded-xl border border-border/60 p-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted uppercase tracking-wide">Packaging Units (Peti/Crate)</label>
                  <Button type="button" variant="soft" size="sm" onClick={() => setPackagingUnits((rows) => [...rows, { unitId: "", unitName: "", qtyPerUnit: "", price: "", costPrice: "" }])}>
                    + Add
                  </Button>
                </div>
                {packagingUnits.length === 0 && (
                  <p className="text-xs text-muted">Optional — bulk units with qty per peti/crate, selling price, and cost price for margin tracking.</p>
                )}
                {packagingUnits.length > 0 && (
                  <div className="hidden sm:grid sm:grid-cols-[1.4fr_0.8fr_1fr_1fr_2.5rem] gap-2 px-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                    <span>Unit</span>
                    <span>Qty / unit</span>
                    <span>Sell price (₹)</span>
                    <span>Cost price (₹)</span>
                    <span />
                  </div>
                )}
                {packagingUnits.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1.4fr_0.8fr_1fr_1fr_2.5rem] gap-2 items-end">
                    <div>
                      {packagingUnits.length > 0 && (
                        <label className="mb-1 block text-[10px] font-medium text-muted sm:hidden">Unit</label>
                      )}
                      <AsyncSelect
                        value={row.unitId ? { id: row.unitId, name: row.unitName } : null}
                        onChange={async (opt) => {
                          const o = Array.isArray(opt) ? opt[0] : opt as any;
                          if (!o) return;
                          try {
                            const resolved = String(o.id).startsWith("new_")
                              ? await resolveUnitSelection(o)
                              : { unitId: o.id ?? o._id, unitName: o.name ?? o.label };
                            if (!resolved?.unitId) return;
                            setPackagingUnits((rows) =>
                              rows.map((r, i) => (i === idx ? { ...r, unitId: resolved.unitId, unitName: resolved.unitName } : r))
                            );
                          } catch (err) {
                            toast.error(getErrorMessage(err, "Failed to create unit"));
                          }
                        }}
                        loadOptions={loadUnitOptions}
                        placeholder="Package name (e.g. Crate)"
                        searchable
                        pageSize={25}
                        creatable
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-medium text-muted sm:hidden">Qty / unit</label>
                      <Input type="number" min={1} placeholder="Qty/unit" value={row.qtyPerUnit} onChange={(e) => setPackagingUnits((rows) => rows.map((r, i) => i === idx ? { ...r, qtyPerUnit: e.target.value } : r))} />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-medium text-muted sm:hidden">Sell price (₹)</label>
                      <Input type="number" min={0} step="0.01" placeholder="Sell ₹" value={row.price} onChange={(e) => setPackagingUnits((rows) => rows.map((r, i) => i === idx ? { ...r, price: e.target.value } : r))} />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-medium text-muted sm:hidden">Cost price (₹)</label>
                      <Input type="number" min={0} step="0.01" placeholder="Cost ₹" value={row.costPrice} onChange={(e) => setPackagingUnits((rows) => rows.map((r, i) => i === idx ? { ...r, costPrice: e.target.value } : r))} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="text-danger shrink-0" onClick={() => setPackagingUnits((rows) => rows.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            )}
            {showHsn && (
              <div><label className="mb-1 block text-xs font-medium text-muted">HSN Code</label><Input value={form.hsnCode} onChange={(e) => setForm((f) => ({ ...f, hsnCode: e.target.value }))} placeholder="e.g. 2202" /></div>
            )}
          </div>
          <div className="sticky bottom-0 -mx-5 flex justify-end gap-3 border-t border-border/60 bg-surface px-5 py-4 sm:-mx-6 sm:px-6">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving..." : (editId ? "Save Changes" : "Add Product")}</Button>
          </div>
        </form>
        <BarcodeScanner open={showScanner} onClose={() => setShowScanner(false)} onScan={(text) => setForm((f) => ({ ...f, barcode: text }))} continuous={true} />
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && remove.mutate(deleteId)} title="Delete Product?" message="This product will be hidden from billing." confirmLabel="Delete" loading={remove.isPending} />
    </div>
  );
}
