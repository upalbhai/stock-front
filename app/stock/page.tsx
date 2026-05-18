"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StockItem = {
  id: string;
  name: string;
  unit: string;
  openingQty: number;
};

const initialItems: StockItem[] = [
  { id: "milk", name: "Milk", unit: "L", openingQty: 50 },
  { id: "chaas", name: "Chaas Cups", unit: "cups", openingQty: 300 },
  {
    id: "buttermilk",
    name: "Butter Milk Bottles",
    unit: "bottles",
    openingQty: 120
  },
  { id: "snacks", name: "Snacks", unit: "packs", openingQty: 80 },
  { id: "juice", name: "Fresh Juice", unit: "glasses", openingQty: 60 }
];

export default function StockPage() {
  const [items, setItems] = useState<StockItem[]>(initialItems);
  const [savedAt, setSavedAt] = useState<string | null>(null);

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

  const handleSave = () => {
    setSavedAt(new Date().toLocaleTimeString());
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Start of Day Stock</CardTitle>
          <CardDescription>Enter opening stock for each item</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </div>
        <Button size="lg" onClick={handleSave}>
          Save Opening Stock
        </Button>
      </div>
    </div>
  );
}
