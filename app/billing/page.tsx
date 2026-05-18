"use client";

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

const catalog = [
  { id: "chaas", name: "Chaas Cup", price: 25, taxRate: 0.05 },
  { id: "milk", name: "Milk", price: 45, taxRate: 0.05 },
  { id: "buttermilk", name: "Butter Milk Bottle", price: 35, taxRate: 0.05 },
  { id: "masala", name: "Masala Snacks", price: 30, taxRate: 0.05 },
  { id: "juice", name: "Fresh Juice", price: 60, taxRate: 0.05 },
  { id: "tea", name: "Tea", price: 15, taxRate: 0.05 }
];

export default function BillingPage() {
  const dispatch = useAppDispatch();
  const { items, payment } = useAppSelector((state) => state.billing);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );
  const tax = items.reduce(
    (sum, item) => sum + item.price * item.qty * item.taxRate,
    0
  );
  const total = subtotal + tax;
  const paid = payment.cash + payment.online + payment.card;
  const balance = total - paid;

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Fast Billing</CardTitle>
          <CardDescription>Tap items to add to the order</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {catalog.map((item) => (
              <button
                key={item.id}
                type="button"
                className="flex flex-col gap-2 rounded-3xl border border-border/70 bg-surface/80 p-4 text-left shadow-soft transition hover:-translate-y-0.5"
                onClick={() => dispatch(addItem(item))}
              >
                <p className="text-base font-semibold">{item.name}</p>
                <p className="text-sm text-muted">INR {item.price}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

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
                  <p className="text-xs text-muted">INR {item.price} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch(updateQty({ id: item.id, qty: item.qty - 1 }))}
                  >
                    -
                  </Button>
                  <span className="w-6 text-center text-sm font-semibold">
                    {item.qty}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch(updateQty({ id: item.id, qty: item.qty + 1 }))}
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

            <div className="rounded-2xl border border-border/70 bg-surface/70 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Subtotal</span>
                <span>INR {subtotal.toFixed(0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Tax</span>
                <span>INR {tax.toFixed(0)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span>INR {total.toFixed(0)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted">
                  {balance > 0 ? "Balance Due" : "Change"}
                </span>
                <span className="font-semibold">
                  INR {Math.abs(balance).toFixed(0)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" size="lg">
                Complete Sale
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => dispatch(clearBill())}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
