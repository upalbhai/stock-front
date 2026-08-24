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
import { formatCurrency } from "@/lib/format";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CheckCircle, Mail, XCircle, Info } from "lucide-react";
import { ManualPaymentProof } from "@/components/admin/manual-payment-proof";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

  const { data, isLoading } = useQuery({
    queryKey: ["admin-manual-payments", page, limit, statusFilter],
    queryFn: () => adminService.getManualPayments(token!, { page, limit, status: statusFilter || undefined }),
    enabled: Boolean(token)
  });

  const payments = data?.data?.payments || [];
  const meta = data?.meta?.pagination;

  const verifyMutation = useMutation({
    mutationFn: (paymentId: string) => adminService.verifyManualPayment(paymentId, token!),
    onSuccess: () => {
      toast.success("Payment verified and subscription activated");
      queryClient.invalidateQueries({ queryKey: ["admin-manual-payments"] });
      setSelectedPayment(null);
      setIsVerifying(false);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
      setIsVerifying(false);
    }
  });

  const handleVerify = (paymentId: string) => {
    setIsVerifying(true);
    verifyMutation.mutate(paymentId);
  };

  const rejectMutation = useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: string, reason: string }) => 
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
    }
  });

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return toast.error("Please enter a rejection reason");
    setIsRejecting(true);
    rejectMutation.mutate({ paymentId: paymentToReject._id, reason: rejectReason });
  };

  const resendInvoiceMutation = useMutation({
    mutationFn: (paymentId: string) => adminService.resendManualPaymentInvoice(paymentId, token!),
    onSuccess: () => {
      toast.success("Invoice resent successfully");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    }
  });

  const columns: ColumnDef<any>[] = [
    {
      header: "Business",
      render: (row) => row.businessId?.name || "Unknown Business",
    },
    {
      header: "Amount",
      render: (row) => formatCurrency(row.amount, row.currency),
    },
    {
      header: "Agent",
      render: (row) => row.agentId ? row.agentId.name : "-",
    },
    {
      header: "Reference",
      render: (row) => {
        const utr = row.utr || (row.screenshotUrl?.startsWith("TXN:") || row.screenshotUrl?.startsWith("UTR:")
          ? row.screenshotUrl.slice(4)
          : "");
        return utr ? <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{utr}</span> : "-";
      },
    },
    {
      header: "Proof",
      render: (row) =>
        row.hasScreenshot ? (
          <ManualPaymentProof paymentId={row._id} token={token} />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      header: "Date",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      header: "Status",
      render: (row) => (
        <div className="flex flex-col items-start gap-1">
          <Badge variant={row.status === "verified" ? "success" : row.status === "pending_verification" ? "warning" : "danger"}>
            {row.status.replace("_", " ")}
          </Badge>
          {row.status === "rejected" && row.rejectionReason && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 max-w-[150px] truncate" title={row.rejectionReason}>
              <Info className="h-3 w-3 shrink-0" />
              {row.rejectionReason}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.status === "pending_verification" && (
            <>
              <Button variant="ghost" size="icon" onClick={() => setSelectedPayment(row)} title="Verify Payment">
                <CheckCircle className="h-4 w-4 text-success" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setPaymentToReject(row)} title="Reject Payment">
                <XCircle className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
          {row.status === "verified" && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => resendInvoiceMutation.mutate(row._id)} 
              title="Resend Invoice"
              disabled={resendInvoiceMutation.isPending && resendInvoiceMutation.variables === row._id}
            >
              <Mail className="h-4 w-4 text-primary" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <PhotoProvider maskOpacity={0.85}>
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manual Payment Verifications</h1>
      </div>

      <DataTable
        data={payments}
        columns={columns}
        isLoading={isLoading}
        searchQuery=""
        onSearchChange={() => {}}
        placeholderText="Search payments..."
        onRefetch={() => queryClient.invalidateQueries({ queryKey: ["admin-manual-payments"] })}
        emptyStateText="No manual payments found."
        emptyStateIcon="💳"
        page={meta?.page || 1}
        limit={meta?.limit || 10}
        totalItems={meta?.total || 0}
        onPageChange={setPage}
        onLimitChange={setLimit}
        filters={
          <div className="w-[180px]">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              placeholder="All Statuses"
              options={[
                { label: "All Statuses", value: "" },
                { label: "Pending", value: "pending_verification" },
                { label: "Verified", value: "verified" },
                { label: "Rejected", value: "rejected" },
              ]}
            />
          </div>
        }
        hasActiveFilters={!!statusFilter}
        onClearFilters={() => setStatusFilter("")}
      />

      <Dialog open={Boolean(selectedPayment)} onOpenChange={(open) => !open && !isVerifying && setSelectedPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment Verification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to verify this payment of <strong>{formatCurrency(selectedPayment?.amount || 0, selectedPayment?.currency)}</strong> from <strong>{selectedPayment?.businessId?.name}</strong>?
            </p>
            <p className="text-xs text-muted-foreground">
              Verifying this payment will automatically activate their subscription for another cycle and disburse the agent commission (if applicable).
            </p>
            {selectedPayment?.hasScreenshot ? (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <ManualPaymentProof
                  paymentId={selectedPayment._id}
                  token={token}
                  className="h-20 w-20"
                  thumbnailClassName="object-contain bg-background"
                />
                <p className="text-xs text-muted-foreground">Click the screenshot to zoom and inspect before verifying.</p>
              </div>
            ) : null}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setSelectedPayment(null)} disabled={isVerifying}>Cancel</Button>
              <Button onClick={() => handleVerify(selectedPayment._id)} disabled={isVerifying}>
                {isVerifying ? "Verifying..." : "Confirm Verification"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(paymentToReject)} onOpenChange={(open) => !open && !isRejecting && setPaymentToReject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReject} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please provide a reason for rejecting this payment from <strong>{paymentToReject?.businessId?.name}</strong>.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Rejection Reason *</label>
              <Input
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Transaction ID not found in bank statement"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setPaymentToReject(null)} disabled={isRejecting}>Cancel</Button>
              <Button type="submit" variant="destructive" disabled={isRejecting}>
                {isRejecting ? "Rejecting..." : "Reject Payment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    </PhotoProvider>
  );
}
