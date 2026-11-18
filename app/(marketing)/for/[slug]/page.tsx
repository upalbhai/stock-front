import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ReceiptText,
  Boxes,
  Printer,
  ShieldCheck,
  Zap,
  HelpCircle,
  Laptop,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { APP_ROUTES } from "@/lib/routes";
import {
  industrySolutionSchema,
  breadcrumbSchema,
  faqSchema,
} from "@/lib/jsonld";
import {
  INDUSTRY_VERTICALS,
  IndustryVertical,
} from "@/config/industry-verticals";
import { BillingPreview, InventoryPreview } from "@/components/marketing/feature-previews";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return Object.keys(INDUSTRY_VERTICALS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data: IndustryVertical | undefined = INDUSTRY_VERTICALS[params.slug];

  if (!data) {
    return {
      title: "Industry Solution Not Found | MiniHisab",
    };
  }

  const url = `https://minihisab.com/for/${data.slug}`;

  return {
    title: data.metaTitle,
    description: data.metaDescription,
    keywords: data.keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: data.metaTitle,
      description: data.metaDescription,
      url,
      type: "website",
      siteName: "MiniHisab",
    },
    twitter: {
      card: "summary_large_image",
      title: data.metaTitle,
      description: data.metaDescription,
    },
  };
}

export default function IndustryVerticalPage({ params }: Props) {
  const data = INDUSTRY_VERTICALS[params.slug];

  if (!data) {
    notFound();
  }

  const industryJsonLd = industrySolutionSchema({
    name: data.name,
    slug: data.slug,
    description: data.metaDescription,
  });

  const breadcrumbsJsonLd = breadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Solutions", url: "/features" },
    { name: data.shortName, url: `/for/${data.slug}` },
  ]);

  const faqsJsonLd = faqSchema(data.faqs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([industryJsonLd, breadcrumbsJsonLd, faqsJsonLd]),
        }}
      />

      <div className="bg-background text-foreground">
        {/* ── 1. HERO SECTION ──────────────────────────────────────────────── */}
        <section className="border-b border-border/70 bg-gradient-to-b from-muted/20 to-background pt-8 pb-12 md:pt-12 md:pb-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <Breadcrumbs
                  items={[
                    { name: "Solutions", url: "/features" },
                    { name: data.shortName, url: `/for/${data.slug}` },
                  ]}
                />

                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {data.badge}
                  </span>
                </div>

                <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-foreground leading-[1.15]">
                  {data.headline}
                </h1>

                <p className="text-sm sm:text-base leading-relaxed text-muted-foreground max-w-2xl">
                  {data.subheadline}
                </p>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-lg font-semibold shadow-xs apple-button-press"
                  >
                    <Link href={APP_ROUTES.DASHBOARD}>
                      Open Live Dashboard <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-lg font-semibold apple-button-press"
                  >
                    <Link href={APP_ROUTES.PRICING}>View Pricing Plans</Link>
                  </Button>
                </div>

                <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-muted-foreground border-t border-border/70">
                  <span className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-primary shrink-0 stroke-[2.5]" />
                    <span>0.8s barcode scan</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-primary shrink-0 stroke-[2.5]" />
                    <span>Digital customer khata</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-primary shrink-0 stroke-[2.5]" />
                    <span>Thermal receipts &amp; GST</span>
                  </span>
                </div>
              </div>

              {/* Right Column (5 cols): Interactive Simulation */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-lg">
                  <BillingPreview />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. CORE BOTTLENECKS ELIMINATED ─────────────────────────────── */}
        <section className="py-12 md:py-16 border-b border-border/70 bg-muted/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="max-w-2xl mb-10">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Specific Store Bottlenecks
                </span>
                <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
                  Tailored to solve the three biggest daily challenges in your {data.shortName}.
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Generic accounting software slows down checkout counters. MiniHisab is built around the daily realities of your specific trade.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid gap-6 md:grid-cols-3">
              {data.painPoints.map((item, idx) => (
                <ScrollReveal key={item.title} delay={idx * 80}>
                  <div className="rounded-xl border border-border bg-card p-6 shadow-xs h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-destructive">
                        <span>Challenge {idx + 1}</span>
                      </div>
                      <h3 className="mt-3 font-heading text-base font-bold text-foreground">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-border/70">
                      <p className="text-xs font-semibold text-primary flex items-start gap-1.5">
                        <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 stroke-[2.5]" />
                        <span>{item.remedy}</span>
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. KEY FEATURES FOR THIS TRADE ──────────────────────────────── */}
        <section className="py-12 md:py-16 border-b border-border/70">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Tailored Capabilities
                  </span>
                  <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
                    Everything you need to run your {data.shortName} efficiently.
                  </h2>
                </div>

                <div className="space-y-4">
                  {data.keyFeatures.map((feat) => (
                    <div
                      key={feat.title}
                      className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-1.5"
                    >
                      <h3 className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary shrink-0" />
                        {feat.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                        {feat.description}
                      </p>
                      <p className="text-[11px] font-semibold text-primary pl-6">
                        ★ {feat.benefit}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-lg">
                  <InventoryPreview />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. RECOMMENDED POS HARDWARE SETUP ────────────────────────────── */}
        <section className="py-12 md:py-16 bg-muted/20 border-b border-border/70">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="max-w-2xl mb-8">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Hardware Freedom
                </span>
                <h2 className="mt-1.5 font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
                  Recommended hardware for your {data.shortName}.
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Zero proprietary vendor locks. MiniHisab connects smoothly to everyday Indian retail hardware over USB, Bluetooth, or LAN.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid gap-4 sm:grid-cols-3">
              {data.hardwareAdvice.map((hw, i) => (
                <div
                  key={hw.category}
                  className="rounded-xl border border-border bg-card p-5 shadow-xs"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">
                    {hw.category}
                  </p>
                  <p className="mt-2 text-xs sm:text-sm text-foreground leading-relaxed">
                    {hw.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. FREQUENTLY ASKED QUESTIONS ───────────────────────────────── */}
        <section className="py-12 md:py-16 border-b border-border/70">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center mb-10">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Common Questions
                </span>
                <h2 className="mt-1.5 font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
                  Frequently Asked Questions for {data.name}
                </h2>
              </div>
            </ScrollReveal>

            <div className="space-y-4">
              {data.faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="rounded-xl border border-border bg-card p-5 shadow-xs"
                >
                  <h3 className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                    {faq.question}
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-muted-foreground pl-6">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. CONVERSION CTA ────────────────────────────────────────────── */}
        <section className="py-14 md:py-20 bg-card">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Ready to Upgrade?
            </span>
            <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
              Try MiniHisab for your {data.shortName} today.
            </h2>
            <p className="max-w-xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
              Launch your store register in under two minutes. Import your existing product catalog via Excel/CSV, test barcode billing, and speed up your checkout counter.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-lg font-semibold shadow-xs apple-button-press"
              >
                <Link href={APP_ROUTES.DASHBOARD}>
                  Open Live Dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-lg font-semibold apple-button-press"
              >
                <Link href={APP_ROUTES.PRICING}>View Pricing Plans</Link>
              </Button>
            </div>
            <p className="pt-1 text-xs text-muted-foreground">
              Runs in Chrome, Safari, and Edge. Works across Windows, Mac, Android, and iOS.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
