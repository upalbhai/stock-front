"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";
import { formatCurrency } from "@/lib/format";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { CheckCircle, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminPlanRequestsPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-plan-requests", page, limit, searchQuery],
    queryFn: () => adminService.getPendingPlanRequests(token!, { page, limit, search: searchQuery || undefined }),
    enabled: Boolean(token)
  });

  const requests = data?.data?.requests || [];
  const meta = data?.meta?.pagination;

  const approveMutation = useMutation({
    mutationFn: (data: { businessId: string; reason: string }) => adminService.approvePlanRequest(data.businessId, data.reason, token!),
    onSuccess: () => {
      toast.success("Plan approved successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-plan-requests"] });
      setSelectedRequest(null);
      setIsApproving(false);
      setReason("");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
      setIsApproving(false);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (data: { businessId: string; reason: string }) => adminService.rejectPlanRequest(data.businessId, data.reason, token!),
    onSuccess: () => {
      toast.success("Plan rejected successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-plan-requests"] });
      setSelectedRequest(null);
      setIsRejecting(false);
      setReason("");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
      setIsRejecting(false);
    }
  });

  const handleApprove = (businessId: string) => {
    setIsApproving(true);
    approveMutation.mutate({ businessId, reason });
  };

  const handleReject = (businessId: string) => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    setIsRejecting(true);
    rejectMutation.mutate({ businessId, reason });
  };

  const columns: ColumnDef<any>[] = [
    {
      header: "Business",
      render: (row) => row.name || "-",
    },
    {
      header: "Requested By",
      render: (row) => row.pendingCustomPlan?.requestedBy?.name || "-",
    },
    {
      header: "Requested Date",
      render: (row) => new Date(row.pendingCustomPlan?.requestedAt).toLocaleDateString(),
    },
    {
      header: "Current Plan",
      render: (row) => (
        <div className="text-sm">
          <div>{formatCurrency(row.customPlanDetails?.price || 0, row.customPlanDetails?.currency || "INR")}</div>
          <div className="text-muted-foreground text-xs">{row.maxProducts} Products / {row.maxOutlets} Outlets</div>
        </div>
      )
    },
    {
      header: "Requested Plan",
      render: (row) => (
        <div className="text-sm text-primary font-medium">
          <div>{formatCurrency(row.pendingCustomPlan?.price || 0, row.pendingCustomPlan?.currency || "INR")}</div>
          <div className="text-muted-foreground text-xs">{row.pendingCustomPlan?.maxProducts} Products / {row.pendingCustomPlan?.maxOutlets} Outlets</div>
        </div>
      )
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedRequest({ ...row, action: 'approve' }); setReason(""); }} title="Approve Request">
            <CheckCircle className="h-4 w-4 text-success" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { setSelectedRequest({ ...row, action: 'reject' }); setReason(""); }} title="Reject Request">
            <XCircle className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Custom Plan Requests</h1>
      </div>

      <DataTable
        data={requests}
        columns={columns}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholderText="Search businesses..."
        emptyStateText="No pending plan requests found."
        page={page}
        limit={limit}
        totalItems={meta?.total || 0}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      <Dialog open={!!selectedRequest} onOpenChange={(open) => { if (!open) { setSelectedRequest(null); setReason(""); }}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedRequest?.action === 'approve' ? 'Approve' : 'Reject'} Plan Change
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>
              Are you sure you want to {selectedRequest?.action} the custom plan request for <strong>{selectedRequest?.name}</strong>?
            </p>
            {selectedRequest?.action === 'approve' && (
              <div className="mt-4 p-4 border rounded-md bg-muted/30">
                <p className="text-sm font-semibold mb-2">New Plan Details:</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Price: {formatCurrency(selectedRequest.pendingCustomPlan?.price || 0, selectedRequest.pendingCustomPlan?.currency || "INR")}</li>
                  <li>Products limit: {selectedRequest.pendingCustomPlan?.maxProducts}</li>
                  <li>Outlets limit: {selectedRequest.pendingCustomPlan?.maxOutlets}</li>
                </ul>
              </div>
            )}
            
            <div className="mt-6 space-y-2">
              <label htmlFor="reason" className="text-sm font-medium leading-none">
                Reason {selectedRequest?.action === 'reject' ? <span className="text-destructive">*</span> : "(Optional)"}
              </label>
              <textarea
                id="reason"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder={selectedRequest?.action === 'reject' ? "Please provide a reason for rejection..." : "Add an optional note..."}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedRequest(null); setReason(""); }} disabled={isApproving || isRejecting}>
              Cancel
            </Button>
            {selectedRequest?.action === 'approve' ? (
              <Button 
                className="bg-success text-success-foreground hover:bg-success/90" 
                onClick={() => handleApprove(selectedRequest._id)}
                disabled={isApproving}
              >
                {isApproving ? "Approving..." : "Confirm Approve"}
              </Button>
            ) : (
              <Button 
                variant="destructive"
                onClick={() => handleReject(selectedRequest?._id)}
                disabled={isRejecting}
              >
                {isRejecting ? "Rejecting..." : "Confirm Reject"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
