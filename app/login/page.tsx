"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    pin: "",
    businessName: "",
    outletName: ""
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "login") {
        await login({ phone: form.phone, pin: form.pin });
      } else {
        await register({
          name: form.name,
          phone: form.phone,
          pin: form.pin,
          businessName: form.businessName,
          outletName: form.outletName || `${form.businessName} Main`
        });
      }
      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.08),rgba(0,0,0,0))]" />

      <Card className="relative w-full max-w-md border border-border/70 shadow-soft backdrop-blur-md bg-surface/80 rounded-3xl animate-rise">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-soft font-bold text-xl mb-3">
            OP
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Outlet Pulse</CardTitle>
          <CardDescription className="text-sm text-muted">
            {mode === "login" ? "Welcome back! Enter phone and security PIN" : "Launch your retail franchise system"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mode Switcher */}
            <div className="flex bg-border/40 p-1.5 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => { setMode("login"); setError(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${mode === "login" ? "bg-surface text-text shadow-sm" : "text-muted hover:text-text"}`}
              >
                Access Portal
              </button>
              <button
                type="button"
                onClick={() => { setMode("register"); setError(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${mode === "register" ? "bg-surface text-text shadow-sm" : "text-muted hover:text-text"}`}
              >
                Launch Brand
              </button>
            </div>

            {mode === "register" && (
              <div className="space-y-3 animate-fade">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Owner Name *</label>
                  <Input
                    required
                    id="reg-name"
                    value={form.name}
                    onChange={(event) => handleChange("name", event.target.value)}
                    placeholder="Rahul Shah"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Brand / Business Name *</label>
                  <Input
                    required
                    id="reg-biz"
                    value={form.businessName}
                    onChange={(event) => handleChange("businessName", event.target.value)}
                    placeholder="e.g. Anand Lassi House"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">First Outlet Name</label>
                  <Input
                    id="reg-outlet"
                    value={form.outletName}
                    onChange={(event) => handleChange("outletName", event.target.value)}
                    placeholder="e.g. Anand Outlet (Main)"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Registered Phone *</label>
              <Input
                required
                id="login-phone"
                type="tel"
                value={form.phone}
                onChange={(event) => handleChange("phone", event.target.value)}
                placeholder="e.g. 9876543210"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Security PIN (4–6 Digits) *</label>
              <Input
                required
                id="login-pin"
                type="password"
                maxLength={6}
                value={form.pin}
                onChange={(event) => handleChange("pin", event.target.value)}
                placeholder="••••"
                className="tracking-widest text-center text-lg font-bold"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-danger/10 border border-danger/20 p-2 text-center">
                <p className="text-xs text-danger font-medium">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full py-6 text-sm font-semibold rounded-2xl shadow-soft" disabled={loading} id="login-submit-btn">
              {loading ? "Processing..." : mode === "login" ? "Sign In" : "Launch Franchise"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
