"use client";

import * as React from "react";
import { useState } from "react";
import { Lock, KeyRound, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/auth.service";

export function SecuritySettings() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await authService.setupPassword({
        newPassword: form.newPassword,
        oldPassword: form.oldPassword || undefined,
      });
      
      if ((res as any).success === false) {
        setError((res as any).message || "Failed to update password");
        return;
      }
      
      setSuccess("Password updated successfully.");
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to update password. Make sure you entered your current password if you already have one.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-3xl border border-border/70 shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <KeyRound className="h-5 w-5 text-primary" /> Security & Access
        </CardTitle>
        <CardDescription>Setup or change your account password</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {error && (
            <div className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl text-sm font-medium">
              {success}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Current Password</label>
            <Input 
              type="password" 
              placeholder="Leave blank if not set" 
              value={form.oldPassword} 
              onChange={e => setForm(f => ({ ...f, oldPassword: e.target.value }))} 
            />
            <p className="mt-1 text-[10px] text-muted">Only required if you already have a password</p>
          </div>
          
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">New Password *</label>
            <Input 
              required
              type="password" 
              placeholder="Min 6 characters" 
              value={form.newPassword} 
              onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} 
              minLength={6}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Confirm New Password *</label>
            <Input 
              required
              type="password" 
              placeholder="Min 6 characters" 
              value={form.confirmPassword} 
              onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} 
              minLength={6}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
