import "./globals.css";
import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { Providers } from "./providers";
import { ServiceWorkerRegister } from "@/components/service-worker";
import { cn } from "@/lib/utils";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: "Outlet Pulse",
  description: "Retail billing, inventory, outlets, staff, and reports in one operations platform.",
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
          <NuqsAdapter>
            {children}
          </NuqsAdapter>
        </Providers>
      </body>
    </html>
  );
}
