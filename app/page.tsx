"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ReceiptText, Package, Store, Users, ShieldCheck, ChartNoAxesCombined } from "lucide-react";

const features = [
  { title: "Billing", description: "Create bills fast with payment tracking and receipt flow.", icon: ReceiptText },
  { title: "Stock", description: "Watch products, low stock alerts, and outlet stock movement.", icon: Package },
  { title: "Outlets", description: "Manage branches and approve new outlets before they go live.", icon: Store },
  { title: "Users & Roles", description: "Create staff, assign roles, and control permissions safely.", icon: Users },
  { title: "Approval Flow", description: "Business owners wait for admin approval before activation.", icon: ShieldCheck },
  { title: "Reports", description: "See daily sales, trends, and outlet performance in one place.", icon: ChartNoAxesCombined }
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="border-border/70 shadow-soft">
          <CardHeader>
            <Badge className="w-fit">Retail SaaS</Badge>
            <CardTitle className="text-3xl font-bold tracking-tight">Run billing, stock, outlets, and staff from one panel</CardTitle>
            <CardDescription className="text-base max-w-2xl">
              Outlet Pulse is built for retail owners who need approval-based onboarding, outlet control, role-based access, and daily reporting without extra noise.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild><Link href="/login">Go to Login <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button asChild variant="outline"><Link href="/reports">Open Reports</Link></Button>
            <Button asChild variant="soft"><Link href="/stock">Check Stock</Link></Button>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Current access</CardTitle>
            <CardDescription>Simple status for the signed-in user</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium">User:</span> {user?.name || "Guest"}</p>
            <p><span className="font-medium">Role:</span> {user?.role || "not signed in"}</p>
            <p><span className="font-medium">Mode:</span> {user ? "Inside the app" : "Public homepage"}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="border-border/70 shadow-soft">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">How it works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted space-y-2">
            <p>1. Owner signs up and waits for admin approval.</p>
            <p>2. Admin approves business and new outlets when needed.</p>
            <p>3. Owner creates roles, users, and permissions only within access limits.</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Security model</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted space-y-2">
            <p>• Email OTP login for verified access.</p>
            <p>• Role-based permissions from the API.</p>
            <p>• Admin can suspend or ban tenants and outlets.</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Main modules</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted space-y-2">
            <p>• Billing and payments</p>
            <p>• Stock and product management</p>
            <p>• Reports, audit logs, and admin controls</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
