import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to MiniHisab to manage billing, inventory, outlets, and reports.",
  alternates: { canonical: "/login" },
  robots: { index: true, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
