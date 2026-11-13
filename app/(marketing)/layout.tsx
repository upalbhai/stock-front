import Link from "next/link";
import Image from "next/image";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { APP_ROUTES } from "@/lib/routes";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh flex flex-col bg-background text-foreground antialiased selection:bg-primary/15 selection:text-foreground">
      <MarketingHeader />

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/80 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
            {/* Brand column */}
            <div className="lg:col-span-2">
              <Link href={APP_ROUTES.HOME} className="flex items-center gap-2.5">
                <Image
                  src="/logo-desktop.webp"
                  alt="MiniHisab Logo"
                  width={160}
                  height={50}
                  className="h-9 w-auto shrink-0 object-contain dark:hidden"
                />
                <Image
                  src="/logo-desktop-dark.webp"
                  alt="MiniHisab Logo"
                  width={160}
                  height={50}
                  className="h-9 w-auto shrink-0 object-contain hidden dark:block"
                />
              </Link>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Retail billing, multi-outlet inventory, GST tax invoices, and customer credit tracking.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Works on desktop PCs, laptops, Android tablets, and mobile browsers.
              </p>
            </div>

            {/* Links column 1: Solutions */}
            <div className="flex flex-col gap-2 text-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">Solutions</p>
              <Link href={APP_ROUTES.FEATURES} className="text-muted-foreground hover:text-primary transition-colors">
                Fast Counter Billing
              </Link>
              <Link href={APP_ROUTES.FEATURES} className="text-muted-foreground hover:text-primary transition-colors">
                Inventory &amp; Low Stock
              </Link>
              <Link href={APP_ROUTES.FEATURES} className="text-muted-foreground hover:text-primary transition-colors">
                Customer Udhar Khata
              </Link>
              <Link href={APP_ROUTES.FEATURES} className="text-muted-foreground hover:text-primary transition-colors">
                GST Tax Invoices
              </Link>
              <Link href={APP_ROUTES.FEATURES} className="text-muted-foreground hover:text-primary transition-colors">
                Multi-Outlet Sync
              </Link>
            </div>

            {/* Links column 2: Product */}
            <div className="flex flex-col gap-2 text-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">Product</p>
              <Link href={APP_ROUTES.SERVICES} className="text-muted-foreground hover:text-primary transition-colors">
                Services Overview
              </Link>
              <Link href={APP_ROUTES.PRICING} className="text-muted-foreground hover:text-primary transition-colors">
                Pricing Plans
              </Link>
              <Link href={APP_ROUTES.LOGIN} className="text-muted-foreground hover:text-primary transition-colors">
                Sign In
              </Link>
              <Link href={APP_ROUTES.DASHBOARD} className="text-muted-foreground hover:text-primary transition-colors">
                Live Dashboard
              </Link>
              <Link href={APP_ROUTES.BLOG} className="text-muted-foreground hover:text-primary transition-colors">
                Retail Guide &amp; Blog
              </Link>
            </div>

            {/* Links column 3: Company & Legal */}
            <div className="flex flex-col gap-2 text-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">Company &amp; Legal</p>
              <Link href={APP_ROUTES.ABOUT} className="text-muted-foreground hover:text-primary transition-colors">
                About MiniHisab
              </Link>
              <Link href={APP_ROUTES.CONTACT} className="text-muted-foreground hover:text-primary transition-colors">
                Contact &amp; Support
              </Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/70 pt-6 text-xs text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} MiniHisab. All rights reserved.</p>
            <p>Retail &amp; Wholesale Inventory Management</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
