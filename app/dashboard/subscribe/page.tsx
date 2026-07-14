"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/components/auth/auth-provider";
import { apiFetch, apiFetchData, getJson } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/error";
import { formatCurrency } from "@/lib/format";
import { APP_ROUTES } from "@/lib/routes";
import type { Plan } from "@/lib/types";

export default function SubscribePage() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // const { data: plansData, isLoading: loadingPlans } = useQuery({
  //   queryKey: ["plans"],
  //   queryFn: () => getJson<{ plans: Plan[] }>("/plans")
  // });

  const { data: statusData } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: () => getJson<{ subscriptionStatus: string, trialEndsAt: string, currentPeriodEnd: string, plan: Plan }>("/payments/status", token),
    enabled: !!token
  });

  useEffect(() => {
    // If user is superadmin, they shouldn't be here
    if (user?.role === "superadmin") {
      router.push(APP_ROUTES.ADMIN);
    }
  }, [user, router]);

  // const handleSubscribe = async (plan: Plan) => {
  //   if (!token) {
  //     router.push(APP_ROUTES.LOGIN);
  //     return;
  //   }

  //   setLoadingPlan(plan._id);
  //   setError(null);

  //   try {
  //     // 1. Create order
  //     const orderData = await apiFetchData<{ orderId: string; keyId: string; amount: number; currency: string }>("/payments/create-order", {
  //       method: "POST",
  //       body: { planId: plan._id, billingCycle },
  //       token
  //     });

  //     if (!orderData.orderId) {
  //       throw new Error("Failed to create order");
  //     }

  //     // 2. Open Razorpay checkout
  //     const options = {
  //       key: orderData.keyId,
  //       amount: orderData.amount,
  //       currency: orderData.currency,
  //       name: "Mini Hisab",
  //       description: `${plan.name} Plan (${billingCycle})`,
  //       order_id: orderData.orderId,
  //       handler: async function (response: any) {
  //         // 3. Verify payment
  //         try {
  //           const verifyRes = await apiFetch<any>("/payments/verify", {
  //             method: "POST",
  //             body: {
  //               razorpay_payment_id: response.razorpay_payment_id,
  //               razorpay_order_id: response.razorpay_order_id,
  //               razorpay_signature: response.razorpay_signature,
  //               planId: plan._id,
  //               billingCycle
  //             },
  //             token
  //           });

  //           if (verifyRes.success) {
  //             // Force reload to update token and app state
  //             window.location.href = APP_ROUTES.SUBSCRIBE_SUCCESS;
  //           } else {
  //             setError("Payment verification failed");
  //           }
  //         } catch (err) {
  //           setError(getErrorMessage(err, "Failed to verify payment"));
  //         }
  //       },
  //       prefill: {
  //         name: user?.name || "",
  //         email: "",
  //         contact: ""
  //       },
  //       theme: {
  //         color: "#4f46e5"
  //       }
  //     };

  //     const rzp = new (window as any).Razorpay(options);
  //     rzp.on("payment.failed", function (response: any) {
  //       setError(`Payment failed: ${response.error.description}`);
  //     });
  //     rzp.open();

  //   } catch (err) {
  //     setError(getErrorMessage(err, "Payment initialization failed"));
  //   } finally {
  //     setLoadingPlan(null);
  //   }
  // };

  // const plans = plansData?.plans || [];
  const activePlanId = statusData?.plan?._id;
  const isTrialExpired = user?.trialExpired;

  return (
    <div className="min-h-screen py-12 px-4 bg-surface">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Simple, transparent pricing</h1>
          <p className="text-lg text-muted">Choose the plan that fits your business needs. Upgrade, downgrade, or cancel anytime.</p>

          {isTrialExpired && (
            <div className="bg-danger/10 text-danger p-4 rounded-2xl flex items-center justify-center gap-2 mt-4 animate-pulse">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Your free trial has expired. Please select a plan to continue using Mini Hisab.</span>
            </div>
          )}

          {error && (
            <div className="bg-danger/10 text-danger p-4 rounded-2xl flex items-center justify-center gap-2 mt-4">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">{error}</span>
            </div>
          )}
        </div>

        {/* Billing Toggle */}
        {/* <div className="flex justify-center">
          <div className="bg-border/40 p-1.5 rounded-2xl flex gap-1">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition ${billingCycle === "monthly" ? "bg-surface text-text shadow-sm" : "text-muted hover:text-text"}`}
            >
              Monthly billing
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition flex items-center gap-2 ${billingCycle === "yearly" ? "bg-surface text-text shadow-sm" : "text-muted hover:text-text"}`}
            >
              Yearly billing
              <span className="bg-success/20 text-success text-[10px] px-2 py-0.5 rounded-full">Save 20%</span>
            </button>
          </div>
        </div> */}

        {/* Pricing Cards */}
        {/* {loadingPlans ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 items-start">
            {plans.map((plan) => {
              const price = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
              const isCurrentPlan = activePlanId === plan._id;

              return (
                <Card key={plan._id} className={`relative flex flex-col h-full rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-soft ${plan.isPopular ? "border-primary shadow-soft scale-105 z-10" : "border-border/60"}`}>
                  {plan.isPopular && (
                    <div className="absolute top-0 inset-x-0 bg-primary text-primary-foreground text-xs font-bold text-center py-1.5 uppercase tracking-wider flex items-center justify-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" /> Most Popular
                    </div>
                  )}
                  
                  <CardHeader className={plan.isPopular ? "pt-10" : ""}>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
                    <div className="mt-4 flex items-baseline text-5xl font-extrabold">
                      {formatCurrency(price, currency)}
                      <span className="ml-1 text-xl font-medium text-muted">
                        /{billingCycle === "yearly" ? "yr" : "mo"}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-6">
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                        <span>Up to <strong>{plan.maxOutlets}</strong> outlets</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                        <span>Up to <strong>{plan.maxStaff}</strong> staff members</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                        <span>Up to <strong>{plan.maxProducts}</strong> products</span>
                      </li>
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <div className="p-6 pt-0">
                    {isCurrentPlan ? (
                      <Button className="w-full rounded-2xl py-6 bg-success text-success-foreground hover:bg-success" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button 
                        className="w-full rounded-2xl py-6 font-semibold" 
                        variant={plan.isPopular ? "default" : "outline"}
                        onClick={() => handleSubscribe(plan)}
                        disabled={!!loadingPlan}
                      >
                        {loadingPlan === plan._id ? "Processing..." : "Subscribe Now"}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )} */}

        {/* Footer Actions */}
        {/* <div className="flex justify-center pt-8 border-t border-border/50">
          <Button variant="ghost" onClick={logout} className="text-muted hover:text-text">
            Sign Out
          </Button>
        </div> */}
      </div>
    </div>
  );
}
