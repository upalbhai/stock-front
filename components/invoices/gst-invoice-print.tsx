"use client";

import * as React from "react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { amountInWords } from "@/lib/numberToWords";
import type { Order, Customer } from "@/lib/types";

type BusinessInfo = {
  name?: string;
  gstNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
};

type OutletInfo = {
  name?: string;
  address?: string;
  phone?: string;
};

type GstInvoicePrintProps = {
  order: Order & {
    invoiceNumber?: string;
    invoiceGeneratedAt?: string;
    taxMode?: "exclusive" | "inclusive";
    taxableAmount?: number;
    cgst?: number;
    sgst?: number;
    igst?: number;
    supplyType?: "intra" | "inter";
    items: Array<Order["items"][number] & {
      hsnCode?: string;
      soldUnit?: string;
      soldQty?: number;
      taxableAmount?: number;
      cgst?: number;
      sgst?: number;
      igst?: number;
      taxRate?: number;
    }>;
    customerId?: Customer | string | null;
  };
  business?: BusinessInfo | null;
  outlet?: OutletInfo | null;
  printRef?: React.RefObject<HTMLDivElement>;
};

export function GstInvoicePrint({ order, business, outlet, printRef }: GstInvoicePrintProps) {
  const customer =
    order.customerId && typeof order.customerId === "object"
      ? (order.customerId as Customer)
      : null;

  const isInterState = order.supplyType === "inter" || (order.igst ?? 0) > 0;

  return (
    <div ref={printRef} className="gst-invoice-print bg-white text-black p-6 max-w-[800px] mx-auto text-sm">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .gst-invoice-print, .gst-invoice-print * { visibility: visible; }
          .gst-invoice-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="text-center border-b-2 border-black pb-3 mb-4">
        <h1 className="text-xl font-bold uppercase tracking-wide">Tax Invoice</h1>
        {order.invoiceNumber && (
          <p className="text-base font-semibold mt-1">{order.invoiceNumber}</p>
        )}
        <p className="text-xs text-gray-600 mt-1">
          Bill Ref: {order.orderNumber} · {formatDateTime(order.invoiceGeneratedAt || order.createdAt)}
        </p>
        {isInterState && (
          <p className="text-[10px] font-semibold text-amber-800 mt-1 uppercase tracking-wide">
            Inter-State Supply · IGST
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
        <div className="border border-gray-300 p-3 rounded">
          <p className="font-bold uppercase text-[10px] text-gray-500 mb-1">Seller</p>
          <p className="font-semibold text-sm">{business?.name || "—"}</p>
          {business?.gstNumber && <p>GSTIN: {business.gstNumber}</p>}
          {business?.address && <p className="mt-1">{business.address}</p>}
          {business?.phone && <p>Ph: {business.phone}</p>}
          {outlet?.name && outlet.name !== business?.name && <p className="mt-1">Outlet: {outlet.name}</p>}
        </div>
        <div className="border border-gray-300 p-3 rounded">
          <p className="font-bold uppercase text-[10px] text-gray-500 mb-1">Buyer</p>
          <p className="font-semibold text-sm">{customer?.name || order.customerName || "—"}</p>
          {customer?.gstin && <p>GSTIN: {customer.gstin}</p>}
          {(customer?.address || customer?.phone) && (
            <>
              {customer.address && <p className="mt-1">{customer.address}</p>}
              {customer.phone && <p>Ph: {customer.phone}</p>}
            </>
          )}
        </div>
      </div>

      <table className="w-full border-collapse text-xs mb-4">
        <thead>
          <tr className="bg-gray-100 border border-gray-400">
            <th className="border border-gray-400 p-1.5 text-left">#</th>
            <th className="border border-gray-400 p-1.5 text-left">Description</th>
            <th className="border border-gray-400 p-1.5 text-left">HSN</th>
            <th className="border border-gray-400 p-1.5 text-right">Qty</th>
            <th className="border border-gray-400 p-1.5 text-right">Rate</th>
            <th className="border border-gray-400 p-1.5 text-right">Taxable</th>
            <th className="border border-gray-400 p-1.5 text-right">GST%</th>
            {isInterState ? (
              <th className="border border-gray-400 p-1.5 text-right">IGST</th>
            ) : (
              <>
                <th className="border border-gray-400 p-1.5 text-right">CGST</th>
                <th className="border border-gray-400 p-1.5 text-right">SGST</th>
              </>
            )}
            <th className="border border-gray-400 p-1.5 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, idx) => {
            const qty = item.soldQty ?? item.qty;
            const unit = item.soldUnit ?? item.unit ?? "pcs";
            return (
              <tr key={idx}>
                <td className="border border-gray-300 p-1.5">{idx + 1}</td>
                <td className="border border-gray-300 p-1.5">{item.name}</td>
                <td className="border border-gray-300 p-1.5">{item.hsnCode || "—"}</td>
                <td className="border border-gray-300 p-1.5 text-right">{qty} {unit}</td>
                <td className="border border-gray-300 p-1.5 text-right">{formatCurrency(item.price)}</td>
                <td className="border border-gray-300 p-1.5 text-right">
                  {formatCurrency(item.taxableAmount ?? item.price * qty)}
                </td>
                <td className="border border-gray-300 p-1.5 text-right">{item.taxRate ?? 0}%</td>
                {isInterState ? (
                  <td className="border border-gray-300 p-1.5 text-right">{formatCurrency(item.igst ?? 0)}</td>
                ) : (
                  <>
                    <td className="border border-gray-300 p-1.5 text-right">{formatCurrency(item.cgst ?? 0)}</td>
                    <td className="border border-gray-300 p-1.5 text-right">{formatCurrency(item.sgst ?? 0)}</td>
                  </>
                )}
                <td className="border border-gray-300 p-1.5 text-right font-medium">
                  {formatCurrency(item.lineTotal ?? item.price * qty)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex justify-end mb-4">
        <div className="w-64 text-xs space-y-1">
          <div className="flex justify-between">
            <span>Taxable Amount</span>
            <span>{formatCurrency(order.taxableAmount ?? order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <span>Discount</span>
              <span>-{formatCurrency(order.discount)}</span>
            </div>
          )}
          {isInterState ? (
            <div className="flex justify-between">
              <span>IGST</span>
              <span>{formatCurrency(order.igst ?? order.tax)}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between">
                <span>CGST</span>
                <span>{formatCurrency(order.cgst ?? order.tax / 2)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST</span>
                <span>{formatCurrency(order.sgst ?? order.tax / 2)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between border-t border-gray-400 pt-1 font-bold text-sm">
            <span>Grand Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
          {order.taxMode && (
            <p className="text-[10px] text-gray-500 pt-0.5">
              GST {order.taxMode === "inclusive" ? "included in rates" : "added on taxable value"}
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-gray-300 pt-3 text-xs">
        <p className="font-medium">Amount in words:</p>
        <p className="italic mt-0.5">{amountInWords(order.total)}</p>
      </div>

      {order.paymentStatus !== "paid" && (
        <p className="text-xs text-amber-700 mt-3">
          Payment: {order.paymentStatus === "partial" ? "Partially paid" : "Pending"} —
          Paid {formatCurrency(order.amountPaid ?? 0)}, Due {formatCurrency(order.amountDue ?? 0)}
        </p>
      )}

      <p className="text-[10px] text-gray-500 mt-6 text-center">
        This is a computer-generated GST invoice.
      </p>
    </div>
  );
}

export function printGstInvoice() {
  window.print();
}
