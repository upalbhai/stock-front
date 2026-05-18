import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const report = {
  totalSales: "INR 18,250",
  totalOrders: 186,
  cash: "INR 7,900",
  online: "INR 6,850",
  split: "INR 3,500"
};

const soldProducts = [
  { item: "Chaas Cup", qty: 210 },
  { item: "Butter Milk Bottle", qty: 120 },
  { item: "Mint Juice", qty: 98 }
];

const remainingStock = [
  { item: "Milk", qty: 12 },
  { item: "Chaas Cups", qty: 24 },
  { item: "Snacks", qty: 18 }
];

export default function ReportsPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>End of Day Summary</CardTitle>
          <CardDescription>Auto-generated report for today</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-surface/70 p-4">
            <p className="text-sm text-muted">Total Sales</p>
            <p className="text-xl font-semibold">{report.totalSales}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-surface/70 p-4">
            <p className="text-sm text-muted">Total Orders</p>
            <p className="text-xl font-semibold">{report.totalOrders}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-surface/70 p-4">
            <p className="text-sm text-muted">Cash Collected</p>
            <p className="text-xl font-semibold">{report.cash}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-surface/70 p-4">
            <p className="text-sm text-muted">Online Collected</p>
            <p className="text-xl font-semibold">{report.online}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-surface/70 p-4">
            <p className="text-sm text-muted">Split Payments</p>
            <p className="text-xl font-semibold">{report.split}</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Best Sellers</CardTitle>
            <CardDescription>Top products for the day</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {soldProducts.map((product) => (
              <div
                key={product.item}
                className="flex items-center justify-between text-sm"
              >
                <span>{product.item}</span>
                <Badge variant="soft">{product.qty} sold</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Remaining Stock</CardTitle>
            <CardDescription>Closing quantities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {remainingStock.map((item) => (
              <div
                key={item.item}
                className="flex items-center justify-between text-sm"
              >
                <span>{item.item}</span>
                <span className="text-muted">{item.qty} left</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
