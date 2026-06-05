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
import { Select } from "@/components/ui/select";
import AsyncSelect from "@/components/ui/async-select";
import { DataTable } from "@/components/ui/data-table";
import { BarcodeScanner } from "@/components/ui/barcode-scanner";
import { useAuth } from "@/components/auth/auth-provider";
import { getJson, apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import type { Product, Category, Outlet } from "@/lib/types";
import { getErrorMessage } from "@/lib/error";
import { productService } from "@/services/product.service";
import Pagination from "@/components/ui/pagination";

const UNIT_OPTIONS = ["pcs","kg","liter","packet","dozen","box","bottle","gm"].map((u) => ({ value: u, label: u }));

async function loadUnits({ page, limit, q }: { page: number; limit: number; q?: string }) {
  const params = new URLSearchParams();
  params.set("flat", "true");
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (q) params.set("q", q);
  const res = await fetch(`/api/units?${params.toString()}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load units");
  return res.json();
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
  const [isRefetching, setIsRefetching] = React.useState(false);
  const [cooldownSeconds, setCooldownSeconds] = React.useState(0);
  const [form, setForm] = React.useState({ name: "", description: "", sku: "", barcode: "", unit: "pcs", unitId: "", price: "", costPrice: "", categoryId: "", taxRate: "0", gstRate: "0", onHandQty: "0", lowStockThreshold: "10", sortOrder: "0" });
  const { ref, inView } = useInView();

  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(50);

  const { data: prodData, isLoading, isError, error, refetch: refetchProducts } = useQuery({
    queryKey: ["products", outletId, catFilter, search, page, limit],
    queryFn: () => getJson<any>("/products", token, { outletId: outletId ?? undefined, categoryId: catFilter || undefined, search: search || undefined, page, limit }),
    enabled: Boolean(token)
  });

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleRefetch = () => {
    setIsRefetching(true);
    setCooldownSeconds(15);
    refetchProducts();
    
    let seconds = 15;
    timeoutRef.current = setInterval(() => {
      seconds -= 1;
      setCooldownSeconds(seconds);
      if (seconds === 0) {
        setIsRefetching(false);
        if (timeoutRef.current) clearInterval(timeoutRef.current);
      }
    }, 1000);
  };

  const { data: catData } = useQuery({
    queryKey: ["categories", outletId],
    queryFn: () => getJson<{ categories: Category[] }>("/categories", token, { flat: "true" }),
    enabled: Boolean(token)
  });

  const save = useMutation({
    mutationFn: (body: unknown) => editId
      ? apiFetch(`/products/${editId}`, { method: "PATCH", body, token })
      : apiFetch("/products", { method: "POST", body, token }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setShowModal(false); setEditId(null); toast.success(editId ? "Product updated" : "Product created"); },
    onError: (err) => { toast.error(getErrorMessage(err, "Failed to save product")); }
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/products/${id}`, { method: "DELETE", token }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setDeleteId(null); toast.success("Product deleted"); },
    onError: (err) => { toast.error(getErrorMessage(err, "Failed to delete product")); }
  });

  // normalize response which may use `data` or `products` + extract pagination
  const raw = prodData as any;
  const products: Product[] = (raw && (raw.products ?? raw.data)) ?? [];
  const pagination = raw?.meta?.pagination ?? raw?.meta ?? { page: 1, limit, total: products.length, totalPages: 1 };
  const categories = catData?.categories ?? [];

  const openCreate = () => { setEditId(null); setForm({ name: "", description: "", sku: "", barcode: "", unit: "pcs", unitId: "", price: "", costPrice: "", categoryId: "", taxRate: "0", gstRate: "0", onHandQty: "0", lowStockThreshold: "10", sortOrder: "0" }); setShowModal(true); };
  const openEdit = (p: Product) => {
    setEditId(p._id);
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
      onHandQty: String(p.onHandQty),
      lowStockThreshold: String(p.lowStockThreshold),
      sortOrder: String(p.sortOrder)
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate({ ...form, outletId, price: Number(form.price), costPrice: Number(form.costPrice), taxRate: Number(form.taxRate), gstRate: Number(form.gstRate), onHandQty: Number(form.onHandQty), lowStockThreshold: Number(form.lowStockThreshold), sortOrder: Number(form.sortOrder), categoryId: form.categoryId || undefined });
  };

  const catOptions = [{ value: "", label: "All Categories" }, ...categories.map((c) => ({ value: c._id, label: `${c.icon} ${c.name}` }))];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Products</h1><p className="text-sm text-muted">{products.length} products</p></div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefetch} disabled={isRefetching} id="refetch-products-btn">
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            {isRefetching ? `Refetch (${cooldownSeconds}s)` : "Refetch"}
          </Button>
          <Button id="create-product-btn" onClick={openCreate}><Plus className="h-4 w-4" /> Add Product</Button>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted/60" /><Input className="pl-10 py-3 text-base" placeholder="Search products by name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <Select value={catFilter} onValueChange={setCatFilter} options={catOptions} className="sm:w-56" placeholder="Filter by Category" />
      </div>

      <DataTable loading={isLoading} error={isError} errorMessage={error ? getErrorMessage(error) : undefined} data={products} keyExtractor={(p) => p._id} emptyMessage="No products yet. Add your first product."
        columns={[
          { key: "name", header: "Product", render: (p) => (<div className="flex items-center gap-4 py-2">{p.image ? <img src={p.image} className="h-14 w-14 rounded-lg object-cover flex-shrink-0" /> : <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0"><Package className="h-6 w-6" /></div>}<div className="flex-1 min-w-0"><p className="font-semibold text-base">{p.name}</p>{p.sku && <p className="text-xs text-muted mt-1">SKU: {p.sku}</p>}</div></div>) },
          { key: "category", header: "Category", render: (p) => typeof p.categoryId === "object" && p.categoryId ? <span className="text-sm font-medium">{p.categoryId.icon} {p.categoryId.name}</span> : <span className="text-xs text-muted">—</span> },
          { key: "price", header: "Price", render: (p) => <span className="font-bold text-lg">{formatCurrency(p.price)}</span> },
          { key: "onHandQty", header: "Stock", render: (p) => (<div><p className={p.onHandQty <= p.lowStockThreshold ? "font-bold text-danger text-base" : "font-bold text-base"}>{p.onHandQty} {(p as any).unitId?.abbreviation ?? p.unit}</p>{p.onHandQty <= p.lowStockThreshold && <Badge variant="warning" className="text-[10px] mt-1">Low Stock</Badge>}</div>) },
          { key: "isActive", header: "Status", render: (p) => <Badge variant={p.isActive ? "soft" : "danger"}>{p.isActive ? "Active" : "Inactive"}</Badge> },
          { key: "actions", header: "", render: (p) => (<div className="flex gap-2"><Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-danger" onClick={() => setDeleteId(p._id)}><Trash2 className="h-4 w-4" /></Button></div>) }
        ]} />

      <div className="flex justify-center p-4">
        {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted" /> : (
          <Pagination page={page} totalPages={pagination.totalPages} pageSize={limit} onPageChange={(p) => setPage(p)} onPageSizeChange={(s) => { setLimit(s); setPage(1); }} />
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? "Edit Product" : "Add Product"} size="lg">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="mb-1 block text-xs font-medium text-muted">Product Name *</label><Input id="product-name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Mango Lassi" /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted">Category</label><Select id="product-cat" value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))} options={catOptions} /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted">Unit</label>
              <AsyncSelect
                value={form.unitId ? { id: form.unitId, name: form.unit } : (form.unit ? { id: `new_${form.unit}`, name: form.unit } : null)}
                onChange={(opt) => {
                  if (!opt) return setForm((f) => ({ ...f, unit: "", unitId: "" }));
                  const o = Array.isArray(opt) ? opt[0] : opt as any;
                  // If created new option (id starts with new_), treat as plain string
                  if (String(o.id).startsWith("new_")) {
                    setForm((f) => ({ ...f, unit: o.name ?? o.label ?? String(o), unitId: "" }));
                  } else {
                    setForm((f) => ({ ...f, unit: o.name ?? o.label ?? String(o), unitId: o.id ?? o._id }));
                  }
                }}
                loadOptions={loadUnits}
                placeholder="Unit"
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
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted" onClick={() => setShowScanner(true)}>
                  <span className="text-lg">📷</span>
                </Button>
              </div>
            </div>
            <div><label className="mb-1 block text-xs font-medium text-muted">GST Rate (%)</label><Input id="product-gst" type="number" min={0} max={100} value={form.gstRate} onChange={(e) => setForm((f) => ({ ...f, gstRate: e.target.value }))} /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={save.isPending}>{save.isPending ? "Saving..." : (editId ? "Save Changes" : "Add Product")}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && remove.mutate(deleteId)} title="Delete Product?" message="This product will be hidden from billing." confirmLabel="Delete" loading={remove.isPending} />
      <BarcodeScanner open={showScanner} onClose={() => setShowScanner(false)} onScan={(text) => setForm((f) => ({ ...f, barcode: text }))} />
    </div>
  );
}
