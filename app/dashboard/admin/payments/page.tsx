"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PhotoProvider } from "react-photo-view";
import { adminService } from "@/services/admin.service";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";
import { formatCurrency, formatDate } from "@/lib/format";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  Mail,
  XCircle,
  Building2,
  Calendar,
  RefreshCw,
  Copy,
  Check,
  CreditCard,
  UserCheck,
  AlertCircle,
  Eye,
  FileCheck,
  ExternalLink,
} from "lucide-react";
import { ManualPaymentProof } from "@/components/admin/manual-payment-proof";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Link from "next/link";
import { APP_ROUTES } from "@/lib/routes";

export default function AdminPaymentsPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [paymentToReject, setPaymentToReject] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-manual-payments", page, limit, statusFilter],
    queryFn: () =>
      adminService.getManualPayments(token!, {
        page,
        limit,
        status: statusFilter || undefined,
      }),
    enabled: Boolean(token),
  });

  const payments = data?.data?.payments || [];
  const meta = data?.meta?.pagination;
  const totalCount = meta?.total || payments.length;

  // Counts for live chips
  const pendingCount = payments.filter(
    (p: any) => p.status === "pending_verification"
  ).length;
  const verifiedCount = payments.filter((p: any) => p.status === "verified").length;
  const rejectedCount = payments.filter((p: any) => p.status === "rejected").length;

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const verifyMutation = useMutation({
    mutationFn: (paymentId: string) =>
      adminService.verifyManualPayment(paymentId, token!),
    onSuccess: () => {
      toast.success("Payment verified and subscription activated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-manual-payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-businesses"] });
      setSelectedPayment(null);
      setIsVerifying(false);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
      setIsVerifying(false);
    },
  });

  const handleVerify = (paymentId: string) => {
    setIsVerifying(true);
    verifyMutation.mutate(paymentId);
  };

  const rejectMutation = useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: string; reason: string }) =>
      adminService.rejectManualPayment(paymentId, reason, "", token!),
    onSuccess: () => {
      toast.success("Payment rejected successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-manual-payments"] });
      setPaymentToReject(null);
      setRejectReason("");
      setIsRejecting(false);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
      setIsRejecting(false);
    },
  });

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return toast.error("Please enter a rejection reason");
    setIsRejecting(true);
    rejectMutation.mutate({ paymentId: paymentToReject._id, reason: rejectReason });
  };

  const resendInvoiceMutation = useMutation({
    mutationFn: (paymentId: string) =>
      adminService.resendManualPaymentInvoice(paymentId, token!),
    onSuccess: () => {
      toast.success("Invoice resent successfully to customer email");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const columns: ColumnDef<any>[] = [
    {
      header: "Business Tenant",
      render: (row) => {
        const bizName = row.businessId?.name || "Unknown Business";
        const bizInitial = bizName.charAt(0).toUpperCase();
        const bizId = row.businessId?._id || row.businessId || "";

        return (
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary ring-1 ring-primary/20 text-xs">
              {bizInitial}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground text-xs truncate max-w-[170px]">
                  {bizName}
                </span>
                {bizId && (
                  <Link
                    href={`/dashboard/admin/businesses?search=${encodeURIComponent(bizName)}`}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title="View business details"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
              {bizId && (
                <button
                  type="button"
                  onClick={(e) => handleCopy(bizId, e)}
                  className="group flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground font-mono transition-colors mt-0.5"
                  title="Copy business ID"
                >
                  <span>ID: {bizId.slice(0, 8)}...</span>
                  {copiedId === bizId ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100" />
                  )}
                </button>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: "Amount",
      render: (row) => (
        <div>
          <div className="text-xs font-bold text-foreground">
            {formatCurrency(row.amount, row.currency || "INR")}
          </div>
          <span className="text-[10px] text-muted-foreground uppercase font-medium">
            {row.billingCycle || "Subscription"}
          </span>
        </div>
      ),
    },
    {
      header: "Reference / UTR",
      render: (row) => {
        const utr =
          row.utr ||
          (row.screenshotUrl?.startsWith("TXN:") || row.screenshotUrl?.startsWith("UTR:")
            ? row.screenshotUrl.slice(4)
            : "");

        if (!utr) {
          return <span className="text-xs text-muted-foreground">Not provided</span>;
        }

        return (
          <button
            type="button"
            onClick={(e) => handleCopy(utr, e)}
            className="group inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-muted/40 px-2 py-1 text-xs font-mono text-foreground hover:bg-muted transition-colors"
            title="Click to copy transaction reference"
          >
            <span>{utr}</span>
            {copiedId === utr ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100" />
            )}
          </button>
        );
      },
    },
    {
      header: "Proof Receipt",
      render: (row) =>
        row.hasScreenshot ? (
          <div className="flex items-center gap-2">
            <ManualPaymentProof
              paymentId={row._id}
              token={token}
              className="h-9 w-9 rounded-md border border-border/80 shadow-2xs"
            />
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Click to inspect
            </span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <AlertCircle className="h-3 w-3 text-muted-foreground/60" />
            No receipt
          </span>
        ),
    },
    {
      header: "Partner Agent",
      render: (row) =>
        row.agentId ? (
          <div className="flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-primary" />
            <div className="text-xs font-medium text-foreground">
              {row.agentId.name || "Agent"}
            </div>
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground">Direct Signup</span>
        ),
    },
    {
      header: "Submission Date",
      render: (row) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 text-muted-foreground/70" />
          <span>{formatDate(row.createdAt)}</span>
        </div>
      ),
    },
    {
      header: "Audit Status",
      render: (row) => {
        const isVerified = row.status === "verified";
        const isPending = row.status === "pending_verification";
        const isRejected = row.status === "rejected";

        return (
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  isVerified
                    ? "bg-emerald-500"
                    : isPending
                    ? "bg-amber-500 animate-pulse"
                    : "bg-destructive"
                }`}
              />
              <Badge
                variant={isVerified ? "soft" : isPending ? "warning" : "danger"}
                className="capitalize text-[11px] font-medium"
              >
                {row.status.replace("_", " ")}
              </Badge>
            </div>
            {isRejected && row.rejectionReason && (
              <p
                className="text-[10px] text-destructive max-w-[140px] truncate"
                title={row.rejectionReason}
              >
                Reason: {row.rejectionReason}
              </p>
            )}
          </div>
        );
      },
    },
    {
      header: "Action",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5 pr-2">
          {row.status === "pending_verification" && (
            <>
              <Button
                variant="default"
                size="xs"
                className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-2xs"
                onClick={() => setSelectedPayment(row)}
                title="Verify and activate subscription"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Verify
              </Button>
              <Button
                variant="outline"
                size="xs"
                className="gap-1 text-destructive hover:bg-destructive/10 border-destructive/30 cursor-pointer shadow-2xs"
                onClick={() => setPaymentToReject(row)}
                title="Reject payment"
              >
                <XCircle className="h-3.5 w-3.5" /> Reject
              </Button>
            </>
          )}
          {row.status === "verified" && (
            <Button
              variant="outline"
              size="xs"
              className="gap-1 text-xs cursor-pointer shadow-2xs hover:bg-accent"
              onClick={() => resendInvoiceMutation.mutate(row._id)}
              disabled={
                resendInvoiceMutation.isPending &&
                resendInvoiceMutation.variables === row._id
              }
              title="Resend receipt and tax invoice"
            >
              <Mail className="h-3 w-3 text-primary" />
              <span>
                {resendInvoiceMutation.isPending &&
                resendInvoiceMutation.variables === row._id
                  ? "Sending..."
                  : "Resend Invoice"}
              </span>
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <PhotoProvider maskOpacity={0.88}>
      <div className="space-y-4 animate-in fade-in duration-300">
        {/* ── COMPACT SECTION HEADER & LIVE METRIC STRIP ───────────────────── */}
        <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground sm:text-xl">
                  Manual Payment Verifications
                </h1>
                <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-500/20 shrink-0">
                  Offline Gateway
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                Audit wire transfers, UPI proofs, and reference IDs before granting subscription access.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-7 sm:h-8 gap-1 px-2 sm:px-2.5 text-xs cursor-pointer shadow-2xs hover:bg-accent shrink-0"
            >
              <RefreshCw
                className={`h-3 w-3 ${isLoading ? "animate-spin text-primary" : "text-muted-foreground"}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>

          {/* ── COMPACT METRIC FILTER CHIPS (SLIM, ONLY 34px TALL) ─────────── */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth border-t border-border/60 pt-2.5 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
            {/* All Payments */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter("");
                setPage(1);
              }}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer shrink-0 ${
                statusFilter === ""
                  ? "border-primary bg-primary/10 text-primary font-semibold shadow-2xs"
                  : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>All Payments</span>
              <span
                className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                  statusFilter === ""
                    ? "bg-primary text-primary-foreground font-bold"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {totalCount}
              </span>
            </button>

            {/* Pending Verification */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter("pending_verification");
                setPage(1);
              }}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer shrink-0 ${
                statusFilter === "pending_verification"
                  ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold shadow-2xs"
                  : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Pending Review</span>
              <span
                className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                  statusFilter === "pending_verification"
                    ? "bg-amber-500 text-white font-bold"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {pendingCount}
              </span>
            </button>

            {/* Verified */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter("verified");
                setPage(1);
              }}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer shrink-0 ${
                statusFilter === "verified"
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-2xs"
                  : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Verified & Paid</span>
              <span
                className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                  statusFilter === "verified"
                    ? "bg-emerald-500 text-white font-bold"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {verifiedCount}
              </span>
            </button>

            {/* Rejected */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter("rejected");
                setPage(1);
              }}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer shrink-0 ${
                statusFilter === "rejected"
                  ? "border-destructive bg-destructive/10 text-destructive font-semibold shadow-2xs"
                  : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <XCircle className="h-3.5 w-3.5 text-destructive" />
              <span>Rejected</span>
              <span
                className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                  statusFilter === "rejected"
                    ? "bg-destructive text-destructive-foreground font-bold"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {rejectedCount}
              </span>
            </button>
          </div>
        </div>

        {/* ── DATA TABLE ─────────────────────────────────────────────────── */}
        <DataTable
          data={payments}
          columns={columns}
          isLoading={isLoading}
          searchQuery=""
          onSearchChange={() => {}}
          placeholderText="Filter payments..."
          onRefetch={() => queryClient.invalidateQueries({ queryKey: ["admin-manual-payments"] })}
          emptyStateText="No manual payments match the selected criteria."
          emptyStateIcon="💳"
          page={meta?.page || 1}
          limit={meta?.limit || 10}
          totalItems={meta?.total || 0}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />

        {/* ── VERIFY DIALOG ──────────────────────────────────────────────── */}
        <Dialog
          open={Boolean(selectedPayment)}
          onOpenChange={(open) => !open && !isVerifying && setSelectedPayment(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    Confirm Payment Verification
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Activate subscription after bank settlement confirmation
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3.5 pt-1">
              <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Store Tenant:</span>
                  <span className="font-semibold text-foreground">
                    {selectedPayment?.businessId?.name || "Business"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Settlement Amount:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatCurrency(
                      selectedPayment?.amount || 0,
                      selectedPayment?.currency || "INR"
                    )}
                  </span>
                </div>
                {selectedPayment?.utr && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Reference / UTR:</span>
                    <span className="font-mono font-medium text-foreground">
                      {selectedPayment.utr}
                    </span>
                  </div>
                )}
                {selectedPayment?.agentId && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Referring Agent:</span>
                    <span className="text-primary font-medium">
                      {selectedPayment.agentId.name}
                    </span>
                  </div>
                )}
              </div>

              {selectedPayment?.hasScreenshot && (
                <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-muted/20 p-3">
                  <ManualPaymentProof
                    paymentId={selectedPayment._id}
                    token={token}
                    className="h-16 w-16 rounded-lg border border-border shrink-0 shadow-2xs"
                    thumbnailClassName="object-contain bg-background"
                  />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Payment Proof Attached</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Click the thumbnail above to inspect high-resolution receipt before confirming.
                    </p>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Verifying this record immediately transitions the tenant store to active subscription, sends a PDF confirmation invoice, and disburses commission to the assigned agent if applicable.
              </p>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPayment(null)}
                disabled={isVerifying}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-2xs"
                onClick={() => handleVerify(selectedPayment._id)}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin mr-1.5" />
                    Verifying...
                  </>
                ) : (
                  "Confirm & Activate"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── REJECT DIALOG ──────────────────────────────────────────────── */}
        <Dialog
          open={Boolean(paymentToReject)}
          onOpenChange={(open) => !open && !isRejecting && setPaymentToReject(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                  <XCircle className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    Reject Offline Payment
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Provide reason for rejection to notify tenant
                  </p>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleReject} className="space-y-4 pt-1">
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                Rejecting this payment will keep the account pending or inactive and prompt the tenant to submit valid proof.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Rejection Reason *
                </label>
                <Input
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Transaction ID not found in bank ledger"
                  className="text-xs h-9"
                />
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentToReject(null)}
                  disabled={isRejecting}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={isRejecting}
                  className="font-semibold cursor-pointer shadow-2xs"
                >
                  {isRejecting ? "Rejecting..." : "Reject Payment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PhotoProvider>
  );
}
