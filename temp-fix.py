import re

with open('app/dashboard/products/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Imports
code = code.replace(
    'import { categoryService } from "@/services/category.service";',
    'import { categoryService } from "@/services/category.service";\nimport { brandService } from "@/services/brand.service";'
)

# 2. productSchema
code = code.replace(
    'categoryId: z.string().min(1, "Category is required"),',
    'categoryId: z.string().min(1, "Category is required"),\n  brandId: z.string().optional(),'
)

# 3. loadBrands function
loadBrandsFn = '''}

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

export default function ProductsPage()'''
code = re.sub(r'\}\s+export default function ProductsPage\(\)', loadBrandsFn, code)

# 4. State
stateStr = '''  const [catFilter, setCatFilter] = React.useState<{ id: string, name: string, label: string } | null>(null);
  const [brandFilter, setBrandFilter] = React.useState<{ id: string, name: string, label: string } | null>(null);
  const [formCategoryOption, setFormCategoryOption] = React.useState<{ id: string, name: string, label: string } | null>(null);
  const [formBrandOption, setFormBrandOption] = React.useState<{ id: string, name: string, label: string } | null>(null);'''
code = re.sub(r'  const \[catFilter, setCatFilter\].*?setFormCategoryOption\] = React\.useState.*?null\);', stateStr, code, flags=re.DOTALL)

# 5. defaultValues
code = code.replace('categoryId: "", taxRate', 'categoryId: "", brandId: "", taxRate')

# 6. useQuery dependencies and call
code = code.replace(
    'queryKey: ["products", outletId, query.search, catFilter?.id, query.page, query.limit],',
    'queryKey: ["products", outletId, query.search, catFilter?.id, brandFilter?.id, query.page, query.limit],'
)
code = code.replace(
    'categoryId: catFilter?.id || undefined,',
    'categoryId: catFilter?.id || undefined,\n        brandId: brandFilter?.id || undefined,'
)

# 7. Options loader
brandLoaders = '''      return res;
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
  );'''
code = re.sub(r'      return res;\n    \},\n    \[token, qc\]\n  \);', brandLoaders, code)

# 8. Reset calls
code = code.replace('setFormCategoryOption(null);', 'setFormCategoryOption(null);\n    setFormBrandOption(null);')
code = code.replace('sortOrder: "0", packagingUnits: [] });', 'sortOrder: "0", packagingUnits: [] });')

code = code.replace(
'''  const openCreate = () => {
    setEditId(null);
    setFormCategoryOption(null);
    setFormBrandOption(null);
    reset({ name: "", description: "", sku: "", barcode: "", unit: "pcs", unitId: "", price: "", costPrice: "", categoryId: "", taxRate: "0", gstRate: "0", hsnCode: "", onHandQty: "0", lowStockThreshold: "10", sortOrder: "0", packagingUnits: [] });
    setShowModal(true);
  };''',
'''  const openCreate = () => {
    setEditId(null);
    setFormCategoryOption(null);
    setFormBrandOption(null);
    reset({ name: "", description: "", sku: "", barcode: "", unit: "pcs", unitId: "", price: "", costPrice: "", categoryId: "", brandId: "", taxRate: "0", gstRate: "0", hsnCode: "", onHandQty: "0", lowStockThreshold: "10", sortOrder: "0", packagingUnits: [] });
    setShowModal(true);
  };'''
)

openEditReset = '''    let brandOpt = null;
    if (typeof p.brandId === "object" && p.brandId) {
      brandOpt = { id: (p.brandId as any)._id, name: (p.brandId as any).name, label: (p.brandId as any).name };
    }
    setFormBrandOption(brandOpt);
    reset({'''
code = code.replace('    reset({', openEditReset, 1)

code = code.replace(
    'categoryId: typeof p.categoryId === "object" ? p.categoryId?._id ?? "" : p.categoryId ?? "",',
    'categoryId: typeof p.categoryId === "object" ? p.categoryId?._id ?? "" : p.categoryId ?? "",\n      brandId: typeof p.brandId === "object" ? (p.brandId as any)?._id ?? "" : p.brandId ?? "",'
)

# 9. onSubmit
code = code.replace(
    'categoryId: data.categoryId || undefined,',
    'categoryId: data.categoryId || undefined,\n      brandId: data.brandId || undefined,'
)

# 10. Filter section
brandFilterHtml = '''            <div className="w-48 shrink-0">
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
          </div>'''
code = re.sub(r'          </div>\n        \}', brandFilterHtml + '\n        }', code)

# 11. Table Columns
code = code.replace(
    '{p.sku && <p className="text-xs text-muted mt-1">SKU: {p.sku}</p>}</div></div>)',
    '{p.sku && <p className="text-xs text-muted mt-1 inline-block mr-2">SKU: {p.sku}</p>}{p.brandId && typeof p.brandId === "object" && <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 mt-1">{(p.brandId as any).name}</Badge>}</div></div>)'
)

# 12. Form body
brandFormHtml = '''            <div className="col-span-2 md:col-span-1">
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
                      if (res.data?.brand) {
                        const newBrand = res.data.brand;
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
            </div>'''
code = re.sub(r'(              \{errors\.categoryId && <p.*?</div>)', r'\1\n' + brandFormHtml, code, flags=re.DOTALL)

with open('app/dashboard/products/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

