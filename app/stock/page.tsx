"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/auth-provider";
import { getJson, postJson, type QueueResult } from "@/lib/api-client";
import { RoleGate } from "@/components/auth/role-gate";
import { useSettings } from "@/components/settings/settings-provider";

type StockItem = {
  id: string;
  name: string;
  unit: string;
  openingQty: number;
};

type Product = {
  _id: string;
  name: string;
  unit: string;
  onHandQty?: number;
};

export default function StockPage() {
  const { token, outletId } = useAuth();
  const { settings } = useSettings();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<StockItem[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["products", outletId],
    queryFn: () =>
      getJson<{ data: Product[] }>("/products", token, { outletId }),
    enabled: Boolean(token && outletId)
  });

  const products = data?.data ?? [];

  useEffect(() => {
    if (products.length && items.length === 0) {
      setItems(
        products.map((product) => ({
          id: product._id,
          name: product.name,
          unit: product.unit,
          openingQty: product.onHandQty ?? 0
        }))
      );
    }
  }, [items.length, products]);

  const updateQty = (id: string, value: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, openingQty: Math.max(0, value) } : item
      )
    );
  };

  const quickAdjust = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, openingQty: Math.max(0, item.openingQty + delta) }
          : item
      )
    );
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      postJson("/stock/opening", {
        outletId,
        items: items.map((item) => ({
          productId: item.id,
          openingQty: item.openingQty
        }))
      }, token, { queueIfOffline: settings.offlineMode }),
    onSuccess: (result) => {
      setSavedAt(new Date().toLocaleTimeString());
      if (result && (result as QueueResult).queued) {
        setNotice("Saved offline. Will sync when online.");
      } else {
        setNotice("Opening stock saved.");
      }
      queryClient.invalidateQueries({ queryKey: ["stock-summary", outletId] });
      queryClient.invalidateQueries({ queryKey: ["stock-alerts", outletId] });
    }
  });

  return (
    <RoleGate allowed={["owner", "manager"]}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Start of Day Stock</CardTitle>
            <CardDescription>Enter opening stock for each item</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 && (
              <p className="text-sm text-muted">
                Add products in Settings to begin stock entry.
              </p>
            )}
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-border/70 bg-surface/70 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold">{item.name}</p>
                    <p className="text-sm text-muted">Unit: {item.unit}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="soft"
                      size="sm"
                      onClick={() => quickAdjust(item.id, -5)}
                    >
                      -5
                    </Button>
                    <Input
                      type="number"
                      value={item.openingQty}
                      onChange={(event) =>
                        updateQty(item.id, Number(event.target.value))
                      }
                      className="w-24 text-center"
                    />
                    <Button
                      variant="soft"
                      size="sm"
                      onClick={() => quickAdjust(item.id, 5)}
                    >
                      +5
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => quickAdjust(item.id, 10)}
                    >
                      +10
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted">
              Save opening stock once counting is complete.
            </p>
            {savedAt && (
              <p className="text-xs text-muted">Saved at {savedAt}</p>
            )}
            {notice && <p className="text-xs text-muted">{notice}</p>}
            {saveMutation.isError && (
              <p className="text-xs text-danger">
                {saveMutation.error instanceof Error
                  ? saveMutation.error.message
                  : "Failed to save stock"}
              </p>
            )}
          </div>
          <Button
            size="lg"
            onClick={() => saveMutation.mutate()}
            disabled={!outletId || items.length === 0 || saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving..." : "Save Opening Stock"}
          </Button>
        </div>
      </div>
    </RoleGate>
  );
}
