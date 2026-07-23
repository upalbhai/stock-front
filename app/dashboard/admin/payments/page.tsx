"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { useAuth } from "@/components/auth/auth-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";
import { formatCurrency } from "@/lib/format";
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

  const { data, isLoading } = useQuery({
    queryKey: ["admin-manual-payments"],
    queryFn: () => adminService.getManualPayments(token!),
    enabled: Boolean(token)
  });

  const payments = data?.payments || [];

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

  if (isLoading) return <div className="p-4">Loading payments...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manual Payment Verifications</h1>
      </div>

      <div className="grid gap-4">
        {payments.map((payment: any) => (
          <Card key={payment._id}>
            <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-semibold text-lg">{payment.businessId?.name || "Unknown Business"}</h3>
                <p className="text-sm text-muted-foreground">Amount: {formatCurrency(payment.amount, payment.currency)}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant={payment.status === "verified" ? "success" : "warning"}>
                    {payment.status}
                  </Badge>
                  {payment.agentId && (
                    <Badge variant="soft">Agent: {payment.agentId.name}</Badge>
                  )}
                  <Badge variant="secondary">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full md:w-auto">
                 {payment.screenshotUrl ? (
                    <Button variant="outline" onClick={() => window.open(payment.screenshotUrl, "_blank")}>
                      View Screenshot
                    </Button>
                 ) : (
                    <span className="text-xs text-muted-foreground italic">No screenshot</span>
                 )}
                 {payment.status === "pending_verification" && (
                    <Button onClick={() => setSelectedPayment(payment)}>Verify Payment</Button>
                 )}
              </div>
            </CardContent>
          </Card>
        ))}
        {payments.length === 0 && (
          <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
            No manual payments found.
          </div>
        )}
      </div>

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
