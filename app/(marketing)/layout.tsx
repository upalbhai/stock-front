import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/lib/routes";

const navItems = [
  { href: APP_ROUTES.SERVICES, label: "Services" },
  { href: APP_ROUTES.ABOUT, label: "About" },
  { href: APP_ROUTES.PRICING, label: "Pricing" },
  { href: APP_ROUTES.BLOG, label: "Blog" },
  { href: APP_ROUTES.CONTACT, label: "Contact" },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href={APP_ROUTES.HOME} className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-primary text-xs font-extrabold text-primary-foreground">
              MH
            </span>
            <span className="truncate font-heading text-sm font-extrabold uppercase tracking-wide">
              MiniHisab
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-muted-foreground md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href={APP_ROUTES.LOGIN}>Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={APP_ROUTES.DASHBOARD}>
                Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        <nav className="flex gap-4 overflow-x-auto px-4 pb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground md:hidden">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="shrink-0 transition hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main>{children}</main>

      <footer className="border-t border-border bg-muted/25">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-primary text-xs font-extrabold text-primary-foreground">
                MH
              </span>
              <span className="font-heading text-sm font-extrabold uppercase tracking-wide">
                MiniHisab
              </span>
            </div>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Retail billing, inventory, outlet control, and reporting for teams that need the workday to move quickly.
            </p>
          </div>
          <div className="grid gap-2 text-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Company</p>
            <Link href={APP_ROUTES.ABOUT} className="hover:text-primary">About</Link>
            <Link href={APP_ROUTES.SERVICES} className="hover:text-primary">Services</Link>
            <Link href={APP_ROUTES.BLOG} className="hover:text-primary">Blog</Link>
            <Link href={APP_ROUTES.CONTACT} className="hover:text-primary">Contact</Link>
          </div>
          <div className="grid gap-2 text-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Product</p>
            <Link href={APP_ROUTES.PRICING} className="hover:text-primary">Pricing</Link>
            <Link href={APP_ROUTES.LOGIN} className="hover:text-primary">Login</Link>
            <Link href={APP_ROUTES.DASHBOARD} className="hover:text-primary">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
