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
import { businessService } from "@/services/business.service";
import { Textarea } from "@/components/ui/textarea";

export default function SubscribePage() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [transactionId, setTransactionId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [planRequestForm, setPlanRequestForm] = useState({
    maxOutlets: 1,
    maxProducts: 0,
    notes: ""
  });

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

  const requestPlanMutation = useMutation({
    mutationFn: (data: any) => businessService.requestCustomPlan(data, token),
    onSuccess: () => {
      setSuccess("Plan request submitted successfully! Our team will review it and provide a quote shortly.");
      // refetch status
      window.location.reload();
    },
    onError: (err) => {
      setError(getErrorMessage(err, "Failed to submit plan request"));
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

  const handleRequestPlan = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    requestPlanMutation.mutate({
      ...planRequestForm,
      features: []
    });
  };

  const isTrialExpired = user?.trialExpired;
  const isLocked = user?.subscriptionStatus === "payment_locked";

  const hasCustomPlan = !!statusData?.customPlanDetails;
  const hasPendingPlan = !!statusData?.pendingCustomPlan;

  return (
    <div className="min-h-screen py-12 px-4 bg-surface">
      <div className="max-w-2xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            {!hasCustomPlan && !hasPendingPlan ? "Request a Plan" : "Subscription"}
          </h1>
          <p className="text-lg text-muted">
            {!hasCustomPlan && !hasPendingPlan
              ? "Tell us what you need and we'll build a tailored plan for your business."
              : "Complete your payment to activate or renew your subscription."}
          </p>

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

        {!success && hasPendingPlan && !hasCustomPlan && (
          <Card className="shadow-lg border-border/50">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <CardTitle className="text-2xl">Plan Request Under Review</CardTitle>
              <CardDescription className="text-base mt-2">
                We have received your requirements and are currently putting together the best custom plan for your business. We will notify you once your plan is ready!
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {!success && !hasPendingPlan && !hasCustomPlan && (
          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle>Tell us about your business</CardTitle>
              <CardDescription>
                We'll use this information to calculate a custom plan and price for you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRequestPlan} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Number of Outlets</label>
                    <Input
                      type="number"
                      min="1"
                      required
                      value={planRequestForm.maxOutlets}
                      onChange={(e) => setPlanRequestForm(f => ({ ...f, maxOutlets: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Number of Products</label>
                    <Input
                      type="number"
                      min="0"
                      required
                      value={planRequestForm.maxProducts}
                      onChange={(e) => setPlanRequestForm(f => ({ ...f, maxProducts: parseInt(e.target.value) || 0 }))}
                    />
                    <p className="text-xs text-muted-foreground">Enter 0 if unlimited.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Additional Requirements (Optional)</label>
                  <Textarea
                    placeholder="Tell us about any specific features you need, or special requests."
                    value={planRequestForm.notes}
                    onChange={(e) => setPlanRequestForm(f => ({ ...f, notes: e.target.value }))}
                    className="min-h-[100px]"
                  />
                </div>

                <Button type="submit" className="w-full h-12 text-lg" disabled={requestPlanMutation.isPending}>
                  {requestPlanMutation.isPending ? "Submitting..." : "Request Plan Quote"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {!success && hasCustomPlan && (
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
