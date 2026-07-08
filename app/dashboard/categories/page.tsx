"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ChevronRight, FolderOpen, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/components/auth/auth-provider";
import { categoryService } from "@/services/category.service";
import { getErrorMessage } from "@/lib/error";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";
import type { Category } from "@/lib/types";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";

const EMOJI_OPTIONS = ["🍽️","🥤","🧃","☕","🍵","🥛","🧁","🍰","🍕","🥗","🌮","🍜","🥚","🥗","🫙","🍱","🍦","🧊","🍹","🍺"];
const COLOR_OPTIONS = ["#6366f1","#f59e0b","#10b981","#ef4444","#8b5cf6","#06b6d4","#f97316","#84cc16","#ec4899","#14b8a6"];

export default function CategoriesPage() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [showModal, setShowModal] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [isRefetching, setIsRefetching] = React.useState(false);
  const [cooldownSeconds, setCooldownSeconds] = React.useState(0);
  
  const [query, setQuery] = useQueryStates({
    search: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(50)
  });

  const [form, setForm] = React.useState({ name: "", parentId: "", icon: "🍽️", color: "#6366f1", description: "", sortOrder: "0" });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["categories", query.page, query.limit, query.search],
    queryFn: () => categoryService.getCategoriesWithMeta(token, { flat: "true", page: query.page, limit: query.limit, search: query.search }),
    enabled: Boolean(token),
  });

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);


  const saveMutation = useMutation({
    mutationFn: (body: unknown) => {
      if (editId) {
        return categoryService.updateCategory(editId, body, token);
      }
      return categoryService.createCategory(body, token);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      setShowModal(false);
      setEditId(null);
      toast.success(editId ? "Category updated" : "Category created");
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, "Failed to save category"));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryService.deleteCategory(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      setDeleteId(null);
      toast.success("Category deleted");
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, "Failed to delete category"));
    }
  });

  const allCategories = data?.data ?? [];
  const topLevel = allCategories.filter((c) => !c.parentId || c.parentId === c._id);
  const pagination = data?.meta?.pagination ?? { page: 1, limit: query.limit, total: allCategories.length, totalPages: 1 };

  const openCreate = (parentId = "") => {
    setEditId(null);
    setForm({ name: "", parentId, icon: "🍽️", color: "#6366f1", description: "", sortOrder: "0" });
    setShowModal(true);
  };
  const openEdit = (cat: Category) => {
    setEditId(cat._id);
    setForm({ name: cat.name, parentId: cat.parentId ?? "", icon: cat.icon, color: cat.color, description: "", sortOrder: String(cat.sortOrder) });
    setShowModal(true);
  };

  const topLevelOptions = [{ value: "", label: "— Top Level —" }, ...topLevel.map((c) => ({ value: c._id, label: `${c.icon} ${c.name}` }))];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Categories</h1><p className="text-sm text-muted">Organize products into categories and subcategories</p></div>
      </div>

      <DataTable
        isLoading={isLoading}
        data={topLevel}
        keyExtractor={(c) => c._id}
        totalItems={pagination.total}
        page={query.page}
        limit={query.limit}
        onPageChange={(p) => setQuery({ page: p })}
        onLimitChange={(l) => setQuery({ limit: l, page: 1 })}
        searchQuery={query.search}
        onSearchChange={(s) => setQuery({ search: s, page: 1 })}
        onRefetch={() => refetch()}
        filters={<Button id="create-category-btn" onClick={() => openCreate("")}><Plus className="h-4 w-4 mr-1.5" /> Add Category</Button>}
        emptyStateIcon={<FolderOpen className="h-12 w-12 text-muted/30" />}
        emptyStateText="No categories yet. Create your first category like 'Lassi', 'Tea'."
        expandable
        columns={[
          {
            key: "category",
            header: "Category",
            render: (cat: Category) => (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: cat.color + "20", color: cat.color }}>
                  {cat.icon}
                </div>
                <h2 className="font-semibold">{cat.name}</h2>
              </div>
            )
          },
          {
            key: "subcategories",
            header: "Subcategories",
            render: (cat: Category) => {
              const children = allCategories.filter((c) => c.parentId === cat._id && c._id !== cat._id);
              return <span className="text-xs text-muted font-medium">{children.length} subcategory{children.length !== 1 ? "ies" : ""}</span>;
            }
          },
          {
            key: "actions",
            header: "",
            className: "text-right",
            render: (cat: Category) => (
              <div className="flex gap-2 justify-end">
                <Button variant="soft" size="sm" onClick={(e) => { e.stopPropagation(); openCreate(cat._id); }} id={`add-sub-${cat._id}`}><Plus className="h-3.5 w-3.5" /> Sub</Button>
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(cat); }} id={`edit-cat-${cat._id}`}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="sm" className="text-danger" onClick={(e) => { e.stopPropagation(); setDeleteId(cat._id); }} id={`delete-cat-${cat._id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            )
          }
        ]}
        renderSubComponent={(cat: Category) => {
          const children = allCategories.filter((c) => c.parentId === cat._id && c._id !== cat._id);
          if (children.length === 0) return null;
          
          return (
            <div className="pl-14 p-4 border-l-[3px] ml-[1.125rem]" style={{ borderColor: cat.color }}>
              <DataTable
                data={children}
                keyExtractor={(c) => c._id}
                hidePagination
                emptyStateText="No subcategories."
                columns={[
                  {
                    key: "subcategory",
                    header: "Subcategory",
                    render: (sub: Category) => (
                       <div className="flex items-center gap-3">
                         <span className="text-xl">{sub.icon}</span>
                         <span className="font-medium text-sm">{sub.name}</span>
                       </div>
                    )
                  },
                  {
                    key: "actions",
                    header: "",
                    className: "text-right",
                    render: (sub: Category) => (
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted hover:text-foreground" onClick={() => openEdit(sub)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-danger/60 hover:text-danger" onClick={() => setDeleteId(sub._id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    )
                  }
                ]}
              />
            </div>
          );
        }}
      />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? "Edit Category" : "Create Category"} size="md">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate({ ...form, parentId: form.parentId || null, sortOrder: Number(form.sortOrder) }); }}>
          <div><label className="mb-1 block text-xs font-medium text-muted">Category Name *</label><Input id="cat-name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Lassi, Tea, Juice" /></div>
          <div><label className="mb-1 block text-xs font-medium text-muted">Parent Category</label><Select id="cat-parent" value={form.parentId} onValueChange={(v) => setForm((f) => ({ ...f, parentId: v }))} options={topLevelOptions} /></div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Icon (Emoji)</label>
            <div className="flex flex-wrap gap-2 mt-1 mb-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button key={emoji} type="button" onClick={() => setForm((f) => ({ ...f, icon: emoji }))}
                  className={cn("flex h-10 w-10 items-center justify-center rounded-2xl text-xl transition border", form.icon === emoji ? "border-primary bg-primary/10" : "border-border hover:border-primary/50")}>
                  {emoji}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 max-w-[200px] mt-2">
              <span className="text-xs text-muted shrink-0">Custom Emoji:</span>
              <Input
                maxLength={2}
                placeholder="e.g. 🍔"
                value={EMOJI_OPTIONS.includes(form.icon) ? "" : form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                className="h-8 text-sm px-2"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Color</label>
            <div className="flex flex-wrap gap-2 mt-1 mb-2">
              {COLOR_OPTIONS.map((color) => (
                <button key={color} type="button" onClick={() => setForm((f) => ({ ...f, color }))}
                  className={cn("h-8 w-8 rounded-xl transition", form.color === color ? "ring-2 ring-offset-2 ring-primary" : "")}
                  style={{ backgroundColor: color }} />
              ))}
            </div>
            <div className="flex items-center gap-2 max-w-[220px] mt-2">
              <span className="text-xs text-muted shrink-0">Custom Color:</span>
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <input
                  type="color"
                  value={form.color.startsWith("#") && form.color.length === 7 ? form.color : "#6366f1"}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="h-8 w-8 rounded cursor-pointer border border-border bg-transparent p-0 shrink-0"
                />
                <Input
                  placeholder="#hexcode"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="h-8 text-sm px-2 flex-grow"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saveMutation.isPending} style={{ backgroundColor: form.color }}>{saveMutation.isPending ? "Saving..." : (editId ? "Save" : "Create")}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Category?" message="Products in this category will become uncategorized." confirmLabel="Delete" loading={deleteMutation.isPending} />
    </div>
  );
}
