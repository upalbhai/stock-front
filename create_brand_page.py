import os

source_path = 'app/dashboard/categories/page.tsx'
target_path = 'app/dashboard/brands/page.tsx'

os.makedirs(os.path.dirname(target_path), exist_ok=True)

with open(source_path, 'r', encoding='utf-8') as f:
    code = f.read()

# Replace imports
code = code.replace('import { categoryService } from "@/services/category.service";', 'import { brandService } from "@/services/brand.service";')
code = code.replace('import type { Category } from "@/lib/types";', 'import type { Brand } from "@/lib/types";')

# Remove EMOJI and COLOR options
import re
code = re.sub(r'const EMOJI_OPTIONS = \[.*?\];\n', '', code)
code = re.sub(r'const COLOR_OPTIONS = \[.*?\];\n', '', code)

# Replace Component name
code = code.replace('export default function CategoriesPage()', 'export default function BrandsPage()')

# Replace form state
code = code.replace('const [form, setForm] = React.useState({ name: "", parentId: "", icon: "???", color: "#6366f1", description: "", sortOrder: "0" });', 'const [form, setForm] = React.useState({ name: "", isActive: true });')

# Replace queries and mutations
code = code.replace('queryKey: ["categories",', 'queryKey: ["brands",')
code = code.replace('queryKey: ["categories"]', 'queryKey: ["brands"]')
code = code.replace('categoryService.getCategoriesWithMeta(token, { flat: "true", page: query.page, limit: query.limit, search: query.search })', 'brandService.getBrandsWithMeta(token, { page: query.page, limit: query.limit, search: query.search })')
code = code.replace('categoryService.updateCategory(editId, body, token)', 'brandService.updateBrand(editId, body, token)')
code = code.replace('categoryService.createCategory(body, token)', 'brandService.createBrand(body, token)')
code = code.replace('categoryService.deleteCategory(id, token)', 'brandService.deleteBrand(id, token)')
code = code.replace('"Category updated"', '"Brand updated"')
code = code.replace('"Category created"', '"Brand created"')
code = code.replace('"Failed to save category"', '"Failed to save brand"')
code = code.replace('"Category deleted"', '"Brand deleted"')
code = code.replace('"Failed to delete category"', '"Failed to delete brand"')

# Replace derived state
code = code.replace('const allCategories = data?.data ?? [];', 'const allBrands = data?.data ?? [];')
code = code.replace('const allCategoryIds = new Set(allCategories.map(c => c._id));', '')
code = code.replace('const topLevel = allCategories.filter((c) => !c.parentId || c.parentId === c._id || !allCategoryIds.has(c.parentId));', '')
code = code.replace('const pagination = data?.meta?.pagination ?? { page: 1, limit: query.limit, total: allCategories.length, totalPages: 1 };', 'const pagination = data?.meta?.pagination ?? { page: 1, limit: query.limit, total: allBrands.length, totalPages: 1 };')

# Replace openCreate and openEdit
code = code.replace(
'''  const openCreate = (parentId = "") => {
    setEditId(null);
    setForm({ name: "", parentId, icon: "???", color: "#6366f1", description: "", sortOrder: "0" });
    setShowModal(true);
  };
  const openEdit = (cat: Category) => {
    setEditId(cat._id);
    setForm({ name: cat.name, parentId: cat.parentId ?? "", icon: cat.icon, color: cat.color, description: "", sortOrder: String(cat.sortOrder) });
    setShowModal(true);
  };''',
'''  const openCreate = () => {
    setEditId(null);
    setForm({ name: "", isActive: true });
    setShowModal(true);
  };
  const openEdit = (brand: Brand) => {
    setEditId(brand._id);
    setForm({ name: brand.name, isActive: brand.isActive ?? true });
    setShowModal(true);
  };'''
)

code = code.replace('const topLevelOptions = [{ value: "", label: "— Top Level —" }, ...topLevel.map((c) => ({ value: c._id, label: ${c.icon}  }))];\n', '')

# Replace JSX
code = code.replace('<h1>Categories</h1>', '<h1>Brands</h1>')
code = code.replace('Categories</h1><p className="text-sm text-muted">Organize products into categories and subcategories</p>', 'Brands</h1><p className="text-sm text-muted">Manage product brands and manufacturers</p>')
code = code.replace('id="create-category-btn"', 'id="create-brand-btn"')
code = code.replace('openCreate("")', 'openCreate()')
code = code.replace('Add Category', 'Add Brand')

# Replace DataTable props
code = code.replace('data={topLevel}', 'data={allBrands}')
code = code.replace('emptyStateText="No categories yet. Create your first category like \'Lassi\', \'Tea\'."', 'emptyStateText="No brands yet. Create your first brand like \'Amul\', \'Havmor\'."')
code = code.replace('expandable\n        ', '')

code = code.replace(
'''        columns={[
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
                <Button variant="soft" size="sm" onClick={(e) => { e.stopPropagation(); openCreate(cat._id); }} id={dd-sub-}><Plus className="h-3.5 w-3.5" /> Sub</Button>
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(cat); }} id={edit-cat-}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="sm" className="text-danger" onClick={(e) => { e.stopPropagation(); setDeleteId(cat._id); }} id={delete-cat-}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            )
          }
        ]}''',
'''        columns={[
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
              <span className={	ext-xs font-medium px-2 py-1 rounded-full }>
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
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(brand); }} id={edit-brand-}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="sm" className="text-danger" onClick={(e) => { e.stopPropagation(); setDeleteId(brand._id); }} id={delete-brand-}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            )
          }
        ]}'''
)

code = re.sub(r'renderSubComponent=\{\(cat: Category\) => \{.*?\}\}', '', code, flags=re.DOTALL)

# Replace Modal
code = code.replace('title={editId ? "Edit Category" : "Create Category"}', 'title={editId ? "Edit Brand" : "Create Brand"}')
code = code.replace(
'''        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate({ ...form, parentId: form.parentId || null, sortOrder: Number(form.sortOrder) }); }}>
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
                placeholder="e.g. ??"
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
        </form>''',
'''        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}>
          <div><label className="mb-1 block text-xs font-medium text-muted">Brand Name *</label><Input id="brand-name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Amul, Havmor" /></div>
          
          <div className="flex items-center gap-2 pt-2">
             <input type="checkbox" id="brand-active" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
             <label htmlFor="brand-active" className="text-sm font-medium text-foreground">Active</label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : (editId ? "Save" : "Create")}</Button>
          </div>
        </form>'''
)

code = code.replace('title="Delete Category?" message="Products in this category will become uncategorized." confirmLabel="Delete"', 'title="Delete Brand?" message="Products with this brand will become unbranded." confirmLabel="Delete"')

with open(target_path, 'w', encoding='utf-8') as f:
    f.write(code)

