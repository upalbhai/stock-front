"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Script from "next/script";
import {
  AlertCircle,
  FileText,
  CheckCircle2,
  CreditCard,
  Building2,
  Copy,
  Upload,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  Sparkles,
  Store,
  Package,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/auth-provider";
import { apiFetch, getJson, getJsonWithMeta } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/error";
import { APP_ROUTES } from "@/lib/routes";
import { businessService } from "@/services/business.service";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Download } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

const AVAILABLE_FEATURES = [
  { key: "retail_billing", label: "Retail POS Billing", desc: "Quick counter billing, takeaway and dine-in" },
  { key: "wholesale_billing", label: "Wholesale Billing", desc: "Bulk billing in peti/crate with manual pricing" },
  { key: "packaging_units", label: "Packaging Units", desc: "Peti/crate packaging on products" },
  { key: "gst_invoices", label: "GST Invoices", desc: "CGST/SGST invoice generation" },
  { key: "credit_khata", label: "Credit / Khata", desc: "Partial payments and customer balance" },
  { key: "customers", label: "Customer Directory", desc: "Saved customers with GSTIN and balance" },
  { key: "bulk_stock_in", label: "Bulk Stock Receive", desc: "Receive stock in peti/crate units" },
  { key: "order_void", label: "Void Bills", desc: "Void wrong entries with audit trail" },
  { key: "order_history", label: "Order History", desc: "View and reprint past bills" },
  { key: "notifications", label: "In-App Notifications", desc: "Alerts for orders and stock thresholds" },
];

export default function SubscribePage() {
  const router = useRouter();
  const { user, token, logout, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [transactionId, setTransactionId] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(10);

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [preferredCurrency, setPreferredCurrency] = useState<string>("INR");
  const [preferredBillingCycle, setPreferredBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [planRequestForm, setPlanRequestForm] = useState({
    maxOutlets: 1,
    maxProducts: 50,
    notes: "",
  });

  const { data: statusData, refetch: refetchStatus } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: () => getJson<any>("/payments/status", token),
    enabled: !!token,
  });

  const { data: historyResult, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ["payment-history", historyPage, historyLimit],
    queryFn: () =>
      getJsonWithMeta<{ history: any[] }>("/payments/history", token, {
        page: historyPage,
        limit: historyLimit,
      }),
    enabled: !!token,
  });

  const history = historyResult?.data?.history ?? [];
  const historyMeta = historyResult?.meta?.pagination;

  const { data: bankData } = useQuery({
    queryKey: ["bank-details"],
    queryFn: () => getJson<any>("/payments/bank-details", token),
    enabled: !!token,
  });

  useEffect(() => {
    if (user?.role === "superadmin") {
      router.push(APP_ROUTES.ADMIN);
    }
  }, [user, router]);

  useEffect(() => {
    if (statusData) {
      setPlanRequestForm((f) => ({
        ...f,
        maxOutlets: statusData.maxOutlets || 1,
        maxProducts: statusData.maxProducts != null ? statusData.maxProducts : 50,
      }));
      if (statusData.currency) {
        setPreferredCurrency(statusData.currency);
      } else if (statusData.isInternational) {
        setPreferredCurrency("USD");
      }
      if (statusData.customPlanDetails?.billingCycle) {
        setPreferredBillingCycle(
          statusData.customPlanDetails.billingCycle === "yearly" ? "yearly" : "monthly"
        );
      } else if (statusData.pendingCustomPlan?.billingCycle) {
        setPreferredBillingCycle(
          statusData.pendingCustomPlan.billingCycle === "yearly" ? "yearly" : "monthly"
        );
      }
      if (Array.isArray(statusData.customPlanDetails?.enabledFeatures)) {
        setSelectedFeatures(statusData.customPlanDetails.enabledFeatures);
      } else if (Array.isArray(statusData.pendingCustomPlan?.enabledFeatures)) {
        setSelectedFeatures(statusData.pendingCustomPlan.enabledFeatures);
      }
    }
  }, [statusData]);

  const uploadMutation = useMutation({
    mutationFn: (data: any) => apiFetch("/payments/manual", { method: "POST", body: data, token }),
    onSuccess: () => {
      setSuccess("Payment submitted. We will verify the transfer and activate your plan, usually within 24 hours.");
      setTransactionId("");
      setScreenshotFile(null);
      queryClient.invalidateQueries({ queryKey: ["subscription-status"] });
      queryClient.invalidateQueries({ queryKey: ["payment-history"] });
      refetchHistory();
    },
    onError: (err) => {
      setError(getErrorMessage(err, "Failed to upload payment details"));
    },
  });

  const requestPlanMutation = useMutation({
    mutationFn: (data: any) => businessService.requestCustomPlan(data, token),
    onSuccess: () => {
      setSuccess("Plan request submitted successfully! Our team will review it and provide a quote shortly.");
      queryClient.invalidateQueries({ queryKey: ["subscription-status"] });
      refetchStatus();
    },
    onError: (err) => {
      setError(getErrorMessage(err, "Failed to submit plan request"));
    },
  });

  const requestGraceMutation = useMutation({
    mutationFn: (notes?: string | void) =>
      apiFetch("/payments/request-grace", {
        method: "POST",
        body: { notes: typeof notes === "string" ? notes : "Store owner requested 3-day grace period to complete payment" },
        token,
      }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-status"] });
      if (refreshUser) {
        await refreshUser();
      }
      window.location.href = APP_ROUTES.DASHBOARD;
    },
    onError: (err) => {
      setError(getErrorMessage(err, "Failed to request grace period"));
    },
  });

  const toggleFeature = (key: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const copyText = async (label: string, value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      setError("Could not copy. Please copy the details manually.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!transactionId.trim()) {
      setError("Please enter the UTR / UPI reference number");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("utr", transactionId.trim());

      if (screenshotFile) {
        if (screenshotFile.size > 1.5 * 1024 * 1024) {
          setError("Screenshot must be under 1.5 MB");
          return;
        }
        formData.append("screenshot", screenshotFile);
      }

      uploadMutation.mutate(formData);
    } catch (err) {
      setError(getErrorMessage(err, "Could not submit payment"));
    }
  };

  const handleDownloadInvoice = (payment: any) => {
    const printWindow = window.open("", "_blank");
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
              <span class="status ${
                payment.status === "active" || payment.status === "verified"
                  ? "success"
                  : payment.status === "rejected"
                  ? "danger"
                  : "warning"
              }">
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
          ${
            payment.rejectionReason
              ? `<p style="color:#d93025; margin-top: 20px;"><strong>Rejection Note:</strong> ${payment.rejectionReason}</p>`
              : ""
          }
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

      const orderResponse: any = await apiFetch("/payments/create-order", {
        method: "POST",
        body: { isCustomPlan: true },
        token,
      });

      const { orderId, amount, currency, keyId } = orderResponse.data;

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
            await apiFetch("/payments/verify", {
              method: "POST",
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                isCustomPlan: true,
              },
              token,
            });

            setSuccess("Payment successful! Your subscription is now active.");
            queryClient.invalidateQueries({ queryKey: ["subscription-status"] });
            refetchStatus();
            if (refreshUser) {
              await refreshUser();
            }
            setTimeout(() => {
              window.location.href = APP_ROUTES.DASHBOARD;
            }, 1500);
          } catch (err) {
            setError(getErrorMessage(err, "Payment verification failed. Please contact support."));
          } finally {
            setIsRazorpayLoading(false);
          }
        },
        prefill: {
          name: user?.name || "",
          email: (user as any)?.email || "",
        },
        theme: {
          color: "#0f172a",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setError(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to initiate payment. Please try again or use manual transfer."
        )
      );
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
      features: selectedFeatures,
      currency: preferredCurrency,
      billingCycle: preferredBillingCycle,
    });
  };

  const isTrialExpired = user?.trialExpired;
  const isLocked = user?.subscriptionStatus === "payment_locked";
  const isActive = statusData?.subscriptionStatus === "active";
  const isTrial = statusData?.subscriptionStatus === "trial";

  const hasCustomPlan = Boolean(
    statusData?.customPlanDetails &&
    typeof statusData.customPlanDetails.price === "number"
  );
  const hasPendingPlan = Boolean(statusData?.pendingCustomPlan?.requestedAt);
  const pendingManual = statusData?.pendingManualPayment;
  const lastRejected = statusData?.lastRejectedManualPayment;
  const bank = bankData?.bankDetails || {};
  const dueAmount = statusData?.customPlanDetails?.price ?? 0;
  const dueCurrency =
    statusData?.customPlanDetails?.currency || statusData?.currency || "INR";
  const billingCycle =
    statusData?.customPlanDetails?.billingCycle === "yearly" ? "yearly" : "monthly";
  const isComplimentary = dueAmount === 0;
  const isPaymentDue = !isActive && dueAmount > 0;

  const assignedAgent = statusData?.agent;
  const agentPhoneClean = assignedAgent?.phone
    ? assignedAgent.phone.replace(/[^0-9]/g, "")
    : "";
  const whatsappUrl = agentPhoneClean
    ? `https://wa.me/${
        agentPhoneClean.startsWith("91") ? agentPhoneClean : `91${agentPhoneClean}`
      }?text=${encodeURIComponent(
        `Hello ${assignedAgent.name}, I am reaching out regarding my store subscription. I would like to request an upgrade for more outlets/products.`
      )}`
    : null;

  const historyStatusVariant = (status: string): "success" | "warning" | "danger" => {
    if (status === "active" || status === "verified") return "success";
    if (status === "rejected" || status === "cancelled" || status === "expired") return "danger";
    return "warning";
  };

  const formatHistoryStatus = (status: string) => status.replace(/_/g, " ");

  const renderUpgradeForm = (isTab = false) => (
    <Card className="shadow-lg border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">
              {hasCustomPlan ? "Request Plan Upgrade" : "Tell Us About Your Business"}
            </CardTitle>
            <CardDescription className="mt-1 text-sm">
              {assignedAgent
                ? `Submit your requested outlets and limits to your partner agent (${assignedAgent.name}).`
                : "Select the capacity and features you need. Our team will review and quote your plan."}
            </CardDescription>
          </div>
          {assignedAgent ? (
            <Badge variant="outline" className="border-blue-500/30 text-blue-600 bg-blue-500/10">
              Partner Managed
            </Badge>
          ) : (
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
              Direct / Self-Serve
            </Badge>
          )}
        </div>
        {isTrial && !hasCustomPlan && (
          <div className="mt-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 flex items-center gap-2.5 text-xs text-blue-700 dark:text-blue-300">
            <Sparkles className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <span>
              <strong>Free Trial Active:</strong> You have full free trial access
              {statusData?.trialEndsAt ? ` until ${new Date(statusData.trialEndsAt).toLocaleDateString()}` : ""}.
              Submit your requirements below when you are ready to configure your tailored permanent plan.
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRequestPlan} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-primary" />
                <span>Store Billing Currency</span>
              </label>
              <Select
                className="w-full"
                value={preferredCurrency}
                onValueChange={setPreferredCurrency}
                options={[
                  { value: "INR", label: "₹ INR (India - Domestic)" },
                  { value: "USD", label: "$ USD (US & Global)" },
                  { value: "AED", label: "د.إ AED (UAE)" },
                  { value: "EUR", label: "€ EUR (Eurozone)" },
                  { value: "GBP", label: "£ GBP (UK)" },
                  { value: "CAD", label: "$ CAD (Canada)" },
                  { value: "AUD", label: "$ AUD (Australia)" },
                  { value: "SGD", label: "$ SGD (Singapore)" },
                ]}
              />
              <p className="text-xs text-muted-foreground">
                Quotes and invoices will be issued in this currency.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                <span>Preferred Billing Frequency</span>
              </label>
              <Select
                className="w-full"
                value={preferredBillingCycle}
                onValueChange={(v) => setPreferredBillingCycle(v as "monthly" | "yearly")}
                options={[
                  { value: "monthly", label: "Monthly Cycle" },
                  { value: "yearly", label: "Yearly Cycle (Annual Savings)" },
                ]}
              />
              <p className="text-xs text-muted-foreground">
                Choose your desired renewal term.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Store className="h-4 w-4 text-primary" />
                <span>Requested Outlets</span>
              </label>
              <Input
                type="number"
                min="1"
                required
                value={planRequestForm.maxOutlets}
                onChange={(e) =>
                  setPlanRequestForm((f) => ({
                    ...f,
                    maxOutlets: parseInt(e.target.value) || 1,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Current: {statusData?.maxOutlets || 1} outlet(s)
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Package className="h-4 w-4 text-primary" />
                <span>Requested Product SKUs</span>
              </label>
              <Input
                type="number"
                min="0"
                required
                value={planRequestForm.maxProducts}
                onChange={(e) =>
                  setPlanRequestForm((f) => ({
                    ...f,
                    maxProducts: parseInt(e.target.value) || 0,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Enter 0 for unlimited catalog capacity.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-primary" />
              <span>Requested Feature Modules</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {AVAILABLE_FEATURES.map((feat) => {
                const isSelected = selectedFeatures.includes(feat.key);
                return (
                  <button
                    key={feat.key}
                    type="button"
                    onClick={() => toggleFeature(feat.key)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary/50 bg-primary/5 shadow-2xs ring-1 ring-primary/20"
                        : "border-border/70 bg-card hover:bg-muted/40"
                    }`}
                  >
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border mt-0.5 ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-muted-foreground/40 bg-background"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground leading-tight">
                        {feat.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                        {feat.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Business Requirements & Notes (Optional)</label>
            <Textarea
              placeholder="e.g. We are opening our 2nd branch next month and need extra product capacity..."
              value={planRequestForm.notes}
              onChange={(e) =>
                setPlanRequestForm((f) => ({ ...f, notes: e.target.value }))
              }
              className="min-h-[85px] text-xs"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-sm font-semibold cursor-pointer shadow-sm"
            disabled={requestPlanMutation.isPending}
          >
            {requestPlanMutation.isPending
              ? "Submitting..."
              : assignedAgent
              ? "Send Upgrade Request to Agent"
              : "Submit Upgrade Request to Platform Team"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen py-12 px-4 bg-surface">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="max-w-2xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {!hasCustomPlan && !hasPendingPlan ? "Request a Plan" : "Subscription & Billing"}
          </h1>
          <p className="text-base text-muted-foreground">
            {!hasCustomPlan && !hasPendingPlan
              ? "Tell us what you need and we will build a tailored plan for your business."
              : "Manage your store plan, renew subscriptions, and request quota upgrades."}
          </p>

          {isLocked && (
            <div className="bg-danger/10 text-danger p-4 rounded-2xl flex flex-col items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-2 animate-pulse">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">
                  Your account is locked. Please submit payment details to restore access.
                </span>
              </div>
              <Button
                variant="outline"
                className="bg-background text-danger hover:text-danger border-danger/50 cursor-pointer"
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
              <Button variant="outline" onClick={logout} className="mt-4 cursor-pointer">
                Sign Out
              </Button>
            </div>
          )}
        </div>

        {/* ── ASSIGNED AGENT BANNER CARD (IF AGENT ASSIGNED) ──────────────── */}
        {assignedAgent && (
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 sm:p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                    Dedicated Partner Agent
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground">{assignedAgent.name}</h3>
                <p className="text-xs text-muted-foreground">
                  Your dedicated support and billing consultant for this store account.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
                {assignedAgent.phone && (
                  <a
                    href={`tel:${assignedAgent.phone}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-2xs"
                  >
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    <span>Call</span>
                  </a>
                )}
                {assignedAgent.email && (
                  <a
                    href={`mailto:${assignedAgent.email}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-2xs"
                  >
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    <span>Email</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── PENDING PLAN REQUEST BANNER (IF REVIEW IN PROGRESS) ─────────── */}
        {!success && hasPendingPlan && (
          <Card className="shadow-lg border-amber-500/30 bg-amber-500/5">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/15 p-2.5 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="h-6 w-6 text-amber-600 dark:text-amber-400 animate-pulse" />
                </div>
                <div>
                  <CardTitle className="text-lg">Plan Upgrade Request Under Review</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Submitted on{" "}
                    {statusData.pendingCustomPlan?.requestedAt
                      ? new Date(statusData.pendingCustomPlan.requestedAt).toLocaleDateString()
                      : "recently"}
                    . {assignedAgent ? `Assigned Agent: ${assignedAgent.name}` : "Platform Team"} is
                    preparing your quote.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-xl bg-card p-3 border border-border/80">
                <div>
                  <span className="text-[10px] text-muted-foreground block font-medium">Outlets</span>
                  <span className="font-bold text-foreground">
                    {statusData.pendingCustomPlan?.maxOutlets || 1}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block font-medium">Products</span>
                  <span className="font-bold text-foreground">
                    {statusData.pendingCustomPlan?.maxProducts === 0
                      ? "Unlimited"
                      : statusData.pendingCustomPlan?.maxProducts || 50}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block font-medium">Features</span>
                  <span className="font-bold text-primary">
                    {Array.isArray(statusData.pendingCustomPlan?.enabledFeatures) &&
                    statusData.pendingCustomPlan.enabledFeatures.length > 0
                      ? `${statusData.pendingCustomPlan.enabledFeatures.length} modules`
                      : "Core POS"}
                  </span>
                </div>
              </div>

              {statusData.pendingCustomPlan?.notes && (
                <div className="rounded-xl bg-card p-2.5 border border-border/80 text-xs text-muted-foreground italic">
                  Note: {statusData.pendingCustomPlan.notes}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── FIRST-TIME ONBOARDING (NO PLAN YET) ─────────────────────────── */}
        {!success && !hasCustomPlan && !hasPendingPlan && renderUpgradeForm(false)}

        {/* ── EXISTING SUBSCRIBED STORE TABS ──────────────────────────────── */}
        {!success && hasCustomPlan && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="overview">Overview & Renew</TabsTrigger>
              <TabsTrigger value="upgrade">Upgrade Plan</TabsTrigger>
              <TabsTrigger value="history">Billing History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <Card className="shadow-lg border-border/50">
                <CardHeader>
                  <CardTitle>Current Subscription</CardTitle>
                  <CardDescription>Review your plan status and features.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="font-medium text-muted-foreground">Status</span>
                    <Badge
                      variant={
                        isActive
                          ? "success"
                          : isTrial
                          ? "warning"
                          : "danger"
                      }
                      className="capitalize"
                    >
                      {statusData?.subscriptionStatus?.replace("_", " ") || "Unknown"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="font-medium text-muted-foreground">Plan Expiry / Renewal</span>
                    <span className="font-semibold text-foreground">
                      {statusData?.currentPeriodEnd
                        ? new Date(statusData.currentPeriodEnd).toLocaleDateString()
                        : statusData?.trialEndsAt
                        ? new Date(statusData.trialEndsAt).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="font-medium text-muted-foreground">Store Outlets</span>
                    <span className="font-semibold text-foreground">
                      {statusData?.maxOutlets || "-"} outlet(s)
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="font-medium text-muted-foreground">Product Catalog Capacity</span>
                    <span className="font-semibold text-foreground">
                      {statusData?.maxProducts === 0
                        ? "Unlimited"
                        : statusData?.maxProducts || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="font-medium text-muted-foreground">Approved Plan Price</span>
                    <span className="font-semibold text-foreground">
                      {isComplimentary
                        ? "Complimentary (₹0 / $0 Free)"
                        : `${dueCurrency} ${dueAmount} / ${billingCycle}`}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* State A: Subscription is Active (No payment due!) */}
              {isActive && (
                <Card className="shadow-lg border-emerald-500/30 bg-emerald-500/5">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-500/15 p-2.5 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-emerald-950 dark:text-emerald-100">
                          {isComplimentary ? "Complimentary Subscription Active" : "Store Subscription Active"}
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5">
                          Your account is active with full access to all requested features and capacity.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      No payments are required at this time. If you need to add more branches or product capacity, you can submit an upgrade request anytime.
                    </p>
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveTab("upgrade")}
                        className="cursor-pointer text-xs font-semibold"
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1.5 text-primary" />
                        Request Capacity Upgrade
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* State B: Inactive but Complimentary (Free) */}
              {!isActive && isComplimentary && (
                <Card className="shadow-lg border-emerald-500/30 bg-emerald-500/5">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-500/15 p-2.5 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-emerald-950 dark:text-emerald-100">
                          Complimentary Plan Approved
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5">
                          Your customized store plan has been approved with zero billing fees.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => {
                        refetchStatus();
                        window.location.href = APP_ROUTES.DASHBOARD;
                      }}
                      className="w-full h-12 text-sm font-semibold cursor-pointer shadow-sm"
                    >
                      Enter Store Dashboard
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* State C: Payment is Required (Price > 0 and not active) */}
              {isPaymentDue && (
                <div className="space-y-6">
                  <Card className="shadow-lg border-primary/30 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-primary">
                        <CreditCard className="h-5 w-5" />
                        Pay Online to Activate
                      </CardTitle>
                      <CardDescription>
                        Pay {dueCurrency} {dueAmount} securely via Card / Razorpay to activate your {billingCycle} subscription immediately.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        onClick={handleRazorpayCheckout}
                        className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all cursor-pointer font-semibold"
                        disabled={isRazorpayLoading}
                      >
                        {isRazorpayLoading ? "Processing..." : `Pay ${dueCurrency} ${dueAmount} with Razorpay`}
                      </Button>
                      <p className="text-center text-[11px] text-muted-foreground">
                        {dueCurrency === "INR"
                          ? "Secure checkout with UPI, Credit/Debit Cards, Netbanking & Wallets."
                          : "International Credit/Debit Cards (Visa, Mastercard, AMEX) accepted worldwide."}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Manual Bank Transfer: Only show for INR domestic payments */}
                  {dueCurrency === "INR" && (
                    <>
                      <div className="relative flex items-center py-4">
                        <div className="flex-grow border-t border-border"></div>
                        <span className="flex-shrink-0 mx-4 text-muted-foreground text-sm font-medium uppercase tracking-wider">
                          Or
                        </span>
                        <div className="flex-grow border-t border-border"></div>
                      </div>

                      <Card className="shadow border-border/50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                            Manual Bank Transfer (NEFT / UPI)
                          </CardTitle>
                          <CardDescription>
                            Transfer {dueCurrency} {dueAmount} ({billingCycle}) to the account below, then
                            submit your UTR. Verification usually takes up to 24 hours.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {bank.accountNumber || bank.upiId ? (
                            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3 text-sm">
                              <p className="font-medium text-foreground">Pay to this account</p>
                              {[
                                ["Account name", bank.accountName],
                                ["Bank", bank.bankName],
                                ["Account number", bank.accountNumber],
                                ["IFSC", bank.ifsc],
                                ["Branch", bank.branch],
                                ["UPI ID", bank.upiId],
                              ]
                                .filter(([, value]) => Boolean(value))
                                .map(([label, value]) => (
                                  <div key={label} className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="text-xs text-muted-foreground">{label}</p>
                                      <p className="font-semibold font-mono">{value}</p>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyText(label, String(value))}
                                      className="cursor-pointer"
                                    >
                                      <Copy className="h-3.5 w-3.5 mr-1" />
                                      {copiedField === label ? "Copied" : "Copy"}
                                    </Button>
                                  </div>
                                ))}
                              {bank.notes ? (
                                <p className="text-xs text-muted-foreground pt-1">{bank.notes}</p>
                              ) : null}
                              {bank.upiId ? (
                                <a
                                  className="inline-flex text-sm font-medium text-primary underline"
                                  href={`upi://pay?pa=${encodeURIComponent(
                                    bank.upiId
                                  )}&pn=${encodeURIComponent(
                                    bank.accountName || "Subscription"
                                  )}&am=${dueAmount}&cu=INR`}
                                >
                                  Open UPI app
                                </a>
                              ) : null}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-3">
                              Bank details are not published yet. Ask support for the account, then
                              submit your UTR here.
                            </p>
                          )}

                          {pendingManual ? (
                            <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 space-y-1">
                              <p className="font-medium flex items-center gap-2">
                                <Clock className="h-4 w-4" /> Transfer submitted: waiting for
                                verification
                              </p>
                              <p className="text-sm text-muted-foreground">
                                UTR:{" "}
                                <span className="font-mono font-semibold text-foreground">
                                  {pendingManual.utr}
                                </span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Submitted {new Date(pendingManual.createdAt).toLocaleString()}. You will
                                get access as soon as an admin confirms the credit.
                              </p>
                            </div>
                          ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                              {lastRejected ? (
                                <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm">
                                  <p className="font-medium text-danger">
                                    Previous transfer was rejected
                                  </p>
                                  <p className="text-muted-foreground mt-1">
                                    {lastRejected.rejectionReason}
                                  </p>
                                  <p className="text-xs mt-1">
                                    Submit a new UTR below after you transfer again.
                                  </p>
                                </div>
                              ) : null}

                              <div className="space-y-2">
                                <label className="text-sm font-medium">Amount to transfer</label>
                                <div className="px-4 py-2 bg-muted rounded-md text-foreground font-semibold border border-border">
                                  {dueCurrency} {dueAmount}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium">UTR / UPI reference *</label>
                                <Input
                                  type="text"
                                  required
                                  value={transactionId}
                                  onChange={(e) => setTransactionId(e.target.value)}
                                  placeholder="e.g. 123456789012"
                                />
                                <p className="text-xs text-muted-foreground">
                                  From your bank SMS or UPI app after the transfer.
                                </p>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium">Payment screenshot (optional)</label>
                                <Input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                                />
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Upload className="h-3 w-3" /> JPEG, PNG or WebP, max 1.5 MB. Helps us
                                  verify faster.
                                </p>
                              </div>

                              <Button
                                type="submit"
                                variant="secondary"
                                className="w-full h-12 text-lg cursor-pointer"
                                disabled={uploadMutation.isPending}
                              >
                                {uploadMutation.isPending
                                  ? "Submitting..."
                                  : "Submit payment for verification"}
                              </Button>
                            </form>
                          )}
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="upgrade" className="mt-6">
              {renderUpgradeForm(true)}
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
                    {historyLoading ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Loading billing history...
                      </p>
                    ) : history.length > 0 ? (
                      <>
                        {history.map((payment: any) => (
                          <div
                            key={payment.id}
                            className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-border rounded-xl gap-4"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-foreground">{payment.description}</p>
                                <Badge variant="soft" className="capitalize text-[10px]">
                                  {payment.type === "manual" ? "Bank transfer" : "Online"}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {new Date(payment.date).toLocaleString()} &middot; Ref:{" "}
                                {payment.reference?.replace(/^(TXN:|UTR:)/, "") || "N/A"}
                              </p>
                              {payment.periodStart && payment.periodEnd ? (
                                <p className="text-xs text-muted-foreground">
                                  Period: {new Date(payment.periodStart).toLocaleDateString()} to{" "}
                                  {new Date(payment.periodEnd).toLocaleDateString()}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex flex-col sm:items-end gap-2 shrink-0">
                              <div className="flex items-center gap-3">
                                <span className="font-bold">
                                  {payment.currency} {payment.amount}
                                </span>
                                <Badge
                                  variant={historyStatusVariant(payment.status)}
                                  className="capitalize"
                                >
                                  {formatHistoryStatus(payment.status)}
                                </Badge>
                              </div>
                              {payment.status === "verified" || payment.status === "active" ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownloadInvoice(payment)}
                                  className="h-8 gap-1.5 text-primary cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5" /> Download Invoice
                                </Button>
                              ) : payment.status === "rejected" && payment.rejectionReason ? (
                                <p className="text-xs text-danger max-w-[220px] text-right">
                                  {payment.rejectionReason}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        ))}
                        {historyMeta && historyMeta.totalPages > 1 ? (
                          <Pagination
                            page={historyMeta.page}
                            totalPages={historyMeta.totalPages}
                            pageSize={historyMeta.limit}
                            onPageChange={setHistoryPage}
                            onPageSizeChange={(size) => {
                              setHistoryLimit(size);
                              setHistoryPage(1);
                            }}
                            className="pt-2"
                          />
                        ) : null}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No billing history found.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-center pt-8 border-t border-border/50">
          <Button
            variant="ghost"
            onClick={logout}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
