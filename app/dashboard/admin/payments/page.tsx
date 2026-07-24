"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";
import { formatCurrency } from "@/lib/format";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { Select } from "@/components/ui/select";
import { ExternalLink, CheckCircle, Mail } from "lucide-react";
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
  const [isVerifying, setIsVerifying] = useState(false);
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
      header: "Date",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      header: "Status",
      render: (row) => (
        <Badge variant={row.status === "verified" ? "success" : row.status === "pending_verification" ? "warning" : "secondary"}>
          {row.status.replace("_", " ")}
        </Badge>
      ),
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.screenshotUrl && (
            <Button variant="ghost" size="icon" onClick={() => window.open(row.screenshotUrl, "_blank")} title="View Screenshot">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
          {row.status === "pending_verification" && (
            <Button variant="ghost" size="icon" onClick={() => setSelectedPayment(row)} title="Verify Payment">
              <CheckCircle className="h-4 w-4 text-success" />
            </Button>
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
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setSelectedPayment(null)} disabled={isVerifying}>Cancel</Button>
              <Button onClick={() => handleVerify(selectedPayment._id)} disabled={isVerifying}>
                {isVerifying ? "Verifying..." : "Confirm Verification"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
