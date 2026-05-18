import "./globals.css";
import type { Metadata } from "next";
import { Sora, Space_Mono } from "next/font/google";
import Link from "next/link";
import { Providers } from "./providers";
import { SideNav, BottomNav } from "@/components/layout/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { ServiceWorkerRegister } from "@/components/service-worker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"]
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"]
});

export const metadata: Metadata = {
  title: "Retail & Outlet Manager",
  description: "Fast, mobile-first outlet operations"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sora.variable} ${spaceMono.variable} font-sans antialiased`}>
        <Providers>
          <ServiceWorkerRegister />
          <div className="min-h-screen">
            <header className="sticky top-0 z-40 border-b border-border/60 bg-surface/85 backdrop-blur">
              <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-soft">
                    RO
                  </div>
                  <div>
                    <p className="text-lg font-semibold">Outlet Pulse</p>
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <span>Outlet: Main</span>
                      <Badge variant="soft">Live</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/billing">New Bill</Link>
                  </Button>
                  <ThemeToggle />
                </div>
              </div>
            </header>

            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 pb-24 pt-6 lg:grid-cols-[240px_1fr] lg:pb-10">
              <aside className="hidden lg:block">
                <SideNav />
              </aside>
              <main className="space-y-6">{children}</main>
            </div>

            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
