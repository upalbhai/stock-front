"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  AlertCircle,
  Lock,
  Mail,
  Store,
  User,
  Phone,
  Building,
  KeyRound,
  ShieldCheck,
  Receipt,
  Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/components/auth/auth-provider";
import { getErrorMessage } from "@/lib/error";
import { APP_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

type LoginStep = "email" | "password" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const {
    loginWithEmail,
    checkEmail,
    register,
    sendOtp,
    verifyOtp,
    forgotPassword,
    resetPassword,
  } = useAuth();

  const [mode, setMode] = useState<"login" | "register" | "forgot" | "reset">("login");
  const [loginStep, setLoginStep] = useState<LoginStep>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    code: "",
    businessName: "",
    outletName: "",
    agentCode: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const urlEmail = params.get("email");
    const urlCode = params.get("code");
    if (urlEmail && urlCode) {
      setForm((prev) => ({ ...prev, email: urlEmail, code: urlCode }));
      setLoginStep("otp");
      setLoading(true);
      setSuccess("Verifying your login link...");
      verifyOtp({ email: urlEmail, code: urlCode })
        .then((res: any) => {
          if (res?.message && !res?.token && !res?.user) {
            setError(res.message);
          } else {
            const loggedInUser = res?.user || res;
            if (loggedInUser?.role === "superadmin") {
              router.push(APP_ROUTES.ADMIN);
            } else if (loggedInUser?.role === "agent") {
              router.push(APP_ROUTES.AGENT);
            } else {
              router.push(APP_ROUTES.DASHBOARD);
            }
          }
        })
        .catch((err) => {
          setError(getErrorMessage(err, "Verification failed"));
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [verifyOtp, router]);

  const handleEmailCheckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await checkEmail(form.email);
      setLoginStep(res.method);
      if (res.message) {
        setSuccess(res.message);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to verify email"));
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let loggedInUser = null;
      if (loginStep === "password") {
        const res = await loginWithEmail({ email: form.email, password: form.password });
        loggedInUser = res.user;
      } else if (loginStep === "otp") {
        const res = await verifyOtp({ email: form.email, code: form.code });
        if ((res as any).message) {
          setError((res as any).message);
          setLoading(false);
          return;
        }
        loggedInUser = (res as any).user;
      }

      if (loggedInUser?.role === "superadmin") {
        router.push(APP_ROUTES.ADMIN);
      } else if (loggedInUser?.role === "agent") {
        router.push(APP_ROUTES.AGENT);
      } else {
        router.push(APP_ROUTES.DASHBOARD);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Authentication failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await register({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        businessName: form.businessName,
        outletName: form.outletName || `${form.businessName} Main`,
        agentCode: form.agentCode || undefined,
      });

      if ((res as any)?.message) {
        setSuccess("Account created successfully. A verification code has been sent to your email.");
        setMode("login");
        setLoginStep("otp");
      } else {
        const loggedInUser = (res as any).user;
        if (loggedInUser?.role === "superadmin") {
          router.push(APP_ROUTES.ADMIN);
        } else {
          router.push(APP_ROUTES.DASHBOARD);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(form.email);
      setSuccess("If an account exists, a reset code has been sent to your email.");
      setMode("reset");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to send reset code"));
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await resetPassword({
        email: form.email,
        code: form.code,
        newPassword: form.password,
      });
      setSuccess(res.message);
      setMode("login");
      setLoginStep("email");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to reset password"));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!form.email) {
      setError("Please enter your email first");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await sendOtp(form.email);
      setSuccess("Verification code sent to your email.");
    } catch (e) {
      setError(getErrorMessage(e, "Failed to send code"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ── LEFT COLUMN: BRAND & SYSTEM CAPABILITIES (DESKTOP) ─────── */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-between space-y-8 pr-4">
            <div>
              <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
                <Image
                  src="/logo-desktop.webp"
                  alt="MiniHisab"
                  width={140}
                  height={44}
                  className="h-9 w-auto object-contain dark:hidden"
                  priority
                />
                <Image
                  src="/logo-desktop-dark.webp"
                  alt="MiniHisab"
                  width={140}
                  height={44}
                  className="h-9 w-auto object-contain hidden dark:block"
                  priority
                />
              </Link>

              <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Billing, stock control, and GST for retail and wholesale.
              </h1>

              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Log in to access your counter registers, master carton inventory, customer khata credit ledgers, and tax reports.
              </p>
            </div>

            {/* Visual Hardware Preview Card */}
            <div className="relative aspect-[16/10] w-full rounded-xl border border-border bg-card shadow-xs overflow-hidden">
              <Image
                src="/features/billing.webp"
                alt="MiniHisab POS billing counter hardware"
                fill
                sizes="50vw"
                className="object-cover"
                priority
              />
              <div className="absolute bottom-2 left-2 right-2 rounded-lg border border-border/80 bg-background/90 px-3 py-1.5 backdrop-blur-xs flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Main Counter Register</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Scanner Ready
                </span>
              </div>
            </div>

            {/* Operational Value Checklist */}
            <div className="space-y-2.5 text-xs text-muted-foreground border-t border-border/70 pt-6">
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-foreground font-medium">ESC/POS 58mm &amp; 80mm</span>
                <span>Direct thermal receipt printing</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-foreground font-medium">Unit &amp; Carton Tracking</span>
                <span>Master cartons and retail units</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-foreground font-medium">30-Day Credit Ledgers</span>
                <span>Customer Khata &amp; WhatsApp reminders</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: AUTHENTICATION FORM CARD ──────────────────── */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-xs">
              
              {/* Mobile Brand Header */}
              <div className="lg:hidden text-center mb-6">
                <Link href="/" className="inline-flex justify-center mb-3">
                  <Image
                    src="/logo-mobile.webp"
                    alt="MiniHisab"
                    width={48}
                    height={48}
                    className="h-12 w-12 object-contain dark:hidden"
                    priority
                  />
                  <Image
                    src="/logo-mobile-dark.webp"
                    alt="MiniHisab"
                    width={48}
                    height={48}
                    className="h-12 w-12 object-contain hidden dark:block"
                    priority
                  />
                </Link>
                <h2 className="font-heading text-xl font-bold text-foreground">MiniHisab</h2>
                <p className="text-xs text-muted-foreground mt-1">Retail &amp; Wholesale Operations</p>
              </div>

              {/* Mode Switcher Tabs (Sign In vs Create Store) */}
              {(mode === "login" || mode === "register") && (
                <div className="flex rounded-lg border border-border bg-muted/40 p-1 gap-1 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setLoginStep("email");
                      setError(null);
                      setSuccess(null);
                    }}
                    className={cn(
                      "flex-1 min-h-[40px] text-xs font-semibold rounded-md transition-colors",
                      mode === "login"
                        ? "bg-card text-foreground shadow-xs border border-border/80"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setError(null);
                      setSuccess(null);
                    }}
                    className={cn(
                      "flex-1 min-h-[40px] text-xs font-semibold rounded-md transition-colors",
                      mode === "register"
                        ? "bg-card text-foreground shadow-xs border border-border/80"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Create Store
                  </button>
                </div>
              )}

              {/* Form Title & Context */}
              <div className="mb-5">
                <h2 className="font-heading text-lg font-bold text-foreground">
                  {mode === "login" && "Access your account"}
                  {mode === "register" && "Set up your business store"}
                  {mode === "forgot" && "Reset your password"}
                  {mode === "reset" && "Create a new password"}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {mode === "login" && "Enter your email to sign in via password or one-time code."}
                  {mode === "register" && "Start your store trial. No credit card required."}
                  {mode === "forgot" && "Enter your registered email to receive a password reset code."}
                  {mode === "reset" && "Enter the reset code sent to your email and your new password."}
                </p>
              </div>

              {/* Alert Banners */}
              {success && (
                <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-start gap-2 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium leading-relaxed">{success}</p>
                </div>
              )}

              {error && (
                <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 flex items-start gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium leading-relaxed">{error}</p>
                </div>
              )}

              {/* Form Body */}
              <form
                onSubmit={
                  mode === "register"
                    ? handleRegisterSubmit
                    : mode === "forgot"
                    ? handleForgotSubmit
                    : mode === "reset"
                    ? handleResetSubmit
                    : mode === "login" && loginStep === "email"
                    ? handleEmailCheckSubmit
                    : handleLoginSubmit
                }
                className="space-y-4"
              >
                {/* ── REGISTER FORM FIELDS ────────────────────────────── */}
                {mode === "register" && (
                  <div className="space-y-3.5">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-foreground">
                        Owner Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="h-4 w-4 absolute left-3 top-3.5 text-muted-foreground" />
                        <Input
                          required
                          value={form.name}
                          onChange={(e) => handleChange("name", e.target.value)}
                          placeholder="e.g. Ramesh Patel"
                          className="h-11 pl-9 text-sm rounded-md"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-foreground">
                        Business Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Store className="h-4 w-4 absolute left-3 top-3.5 text-muted-foreground" />
                        <Input
                          required
                          value={form.businessName}
                          onChange={(e) => handleChange("businessName", e.target.value)}
                          placeholder="e.g. Balaji Trading Co."
                          className="h-11 pl-9 text-sm rounded-md"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-foreground">
                        Initial Outlet Name (Optional)
                      </label>
                      <div className="relative">
                        <Building className="h-4 w-4 absolute left-3 top-3.5 text-muted-foreground" />
                        <Input
                          value={form.outletName}
                          onChange={(e) => handleChange("outletName", e.target.value)}
                          placeholder="e.g. Main Counter / Central Godown"
                          className="h-11 pl-9 text-sm rounded-md"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-foreground">
                        Business Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="h-4 w-4 absolute left-3 top-3.5 text-muted-foreground" />
                        <Input
                          required
                          type="email"
                          value={form.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                          placeholder="name@business.com"
                          className="h-11 pl-9 text-sm rounded-md"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-foreground">
                        Phone Number (Optional)
                      </label>
                      <div className="relative">
                        <Phone className="h-4 w-4 absolute left-3 top-3.5 text-muted-foreground" />
                        <Input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => handleChange("phone", e.target.value)}
                          placeholder="98765 43210"
                          className="h-11 pl-9 text-sm rounded-md"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-foreground">
                        Partner Referral Code (Optional)
                      </label>
                      <Input
                        value={form.agentCode}
                        onChange={(e) => handleChange("agentCode", e.target.value)}
                        placeholder="e.g. AGT-1002"
                        className="h-11 text-sm rounded-md font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* ── LOGIN: STEP 1 (EMAIL) ───────────────────────────── */}
                {mode === "login" && loginStep === "email" && (
                  <div className="space-y-3.5">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-foreground">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="h-4 w-4 absolute left-3 top-3.5 text-muted-foreground" />
                        <Input
                          required
                          type="email"
                          value={form.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                          placeholder="you@company.com"
                          className="h-11 pl-9 text-sm rounded-md"
                          autoFocus
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── LOGIN: STEP 2 (PASSWORD) ────────────────────────── */}
                {mode === "login" && loginStep === "password" && (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-semibold text-foreground truncate">{form.email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLoginStep("email")}
                        className="text-xs text-primary hover:underline shrink-0 font-medium"
                      >
                        Change
                      </button>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-semibold text-foreground">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2 text-xs">
                          <button
                            type="button"
                            onClick={async () => {
                              setLoading(true);
                              setError(null);
                              setSuccess(null);
                              try {
                                await sendOtp(form.email);
                                setSuccess("Verification code sent to your email.");
                                setLoginStep("otp");
                              } catch (e) {
                                setError(getErrorMessage(e, "Failed to send code"));
                              } finally {
                                setLoading(false);
                              }
                            }}
                            className="text-primary hover:underline font-medium"
                          >
                            Sign in with OTP
                          </button>
                          <span className="text-muted-foreground">•</span>
                          <button
                            type="button"
                            onClick={() => setMode("forgot")}
                            className="text-primary hover:underline font-medium"
                          >
                            Forgot?
                          </button>
                        </div>
                      </div>

                      <div className="relative">
                        <Lock className="h-4 w-4 absolute left-3 top-3.5 text-muted-foreground" />
                        <Input
                          required
                          type="password"
                          value={form.password}
                          onChange={(e) => handleChange("password", e.target.value)}
                          placeholder="Enter your password"
                          className="h-11 pl-9 text-sm rounded-md"
                          autoFocus
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── LOGIN: STEP 2 (OTP CODE) ────────────────────────── */}
                {mode === "login" && loginStep === "otp" && (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-semibold text-foreground truncate">{form.email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLoginStep("email")}
                        className="text-xs text-primary hover:underline shrink-0 font-medium"
                      >
                        Change
                      </button>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-semibold text-foreground">
                          6-Digit Code <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={loading}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          Resend Code
                        </button>
                      </div>

                      <div className="flex justify-center py-1">
                        <InputOTP
                          maxLength={6}
                          value={form.code}
                          onChange={(value) => setForm((prev) => ({ ...prev, code: value }))}
                        >
                          <InputOTPGroup className="gap-1.5 sm:gap-2">
                            <InputOTPSlot index={0} className="w-10 sm:w-11 h-12 text-base font-bold rounded-md" />
                            <InputOTPSlot index={1} className="w-10 sm:w-11 h-12 text-base font-bold rounded-md" />
                            <InputOTPSlot index={2} className="w-10 sm:w-11 h-12 text-base font-bold rounded-md" />
                            <InputOTPSlot index={3} className="w-10 sm:w-11 h-12 text-base font-bold rounded-md" />
                            <InputOTPSlot index={4} className="w-10 sm:w-11 h-12 text-base font-bold rounded-md" />
                            <InputOTPSlot index={5} className="w-10 sm:w-11 h-12 text-base font-bold rounded-md" />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── FORGOT PASSWORD FORM ────────────────────────────── */}
                {mode === "forgot" && (
                  <div className="space-y-3.5">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-foreground">
                        Account Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="h-4 w-4 absolute left-3 top-3.5 text-muted-foreground" />
                        <Input
                          required
                          type="email"
                          value={form.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                          placeholder="you@company.com"
                          className="h-11 pl-9 text-sm rounded-md"
                          autoFocus
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── RESET PASSWORD FORM ─────────────────────────────── */}
                {mode === "reset" && (
                  <div className="space-y-3.5">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-foreground">
                        Account Email <span className="text-red-500">*</span>
                      </label>
                      <Input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="you@company.com"
                        className="h-11 text-sm rounded-md"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-foreground">
                        Reset Code from Email <span className="text-red-500">*</span>
                      </label>
                      <Input
                        required
                        value={form.code}
                        onChange={(e) => handleChange("code", e.target.value)}
                        placeholder="e.g. 123456"
                        className="h-11 text-sm rounded-md font-mono tracking-widest text-center"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-foreground">
                        New Password <span className="text-red-500">*</span>
                      </label>
                      <Input
                        required
                        type="password"
                        value={form.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        placeholder="At least 6 characters"
                        className="h-11 text-sm rounded-md"
                        minLength={6}
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-foreground">
                        Confirm New Password <span className="text-red-500">*</span>
                      </label>
                      <Input
                        required
                        type="password"
                        value={form.confirmPassword}
                        onChange={(e) => handleChange("confirmPassword", e.target.value)}
                        placeholder="Re-enter your password"
                        className="h-11 text-sm rounded-md"
                        minLength={6}
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 text-sm font-semibold rounded-md shadow-xs mt-2"
                >
                  {loading
                    ? "Processing..."
                    : mode === "login" && loginStep === "email"
                    ? "Continue with Email"
                    : mode === "login"
                    ? "Sign In to Dashboard"
                    : mode === "register"
                    ? "Create Store Account"
                    : mode === "forgot"
                    ? "Send Reset Code"
                    : "Update Password"}
                </Button>

                {/* Back to sign in link */}
                {(mode === "forgot" || mode === "reset") && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setLoginStep("email");
                      setError(null);
                      setSuccess(null);
                    }}
                    className="w-full min-h-[44px] flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                  </button>
                )}
              </form>

              {/* Security & Support Footer */}
              <div className="mt-6 pt-5 border-t border-border/70 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Encrypted Session
                </span>
                <Link href="/" className="hover:text-foreground transition-colors">
                  Back to MiniHisab Home
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
