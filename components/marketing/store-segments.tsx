"use client";

import * as React from "react";
import {
  ShoppingBag,
  Truck,
  Shirt,
  Wrench,
  Check,
  Receipt,
  Boxes,
  Barcode,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const segments = [
  {
    id: "retail-fmcg",
    title: "Kirana & Supermarkets",
    icon: ShoppingBag,
    summary:
      "Engineered for high-volume foot traffic where speed at the counter determines daily revenue.",
    points: [
      "Rapid barcode scanning with instant beep audio feedback",
      "Loose items and packaged goods in the same bill",
      "Split tender: Cash + UPI QR on counter soundbox",
      "Batch tracking with expiry alerts before food items spoil",
    ],
    tag: "High-Frequency Retail",
  },
  {
    id: "wholesale",
    title: "Wholesale & Distributors",
    icon: Truck,
    summary:
      "Handle high-value B2B orders with master cartons, volume discounts, and 30-day credit cycles.",
    points: [
      "Master carton to unit conversion factor per SKU",
      "Buyer GSTIN verification and auto-filled B2B tax invoices",
      "Wholesale volume pricing slabs based on order size",
      "E-Way bill transport details and printable delivery challans",
    ],
    tag: "B2B & Distribution",
  },
  {
    id: "apparel",
    title: "Apparel & Footwear",
    icon: Shirt,
    summary:
      "Organize garments across size, color, and brand variants without inventory confusion.",
    points: [
      "Multi-variant matrix (e.g. Size M, L, XL in Navy, Black)",
      "Print custom barcode labels for non-barcoded clothing",
      "Customer phone number lookups for repeat loyalty",
      "Hassle-free size exchange slips and store credit vouchers",
    ],
    tag: "Variant Matrix",
  },
  {
    id: "hardware",
    title: "Hardware & Electricals",
    icon: Wrench,
    summary:
      "Track multi-unit hardware items, contractor credit ledgers, and serial numbers with ease.",
    points: [
      "Flexible units: sell by meter, coil, kilogram, or box",
      "Contractor and electrician running credit (udhar) ledgers",
      "Serial number tracking for warranty and replacement claims",
      "Printable dispatch delivery challans and tax invoices for site materials",
    ],
    tag: "Multi-Unit & Credit",
  },
];

export function StoreSegments() {
  const [activeSegment, setActiveSegment] = React.useState(segments[0].id);
  const current = segments.find((s) => s.id === activeSegment) || segments[0];

  return (
    <div className="w-full">
      {/* Segment Selector Pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {segments.map((segment) => {
          const Icon = segment.icon;
          const isActive = segment.id === activeSegment;
          return (
            <button
              key={segment.id}
              type="button"
              onClick={() => setActiveSegment(segment.id)}
              className={cn(
                "p-4 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between h-full",
                isActive
                  ? "bg-card border-primary/40 shadow-xs ring-1 ring-primary/20"
                  : "bg-muted/30 border-border hover:bg-muted/60 hover:border-border/80 text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                    isActive
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p
                    className={cn(
                      "text-xs font-bold leading-tight",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {segment.title}
                  </p>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {segment.tag}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Segment Detail Card */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-5 space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {current.tag}
            </span>
            <h3 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
              {current.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {current.summary}
            </p>
          </div>

          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-border/70 md:pl-8">
            {current.points.map((point, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border/80 bg-muted/20 p-3.5 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">
                    Core Workflow
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                  {point}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
