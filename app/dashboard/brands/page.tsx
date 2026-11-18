"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  Award,
  RefreshCw,
  Package,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Building2,
  Tag,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/components/auth/auth-provider";
import { brandService } from "@/services/brand.service";
import { getErrorMessage } from "@/lib/error";
import { DataTable } from "@/components/ui/data-table";
import type { Brand } from "@/lib/types";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";
import { cn } from "@/lib/utils";

function getBrandInitials(name: string): string {
  if (!name) return "BR";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function BrandsPage() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const [showModal, setShowModal] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [isRefetching, setIsRefetching] = React.useState(false);
  const [cooldownSeconds, setCooldownSeconds] = React.useState(0);
  const [statusTab, setStatusTab] = React.useState<"all" | "active" | "inactive">("all");

  const [query, setQuery] = useQueryStates({
    search: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(10),
  });

  const [form, setForm] = React.useState({ name: "", isActive: true });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["brands", query.page, query.limit, query.search],
    queryFn: () =>
      brandService.getBrandsWithMeta(token, {
        page: query.page,
        limit: query.limit,
        search: query.search,
        includeInactive: "true",
      } as any),
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
      await qc.invalidateQueries({ queryKey: ["brands"] });
      await refetch();
      toast.success("Brands synced with catalog");
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
      toast.error("Failed to refresh brands");
    } finally {
      setIsRefetching(false);
    }
  };

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
      toast.success(editId ? "Brand updated successfully" : "Brand created successfully");
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, "Failed to save brand"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => brandService.deleteBrand(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brands"] });
      setDeleteId(null);
      toast.success("Brand removed from catalog");
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, "Failed to delete brand"));
    },
  });

  const allBrands: Brand[] = React.useMemo(() => data?.data ?? [], [data?.data]);
  const activeBrands = React.useMemo(() => allBrands.filter((b) => b.isActive !== false), [allBrands]);
  const inactiveBrands = React.useMemo(() => allBrands.filter((b) => b.isActive === false), [allBrands]);

  const totalProductsMapped = React.useMemo(() => {
    return allBrands.reduce((acc, b) => acc + (b.productCount ?? 0), 0);
  }, [allBrands]);

  const filteredBrands = React.useMemo(() => {
    if (statusTab === "active") return activeBrands;
    if (statusTab === "inactive") return inactiveBrands;
    return allBrands;
  }, [statusTab, allBrands, activeBrands, inactiveBrands]);

  const pagination = data?.meta?.pagination ?? {
    page: 1,
    limit: query.limit,
    total: allBrands.length,
    totalPages: 1,
  };

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

  const brandToDelete = React.useMemo(() => {
    return deleteId ? allBrands.find((b) => b._id === deleteId) : null;
  }, [deleteId, allBrands]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Brands</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
              Manufacturers
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage product manufacturers, vendor brands, and catalog classifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefetch}
            disabled={isRefetching || cooldownSeconds > 0}
            className="h-10 px-3.5 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw
              className={cn(
                "h-3.5 w-3.5 mr-1.5",
                isRefetching && "animate-spin text-primary"
              )}
            />
            {cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s` : "Sync Brands"}
          </Button>

          <Button
            id="create-brand-btn"
            onClick={openCreate}
            className="h-10 px-4 text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Brand</span>
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Brands
              </p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {allBrands.length} Brands
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Registered in business catalog
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Active in POS
              </p>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-1 truncate">
                {activeBrands.length} Active
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Available for billing & search
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Inactive / Hidden
              </p>
              <p className={cn("text-xl font-extrabold tracking-tight mt-1 truncate", inactiveBrands.length > 0 ? "text-muted-foreground" : "text-foreground")}>
                {inactiveBrands.length} Inactive
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Hidden from cashier catalog
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0 border border-border/60">
              <ShieldAlert className="h-5 w-5" />
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
                Items tagged with brands
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Package className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DataTable */}
      <DataTable
        isLoading={isLoading}
        data={filteredBrands}
        keyExtractor={(b) => b._id}
        totalItems={pagination.total}
        page={query.page}
        limit={query.limit}
        onPageChange={(p) => setQuery({ page: p })}
        onLimitChange={(l) => setQuery({ limit: l, page: 1 })}
        searchQuery={query.search}
        onSearchChange={(s) => setQuery({ search: s, page: 1 })}
        onRefetch={handleManualRefetch}
        emptyStateIcon={<Award className="h-12 w-12 text-muted/30" />}
        emptyStateText="No brands found matching your search. Click 'Add Brand' to create one."
        filters={
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <Tabs
              value={statusTab}
              onValueChange={(v) => setStatusTab(v as "all" | "active" | "inactive")}
              className="w-auto shrink-0"
            >
              <TabsList className="h-9 bg-muted/60 p-0.5 border border-border/40 shrink-0">
                <TabsTrigger
                  value="all"
                  className="h-full text-xs px-3.5 font-semibold whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                >
                  All ({allBrands.length})
                </TabsTrigger>
                <TabsTrigger
                  value="active"
                  className="h-full text-xs px-3.5 font-semibold whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                >
                  Active ({activeBrands.length})
                </TabsTrigger>
                <TabsTrigger
                  value="inactive"
                  className="h-full text-xs px-3.5 font-semibold whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                >
                  Inactive ({inactiveBrands.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        }
        columns={[
          {
            key: "brand",
            header: "Brand / Manufacturer",
            render: (brand: Brand) => (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm tracking-wide border border-primary/20 shadow-2xs">
                  {getBrandInitials(brand.name)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground text-sm truncate">
                      {brand.name}
                    </span>
                    <span className="inline-flex items-center text-[11px] font-mono font-medium text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                      #{brand.slug}
                    </span>
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: "products",
            header: "Catalog Products",
            render: (brand: Brand) => (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-muted/50 text-foreground border border-border/60">
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{brand.productCount ?? 0} Products</span>
              </div>
            ),
          },
          {
            key: "status",
            header: "Catalog Status",
            render: (brand: Brand) => (
              <Badge
                variant={brand.isActive ? "soft" : "secondary"}
                className={cn(
                  "gap-1.5 text-xs font-semibold px-2.5 py-1",
                  brand.isActive
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-muted text-muted-foreground border border-border/60"
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    brand.isActive ? "bg-emerald-500" : "bg-muted-foreground/60"
                  )}
                />
                <span>{brand.isActive ? "Active in POS" : "Inactive / Archived"}</span>
              </Badge>
            ),
          },
          {
            key: "actions",
            header: "",
            className: "text-right",
            render: (brand: Brand) => (
              <div className="flex items-center gap-1.5 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(brand);
                  }}
                  id={`edit-brand-${brand._id}`}
                  className="h-9 px-2.5 text-xs font-medium gap-1 cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-2.5 text-xs font-medium text-destructive/80 hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(brand._id);
                  }}
                  id={`delete-brand-${brand._id}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ),
          },
        ]}
      />

      {/* Create / Edit Brand Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editId ? "Edit Brand" : "Create Brand"}
        description="Register brand labels and manufacturer identities for inventory products."
        size="md"
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(form);
          }}
        >
          {/* Live Preview Card */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Catalog Label Preview</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-base border border-primary/20 shadow-2xs">
                {getBrandInitials(form.name)}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-foreground truncate">
                  {form.name.trim() || "Brand Name"}
                </p>
                <Badge
                  variant="soft"
                  className={cn(
                    "text-[10px] mt-0.5",
                    form.isActive ? "text-emerald-700 bg-emerald-500/10" : "text-muted-foreground bg-muted"
                  )}
                >
                  {form.isActive ? "Active in Catalog" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Brand Name *
            </label>
            <Input
              id="brand-name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Amul, Coca-Cola, Nestle, Britannia"
              className="h-10 text-sm"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Active in POS Register</p>
              <p className="text-xs text-muted-foreground">
                Visible for cashiers to filter and select in product catalog
              </p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
            />
          </div>

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
            >
              {saveMutation.isPending ? "Saving..." : editId ? "Save Changes" : "Create Brand"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title={`Delete Brand "${brandToDelete?.name || ""}"?`}
        message={
          (brandToDelete?.productCount ?? 0) > 0
            ? `Warning: ${brandToDelete?.productCount} products are currently assigned to this brand. Deleting it will detach the brand from those items.`
            : "Are you sure you want to delete this brand? Products will lose their brand assignment."
        }
        confirmLabel="Delete Brand"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
