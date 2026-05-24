"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/components/auth/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api-client";

export default function SubscribeSuccessPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [countdown, setCountdown] = useState(5);

  const { data: statusData } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: () => getJson<any>("/payments/status", token),
    enabled: !!token
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen py-20 px-4 bg-surface flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(34,197,94,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(34,197,94,0.08),rgba(0,0,0,0))]" />
      
      <Card className="relative w-full max-w-md border border-success/30 shadow-soft backdrop-blur-md bg-surface/80 rounded-3xl animate-rise text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-success mb-4">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Payment Successful!</CardTitle>
          <CardDescription className="text-base mt-2">
            Thank you for subscribing to Outlet Pulse.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {statusData?.plan && (
            <div className="bg-success/5 border border-success/10 rounded-2xl p-4 space-y-2 text-sm text-left">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted">Plan</span>
                <span className="font-semibold text-text">{statusData.plan.name}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2 pt-1">
                <span className="text-muted">Status</span>
                <span className="font-semibold text-success capitalize">{statusData.subscriptionStatus}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-muted">Next Billing Date</span>
                <span className="font-semibold text-text">
                  {statusData.currentPeriodEnd ? new Date(statusData.currentPeriodEnd).toLocaleDateString() : "-"}
                </span>
              </div>
            </div>
          )}

          <p className="text-sm text-muted">
            Redirecting to dashboard in {countdown} seconds...
          </p>

          <Button asChild className="w-full rounded-2xl py-6 font-semibold" size="lg">
            <Link href="/" className="flex items-center justify-center gap-2">
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
