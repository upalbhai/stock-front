"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  FolderOpen,
  RefreshCw,
  FolderTree,
  Layers,
  Package,
  Tag,
  Sparkles,
  ArrowUpDown,
  Search,
  Check,
  ChevronDown,
  ChevronRight,
  Info,
  Hash,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const EMOJI_CATEGORIES = [
  {
    label: "Drinks",
    icon: "🥤",
    emojis: ["🥤", "🧃", "☕", "🍵", "🥛", "🧋", "🍺", "🍹", "🍸", "🍷", "🍾", "🧊"],
  },
  {
    label: "Food",
    icon: "🥪",
    emojis: ["🥪", "🍕", "🍔", "🍟", "🌭", "🌮", "🌯", "🍜", "🍝", "🍣", "🍱", "🥗", "🍳", "🧇"],
  },
  {
    label: "Sweets",
    icon: "🍬",
    emojis: ["🧁", "🍰", "🍩", "🍪", "🍫", "🍬", "🍭", "🥐", "🍞", "🥞", "🍦", "🍮"],
  },
  {
    label: "Grocery",
    icon: "🛒",
    emojis: ["🥚", "🧀", "🍎", "🍌", "🥦", "🥔", "🫙", "🧂", "🥫", "🧼", "🌾", "🧴"],
  },
  {
    label: "Retail",
    icon: "⚡",
    emojis: ["📦", "🏷️", "🛍️", "🧴", "🔋", "🚬", "🧊", "🍽️", "🏬", "🌟", "💊", "🧻"],
  },
];

const COLOR_OPTIONS = [
  { name: "Indigo", hex: "#6366f1" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Orange", hex: "#f97316" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Purple", hex: "#8b5cf6" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Teal", hex: "#14b8a6" },
  { name: "Lime", hex: "#84cc16" },
  { name: "Red", hex: "#ef4444" },
];

function getContrastColor(hex: string): string {
  if (!hex || !hex.startsWith("#") || hex.length < 7) return "#ffffff";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? "#0f172a" : "#ffffff";
}

export default function CategoriesPage() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const [showModal, setShowModal] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [isRefetching, setIsRefetching] = React.useState(false);
  const [cooldownSeconds, setCooldownSeconds] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState<"tree" | "all" | "subcategories">("tree");
  const [activeEmojiGroup, setActiveEmojiGroup] = React.useState<string>("Drinks");

  const [query, setQuery] = useQueryStates({
    search: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(50),
  });

  const [form, setForm] = React.useState({
    name: "",
    parentId: "",
    icon: "🥤",
    color: "#6366f1",
    description: "",
    sortOrder: "0",
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["categories", query.page, query.limit, query.search],
    queryFn: () =>
      categoryService.getCategoriesWithMeta(token, {
        flat: "true",
        page: query.page,
        limit: query.limit,
        search: query.search,
      }),
    enabled: Boolean(token),
    staleTime: 5_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleManualRefetch = async () => {
    if (isRefetching || cooldownSeconds > 0) return;
    setIsRefetching(true);
    try {
      await qc.invalidateQueries({ queryKey: ["categories"] });
      await refetch();
      toast.success("Categories synced with catalog");
      setCooldownSeconds(5);
      const interval = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      toast.error("Failed to refresh categories");
    } finally {
      setIsRefetching(false);
    }
  };

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
      toast.success(editId ? "Category updated successfully" : "Category created successfully");
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, "Failed to save category"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryService.deleteCategory(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      setDeleteId(null);
      toast.success("Category removed from catalog");
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, "Failed to delete category"));
    },
  });

  const allCategories = React.useMemo(() => data?.data ?? [], [data?.data]);
  const allCategoryIds = React.useMemo(() => new Set(allCategories.map((c) => c._id)), [allCategories]);
  const categoryMap = React.useMemo(() => new Map(allCategories.map((c) => [c._id, c])), [allCategories]);

  // Top level categories
  const topLevel = React.useMemo(() => {
    return allCategories.filter(
      (c) => !c.parentId || c.parentId === c._id || !allCategoryIds.has(c.parentId)
    );
  }, [allCategories, allCategoryIds]);

  // Subcategories
  const subcategories = React.useMemo(() => {
    return allCategories.filter(
      (c) => c.parentId && c.parentId !== c._id && allCategoryIds.has(c.parentId)
    );
  }, [allCategories, allCategoryIds]);

  // Total products mapped across categories
  const totalProductsMapped = React.useMemo(() => {
    return allCategories.reduce((acc, cat) => acc + (cat.productCount ?? 0), 0);
  }, [allCategories]);

  const pagination = data?.meta?.pagination ?? {
    page: 1,
    limit: query.limit,
    total: allCategories.length,
    totalPages: 1,
  };

  const openCreate = (parentId = "") => {
    setEditId(null);
    setForm({
      name: "",
      parentId,
      icon: "🥤",
      color: "#6366f1",
      description: "",
      sortOrder: "0",
    });
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditId(cat._id);
    setForm({
      name: cat.name,
      parentId: cat.parentId ?? "",
      icon: cat.icon || "🥤",
      color: cat.color || "#6366f1",
      description: cat.description || "",
      sortOrder: String(cat.sortOrder ?? 0),
    });
    setShowModal(true);
  };

  // Top level options for Parent selector (excluding current item if editing)
  const topLevelOptions = React.useMemo(() => {
    const list = topLevel.filter((c) => !editId || c._id !== editId);
    return [
      { value: "", label: "None (Top-Level Category)" },
      ...list.map((c) => ({
        value: c._id,
        label: `${c.icon} ${c.name}`,
      })),
    ];
  }, [topLevel, editId]);

  // Category being deleted
  const categoryToDelete = React.useMemo(() => {
    return deleteId ? categoryMap.get(deleteId) : null;
  }, [deleteId, categoryMap]);

  // Dependent subcategories for delete dialog
  const dependentSubcategories = React.useMemo(() => {
    if (!deleteId) return [];
    return allCategories.filter((c) => c.parentId === deleteId && c._id !== deleteId);
  }, [deleteId, allCategories]);

  // Filtered dataset for DataTable based on active tab
  const displayedCategories = React.useMemo(() => {
    if (activeTab === "tree") {
      return topLevel;
    }
    if (activeTab === "subcategories") {
      return subcategories;
    }
    return allCategories;
  }, [activeTab, topLevel, subcategories, allCategories]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Categories</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
              POS Structure
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organize products into POS touch categories, custom colors, icons, and subcategory hierarchies.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefetch}
            disabled={isRefetching || cooldownSeconds > 0}
            className="h-10 px-3.5 text-xs font-semibold"
          >
            <RefreshCw
              className={cn(
                "h-3.5 w-3.5 mr-1.5",
                isRefetching && "animate-spin text-primary"
              )}
            />
            {cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s` : "Sync Catalog"}
          </Button>

          <Button
            id="create-category-btn"
            onClick={() => openCreate("")}
            className="h-10 px-4 text-xs font-semibold gap-1.5 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Categories
              </p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {allCategories.length} Categories
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Active catalog classifications
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Top-Level Groups
              </p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {topLevel.length} Departments
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Master POS register tabs
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <FolderTree className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Subcategories
              </p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {subcategories.length} Nested
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Granular sub-classifications
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Tag className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Mapped Products
              </p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {totalProductsMapped} Products
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Assigned catalog inventory
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Package className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <DataTable
        isLoading={isLoading}
        data={displayedCategories}
        keyExtractor={(c) => c._id}
        totalItems={pagination.total}
        page={query.page}
        limit={query.limit}
        onPageChange={(p) => setQuery({ page: p })}
        onLimitChange={(l) => setQuery({ limit: l, page: 1 })}
        searchQuery={query.search}
        onSearchChange={(s) => setQuery({ search: s, page: 1 })}
        onRefetch={handleManualRefetch}
        emptyStateIcon={<FolderOpen className="h-12 w-12 text-muted/30" />}
        emptyStateText="No categories found matching your criteria. Click 'Add Category' to create one."
        expandable={activeTab === "tree"}
        filters={
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "tree" | "all" | "subcategories")}
              className="w-auto shrink-0"
            >
              <TabsList className="h-9 bg-muted/60 p-0.5 border border-border/40 shrink-0">
                <TabsTrigger
                  value="tree"
                  className="h-full text-xs px-3.5 font-semibold whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                >
                  Tree View ({topLevel.length})
                </TabsTrigger>
                <TabsTrigger
                  value="all"
                  className="h-full text-xs px-3.5 font-semibold whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                >
                  All Categories ({allCategories.length})
                </TabsTrigger>
                <TabsTrigger
                  value="subcategories"
                  className="h-full text-xs px-3.5 font-semibold whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                >
                  Subcategories ({subcategories.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        }
        columns={[
          {
            key: "category",
            header: "Category & Visual Token",
            render: (cat: Category) => (
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-xs transition-transform hover:scale-105"
                  style={{
                    backgroundColor: `${cat.color || "#6366f1"}20`,
                    color: cat.color || "#6366f1",
                    border: `1px solid ${cat.color || "#6366f1"}35`,
                  }}
                >
                  {cat.icon || "📦"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground text-sm truncate">
                      {cat.name}
                    </span>
                    <span className="inline-flex items-center text-[11px] font-mono font-medium text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                      #{cat.slug}
                    </span>
                  </div>
                  {cat.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {cat.description}
                    </p>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: "hierarchy",
            header: "Hierarchy Level",
            render: (cat: Category) => {
              const isSub = Boolean(cat.parentId && cat.parentId !== cat._id && allCategoryIds.has(cat.parentId));
              if (isSub) {
                const parent = categoryMap.get(cat.parentId!);
                return (
                  <div className="flex flex-col gap-1">
                    <Badge variant="outline" className="w-fit text-[11px] bg-primary/5 text-primary border-primary/20">
                      Subcategory
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Parent: {parent ? `${parent.icon} ${parent.name}` : "Unknown"}
                    </span>
                  </div>
                );
              }

              const children = allCategories.filter((c) => c.parentId === cat._id && c._id !== cat._id);
              return (
                <div className="flex flex-col gap-1">
                  <Badge variant="outline" className="w-fit text-[11px] bg-muted/60 text-foreground border-border/80">
                    Master Department
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {children.length} {children.length === 1 ? "subcategory" : "subcategories"}
                  </span>
                </div>
              );
            },
          },
          {
            key: "catalog",
            header: "Catalog Items",
            render: (cat: Category) => (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-muted/50 text-foreground border border-border/60">
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{cat.productCount ?? 0} Products</span>
              </div>
            ),
          },
          {
            key: "pos_preview",
            header: "POS Register Preview",
            render: (cat: Category) => (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold shadow-2xs"
                style={{
                  backgroundColor: `${cat.color || "#6366f1"}15`,
                  color: cat.color || "#6366f1",
                  border: `1px solid ${cat.color || "#6366f1"}35`,
                }}
              >
                <span>{cat.icon || "📦"}</span>
                <span className="truncate max-w-[120px]">{cat.name}</span>
              </div>
            ),
          },
          {
            key: "sort_order",
            header: "POS Priority",
            render: (cat: Category) => (
              <span className="text-xs font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/50">
                Priority #{cat.sortOrder ?? 0}
              </span>
            ),
          },
          {
            key: "actions",
            header: "",
            className: "text-right",
            render: (cat: Category) => {
              const isTop = !cat.parentId || cat.parentId === cat._id || !allCategoryIds.has(cat.parentId);
              return (
                <div className="flex items-center gap-1.5 justify-end">
                  {isTop && (
                    <Button
                      variant="soft"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCreate(cat._id);
                      }}
                      id={`add-sub-${cat._id}`}
                      className="h-9 px-2.5 text-xs font-medium gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Sub</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(cat);
                    }}
                    id={`edit-cat-${cat._id}`}
                    className="h-9 px-2.5 text-xs font-medium gap-1"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-2.5 text-xs font-medium text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(cat._id);
                    }}
                    id={`delete-cat-${cat._id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            },
          },
        ]}
        renderSubComponent={(cat: Category) => {
          const children = allCategories.filter((c) => c.parentId === cat._id && c._id !== cat._id);

          return (
            <div
              className="p-4 pl-6 sm:pl-10 my-2 rounded-xl bg-muted/20 border-l-[3px] space-y-3"
              style={{ borderColor: cat.color || "#6366f1" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    Subcategories under {cat.icon} {cat.name}
                  </span>
                  <Badge variant="outline" className="text-xs bg-card">
                    {children.length} {children.length === 1 ? "Subcategory" : "Subcategories"}
                  </Badge>
                </div>
                <Button
                  variant="soft"
                  size="sm"
                  onClick={() => openCreate(cat._id)}
                  className="h-8 px-2.5 text-xs font-medium gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Subcategory</span>
                </Button>
              </div>

              {children.length === 0 ? (
                <div className="p-4 rounded-lg bg-card/60 border border-border/60 text-center">
                  <p className="text-xs text-muted-foreground">
                    No subcategories created under {cat.name} yet. Click "Add Subcategory" to create one.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-card overflow-hidden">
                  {children.map((sub) => (
                    <div
                      key={sub._id}
                      className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl">{sub.icon}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground truncate">
                              {sub.name}
                            </span>
                            <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                              #{sub.slug}
                            </span>
                          </div>
                          {sub.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {sub.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Package className="h-3.5 w-3.5" />
                          <span>{sub.productCount ?? 0} Products</span>
                        </div>
                        <span className="text-xs font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                          Priority #{sub.sortOrder ?? 0}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => openEdit(sub)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteId(sub._id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }}
      />

      {/* Create / Edit Category Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editId ? "Edit Category" : "Create Category"}
        description="Configure visual attributes, parent hierarchy, and POS register layout."
        size="lg"
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate({
              ...form,
              parentId: form.parentId || null,
              sortOrder: Number(form.sortOrder || 0),
            });
          }}
        >
          {/* Live POS Register Tab Preview Box */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Live POS Touch Bar Preview</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Active Tab Preview */}
              <div
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs transition-transform"
                style={{
                  backgroundColor: form.color,
                  color: getContrastColor(form.color),
                }}
              >
                <span className="text-lg">{form.icon || "📦"}</span>
                <span>{form.name.trim() || "Category Name"}</span>
              </div>

              {/* Inactive Tab Preview */}
              <div
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition"
                style={{
                  backgroundColor: `${form.color}15`,
                  color: form.color,
                  borderColor: `${form.color}40`,
                }}
              >
                <span className="text-base">{form.icon || "📦"}</span>
                <span>Soft Pill Style</span>
              </div>
            </div>
          </div>

          {/* Core Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Category Name *
              </label>
              <Input
                id="cat-name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Beverages, Hot Snacks, Bakery"
                className="h-10 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Parent Category
              </label>
              <Select
                id="cat-parent"
                value={form.parentId}
                onValueChange={(v) => setForm((f) => ({ ...f, parentId: v }))}
                options={topLevelOptions}
              />
            </div>
          </div>

          {/* Sort Order & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                POS Display Priority
              </label>
              <Input
                id="cat-sort"
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                placeholder="0"
                className="h-10 text-sm font-mono"
              />
              <span className="text-[11px] text-muted-foreground mt-1 block">
                0 = Highest priority on POS bar
              </span>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Description (Optional)
              </label>
              <Input
                id="cat-description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Quick grab snacks and beverages"
                className="h-10 text-sm"
              />
            </div>
          </div>

          {/* Emoji Selection with Categorized Tabs */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Icon (Emoji)
            </label>

            {/* Emoji Category Selector */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {EMOJI_CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => setActiveEmojiGroup(cat.label)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border",
                    activeEmojiGroup === cat.label
                      ? "bg-primary/10 border-primary text-primary font-semibold"
                      : "bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Emoji Options Grid */}
            <div className="flex flex-wrap gap-2 p-2.5 rounded-xl border border-border/60 bg-muted/10 max-h-36 overflow-y-auto">
              {EMOJI_CATEGORIES.find((g) => g.label === activeEmojiGroup)?.emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, icon: emoji }))}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl text-xl transition border",
                    form.icon === emoji
                      ? "border-primary bg-primary/20 scale-105 shadow-2xs"
                      : "border-border/60 hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Custom Emoji Input */}
            <div className="flex items-center gap-2 max-w-[220px] mt-2.5">
              <span className="text-xs text-muted-foreground shrink-0 font-medium">Custom Emoji:</span>
              <Input
                maxLength={4}
                placeholder="e.g. 🍔"
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                className="h-8 text-sm px-2 text-center font-emoji"
              />
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Accent Color
            </label>

            <div className="flex flex-wrap gap-2.5 mb-3">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  onClick={() => setForm((f) => ({ ...f, color: c.hex }))}
                  className={cn(
                    "h-8 w-8 rounded-xl transition-transform flex items-center justify-center border border-white/20",
                    form.color.toLowerCase() === c.hex.toLowerCase()
                      ? "ring-2 ring-offset-2 ring-primary scale-110 shadow-xs"
                      : "hover:scale-105"
                  )}
                  style={{ backgroundColor: c.hex }}
                >
                  {form.color.toLowerCase() === c.hex.toLowerCase() && (
                    <Check className="h-4 w-4" style={{ color: getContrastColor(c.hex) }} />
                  )}
                </button>
              ))}
            </div>

            {/* Custom Color Input */}
            <div className="flex items-center gap-2 max-w-[260px]">
              <span className="text-xs text-muted-foreground shrink-0 font-medium">Custom Color:</span>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <input
                  type="color"
                  value={
                    form.color.startsWith("#") && form.color.length === 7 ? form.color : "#6366f1"
                  }
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="h-8 w-9 rounded-lg cursor-pointer border border-border bg-transparent p-0.5 shrink-0"
                />
                <Input
                  placeholder="#hexcode"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="h-8 text-xs font-mono px-2 flex-grow"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-3 border-t border-border/60">
            <Button
              variant="outline"
              type="button"
              className="flex-1 h-10 font-semibold"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-10 font-semibold shadow-xs"
              disabled={saveMutation.isPending}
              style={{
                backgroundColor: form.color,
                color: getContrastColor(form.color),
              }}
            >
              {saveMutation.isPending ? "Saving..." : editId ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title={`Delete Category "${categoryToDelete?.name || ""}"?`}
        message={
          dependentSubcategories.length > 0
            ? `Warning: This category contains ${dependentSubcategories.length} subcategories. Deleting it will detach them and make associated products uncategorized.`
            : "Products assigned to this category will become uncategorized. Are you sure you want to proceed?"
        }
        confirmLabel="Delete Category"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
