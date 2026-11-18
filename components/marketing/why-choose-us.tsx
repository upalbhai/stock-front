import * as React from "react";
import Link from "next/link";
import {
  Check,
  X,
  ArrowRight,
  Cloud,
  Zap,
  Boxes,
  ShieldCheck,
  Smartphone,
  Receipt,
} from "lucide-react";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";

const corePillars = [
  {
    icon: Cloud,
    badge: "Cloud Mobility",
    title: "Access from Any PC, Tablet, or Phone",
    description:
      "Never worry about hard drive crashes, lost local backup files, or Windows version conflicts. MiniHisab runs smoothly in any modern web browser. Check live counter sales, godown stock, and profit on your phone from anywhere in the world.",
    link: "/features",
    linkText: "Explore cloud POS features",
  },
  {
    icon: Zap,
    badge: "Counter Speed",
    title: "Built for Busy Lines with Fast Hotkeys",
    description:
      "Clear long queues during evening peak hours with instant barcode gun scanning, keyboard hotkeys, and automated split payments (cash + UPI QR). New cashiers master the intuitive register in under 5 minutes with zero training.",
    link: "/features",
    linkText: "See counter billing capabilities",
  },
  {
    icon: Boxes,
    badge: "Inventory Precision",
    title: "Buy in Master Cartons, Sell in Loose Pieces",
    description:
      "Goods arrive in bulk cartons or sacks, but shoppers buy individual packets or loose portions. MiniHisab automatically reduces master carton counts when individual units sell, eliminating manual math and inventory shrinkage.",
    link: "/features",
    linkText: "Learn about dual-unit inventory",
  },
];

const comparisonRows = [
  {
    capability: "Counter Checkout Speed",
    minihisab: "0.8s barcode scan with keyboard hotkeys & instant thermal cut",
    paper: "Slow manual pen calculations, long customer queues",
    excel: "Manual row typing, prone to formula errors & slow lookup",
    legacy: "Multi-level menus built for accountants, not retail cashiers",
  },
  {
    capability: "Accessibility & Mobility",
    minihisab: "100% Cloud: view sales & stock live on phone, tablet, or PC",
    paper: "Physical register locked inside the shop counter",
    excel: "File saved on one computer, impossible to access on phone",
    legacy: "Tied to single desktop installation with complex manual backups",
  },
  {
    capability: "Carton to Loose Unit Sync",
    minihisab: "Native master carton conversion ratios calculated automatically",
    paper: "Forgotten loose sales and inaccurate end-of-month stock counts",
    excel: "Complex manual VLOOKUP formulas that frequently break",
    legacy: "Requires separate manual stock adjustments and debit notes",
  },
  {
    capability: "Customer Udhar & Credit Khata",
    minihisab: "Digital customer ledger with credit limit alarms & WhatsApp slips",
    paper: "Dog-eared notebooks, lost pages, and awkward settlement disputes",
    excel: "No customer payment alerts, disconnected from cash drawer",
    legacy: "Complex accounting journal entries requiring accountant setup",
  },
  {
    capability: "Staff Security & Profit Privacy",
    minihisab: "Individual staff PINs: cashiers never see purchase margins",
    paper: "Zero access controls: anyone can read purchase receipts",
    excel: "All purchase rates and margins visible to anyone opening file",
    legacy: "Complicated permission configurations that require IT technicians",
  },
  {
    capability: "Hardware Compatibility",
    minihisab: "Works with any standard USB/Bluetooth barcode scanner & thermal printer",
    paper: "None: fully manual",
    excel: "Limited to standard office A4 laser printers",
    legacy: "Often restricted to proprietary drivers or specific operating systems",
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-16 md:py-24 border-b border-border/70 bg-gradient-to-b from-background via-muted/10 to-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Built Different for Retail &amp; Wholesale
            </span>
            <h2 className="mt-3 font-heading text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl text-foreground">
              Why shop owners choose MiniHisab over manual registers and complex software.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Purpose-built for counter checkout speed, accurate carton inventory, and real-time multi-branch visibility without expensive hardware or IT technicians.
            </p>
          </div>
        </ScrollReveal>

        {/* 3 Core Differentiator Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-16">
          {corePillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <ScrollReveal key={pillar.title} delay={i * 80}>
                <div className="apple-card-hover rounded-xl border border-border bg-card p-6 shadow-xs h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-primary">
                        {pillar.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-heading text-lg font-bold text-foreground leading-snug">
                        {pillar.title}
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                        {pillar.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border/70">
                    <Link
                      href={pillar.link}
                      className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
                    >
                      {pillar.linkText} <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Comprehensive Comparison Table */}
        <ScrollReveal delay={120}>
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-border bg-muted/20">
              <h3 className="font-heading text-xl font-bold text-foreground">
                Operational Capabilities Matrix
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                See how MiniHisab simplifies counter billing and inventory management compared to manual methods.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-border bg-muted/40 font-semibold text-foreground">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6 w-1/4">Operational Need</th>
                    <th className="py-3.5 px-4 sm:px-6 w-1/4 bg-primary/10 text-primary font-bold">
                      MiniHisab (Modern Cloud POS)
                    </th>
                    <th className="py-3.5 px-4 sm:px-6 w-1/6">
                      Paper Registers &amp; Bahi Khata
                    </th>
                    <th className="py-3.5 px-4 sm:px-6 w-1/6">
                      Generic Excel Spreadsheets
                    </th>
                    <th className="py-3.5 px-4 sm:px-6 w-1/6">
                      Legacy Accounting Software
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-muted-foreground">
                  {comparisonRows.map((row, index) => (
                    <tr
                      key={row.capability}
                      className={index % 2 === 0 ? "bg-card" : "bg-muted/10"}
                    >
                      <td className="py-4 px-4 sm:px-6 font-semibold text-foreground">
                        {row.capability}
                      </td>
                      <td className="py-4 px-4 sm:px-6 bg-primary/5 text-foreground font-medium">
                        <div className="flex items-start gap-1.5">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5 stroke-[2.5]" />
                          <span>{row.minihisab}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <span>{row.paper}</span>
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <span>{row.excel}</span>
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <span>{row.legacy}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
