"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { useAuth } from "@/components/auth/auth-provider";
import { getJsonWithMeta, apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import { getErrorMessage } from "@/lib/error";
import { productService } from "@/services/product.service";

export default function ImportProductsPage() {
  const router = useRouter();
  const { user, token, outletId } = useAuth();
  const currency = user?.currency || "INR";
  const qc = useQueryClient();

  const [importPage, setImportPage] = React.useState(1);
  const [importSearch, setImportSearch] = React.useState("");
  const [selectedImportIds, setSelectedImportIds] = React.useState<string[]>([]);

  // Reset selection on search/page change
  React.useEffect(() => {
    setSelectedImportIds([]);
  }, [importSearch, importPage]);

  const globalProductsQuery = useQuery({
    queryKey: ["globalProducts", outletId, importSearch, importPage],
    queryFn: () => getJsonWithMeta<any[]>(`/products/global?outletId=${outletId}&search=${importSearch}&page=${importPage}&limit=10`, token),
    enabled: !!token && !!outletId
  });

  const importProduct = useMutation({
    mutationFn: (productId: string) =>
      apiFetch(`/products/${productId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ outletId })
      }),
    onSuccess: () => {
      toast.success("Product imported successfully");
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["globalProducts"] });
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
    }
  });

  const importProductsBulkMutation = useMutation({
    mutationFn: (params: { productIds?: string[]; importAll?: boolean }) =>
      productService.importProductsBulk({ outletId: outletId || "", ...params }, token),
    onSuccess: () => {
      toast.success("Products imported successfully");
      setSelectedImportIds([]);
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["globalProducts"] });
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, "Failed to bulk import products"));
    }
  });

  const handleSelectAll = (checked: boolean) => {
    if (!globalProductsQuery.data?.data) return;
    const pageIds = globalProductsQuery.data.data.map((p: any) => p._id);
    if (checked) {
      setSelectedImportIds(prev => [...new Set([...prev, ...pageIds])]);
    } else {
      setSelectedImportIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const isAllSelected = Boolean(globalProductsQuery.data?.data?.length) && 
    globalProductsQuery.data?.data?.every((p: any) => selectedImportIds.includes(p._id));

  const columns: ColumnDef<any>[] = [
    {
      header: (
        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40 cursor-pointer"
        />
      ),
      id: "select",
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedImportIds.includes(row._id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedImportIds(prev => [...prev, row._id]);
            } else {
              setSelectedImportIds(prev => prev.filter(id => id !== row._id));
            }
          }}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40 cursor-pointer"
        />
      )
    },
    {
      header: "Product Name",
      accessorKey: "name",
      render: (row) => (
        <div>
          <div className="font-medium">{row.name}</div>
          {row.sku && <div className="text-xs text-muted-foreground">SKU: {row.sku}</div>}
        </div>
      )
    },
    {
      header: "Category",
      accessorKey: "categoryId",
      render: (row) => row.categoryId?.name || "Uncategorized"
    },
    {
      header: "Price",
      accessorKey: "price",
      render: (row) => formatCurrency(row.price, currency)
    },
    {
      header: "Actions",
      id: "actions",
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => importProduct.mutate(row._id)}
          disabled={importProduct.isPending || importProductsBulkMutation.isPending}
        >
          Import
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Import from Master Catalog</h1>
          <p className="text-sm text-muted-foreground">
            Search and import existing products from the global catalog into this outlet.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/products")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </div>
      </div>

      <DataTable
        title="Master Catalog"
        columns={columns}
        data={globalProductsQuery.data?.data || []}
        isLoading={globalProductsQuery.isLoading}
        totalItems={globalProductsQuery.data?.meta?.pagination?.total || 0}
        page={importPage}
        limit={10}
        onPageChange={setImportPage}
        searchQuery={importSearch}
        onSearchChange={(s) => { setImportSearch(s); setImportPage(1); }}
        placeholderText="Search master catalog..."
        headerActions={
          <div className="flex gap-2 items-center">
            {selectedImportIds.length > 0 && (
              <Button
                onClick={() => importProductsBulkMutation.mutate({ productIds: selectedImportIds })}
                disabled={importProductsBulkMutation.isPending}
              >
                {importProductsBulkMutation.isPending ? "Importing..." : `Import Selected (${selectedImportIds.length})`}
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => importProductsBulkMutation.mutate({ importAll: true })}
              disabled={importProductsBulkMutation.isPending}
            >
              Import All Matching
            </Button>
          </div>
        }
      />
    </div>
  );
}
