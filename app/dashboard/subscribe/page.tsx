"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/auth-provider";
import { apiFetch, getJson } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/error";
import { APP_ROUTES } from "@/lib/routes";

export default function SubscribePage() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [transactionId, setTransactionId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: statusData } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: () => getJson<any>("/payments/status", token),
    enabled: !!token
  });

  useEffect(() => {
    if (user?.role === "superadmin") {
      router.push(APP_ROUTES.ADMIN);
    }
  }, [user, router]);

  const uploadMutation = useMutation({
    mutationFn: (data: any) => apiFetch("/payments/manual", { method: "POST", body: data, token }),
    onSuccess: () => {
      setSuccess("Payment details uploaded successfully. Your account will be activated once verified by an admin.");
      setTransactionId("");
    },
    onError: (err) => {
      setError(getErrorMessage(err, "Failed to upload payment details"));
    }
  });

  const requestGraceMutation = useMutation({
    mutationFn: () => apiFetch("/payments/request-grace", { method: "POST", token }),
    onSuccess: () => {
      // Hard reload to update auth context from new session if needed, 
      // or simply push to dashboard so it re-fetches.
      window.location.href = APP_ROUTES.DASHBOARD;
    },
    onError: (err) => {
      setError(getErrorMessage(err, "Failed to request grace period"));
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    const planPrice = statusData?.customPlanDetails?.price || 0;
    const planCurrency = statusData?.customPlanDetails?.currency || "INR";

    if (!transactionId) {
      setError("Please fill all required fields");
      return;
    }
    
    uploadMutation.mutate({
      amount: planPrice,
      currency: planCurrency,
      screenshotUrl: `TXN:${transactionId}`
    });
  };

  const isTrialExpired = user?.trialExpired;
  const isLocked = user?.subscriptionStatus === "payment_locked";

  return (
    <div className="min-h-screen py-12 px-4 bg-surface">
      <div className="max-w-2xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Upload Payment Details</h1>
          <p className="text-lg text-muted">Submit your manual payment transaction details to activate or renew your subscription.</p>

          {isLocked && (
            <div className="bg-danger/10 text-danger p-4 rounded-2xl flex flex-col items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-2 animate-pulse">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Your account is locked. Please submit payment details to restore access.</span>
              </div>
              <Button 
                variant="outline" 
                className="bg-background text-danger hover:text-danger border-danger/50"
                onClick={() => requestGraceMutation.mutate()}
                disabled={requestGraceMutation.isPending}
              >
                {requestGraceMutation.isPending ? "Requesting..." : "Unlock for 3 Days to Pay"}
              </Button>
            </div>
          )}

          {isTrialExpired && !isLocked && (
            <div className="bg-warning/20 text-warning-foreground p-4 rounded-2xl flex items-center justify-center gap-2 mt-4">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Your free trial has expired. Upload payment to continue.</span>
            </div>
          )}

          {error && (
            <div className="bg-danger/10 text-danger p-4 rounded-2xl flex items-center justify-center gap-2 mt-4">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="bg-success/10 text-success p-4 rounded-2xl flex flex-col items-center justify-center gap-2 mt-4">
              <CheckCircle2 className="h-8 w-8" />
              <span className="font-bold text-lg">{success}</span>
              <p className="text-sm">You can sign out while you wait for verification.</p>
              <Button variant="outline" onClick={logout} className="mt-4">Sign Out</Button>
            </div>
          )}
        </div>

        {!success && (
          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>
                Transfer the agreed amount to the company account and enter the transaction ID below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount Due</label>
                  <div className="flex items-center gap-2">
                    <div className="px-4 py-2 bg-muted rounded-md text-foreground font-semibold flex-1 border border-border">
                      {statusData?.customPlanDetails?.currency || "INR"} {statusData?.customPlanDetails?.price || 0}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Transaction ID / Reference Number *</label>
                  <Input 
                    type="text" 
                    required 
                    value={transactionId} 
                    onChange={(e) => setTransactionId(e.target.value)} 
                    placeholder="e.g. UTR123456789" 
                  />
                  <p className="text-xs text-muted-foreground">This helps us verify your payment quickly.</p>
                </div>

                <Button type="submit" className="w-full h-12 text-lg" disabled={uploadMutation.isPending}>
                  {uploadMutation.isPending ? "Submitting..." : "Submit Payment Details"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center pt-8 border-t border-border/50">
          <Button variant="ghost" onClick={logout} className="text-muted-foreground hover:text-foreground">
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
