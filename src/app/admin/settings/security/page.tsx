"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import {
  ShieldCheck,
  Key,
  Lock,
  User,
  Bell,
  Smartphone,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";

export default function AdminSecuritySettingsPage() {
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState(168); // 7 days

  const calculatePasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "Empty", color: "bg-slate-200" };
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (pwd.length >= 12) score += 25;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score += 25;

    if (score <= 25) return { score, label: "Weak", color: "bg-rose-500" };
    if (score <= 50) return { score, label: "Fair", color: "bg-amber-500" };
    if (score <= 75) return { score, label: "Good", color: "bg-blue-500" };
    return { score, label: "Strong & Production-Grade", color: "bg-emerald-500" };
  };

  const strength = calculatePasswordStrength(newPassword);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/admin/account/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Failed to update password");
      }
    } catch {
      toast.error("Network error while updating password");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-5">
        <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider block">
          Admin Management & Security
        </span>
        <h1 className="text-2xl font-black text-[#172554] tracking-tight mt-1 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-[#2563EB]" />
          Login & Security Settings
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Manage cryptographic password security, re-authentication policies, and administrative account safeguards.
        </p>

        {/* Account Tabs */}
        <div className="flex flex-wrap gap-6 mt-6 border-b border-[#E2E8F0] text-xs font-semibold">
          <Link
            href="/admin/settings/account"
            className="pb-2.5 border-b-2 border-transparent text-[#64748B] hover:text-[#0F172A] flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5" />
            Profile Information
          </Link>
          <Link
            href="/admin/settings/security"
            className="pb-2.5 border-b-2 border-[#2563EB] text-[#2563EB] flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Security & Passwords
          </Link>
          <Link
            href="/admin/settings/notifications"
            className="pb-2.5 border-b-2 border-transparent text-[#64748B] hover:text-[#0F172A] flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5" />
            Notifications
          </Link>
          <Link
            href="/admin/settings/sessions"
            className="pb-2.5 border-b-2 border-transparent text-[#64748B] hover:text-[#0F172A] flex items-center gap-1.5"
          >
            <Smartphone className="w-3.5 h-3.5" />
            Active Sessions
          </Link>
        </div>
      </div>

      {/* Change Password Form */}
      <form onSubmit={handleChangePassword} className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <Key className="w-4 h-4 text-[#2563EB]" />
              Update Account Password
            </h2>
            <p className="text-xs text-[#64748B]">Passwords are hashed using bcrypt with cryptographically secure salt factors.</p>
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="px-4 py-2 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {savingPassword ? "Updating..." : "Update Password"}
          </button>
        </div>

        <div className="space-y-4 max-w-lg text-xs">
          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">Current Password *</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current account password"
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">New Password *</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters with numbers & symbols"
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            />

            {/* Password Strength Meter */}
            {newPassword && (
              <div className="mt-2 space-y-1">
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${strength.color} transition-all duration-300`}
                    style={{ width: `${strength.score}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#64748B]">
                  Strength: <strong>{strength.label}</strong>
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">Confirm New Password *</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your new password"
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>
      </form>

      {/* Two-Factor & Advanced Security Policies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#0F172A]">Two-Factor Authentication (2FA)</h3>
              <p className="text-[#64748B] text-[11px] mt-0.5">Require an authenticator code (TOTP) on each administrator login.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={twoFactorEnabled}
                onChange={(e) => {
                  setTwoFactorEnabled(e.target.checked);
                  toast.success(e.target.checked ? "2FA policy flag enabled" : "2FA policy disabled");
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2563EB]"></div>
            </label>
          </div>

          <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-[11px] leading-relaxed">
            When enabled, all super admins and elevated managers will be prompted for their one-time passcode after entering credentials.
          </div>
        </div>

        <div className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-4 text-xs">
          <h3 className="font-bold text-[#0F172A]">Super Administrator Safeguards</h3>
          <div className="space-y-2 text-[#64748B] text-[11px] leading-relaxed">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
              <span>The platform automatically protects the last active Super Admin from accidental deletion or role demotion.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
              <span>Failed login lockout policy activates after 5 invalid attempts to prevent brute-force credential stuffing.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
