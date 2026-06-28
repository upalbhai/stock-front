"use client";

import React, { useState, useRef } from "react";
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/components/auth/auth-provider";
import { getErrorMessage } from "@/lib/error";
import { APP_ROUTES } from "@/lib/routes";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";


type LoginStep = "email" | "password" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithEmail, checkEmail, register, sendOtp, verifyOtp, forgotPassword, resetPassword } = useAuth();
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
    code: "", // for otp/reset
    businessName: "",
    outletName: ""
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };



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
        outletName: form.outletName || `${form.businessName} Main`
      });
      
      if ((res as any)?.message) {
        setSuccess("Account created successfully! We've sent a verification code to your email.");
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
      const res = await resetPassword({ email: form.email, code: form.code, newPassword: form.password });
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
      setSuccess("OTP sent to your email!");
    } catch (e) {
      setError(getErrorMessage(e, "Failed to send code"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,102,204,0.12),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,136,255,0.08),rgba(0,0,0,0))]" />

      <Card className="relative w-full max-w-md border border-border/70 shadow-sm backdrop-blur-md bg-card/80 rounded-xl animate-rise">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground shadow-sm">
            OP
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Outlet Pulse</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {mode === "login" ? "Sign in to your account" : mode === "register" ? "Start your 7-day free trial" : mode === "forgot" ? "Reset your password" : "Create new password"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          
          {(mode === "login" || mode === "register") && (
            <div className="flex bg-border/40 p-1.5 rounded-2xl gap-1 mb-6">
              <button
                type="button"
                onClick={() => { setMode("login"); setLoginStep("email"); setError(null); setSuccess(null); }}
                className={cn(
                  "flex-1 py-2 text-xs font-semibold rounded-xl transition",
                  mode === "login"
                    ? "bg-card text-card-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode("register"); setError(null); setSuccess(null); }}
                className={cn(
                  "flex-1 py-2 text-xs font-semibold rounded-xl transition",
                  mode === "register"
                    ? "bg-card text-card-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Free Trial
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-xl bg-success/10 border border-success/20 p-3 text-center">
              <p className="text-xs text-success font-medium">{success}</p>
            </div>
          )}
          
          {error && (
            <div className="mb-4 rounded-xl bg-danger/10 border border-danger/20 p-3 text-center">
              <p className="text-xs text-danger font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={
            mode === "register" ? handleRegisterSubmit : 
            mode === "forgot" ? handleForgotSubmit : 
            mode === "reset" ? handleResetSubmit : 
            mode === "login" && loginStep === "email" ? handleEmailCheckSubmit : 
            handleLoginSubmit
          } className="space-y-4">
            
            {/* REGISTER FORM */}
            {mode === "register" && (
              <div className="space-y-3 animate-fade">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Owner Name *</label>
                  <Input required value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="John Doe" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Business Name *</label>
                  <Input required value={form.businessName} onChange={(e) => handleChange("businessName", e.target.value)} placeholder="My Super Store" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Outlet Name (Optional)</label>
                  <Input value={form.outletName} onChange={(e) => handleChange("outletName", e.target.value)} placeholder="Main Branch" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Email *</label>
                  <Input required type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="john@example.com" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Phone (Optional)</label>
                  <Input type="tel" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="9876543210" />
                </div>
              </div>
            )}

            {/* LOGIN FORM - EMAIL STEP */}
            {mode === "login" && loginStep === "email" && (
              <div className="space-y-3 animate-fade">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Email *</label>
                  <Input required type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="you@company.com" />
                </div>
              </div>
            )}

            {/* LOGIN FORM - PASSWORD STEP */}
            {mode === "login" && loginStep === "password" && (
              <div className="space-y-3 animate-fade">
                <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                  <button type="button" onClick={() => setLoginStep("email")} className="p-1 hover:bg-border/50 rounded-full transition"><ArrowLeft className="w-4 h-4" /></button>
                  <span className="font-medium text-foreground">{form.email}</span>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-medium text-muted-foreground">Password *</label>
                    <button type="button" onClick={() => setMode("forgot")} className="text-xs text-primary font-medium hover:underline">Forgot password?</button>
                  </div>
                  <Input required type="password" value={form.password} onChange={(e) => handleChange("password", e.target.value)} placeholder="��������" autoFocus />
                </div>
              </div>
            )}

            {/* LOGIN FORM - OTP STEP */}
            {mode === "login" && loginStep === "otp" && (
              <div className="space-y-3 animate-fade">
                <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                  <button type="button" onClick={() => setLoginStep("email")} className="p-1 hover:bg-border/50 rounded-full transition"><ArrowLeft className="w-4 h-4" /></button>
                  <span className="font-medium text-foreground">{form.email}</span>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-medium text-muted-foreground">OTP Code *</label>
                    <button type="button" onClick={handleSendOtp} disabled={loading} className="text-xs text-primary font-medium hover:underline">Resend Code</button>
                  </div>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={form.code}
                      onChange={(value) => setForm(prev => ({ ...prev, code: value }))}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="w-12 h-14 text-lg" />
                        <InputOTPSlot index={1} className="w-12 h-14 text-lg" />
                        <InputOTPSlot index={2} className="w-12 h-14 text-lg" />
                        <InputOTPSlot index={3} className="w-12 h-14 text-lg" />
                        <InputOTPSlot index={4} className="w-12 h-14 text-lg" />
                        <InputOTPSlot index={5} className="w-12 h-14 text-lg" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
              </div>
            )}


            {/* FORGOT PASSWORD FORM */}
            {mode === "forgot" && (
              <div className="space-y-3 animate-fade">
                <p className="text-xs text-muted-foreground mb-4">Enter your email address and we'll send you a code to reset your password.</p>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Email *</label>
                  <Input required type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="you@company.com" />
                </div>
              </div>
            )}

            {/* RESET PASSWORD FORM */}
            {mode === "reset" && (
              <div className="space-y-3 animate-fade">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Email *</label>
                  <Input required type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="you@company.com" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Reset Code *</label>
                  <Input required value={form.code} onChange={(e) => handleChange("code", e.target.value)} placeholder="Enter code from email" className="tracking-widest text-center text-lg font-bold" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">New Password *</label>
                  <Input required type="password" value={form.password} onChange={(e) => handleChange("password", e.target.value)} placeholder="��������" minLength={6} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Confirm New Password *</label>
                  <Input required type="password" value={form.confirmPassword} onChange={(e) => handleChange("confirmPassword", e.target.value)} placeholder="��������" minLength={6} />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full py-6 text-sm font-semibold rounded-2xl shadow-sm mt-4" disabled={loading}>
              {loading ? "Processing..." : 
               mode === "login" && loginStep === "email" ? "Continue with Email" :
               mode === "login" ? "Sign In" : 
               mode === "register" ? "Start Free Trial" : 
               mode === "forgot" ? "Send Reset Code" : "Reset Password"}
            </Button>
            
            {(mode === "forgot" || mode === "reset") && (
              <button type="button" onClick={() => { setMode("login"); setLoginStep("email"); setError(null); setSuccess(null); }} className="w-full text-center text-xs text-muted-foreground hover:text-foreground mt-2 block transition">
                Back to Sign In
              </button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
