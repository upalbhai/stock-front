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
    outletName: "",
    role: "owner"
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
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
          outletName: form.outletName,
          role: form.role as "owner" | "manager" | "staff"
        });
      }
      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Outlet Pulse</CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Sign in to continue"
              : "Create your outlet account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={mode === "login" ? "primary" : "outline"}
              size="sm"
              onClick={() => setMode("login")}
            >
              Login
            </Button>
            <Button
              variant={mode === "register" ? "primary" : "outline"}
              size="sm"
              onClick={() => setMode("register")}
            >
              Register
            </Button>
          </div>

          {mode === "register" && (
            <label className="space-y-2 text-sm">
              Owner Name
              <Input
                value={form.name}
                onChange={(event) => handleChange("name", event.target.value)}
              />
            </label>
          )}

          <label className="space-y-2 text-sm">
            Phone
            <Input
              value={form.phone}
              onChange={(event) => handleChange("phone", event.target.value)}
            />
          </label>

          <label className="space-y-2 text-sm">
            PIN
            <Input
              type="password"
              value={form.pin}
              onChange={(event) => handleChange("pin", event.target.value)}
            />
          </label>

          {mode === "register" && (
            <label className="space-y-2 text-sm">
              Outlet Name
              <Input
                value={form.outletName}
                onChange={(event) =>
                  handleChange("outletName", event.target.value)
                }
              />
            </label>
          )}

          {mode === "register" && (
            <label className="space-y-2 text-sm">
              Role
              <select
                value={form.role}
                onChange={(event) => handleChange("role", event.target.value)}
                className="h-11 w-full rounded-2xl border border-border/70 bg-surface/80 px-3 text-sm"
              >
                <option value="owner">Owner</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
              </select>
            </label>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button className="w-full" size="lg" onClick={handleSubmit}>
            {loading ? "Please wait" : mode === "login" ? "Login" : "Create"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
