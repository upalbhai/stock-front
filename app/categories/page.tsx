"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ChevronRight, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/components/auth/auth-provider";
import { getJson, apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

const EMOJI_OPTIONS = ["🍽️","🥤","🧃","☕","🍵","🥛","🧁","🍰","🍕","🥗","🌮","🍜","🥚","🥗","🫙","🍱","🍦","🧊","🍹","🍺"];
const COLOR_OPTIONS = ["#6366f1","#f59e0b","#10b981","#ef4444","#8b5cf6","#06b6d4","#f97316","#84cc16","#ec4899","#14b8a6"];

export default function CategoriesPage() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ name: "", parentId: "", icon: "🍽️", color: "#6366f1", description: "", sortOrder: "0" });

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getJson<{ categories: Category[] }>("/categories", token, { flat: "true" }),
    enabled: Boolean(token)
  });

  const save = useMutation({
    mutationFn: (body: unknown) => editId
      ? apiFetch(`/categories/${editId}`, { method: "PATCH", body, token })
      : apiFetch("/categories", { method: "POST", body, token }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); setShowModal(false); setEditId(null); }
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/categories/${id}`, { method: "DELETE", token }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); setDeleteId(null); }
  });

  const allCategories = data?.categories ?? [];
  const topLevel = allCategories.filter((c) => !c.parentId);

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
        <Button id="create-category-btn" onClick={() => openCreate("")}><Plus className="h-4 w-4" /> Add Category</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-3xl bg-border/40" />)}</div>
      ) : topLevel.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-border/60 py-20 text-center">
          <FolderOpen className="h-12 w-12 text-muted/30" />
          <p className="mt-3 font-medium text-muted">No categories yet</p>
          <p className="text-sm text-muted/60">Create your first category like "Lassi", "Tea", "Juice"</p>
          <Button className="mt-4" onClick={() => openCreate("")}><Plus className="h-4 w-4" /> Create Category</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {topLevel.map((cat) => {
            const children = allCategories.filter((c) => c.parentId === cat._id);
            return (
              <div key={cat._id} className="animate-rise glass-panel rounded-3xl border border-border/70 p-5 shadow-soft">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ backgroundColor: cat.color + "20", color: cat.color }}>
                      {cat.icon}
                    </div>
                    <div>
                      <h2 className="font-semibold">{cat.name}</h2>
                      <p className="text-xs text-muted">{children.length} subcategory{children.length !== 1 ? "ies" : ""}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="soft" size="sm" onClick={() => openCreate(cat._id)} id={`add-sub-${cat._id}`}><Plus className="h-3.5 w-3.5" /> Sub</Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(cat)} id={`edit-cat-${cat._id}`}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="text-danger" onClick={() => setDeleteId(cat._id)} id={`delete-cat-${cat._id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                {children.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 pl-4 border-l-2" style={{ borderColor: cat.color }}>
                    {children.map((sub) => (
                      <div key={sub._id} className="flex items-center gap-2 rounded-2xl border border-border bg-surface/60 px-3 py-2">
                        <span>{sub.icon}</span>
                        <span className="text-sm font-medium">{sub.name}</span>
                        <button onClick={() => openEdit(sub)} className="text-muted hover:text-text transition"><Pencil className="h-3 w-3" /></button>
                        <button onClick={() => setDeleteId(sub._id)} className="text-danger/60 hover:text-danger transition"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? "Edit Category" : "Create Category"} size="md">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate({ ...form, parentId: form.parentId || undefined, sortOrder: Number(form.sortOrder) }); }}>
          <div><label className="mb-1 block text-xs font-medium text-muted">Category Name *</label><Input id="cat-name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Lassi, Tea, Juice" /></div>
          <div><label className="mb-1 block text-xs font-medium text-muted">Parent Category</label><Select id="cat-parent" value={form.parentId} onValueChange={(v) => setForm((f) => ({ ...f, parentId: v }))} options={topLevelOptions} /></div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Icon (Emoji)</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {EMOJI_OPTIONS.map((emoji) => (
                <button key={emoji} type="button" onClick={() => setForm((f) => ({ ...f, icon: emoji }))}
                  className={cn("flex h-10 w-10 items-center justify-center rounded-2xl text-xl transition border", form.icon === emoji ? "border-primary bg-primary/10" : "border-border hover:border-primary/50")}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Color</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {COLOR_OPTIONS.map((color) => (
                <button key={color} type="button" onClick={() => setForm((f) => ({ ...f, color }))}
                  className={cn("h-8 w-8 rounded-xl transition", form.color === color ? "ring-2 ring-offset-2 ring-primary" : "")}
                  style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={save.isPending} style={{ backgroundColor: form.color }}>{save.isPending ? "Saving..." : (editId ? "Save" : "Create")}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && remove.mutate(deleteId)}
        title="Delete Category?" message="Products in this category will become uncategorized." confirmLabel="Delete" loading={remove.isPending} />
    </div>
  );
}
