import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock3, Store, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "About",
  description: "Learn how MiniHisab helps retail teams run billing, inventory, outlets, and reporting from one platform.",
  alternates: { canonical: "/about" },
};

const values = [
  { title: "Built around the counter", text: "The app is shaped for billing speed, quick stock checks, and repeat daily use.", icon: Store },
  { title: "Clear roles", text: "Owners, managers, staff, and admins get access that matches their responsibility.", icon: Users },
  { title: "Less after-hours cleanup", text: "Sales, GST, expenses, credit, and reports stay connected during the day.", icon: Clock3 },
  { title: "Reliable controls", text: "Approval flows and audit logs keep business changes accountable.", icon: BadgeCheck },
];

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">About</p>
          <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            MiniHisab is made for service businesses that sell every day.
          </h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            The platform brings retail billing, stock, staff, outlet management, and reporting into one operational dashboard. It is designed for businesses that need practical tools before they need marketing fluff.
          </p>
          <Button asChild className="mt-7 rounded-[8px]">
            <Link href={APP_ROUTES.SERVICES}>
              Explore services <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {values.map((value, index) => {
            const Icon = value.icon;
            const animationDelay = `delay-${(index + 1) * 200}`;
            return (
              <div 
                key={value.title} 
                className="rounded-[8px] border border-border bg-card p-5 shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
                style={{ animationDelay: `${(index + 1) * 150}ms` }}
              >
                <Icon className="h-6 w-6 text-primary" />
                <h2 className="mt-4 font-heading text-lg font-bold">{value.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{value.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
