"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, FolderOpen, RefreshCw, Award } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { brandService } from "@/services/brand.service";
import { getErrorMessage } from "@/lib/error";
import { DataTable } from "@/components/ui/data-table";
import type { Brand } from "@/lib/types";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";

export default function BrandsPage() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  
  const [query, setQuery] = useQueryStates({
    search: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(50)
  });

  const [form, setForm] = React.useState({ name: "", isActive: true });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["brands", query.page, query.limit, query.search],
    queryFn: () => brandService.getBrandsWithMeta(token, { page: query.page, limit: query.limit, search: query.search }),
    enabled: Boolean(token),
  });

  const saveMutation = useMutation({
    mutationFn: (body: Partial<Brand>) => {
      if (editId) {
        return brandService.updateBrand(editId, body, token!);
      }
      return brandService.createBrand(body, token!);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brands"] });
      setShowModal(false);
      setEditId(null);
      toast.success(editId ? "Brand updated" : "Brand created");
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, "Failed to save brand"));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => brandService.deleteBrand(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brands"] });
      setDeleteId(null);
      toast.success("Brand deleted");
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, "Failed to delete brand"));
    }
  });

  const allBrands = data?.data ?? [];
  const pagination = data?.meta?.pagination ?? { page: 1, limit: query.limit, total: allBrands.length, totalPages: 1 };

  const openCreate = () => {
    setEditId(null);
    setForm({ name: "", isActive: true });
    setShowModal(true);
  };
  
  const openEdit = (brand: Brand) => {
    setEditId(brand._id);
    setForm({ name: brand.name, isActive: brand.isActive ?? true });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Brands</h1><p className="text-sm text-muted">Manage product brands and manufacturers</p></div>
        <div className="flex gap-2">
          <Button id="create-brand-btn" onClick={() => openCreate()}><Plus className="h-4 w-4 mr-1.5" /> Add Brand</Button>
        </div>
      </div>

      <DataTable
        isLoading={isLoading}
        data={allBrands}
        keyExtractor={(b) => b._id}
        totalItems={pagination.total}
        page={query.page}
        limit={query.limit}
        onPageChange={(p) => setQuery({ page: p })}
        onLimitChange={(l) => setQuery({ limit: l, page: 1 })}
        searchQuery={query.search}
        onSearchChange={(s) => setQuery({ search: s, page: 1 })}
        onRefetch={() => refetch()}
        emptyStateIcon={<Award className="h-12 w-12 text-muted/30" />}
        emptyStateText="No brands yet. Create your first brand like 'Amul', 'Havmor'."
        columns={[
          {
            key: "brand",
            header: "Brand Name",
            render: (brand: Brand) => (
              <div className="flex items-center gap-3">
                <h2 className="font-semibold">{brand.name}</h2>
              </div>
            )
          },
          {
            key: "status",
            header: "Status",
            render: (brand: Brand) => (
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${brand.isActive ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                {brand.isActive ? "Active" : "Inactive"}
              </span>
            )
          },
          {
            key: "actions",
            header: "",
            className: "text-right",
            render: (brand: Brand) => (
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(brand); }} id={`edit-brand-${brand._id}`}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="sm" className="text-danger" onClick={(e) => { e.stopPropagation(); setDeleteId(brand._id); }} id={`delete-brand-${brand._id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            )
          }
        ]}
      />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? "Edit Brand" : "Create Brand"} size="md">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}>
          <div><label className="mb-1 block text-xs font-medium text-muted">Brand Name *</label><Input id="brand-name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Amul, Havmor" /></div>
          
          <div className="flex items-center gap-2 pt-2">
             <input type="checkbox" id="brand-active" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
             <label htmlFor="brand-active" className="text-sm font-medium text-foreground">Active</label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : (editId ? "Save" : "Create")}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Brand?" message="Products with this brand will lose their brand assignment." confirmLabel="Delete" loading={deleteMutation.isPending} />
    </div>
  );
}
