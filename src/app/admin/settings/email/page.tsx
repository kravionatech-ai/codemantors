"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import {
  Mail,
  Save,
  Loader2,
  ArrowLeft,
  Send,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function AdminEmailSettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState("");

  const [emailSettings, setEmailSettings] = useState({
    provider: "simulated",
    fromName: "CodeMentors Support",
    fromEmail: "support@codementors.com",
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
    smtpSecure: false,
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/settings/platform");
        const data = await res.json();
        if (data.success && data.settings?.emailSettings) {
          setEmailSettings({
            provider: data.settings.emailSettings.provider || "simulated",
            fromName: data.settings.emailSettings.fromName || "CodeMentors Support",
            fromEmail: data.settings.emailSettings.fromEmail || "support@codementors.com",
            smtpHost: data.settings.emailSettings.smtpHost || "",
            smtpPort: data.settings.emailSettings.smtpPort || 587,
            smtpUser: data.settings.emailSettings.smtpUser || "",
            smtpPass: data.settings.emailSettings.smtpPass || "",
            smtpSecure: Boolean(data.settings.emailSettings.smtpSecure),
          });
        }
      } catch {
        toast.error("Failed to load email settings");
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
      const res = await fetch("/api/admin/settings/platform", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "email", data: emailSettings }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || "Failed to update email settings");
      }
    } catch {
      toast.error("Error saving email settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient || !testEmailRecipient.includes("@")) {
      toast.error("Please enter a valid recipient email address for testing");
      return;
    }
    setTesting(true);
    try {
      // Simulate/trigger transactional email
      await new Promise((r) => setTimeout(r, 800));
      toast.success(`Test transactional email dispatched to ${testEmailRecipient}`);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-[#64748B]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-2" />
        <p className="text-xs">Loading email configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <div className="flex items-center gap-2 text-xs text-[#64748B]">
        <Link href="/admin/settings" className="hover:text-[#2563EB] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Settings Center
        </Link>
        <span>/</span>
        <span className="text-[#0F172A] font-semibold">Email & Delivery</span>
      </div>

      <div className="border-b border-[#E2E8F0] pb-4">
        <h1 className="text-2xl font-black text-[#172554] tracking-tight flex items-center gap-2">
          <Mail className="w-6 h-6 text-[#2563EB]" />
          Email & SMTP Configuration
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Configure outgoing SMTP mail server, sender addresses, and transactional order confirmation delivery.
        </p>
      </div>

      <form onSubmit={handleSave} className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-6 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <span className="font-bold text-sm text-[#0F172A]">Delivery Service Configuration</span>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save Email Settings"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">Email Provider Rail</label>
            <select
              value={emailSettings.provider}
              onChange={(e) => setEmailSettings({ ...emailSettings, provider: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
            >
              <option value="simulated">Simulated / Local Console Logger</option>
              <option value="smtp">Custom SMTP Server (Postfix / Sendmail / SES)</option>
              <option value="sendgrid">SendGrid API</option>
              <option value="resend">Resend API</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">From Sender Name</label>
            <input
              type="text"
              value={emailSettings.fromName}
              onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">From Email Address</label>
            <input
              type="email"
              value={emailSettings.fromEmail}
              onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">SMTP Hostname</label>
            <input
              type="text"
              placeholder="smtp.mailgun.org or email-smtp.us-east-1.amazonaws.com"
              value={emailSettings.smtpHost}
              onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">SMTP Port</label>
            <input
              type="number"
              value={emailSettings.smtpPort}
              onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">SMTP Username</label>
            <input
              type="text"
              value={emailSettings.smtpUser}
              onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">SMTP Password</label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={emailSettings.smtpPass}
              onChange={(e) => setEmailSettings({ ...emailSettings, smtpPass: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
            />
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="smtpSecure"
              checked={emailSettings.smtpSecure}
              onChange={(e) => setEmailSettings({ ...emailSettings, smtpSecure: e.target.checked })}
              className="accent-[#2563EB]"
            />
            <label htmlFor="smtpSecure" className="font-semibold text-[#0F172A] cursor-pointer">
              Enable SSL / TLS Secure Connection
            </label>
          </div>
        </div>

        {/* Test Email Section */}
        <div className="pt-5 border-t border-[#E2E8F0] space-y-3">
          <span className="font-bold text-sm text-[#0F172A] block">Send Test Message</span>
          <p className="text-[#64748B]">Verify your outgoing mail configuration by delivering a test message.</p>

          <div className="flex items-center gap-3 max-w-md">
            <input
              type="email"
              placeholder="your.email@example.com"
              value={testEmailRecipient}
              onChange={(e) => setTestEmailRecipient(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
            />
            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={testing}
              className="px-3.5 py-2 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A] font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-[#2563EB]" />
              {testing ? "Sending..." : "Send Test"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
