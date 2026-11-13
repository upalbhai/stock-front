"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { APP_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

const navItems = [
  { href: APP_ROUTES.SERVICES, label: "Services" },
  { href: APP_ROUTES.FEATURES, label: "Features" },
  { href: APP_ROUTES.ABOUT, label: "About" },
  { href: APP_ROUTES.PRICING, label: "Pricing" },
  { href: APP_ROUTES.BLOG, label: "Blog" },
  { href: APP_ROUTES.CONTACT, label: "Contact" },
];

export function MarketingHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand Logo Lockup */}
        <div className="flex items-center gap-3">
          <Link
            href={APP_ROUTES.HOME}
            className="flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-90"
            aria-label="MiniHisab Home"
          >
            {/* Mobile Logo Mark (< sm) */}
            <Image
              src="/logo-mobile.webp"
              alt="MiniHisab Mobile Logo"
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 object-contain sm:hidden dark:hidden"
              priority
            />
            <Image
              src="/logo-mobile-dark.webp"
              alt="MiniHisab Mobile Logo"
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 object-contain hidden dark:block dark:sm:hidden"
              priority
            />
            {/* Desktop Full Logo (>= sm) */}
            <Image
              src="/logo-desktop.webp"
              alt="MiniHisab Logo"
              width={160}
              height={50}
              className="h-9 w-auto shrink-0 object-contain hidden sm:block dark:hidden"
              priority
            />
            <Image
              src="/logo-desktop-dark.webp"
              alt="MiniHisab Logo"
              width={160}
              height={50}
              className="h-9 w-auto shrink-0 object-contain hidden dark:sm:block"
              priority
            />
          </Link>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden items-center gap-1 text-sm font-medium md:flex" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Items */}
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex rounded-md text-muted-foreground hover:text-foreground">
            <Link href={APP_ROUTES.LOGIN}>Sign In</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="rounded-md px-3.5 font-semibold shadow-xs"
          >
            <Link href={APP_ROUTES.DASHBOARD}>
              Dashboard <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>

          {/* Mobile Hamburger Menu Sheet */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="md:hidden h-10 w-10 text-muted-foreground hover:text-foreground rounded-md"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-xs p-6 flex flex-col justify-between">
              <div>
                <SheetHeader className="text-left pb-4 border-b border-border">
                  <SheetTitle className="flex items-center gap-2 text-base font-bold">
                    <Image
                      src="/logo-mobile.webp"
                      alt="MiniHisab"
                      width={28}
                      height={28}
                      className="h-7 w-7 object-contain dark:hidden"
                    />
                    <Image
                      src="/logo-mobile-dark.webp"
                      alt="MiniHisab"
                      width={28}
                      height={28}
                      className="h-7 w-7 object-contain hidden dark:block"
                    />
                    <span>MiniHisab</span>
                  </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col gap-1 py-6" aria-label="Mobile Navigation">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center justify-between rounded-md px-3.5 min-h-[44px] text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground font-semibold"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <span>{item.label}</span>
                          <ArrowRight className="h-4 w-4 opacity-40" />
                        </Link>
                      </SheetClose>
                    );
                  })}
                </nav>
              </div>

              <div className="flex flex-col gap-2.5 pt-4 border-t border-border">
                <SheetClose asChild>
                  <Button asChild variant="outline" className="w-full min-h-[44px] justify-center rounded-md font-medium">
                    <Link href={APP_ROUTES.LOGIN}>Sign In</Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button asChild className="w-full min-h-[44px] justify-center rounded-md font-semibold shadow-xs">
                    <Link href={APP_ROUTES.DASHBOARD}>
                      Open Dashboard <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
