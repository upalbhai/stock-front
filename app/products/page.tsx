"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/components/auth/auth-provider";
import { getJson, apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import type { Product, Category, Outlet } from "@/lib/types";

const UNIT_OPTIONS = ["pcs","kg","liter","packet","dozen","box","bottle","gm"].map((u) => ({ value: u, label: u }));

export default function ProductsPage() {
  const { token, outletId } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [catFilter, setCatFilter] = React.useState("");
  const [showModal, setShowModal] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ name: "", description: "", sku: "", unit: "pcs", price: "", costPrice: "", categoryId: "", taxRate: "0", gstRate: "0", onHandQty: "0", lowStockThreshold: "10", sortOrder: "0" });

  const { data: prodData, isLoading } = useQuery({
    queryKey: ["products", outletId, catFilter, search],
    queryFn: () => getJson<{ products: Product[] }>("/products", token, { outletId: outletId ?? undefined, categoryId: catFilter || undefined, search: search || undefined }),
    enabled: Boolean(token)
  });
  const { data: catData } = useQuery({
    queryKey: ["categories", outletId],
    queryFn: () => getJson<{ categories: Category[] }>("/categories", token, { flat: "true" }),
    enabled: Boolean(token)
  });

  const save = useMutation({
    mutationFn: (body: unknown) => editId
      ? apiFetch(`/products/${editId}`, { method: "PATCH", body, token })
      : apiFetch("/products", { method: "POST", body, token }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setShowModal(false); setEditId(null); }
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/products/${id}`, { method: "DELETE", token }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setDeleteId(null); }
  });

  const products = prodData?.products ?? [];
  const categories = catData?.categories ?? [];

  const openCreate = () => { setEditId(null); setForm({ name: "", description: "", sku: "", unit: "pcs", price: "", costPrice: "", categoryId: "", taxRate: "0", gstRate: "0", onHandQty: "0", lowStockThreshold: "10", sortOrder: "0" }); setShowModal(true); };
  const openEdit = (p: Product) => {
    setEditId(p._id);
    setForm({ name: p.name, description: p.description ?? "", sku: p.sku ?? "", unit: p.unit, price: String(p.price), costPrice: String(p.costPrice ?? 0), categoryId: typeof p.categoryId === "object" ? p.categoryId?._id ?? "" : p.categoryId ?? "", taxRate: String(p.taxRate), gstRate: String(p.gstRate), onHandQty: String(p.onHandQty), lowStockThreshold: String(p.lowStockThreshold), sortOrder: String(p.sortOrder) });
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
        <Button id="create-product-btn" onClick={openCreate}><Plus className="h-4 w-4" /> Add Product</Button>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><Input className="pl-9" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <Select value={catFilter} onValueChange={setCatFilter} options={catOptions} className="w-48" placeholder="Category" />
      </div>

      <DataTable loading={isLoading} data={products} keyExtractor={(p) => p._id} emptyMessage="No products yet. Add your first product."
        columns={[
          { key: "name", header: "Product", render: (p) => (<div className="flex items-center gap-3">{p.image ? <img src={p.image} className="h-10 w-10 rounded-xl object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Package className="h-5 w-5" /></div>}<div><p className="font-medium">{p.name}</p>{p.sku && <p className="text-xs text-muted">SKU: {p.sku}</p>}</div></div>) },
          { key: "category", header: "Category", render: (p) => typeof p.categoryId === "object" && p.categoryId ? <span className="text-sm">{p.categoryId.icon} {p.categoryId.name}</span> : <span className="text-xs text-muted">—</span> },
          { key: "price", header: "Price", render: (p) => <span className="font-semibold">{formatCurrency(p.price)}</span> },
          { key: "onHandQty", header: "Stock", render: (p) => (<div><p className={p.onHandQty <= p.lowStockThreshold ? "font-semibold text-danger" : "font-semibold"}>{p.onHandQty} {p.unit}</p>{p.onHandQty <= p.lowStockThreshold && <Badge variant="warning" className="text-[10px]">Low</Badge>}</div>) },
          { key: "isActive", header: "Status", render: (p) => <Badge variant={p.isActive ? "soft" : "danger"}>{p.isActive ? "Active" : "Inactive"}</Badge> },
          { key: "actions", header: "", render: (p) => (<div className="flex gap-2"><Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="text-danger" onClick={() => setDeleteId(p._id)}><Trash2 className="h-3.5 w-3.5" /></Button></div>) }
        ]} />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? "Edit Product" : "Add Product"} size="lg">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="mb-1 block text-xs font-medium text-muted">Product Name *</label><Input id="product-name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Mango Lassi" /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted">Category</label><Select id="product-cat" value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))} options={catOptions} /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted">Unit</label><Select id="product-unit" value={form.unit} onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))} options={UNIT_OPTIONS} /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted">Selling Price (₹) *</label><Input id="product-price" required type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="0.00" /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted">Cost Price (₹)</label><Input id="product-cost" type="number" min={0} value={form.costPrice} onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))} placeholder="0.00" /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted">Opening Stock</label><Input id="product-qty" type="number" min={0} value={form.onHandQty} onChange={(e) => setForm((f) => ({ ...f, onHandQty: e.target.value }))} /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted">Low Stock Alert</label><Input id="product-threshold" type="number" min={0} value={form.lowStockThreshold} onChange={(e) => setForm((f) => ({ ...f, lowStockThreshold: e.target.value }))} /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted">SKU</label><Input id="product-sku" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} placeholder="Optional" /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted">GST Rate (%)</label><Input id="product-gst" type="number" min={0} max={100} value={form.gstRate} onChange={(e) => setForm((f) => ({ ...f, gstRate: e.target.value }))} /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={save.isPending}>{save.isPending ? "Saving..." : (editId ? "Save Changes" : "Add Product")}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && remove.mutate(deleteId)} title="Delete Product?" message="This product will be hidden from billing." confirmLabel="Delete" loading={remove.isPending} />
    </div>
  );
}
