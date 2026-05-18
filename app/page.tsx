import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const stats = [
  { label: "Today Sales", value: "INR 12,450", hint: "+8% vs yesterday" },
  { label: "Orders", value: "148", hint: "Peak hour 6-8 PM" },
  { label: "Cash Collected", value: "INR 5,240", hint: "42% of total" },
  { label: "Online + Card", value: "INR 7,210", hint: "58% of total" }
];

const payments = [
  { method: "Cash", amount: "INR 5,240" },
  { method: "UPI", amount: "INR 4,150" },
  { method: "Card", amount: "INR 3,060" },
  { method: "Split", amount: "INR 1,120" }
];

const alerts = [
  { item: "Chaas Cups", remaining: "24", level: "Low" },
  { item: "Butter Milk Bottles", remaining: "18", level: "Critical" },
  { item: "Masala Snacks", remaining: "12", level: "Low" }
];

const topProducts = [
  { item: "Chaas Cup", sold: "180" },
  { item: "Mint Juice", sold: "120" },
  { item: "Butter Milk Bottle", sold: "95" }
];

const chart = [30, 55, 45, 70, 60, 90, 75];

export default function Page() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="animate-rise">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Start fast tasks for the day</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="xl" className="flex-1">
              <Link href="/stock">Start Day Stock</Link>
            </Button>
            <Button asChild variant="outline" size="xl" className="flex-1">
              <Link href="/billing">New Billing</Link>
            </Button>
            <Button asChild variant="soft" size="xl" className="flex-1">
              <Link href="/reports">End Day Report</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="animate-rise">
          <CardHeader>
            <CardTitle>Live Payments</CardTitle>
            <CardDescription>Collected by method</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.method}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted">{payment.method}</span>
                <span className="font-semibold">{payment.amount}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="animate-rise">
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted">{stat.hint}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="animate-rise">
          <CardHeader>
            <CardTitle>Daily Performance</CardTitle>
            <CardDescription>Sales pulse by hour</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-end gap-3">
              {chart.map((value, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-2xl bg-primary/20"
                >
                  <div
                    className="rounded-2xl bg-primary"
                    style={{ height: `${value}%` }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="animate-rise">
            <CardHeader>
              <CardTitle>Stock Alerts</CardTitle>
              <CardDescription>Low stock items</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.item}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="font-medium">{alert.item}</p>
                    <p className="text-xs text-muted">
                      Remaining: {alert.remaining}
                    </p>
                  </div>
                  <Badge variant={alert.level === "Critical" ? "danger" : "warning"}>
                    {alert.level}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="animate-rise">
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best sellers today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {topProducts.map((product) => (
                <div
                  key={product.item}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium">{product.item}</span>
                  <span className="text-muted">{product.sold} sold</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
