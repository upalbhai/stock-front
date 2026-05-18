"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { getJson, postJson } from "@/lib/api-client";
import { useSettings } from "@/components/settings/settings-provider";
import { RoleGate } from "@/components/auth/role-gate";
import { formatCurrency } from "@/lib/format";

const roles = [
  { role: "Owner / Admin", access: "Full access" },
  { role: "Manager", access: "Stock, reports, approvals" },
  { role: "Staff / Cashier", access: "Billing and daily tasks" }
];

type Product = {
  _id: string;
  name: string;
  unit: string;
  price: number;
  taxRate?: number;
  gstRate?: number;
  barcode?: string;
  lowStockThreshold?: number;
};

export default function SettingsPage() {
  const { token, outletId } = useAuth();
  const { settings, updateSettings } = useSettings();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    unit: "pcs",
    price: "",
    taxRate: "0.05",
    barcode: "",
    lowStockThreshold: "10"
  });

  const { data } = useQuery({
    queryKey: ["products", outletId],
    queryFn: () =>
      getJson<{ data: Product[] }>("/products", token, { outletId }),
    enabled: Boolean(token && outletId)
  });

  const products = data?.data ?? [];

  const createProduct = useMutation({
    mutationFn: () =>
      postJson(
        "/products",
        {
          outletId,
          name: form.name,
          unit: form.unit,
          price: Number(form.price),
          taxRate: Number(form.taxRate),
          barcode: form.barcode || undefined,
          lowStockThreshold: Number(form.lowStockThreshold)
        },
        token
      ),
    onSuccess: () => {
      setForm({
        name: "",
        unit: "pcs",
        price: "",
        taxRate: "0.05",
        barcode: "",
        lowStockThreshold: "10"
      });
      queryClient.invalidateQueries({ queryKey: ["products", outletId] });
    }
  });

  return (
    <RoleGate allowed={["owner", "manager"]}>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Outlet Settings</CardTitle>
              <CardDescription>Basic outlet preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="space-y-2 text-sm">
                Outlet Name
                <Input defaultValue="Main Outlet" />
              </label>
              <label className="space-y-2 text-sm">
                Default Language
                <Input defaultValue="English (Hindi/Gujarati ready)" />
              </label>
              <div className="space-y-3">
                <label className="flex items-center justify-between rounded-2xl border border-border/70 bg-surface/70 p-3 text-sm">
                  <span>Auto tax calculation</span>
                  <input
                    type="checkbox"
                    checked={settings.taxEnabled}
                    onChange={(event) =>
                      updateSettings({ taxEnabled: event.target.checked })
                    }
                    className="h-5 w-5 accent-primary"
                  />
                </label>
                <label className="flex items-center justify-between rounded-2xl border border-border/70 bg-surface/70 p-3 text-sm">
                  <span>GST billing view</span>
                  <input
                    type="checkbox"
                    checked={settings.gstEnabled}
                    onChange={(event) =>
                      updateSettings({ gstEnabled: event.target.checked })
                    }
                    className="h-5 w-5 accent-primary"
                  />
                </label>
                <label className="flex items-center justify-between rounded-2xl border border-border/70 bg-surface/70 p-3 text-sm">
                  <span>Offline queue mode</span>
                  <input
                    type="checkbox"
                    checked={settings.offlineMode}
                    onChange={(event) =>
                      updateSettings({ offlineMode: event.target.checked })
                    }
                    className="h-5 w-5 accent-primary"
                  />
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Setup</CardTitle>
              <CardDescription>Add items with GST and barcode</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  Product Name
                  <Input
                    value={form.name}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm">
                  Unit
                  <Input
                    value={form.unit}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, unit: event.target.value }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm">
                  Price
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, price: event.target.value }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm">
                  GST / Tax Rate
                  <Input
                    type="number"
                    value={form.taxRate}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        taxRate: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm">
                  Barcode / SKU
                  <Input
                    value={form.barcode}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        barcode: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm">
                  Low Stock Alert
                  <Input
                    type="number"
                    value={form.lowStockThreshold}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        lowStockThreshold: event.target.value
                      }))
                    }
                  />
                </label>
              </div>
              <Button
                size="lg"
                onClick={() => createProduct.mutate()}
                disabled={!outletId || !form.name || !form.price || createProduct.isPending}
              >
                {createProduct.isPending ? "Saving..." : "Add Product"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <CardDescription>Current catalog</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {products.length === 0 && (
                <p className="text-sm text-muted">
                  No products yet. Add your first product above.
                </p>
              )}
              {products.map((product) => (
                <div
                  key={product._id}
                  className="flex items-center justify-between rounded-2xl border border-border/70 bg-surface/70 p-3 text-sm"
                >
                  <div>
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-xs text-muted">
                      {product.unit} • {product.barcode || "No barcode"}
                    </p>
                  </div>
                  <span className="font-semibold">
                    {formatCurrency(product.price)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Roles & Permissions</CardTitle>
            <CardDescription>Assign user access levels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {roles.map((role) => (
              <div
                key={role.role}
                className="rounded-2xl border border-border/70 bg-surface/70 p-3"
              >
                <p className="text-sm font-semibold">{role.role}</p>
                <p className="text-xs text-muted">{role.access}</p>
                <Badge variant="soft" className="mt-2">
                  Active
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </RoleGate>
  );
}
