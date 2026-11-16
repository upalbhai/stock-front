"use client";

import * as React from "react";
import { Clock, TrendingUp, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { APP_ROUTES } from "@/lib/routes";

export function RoiCalculator() {
  const [dailyBills, setDailyBills] = React.useState(120);
  const [mode, setMode] = React.useState<"retail" | "wholesale">("retail");

  // Realistic estimates based on retail speed and reconciliation time
  const timeSavedMinutesDaily = Math.round((dailyBills * 0.5) + 30); // 30s saved per bill + 30m saved at EOD closing
  const hoursSavedMonthly = Math.round((timeSavedMinutesDaily * 30) / 60);
  const estimatedRecoveredDues = mode === "retail" 
    ? Math.round(dailyBills * 45) // Approx untracked change/khata recovery per month
    : Math.round(dailyBills * 180);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 lg:p-10 shadow-xs">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Interactive Controller */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Operational Efficiency
            </span>
            <h3 className="mt-2 font-heading text-xl sm:text-2xl font-bold text-foreground">
              See what automated billing &amp; stock control saves you
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Slide your daily bill volume to estimate time saved at the checkout counter and during evening register reconciliation.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("retail")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                mode === "retail"
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-muted/40 text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              Retail Counter
            </button>
            <button
              type="button"
              onClick={() => setMode("wholesale")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                mode === "wholesale"
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-muted/40 text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              Wholesale Godown
            </button>
          </div>

          {/* Slider */}
          <div className="space-y-3 p-4 rounded-xl border border-border/80 bg-muted/20">
            <div className="flex justify-between items-baseline">
              <label htmlFor="daily-bills-slider" className="text-xs font-semibold text-foreground">
                Average Invoices / Bills per Day:
              </label>
              <span className="font-mono text-base font-bold text-primary">
                {dailyBills} bills / day
              </span>
            </div>
            <input
              id="daily-bills-slider"
              type="range"
              min="20"
              max="400"
              step="10"
              value={dailyBills}
              onChange={(e) => setDailyBills(Number(e.target.value))}
              aria-label="Daily bills volume slider"
              className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
              <span>20 bills (Small Shop)</span>
              <span>200 (Busy Counter)</span>
              <span>400+ (Supermarket)</span>
            </div>
          </div>
        </div>

        {/* Right Metric Cards */}
        <div className="lg:col-span-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Metric 1 */}
            <div className="rounded-xl border border-border bg-muted/20 p-5 space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Time Saved</span>
              </div>
              <p className="font-mono text-3xl font-extrabold text-foreground">
                ~{hoursSavedMonthly} hrs<span className="text-xs font-sans font-normal text-muted-foreground"> / month</span>
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Faster barcode scanning, instant 80mm printing, and zero manual evening tallying.
              </p>
            </div>

            {/* Metric 2 */}
            <div className="rounded-xl border border-border bg-muted/20 p-5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Faster Recovery</span>
              </div>
              <p className="font-mono text-3xl font-extrabold text-foreground">
                14 Days<span className="text-xs font-sans font-normal text-muted-foreground"> quicker</span>
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Clear digital ledgers, running balance visibility, and credit limits prevent untracked dues.
              </p>
            </div>
          </div>

          {/* Guarantee Callout */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-foreground">
                No expensive proprietary hardware needed
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect your existing TVS/Epson thermal printers, regular USB barcode guns, and standard PCs or tablets. Zero hardware lock-in.
              </p>
            </div>
          </div>

          <div className="pt-1">
            <Button asChild className="w-full sm:w-auto font-semibold shadow-xs">
              <Link href={APP_ROUTES.DASHBOARD}>
                Test Live POS on Dashboard
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
