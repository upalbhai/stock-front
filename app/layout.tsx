import "./globals.css";
import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { Providers } from "./providers";
import { ServiceWorkerRegister } from "@/components/service-worker";
import { AppShell } from "@/components/layout/app-shell";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: "Retail & Outlet Manager",
  description: "Fast, mobile-first outlet operations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans", inter.variable, plusJakarta.variable, GeistMono.variable)}
    >
      <body
        className={cn(
          inter.variable,
          plusJakarta.variable,
          GeistMono.variable,
          "font-sans antialiased"
        )}
      >
        <Providers>
          <ServiceWorkerRegister />
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
