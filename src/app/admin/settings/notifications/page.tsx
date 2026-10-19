"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import {
  Bell,
  User,
  ShieldCheck,
  Smartphone,
  Save,
  Loader2,
  CheckCircle2,
  Mail,
  CreditCard,
  GraduationCap,
  RotateCcw,
} from "lucide-react";

export default function AdminNotificationsSettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [prefs, setPrefs] = useState({
    orderAlerts: true,
    enrollmentAlerts: true,
    refundRequests: true,
    securityAlerts: true,
    weeklySummary: false,
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/account/notifications");
        const data = await res.json();
        if (data.success && data.notifications) {
          setPrefs(data.notifications);
        }
      } catch {
        toast.error("Failed to load notifications preferences");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/account/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || "Failed to update notification settings");
      }
    } catch {
      toast.error("Error saving notification settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-[#64748B]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-3" />
        <p className="text-xs">Loading notification preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-5">
        <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider block">
          Admin Management & Security
        </span>
        <h1 className="text-2xl font-black text-[#172554] tracking-tight mt-1 flex items-center gap-2">
          <Bell className="w-6 h-6 text-[#2563EB]" />
          Notification Preferences
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Select which automated platform alerts, financial events, and security advisories are dispatched to your email.
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
            className="pb-2.5 border-b-2 border-transparent text-[#64748B] hover:text-[#0F172A] flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Security & Passwords
          </Link>
          <Link
            href="/admin/settings/notifications"
            className="pb-2.5 border-b-2 border-[#2563EB] text-[#2563EB] flex items-center gap-1.5"
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

      {/* Preferences Form */}
      <form onSubmit={handleSave} className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A]">Email Notification Channels</h2>
            <p className="text-xs text-[#64748B]">Configure real-time administrative triggers.</p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <label className="flex items-start justify-between p-3.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="flex items-start gap-3">
              <CreditCard className="w-4 h-4 text-[#2563EB] mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-[#0F172A] block">Paid Order Notifications</span>
                <span className="text-[#64748B] text-[11px]">
                  Receive immediate notification when a student successfully completes a Razorpay checkout.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.orderAlerts}
              onChange={(e) => setPrefs({ ...prefs, orderAlerts: e.target.checked })}
              className="accent-[#2563EB] mt-1"
            />
          </label>

          <label className="flex items-start justify-between p-3.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="flex items-start gap-3">
              <RotateCcw className="w-4 h-4 text-[#D97706] mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-[#0F172A] block">Refund & Dispute Requests</span>
                <span className="text-[#64748B] text-[11px]">
                  Receive high-priority alert when a refund request requires administrator review.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.refundRequests}
              onChange={(e) => setPrefs({ ...prefs, refundRequests: e.target.checked })}
              className="accent-[#2563EB] mt-1"
            />
          </label>

          <label className="flex items-start justify-between p-3.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="flex items-start gap-3">
              <GraduationCap className="w-4 h-4 text-[#16A34A] mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-[#0F172A] block">New Student Enrollments</span>
                <span className="text-[#64748B] text-[11px]">
                  Receive notifications when learners enroll in free courses or claim learning path certifications.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.enrollmentAlerts}
              onChange={(e) => setPrefs({ ...prefs, enrollmentAlerts: e.target.checked })}
              className="accent-[#2563EB] mt-1"
            />
          </label>

          <label className="flex items-start justify-between p-3.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-[#DC2626] mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-[#0F172A] block">Security & System Audit Alerts</span>
                <span className="text-[#64748B] text-[11px]">
                  Alerts for multiple failed logins, password changes, or role permissions modifications.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.securityAlerts}
              onChange={(e) => setPrefs({ ...prefs, securityAlerts: e.target.checked })}
              className="accent-[#2563EB] mt-1"
            />
          </label>
        </div>
      </form>
    </div>
  );
}
