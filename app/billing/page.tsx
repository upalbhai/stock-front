"use client";

import { useMemo, useState } from "react";
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
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addItem,
  clearBill,
  removeItem,
  setPayment,
  updateQty
} from "@/store/billingSlice";
import { useAuth } from "@/components/auth/auth-provider";
import { getJson, postJson, type QueueResult } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import { useSettings } from "@/components/settings/settings-provider";

type Product = {
  _id: string;
  name: string;
  price: number;
  taxRate?: number;
  gstRate?: number;
  sku?: string;
  barcode?: string;
  unit?: string;
};

type OrderResponse = {
  data: {
    _id: string;
    items: { name: string; qty: number; price: number; lineTotal: number }[];
    subtotal: number;
    tax: number;
    total: number;
    createdAt: string;
  };
};

export default function BillingPage() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { items, payment } = useAppSelector((state) => state.billing);
  const { token, outletId, user } = useAuth();
  const { settings } = useSettings();
  const [scanValue, setScanValue] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);
  const [lastOrder, setLastOrder] = useState<OrderResponse["data"] | null>(null);

  const { data } = useQuery({
    queryKey: ["products", outletId],
    queryFn: () =>
      getJson<{ data: Product[] }>("/products", token, { outletId }),
    enabled: Boolean(token && outletId)
  });

  const products = data?.data ?? [];

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );
  const tax = items.reduce(
    (sum, item) => sum + item.price * item.qty * (settings.taxEnabled ? item.taxRate : 0),
    0
  );
  const total = subtotal + tax;
  const paid = payment.cash + payment.online + payment.card;
  const balance = total - paid;

  const paymentMethod = useMemo(() => {
    const parts = [payment.cash, payment.online, payment.card].filter(
      (value) => value > 0
    );
    if (parts.length > 1) {
      return "split";
    }
    if (payment.online > 0) {
      return "online";
    }
    if (payment.card > 0) {
      return "card";
    }
    return "cash";
  }, [payment.card, payment.cash, payment.online]);

  const addProduct = (product: Product) => {
    dispatch(
      addItem({
        id: product._id,
        name: product.name,
        price: product.price,
        taxRate: settings.taxEnabled
          ? product.taxRate ?? product.gstRate ?? 0
          : 0,
        sku: product.sku,
        barcode: product.barcode,
        unit: product.unit
      })
    );
  };

  const handleScan = () => {
    const value = scanValue.trim();
    if (!value) {
      return;
    }
    const match = products.find(
      (product) => product.barcode === value || product.sku === value
    );
    if (!match) {
      setScanError("No product found for barcode or SKU.");
      return;
    }
    setScanError(null);
    setScanValue("");
    addProduct(match);
  };

  const createOrder = useMutation({
    mutationFn: () =>
      postJson<OrderResponse>(
        "/orders",
        {
          outletId,
          createdBy: user?.id,
          items: items.map((item) => ({
            productId: item.id,
            name: item.name,
            qty: item.qty,
            price: item.price,
            taxRate: item.taxRate
          })),
          payment: {
            method: paymentMethod,
            cash: payment.cash,
            online: payment.online,
            card: payment.card
          }
        },
        token,
        { queueIfOffline: settings.offlineMode }
      ),
    onSuccess: (result) => {
      if (result && (result as QueueResult).queued) {
        setLastOrder(null);
      } else {
        setLastOrder((result as OrderResponse).data);
      }
      dispatch(clearBill());
      queryClient.invalidateQueries({ queryKey: ["report", outletId] });
      queryClient.invalidateQueries({ queryKey: ["stock-summary", outletId] });
      queryClient.invalidateQueries({ queryKey: ["stock-alerts", outletId] });
    }
  });

  const readyToCharge = items.length > 0 && balance <= 0;
  const canSubmit = readyToCharge && Boolean(token && outletId);

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Fast Billing</CardTitle>
            <CardDescription>Tap items to add to the order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-2">
              <label className="text-sm">Barcode / SKU</label>
              <div className="flex gap-2">
                <Input
                  value={scanValue}
                  onChange={(event) => setScanValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleScan();
                    }
                  }}
                  placeholder="Scan barcode or type SKU"
                />
                <Button variant="outline" onClick={handleScan}>
                  Add
                </Button>
              </div>
              {scanError && <p className="text-xs text-danger">{scanError}</p>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {products.length === 0 && (
                <p className="text-sm text-muted">
                  Add products in Settings before billing.
                </p>
              )}
              {products.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  className="flex flex-col gap-2 rounded-3xl border border-border/70 bg-surface/80 p-4 text-left shadow-soft transition hover:-translate-y-0.5"
                  onClick={() => addProduct(item)}
                >
                  <p className="text-base font-semibold">{item.name}</p>
                  <p className="text-sm text-muted">{formatCurrency(item.price)}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {lastOrder && (
          <Card id="receipt" className="animate-rise">
            <CardHeader>
              <CardTitle>Receipt</CardTitle>
              <CardDescription>Order #{lastOrder._id.slice(-6)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {lastOrder.items.map((item) => (
                <div key={item.name} className="flex justify-between">
                  <span>
                    {item.name} x {item.qty}
                  </span>
                  <span>{formatCurrency(item.lineTotal)}</span>
                </div>
              ))}
              <div className="border-t border-border/70 pt-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(lastOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{settings.gstEnabled ? "GST" : "Tax"}</span>
                  <span>{formatCurrency(lastOrder.tax)}</span>
                </div>
                <div className="mt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(lastOrder.total)}</span>
                </div>
              </div>
              <Button className="no-print" onClick={() => window.print()}>
                Print Receipt
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>Adjust quantities quickly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.length === 0 && (
              <p className="text-sm text-muted">No items added yet.</p>
            )}
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-border/70 bg-surface/70 p-3"
              >
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-muted">{formatCurrency(item.price)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      dispatch(updateQty({ id: item.id, qty: item.qty - 1 }))
                    }
                  >
                    -
                  </Button>
                  <span className="w-6 text-center text-sm font-semibold">
                    {item.qty}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      dispatch(updateQty({ id: item.id, qty: item.qty + 1 }))
                    }
                  >
                    +
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dispatch(removeItem(item.id))}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Split</CardTitle>
            <CardDescription>Cash, UPI, or card</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3">
              <label className="space-y-1 text-sm">
                Cash
                <Input
                  type="number"
                  value={payment.cash}
                  onChange={(event) =>
                    dispatch(
                      setPayment({
                        field: "cash",
                        value: Number(event.target.value)
                      })
                    )
                  }
                />
              </label>
              <label className="space-y-1 text-sm">
                UPI / Online
                <Input
                  type="number"
                  value={payment.online}
                  onChange={(event) =>
                    dispatch(
                      setPayment({
                        field: "online",
                        value: Number(event.target.value)
                      })
                    )
                  }
                />
              </label>
              <label className="space-y-1 text-sm">
                Card
                <Input
                  type="number"
                  value={payment.card}
                  onChange={(event) =>
                    dispatch(
                      setPayment({
                        field: "card",
                        value: Number(event.target.value)
                      })
                    )
                  }
                />
              </label>
            </div>
            <Button
              variant="soft"
              size="sm"
              onClick={() => {
                dispatch(setPayment({ field: "cash", value: total }));
                dispatch(setPayment({ field: "online", value: 0 }));
                dispatch(setPayment({ field: "card", value: 0 }));
              }}
            >
              Pay Full Cash
            </Button>

            <div className="rounded-2xl border border-border/70 bg-surface/70 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">
                  {settings.gstEnabled ? "GST" : "Tax"}
                </span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted">
                  {balance > 0 ? "Balance Due" : "Change"}
                </span>
                <span className="font-semibold">
                  {formatCurrency(Math.abs(balance))}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                size="lg"
                onClick={() => createOrder.mutate()}
                disabled={!canSubmit || createOrder.isPending}
              >
                {createOrder.isPending ? "Saving..." : "Complete Sale"}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => dispatch(clearBill())}
              >
                Clear
              </Button>
            </div>
            {!readyToCharge && items.length > 0 && (
              <p className="text-xs text-danger">
                Collect full payment to complete sale.
              </p>
            )}
            {createOrder.isSuccess && lastOrder === null && (
              <p className="text-xs text-muted">
                Sale queued offline. It will sync once back online.
              </p>
            )}
            {createOrder.isError && (
              <p className="text-xs text-danger">
                {createOrder.error instanceof Error
                  ? createOrder.error.message
                  : "Failed to save order"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
