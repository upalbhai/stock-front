import "./globals.css";
import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { Providers } from "./providers";
import { ServiceWorkerRegister } from "@/components/service-worker";
import { GoogleAnalytics } from "@/components/google-analytics";
import { cn } from "@/lib/utils";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  verification: {
    google: "3umseRn7qiZzmUpMnvHeAK0_jpjY5JNlMCuhkEjYR8A",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans", inter.variable, plusJakarta.variable, GeistMono.variable)}
    >
      <head>
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"} crossOrigin="anonymous" />
      </head>
      <body
        className={cn(
          inter.variable,
          plusJakarta.variable,
          GeistMono.variable,
          "font-sans antialiased"
        )}
      >
        <Providers>
          <GoogleAnalytics />
          <ServiceWorkerRegister />
          <NuqsAdapter>
            {children}
          </NuqsAdapter>
        </Providers>
      </body>
    </html>
  );
}
