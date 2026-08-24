"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import Script from "next/script";
import { AlertCircle, FileText, CheckCircle2, CreditCard, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/auth-provider";
import { apiFetch, getJson } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/error";
import { APP_ROUTES } from "@/lib/routes";
import { businessService } from "@/services/business.service";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";

export default function SubscribePage() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [transactionId, setTransactionId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);

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

  const { data: historyData } = useQuery({
    queryKey: ["payment-history"],
    queryFn: () => getJson<any>("/payments/history", token),
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

  const handleDownloadInvoice = (payment: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${payment.reference || payment.id}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .details { margin-bottom: 40px; display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; }
            th { background-color: #f8f9fa; }
            .total { font-weight: bold; text-align: right; font-size: 1.2em; }
            .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: 500; font-size: 14px; text-transform: uppercase; }
            .success { background: #e6f4ea; color: #1e8e3e; }
            .warning { background: #fef7e0; color: #f29900; }
            .danger { background: #fce8e6; color: #d93025; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Stock Inventory Subscription Invoice</h2>
            <p>Payment Reference: ${payment.reference || payment.id}</p>
            <p>Date: ${new Date(payment.date).toLocaleString()}</p>
          </div>
          <div class="details">
            <div>
              <h3>Billed To:</h3>
              <p>${user?.name || "Business Owner"}</p>
              <p>${(user as any)?.email || ""}</p>
            </div>
            <div>
              <h3>Status:</h3>
              <span class="status ${payment.status === 'active' || payment.status === 'verified' ? 'success' : payment.status === 'rejected' ? 'danger' : 'warning'}">
                ${payment.status.replace("_", " ")}
              </span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${payment.description || "Subscription"}</td>
                <td style="text-transform: capitalize;">${payment.type}</td>
                <td>${payment.currency} ${payment.amount}</td>
              </tr>
            </tbody>
          </table>
          <div class="total">
            Total Paid: ${payment.currency} ${payment.amount}
          </div>
          ${payment.rejectionReason ? `<p style="color:#d93025; margin-top: 20px;"><strong>Rejection Note:</strong> ${payment.rejectionReason}</p>` : ''}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleRazorpayCheckout = async () => {
    try {
      setIsRazorpayLoading(true);
      setError(null);

      // 1. Create order
      const orderResponse: any = await apiFetch("/payments/create-order", {
        method: "POST",
        body: { isCustomPlan: true },
        token
      });

      const { orderId, amount, currency, keyId } = orderResponse.data;

      // 2. Initialize Razorpay options
      const options = {
        key: keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: "Stock Inventory",
        description: "Subscription Payment",
        order_id: orderId,
        handler: async function (response: any) {
          try {
            setIsRazorpayLoading(true);
            // 3. Verify payment
            await apiFetch("/payments/verify", {
              method: "POST",
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                isCustomPlan: true
              },
              token
            });
            
            setSuccess("Payment successful! Your subscription is now active.");
            setTimeout(() => {
              window.location.href = APP_ROUTES.DASHBOARD;
            }, 2000);
          } catch (err) {
            setError(getErrorMessage(err, "Payment verification failed. Please contact support."));
          } finally {
            setIsRazorpayLoading(false);
          }
        },
        prefill: {
          name: user?.name || "",
          email: (user as any)?.email || ""
        },
        theme: {
          color: "#0f172a"
        }
      };

      // 3. Open checkout
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setError(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to initiate payment. Please try again or use manual transfer."));
    } finally {
      setIsRazorpayLoading(false);
    }
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
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
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
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full flex">
              <TabsTrigger value="overview">Overview & Renew</TabsTrigger>
              <TabsTrigger value="history">Billing History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6 mt-6">
              <Card className="shadow-lg border-border/50">
                <CardHeader>
                  <CardTitle>Current Subscription</CardTitle>
                  <CardDescription>
                    Review your plan status and features.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="font-medium text-muted-foreground">Status</span>
                    <Badge variant={statusData?.subscriptionStatus === "active" ? "success" : statusData?.subscriptionStatus === "trial" ? "warning" : "danger"} className="capitalize">
                      {statusData?.subscriptionStatus?.replace("_", " ") || "Unknown"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="font-medium text-muted-foreground">Plan Expiry</span>
                    <span className="font-semibold text-foreground">
                      {statusData?.currentPeriodEnd ? new Date(statusData.currentPeriodEnd).toLocaleDateString() : (statusData?.trialEndsAt ? new Date(statusData.trialEndsAt).toLocaleDateString() : "-")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="font-medium text-muted-foreground">Max Outlets</span>
                    <span className="font-semibold text-foreground">{statusData?.maxOutlets || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="font-medium text-muted-foreground">Max Products</span>
                    <span className="font-semibold text-foreground">{statusData?.maxProducts === 0 ? "Unlimited" : statusData?.maxProducts || "-"}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="shadow-lg border-border/50 bg-primary/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <CreditCard className="h-5 w-5" />
                      Pay Online Instantly
                    </CardTitle>
                    <CardDescription>
                      Pay {statusData?.customPlanDetails?.currency || "INR"} {statusData?.customPlanDetails?.price || 0} securely via Razorpay to activate your subscription immediately.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={handleRazorpayCheckout} 
                      className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all" 
                      disabled={isRazorpayLoading}
                    >
                      {isRazorpayLoading ? "Processing..." : "Pay with Razorpay"}
                    </Button>
                  </CardContent>
                </Card>

                <div className="relative flex items-center py-4">
                  <div className="flex-grow border-t border-border"></div>
                  <span className="flex-shrink-0 mx-4 text-muted-foreground text-sm font-medium uppercase tracking-wider">Or</span>
                  <div className="flex-grow border-t border-border"></div>
                </div>

                <Card className="shadow border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      Manual Bank Transfer
                    </CardTitle>
                    <CardDescription>
                      Transfer the agreed amount to the company account and enter the transaction ID below. Verification may take up to 24 hours.
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

                      <Button type="submit" variant="secondary" className="w-full h-12 text-lg" disabled={uploadMutation.isPending}>
                        {uploadMutation.isPending ? "Submitting..." : "Submit Payment Details"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <Card className="shadow-lg border-border/50">
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>
                    View your past payments, subscription renewals, and download invoices.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {historyData?.data?.history?.length > 0 ? (
                      historyData.data.history.map((payment: any) => (
                        <div key={payment.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-border rounded-xl gap-4">
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{payment.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(payment.date).toLocaleDateString()} &middot; Ref: {payment.reference?.replace("TXN:", "") || "N/A"}
                            </p>
                          </div>
                          <div className="flex flex-col sm:items-end gap-2 shrink-0">
                            <div className="flex items-center gap-3">
                              <span className="font-bold">{payment.currency} {payment.amount}</span>
                              <Badge variant={payment.status === 'active' || payment.status === 'verified' ? 'success' : payment.status === 'rejected' ? 'danger' : 'warning'} className="capitalize">
                                {payment.status.replace("_", " ")}
                              </Badge>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleDownloadInvoice(payment)} className="h-8 gap-1.5 text-primary">
                              <Download className="w-3.5 h-3.5" /> Download Invoice
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">No billing history found.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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
