"use client";

import { useEffect, useState } from "react";
import { PhotoView } from "react-photo-view";
import { API_BASE_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

type ManualPaymentProofProps = {
  paymentId: string;
  token?: string | null;
  className?: string;
  thumbnailClassName?: string;
};

export function ManualPaymentProof({
  paymentId,
  token,
  className,
  thumbnailClassName
}: ManualPaymentProofProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!token || !paymentId) {
      setLoading(false);
      setFailed(true);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/payments/manual/${paymentId}/proof`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Proof not found");
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
        setFailed(false);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [paymentId, token]);

  if (loading) {
    return (
      <div className={cn("h-9 w-9 rounded-md bg-muted animate-pulse", className)} />
    );
  }

  if (failed || !src) {
    return null;
  }

  return (
    <PhotoView src={src}>
      <button
        type="button"
        className={cn(
          "overflow-hidden rounded-md border border-border bg-muted/40 cursor-zoom-in ring-offset-background transition hover:ring-2 hover:ring-primary/40",
          className ?? "h-9 w-9"
        )}
        title="View payment screenshot"
      >
        <img
          src={src}
          alt="Payment proof"
          className={cn("h-full w-full object-cover", thumbnailClassName)}
        />
      </button>
    </PhotoView>
  );
}
