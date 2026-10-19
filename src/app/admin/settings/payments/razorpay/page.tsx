"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  RefreshCw,
  Zap,
} from "lucide-react";

export default function AdminRazorpaySettingsPage() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [settings, setSettings] = useState<any>({
    isEnabled: true,
    mode: "test",
    testKeyId: "",
    testKeySecretMasked: "",
    hasTestSecret: false,
    liveKeyId: "",
    liveKeySecretMasked: "",
    hasLiveSecret: false,
    testWebhookSecretMasked: "",
    liveWebhookSecretMasked: "",
    defaultCurrency: "INR",
    supportedCurrencies: ["INR", "USD"],
    merchantName: "CodeMentors",
    merchantDescription: "Production-Grade Developer Education & Masterclasses",
    themeColor: "#172554",
    webhookUrl: "/api/payments/razorpay/webhook",
    refundWindowDays: 7,
    autoRefundApproval: false,
    connectionStatus: "unverified",
    lastVerifiedAt: null,
    lastWebhookAt: null,
  });

  // Secret edit inputs
  const [newTestSecret, setNewTestSecret] = useState("");
  const [newLiveSecret, setNewLiveSecret] = useState("");
  const [newTestWebhookSecret, setNewTestWebhookSecret] = useState("");
  const [newLiveWebhookSecret, setNewLiveWebhookSecret] = useState("");

  // Live Mode Confirmation Modal
  const [liveConfirmModal, setLiveConfirmModal] = useState(false);
  const [liveConfirmChecked, setLiveConfirmChecked] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings/payments/razorpay");
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch {
      toast.error("Failed to load Razorpay payment settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (confirmLive = false) => {
    setSaving(true);
    try {
      const payload: any = {
        isEnabled: settings.isEnabled,
        mode: settings.mode,
        testKeyId: settings.testKeyId,
        liveKeyId: settings.liveKeyId,
        defaultCurrency: settings.defaultCurrency,
        merchantName: settings.merchantName,
        merchantDescription: settings.merchantDescription,
        themeColor: settings.themeColor,
        refundWindowDays: settings.refundWindowDays,
        autoRefundApproval: settings.autoRefundApproval,
        confirmLiveMode: confirmLive,
      };

      if (newTestSecret) payload.testKeySecret = newTestSecret;
      if (newLiveSecret) payload.liveKeySecret = newLiveSecret;
      if (newTestWebhookSecret) payload.testWebhookSecret = newTestWebhookSecret;
      if (newLiveWebhookSecret) payload.liveWebhookSecret = newLiveWebhookSecret;

      const res = await fetch("/api/admin/settings/payments/razorpay", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setNewTestSecret("");
        setNewLiveSecret("");
        setNewTestWebhookSecret("");
        setNewLiveWebhookSecret("");
        setLiveConfirmModal(false);
        fetchSettings();
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch {
      toast.error("Network error while saving payment settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/admin/settings/payments/razorpay/test", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchSettings();
      } else {
        toast.error(data.error || "Connection test failed");
        fetchSettings();
      }
    } catch {
      toast.error("Error occurred while testing connection");
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Webhook URL copied to clipboard");
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-[#64748B]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-3" />
        <p className="text-xs">Loading Razorpay configuration...</p>
      </div>
    );
  }

  const isLive = settings.mode === "live";

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      {/* Top Header */}
      <div className="border-b border-[#E2E8F0] pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider">
                Financial Gateways & Checkout
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isLive ? "bg-rose-100 text-rose-800" : "bg-blue-100 text-blue-800"
                }`}
              >
                {isLive ? "● LIVE PRODUCTION" : "TEST SANDBOX"}
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#172554] tracking-tight mt-1 flex items-center gap-2.5">
              <CreditCard className="w-6 h-6 text-[#2563EB]" />
              Razorpay Gateway Configuration
            </h1>
            <p className="text-xs text-[#64748B] mt-1">
              Configure credentials, test vs live modes, webhook secrets, currency routing, and student refund policies.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="px-3.5 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${testing ? "animate-spin text-[#2563EB]" : "text-[#D97706]"}`} />
              {testing ? "Testing..." : "Test Connection"}
            </button>

            <button
              onClick={() => {
                if (settings.mode === "live") {
                  setLiveConfirmModal(true);
                } else {
                  handleSave();
                }
              }}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </div>

        {/* Status Indicators Bar */}
        <div className="mt-4 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#64748B]">Status:</span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                settings.connectionStatus === "connected"
                  ? "bg-emerald-50 text-[#16A34A] border border-emerald-200"
                  : "bg-amber-50 text-[#D97706] border border-amber-200"
              }`}
            >
              {settings.connectionStatus === "connected" ? "✓ Credentials Verified" : "Unverified / Needs Test"}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-[#64748B]">
            {settings.lastVerifiedAt && (
              <span>Last verified: {new Date(settings.lastVerifiedAt).toLocaleString()}</span>
            )}
            <span>Gateway: {settings.isEnabled ? "Enabled" : "Disabled"}</span>
          </div>
        </div>
      </div>

      {/* Gateway Master Switch & Mode Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Enable / Disable Gateway */}
        <div className="p-5 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[#0F172A]">Gateway Master Status</h3>
              <p className="text-xs text-[#64748B] mt-0.5">Enable or temporarily pause Razorpay checkout for students.</p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.isEnabled}
                onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#16A34A]"></div>
            </label>
          </div>

          <div className="text-[11px] text-[#64748B] bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
            {settings.isEnabled
              ? "Students can purchase courses using Razorpay Standard Checkout (UPI, Cards, NetBanking)."
              : "Gateway is currently paused. Checkout will show temporary maintenance message."}
          </div>
        </div>

        {/* Mode Selector */}
        <div className="p-5 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-3">
          <div>
            <h3 className="font-bold text-sm text-[#0F172A]">Operating Mode</h3>
            <p className="text-xs text-[#64748B] mt-0.5">Start in Test Mode to test transactions without real payments.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <button
              type="button"
              onClick={() => setSettings({ ...settings, mode: "test" })}
              className={`p-3 rounded-lg border font-semibold text-left transition-all cursor-pointer ${
                settings.mode === "test"
                  ? "border-[#2563EB] bg-blue-50/70 text-[#2563EB] ring-2 ring-blue-400/20"
                  : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-slate-50"
              }`}
            >
              <span className="block font-bold">🧪 Test Sandbox</span>
              <span className="text-[10px] text-[#64748B] block mt-0.5">Simulated cards & mock signatures</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!settings.liveKeyId || !settings.hasLiveSecret) {
                  toast.error("Please configure Live Key ID and Secret below before switching to Live Mode");
                }
                setSettings({ ...settings, mode: "live" });
              }}
              className={`p-3 rounded-lg border font-semibold text-left transition-all cursor-pointer ${
                settings.mode === "live"
                  ? "border-rose-500 bg-rose-50/70 text-rose-700 ring-2 ring-rose-400/20"
                  : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-slate-50"
              }`}
            >
              <span className="block font-bold">⚡ Live Production</span>
              <span className="text-[10px] text-[#64748B] block mt-0.5">Real customer currency transactions</span>
            </button>
          </div>
        </div>
      </div>

      {/* Credentials Management: Test vs Live */}
      <div className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-6">
        <div>
          <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#2563EB]" />
            Gateway API Credentials & Secret Protection
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Keys and secrets are stored in secure server-side encrypted database storage. Secrets are never exposed to browser bundles.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs">
          {/* Test Credentials Column */}
          <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/30 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-blue-200">
              <span className="font-bold text-xs text-[#172554]">Test Mode Credentials (Sandbox)</span>
              <span className="text-[10px] font-mono font-bold text-[#2563EB] bg-blue-100 px-2 py-0.5 rounded">
                rzp_test_...
              </span>
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Test Key ID</label>
              <input
                type="text"
                value={settings.testKeyId}
                onChange={(e) => setSettings({ ...settings, testKeyId: e.target.value })}
                placeholder="rzp_test_..."
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] font-mono focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">
                Test Secret Key {settings.hasTestSecret && <span className="text-emerald-600 font-normal">(Configured)</span>}
              </label>
              <input
                type="password"
                value={newTestSecret}
                onChange={(e) => setNewTestSecret(e.target.value)}
                placeholder={settings.testKeySecretMasked || "Enter new test secret key to change"}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] font-mono focus:outline-none focus:border-[#2563EB]"
              />
              <p className="text-[10px] text-[#94A3B8] mt-1">Leave empty to keep current secret intact.</p>
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Test Webhook Secret</label>
              <input
                type="password"
                value={newTestWebhookSecret}
                onChange={(e) => setNewTestWebhookSecret(e.target.value)}
                placeholder={settings.testWebhookSecretMasked || "Enter test webhook secret"}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] font-mono focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          {/* Live Credentials Column */}
          <div className="p-5 rounded-xl border border-rose-200 bg-rose-50/20 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-rose-200">
              <span className="font-bold text-xs text-rose-900">Live Production Credentials</span>
              <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                rzp_live_...
              </span>
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Live Key ID</label>
              <input
                type="text"
                value={settings.liveKeyId}
                onChange={(e) => setSettings({ ...settings, liveKeyId: e.target.value })}
                placeholder="rzp_live_..."
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] font-mono focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">
                Live Secret Key {settings.hasLiveSecret && <span className="text-emerald-600 font-normal">(Configured)</span>}
              </label>
              <input
                type="password"
                value={newLiveSecret}
                onChange={(e) => setNewLiveSecret(e.target.value)}
                placeholder={settings.liveKeySecretMasked || "Enter live secret key to update"}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] font-mono focus:outline-none focus:border-[#2563EB]"
              />
              <p className="text-[10px] text-[#94A3B8] mt-1">Leave empty to keep current secret intact.</p>
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Live Webhook Secret</label>
              <input
                type="password"
                value={newLiveWebhookSecret}
                onChange={(e) => setNewLiveWebhookSecret(e.target.value)}
                placeholder={settings.liveWebhookSecretMasked || "Enter live webhook secret"}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] font-mono focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Webhook Endpoint & Integration Information */}
      <div className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-4 text-xs">
        <div>
          <h3 className="font-bold text-[#0F172A] flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[#2563EB]" />
            Razorpay Webhook Endpoint
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Configure this exact URL in your Razorpay Dashboard under Webhooks to receive asynchronous payment and refund confirmations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/payments/razorpay/webhook`}
            className="flex-1 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-slate-50 font-mono text-xs text-[#0F172A]"
          />
          <button
            onClick={() =>
              copyToClipboard(`${window.location.origin}/api/payments/razorpay/webhook`)
            }
            className="px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 font-semibold text-xs text-[#0F172A] flex items-center gap-1.5 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy URL
          </button>
        </div>

        <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-[#64748B] space-y-1">
          <span className="font-bold text-[#0F172A] block">Required Webhook Events to Subscribe:</span>
          <div className="flex flex-wrap gap-2 pt-1 font-mono">
            <span className="px-2 py-0.5 rounded bg-white border border-[#E2E8F0] text-[#0F172A]">order.paid</span>
            <span className="px-2 py-0.5 rounded bg-white border border-[#E2E8F0] text-[#0F172A]">payment.captured</span>
            <span className="px-2 py-0.5 rounded bg-white border border-[#E2E8F0] text-[#0F172A]">payment.failed</span>
            <span className="px-2 py-0.5 rounded bg-white border border-[#E2E8F0] text-[#0F172A]">refund.processed</span>
          </div>
        </div>
      </div>

      {/* Currency & Merchant Display Settings */}
      <div className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-5 text-xs">
        <h3 className="font-bold text-sm text-[#0F172A]">Merchant Display & Checkout Customization</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">Default Currency</label>
            <select
              value={settings.defaultCurrency}
              onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
            >
              <option value="INR">INR — Indian Rupee (₹)</option>
              <option value="USD">USD — US Dollar ($)</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">Merchant Display Name</label>
            <input
              type="text"
              value={settings.merchantName}
              onChange={(e) => setSettings({ ...settings, merchantName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">Checkout Theme Accent Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.themeColor}
                onChange={(e) => setSettings({ ...settings, themeColor: e.target.value })}
                className="w-8 h-8 rounded border border-[#E2E8F0] p-0 cursor-pointer"
              />
              <input
                type="text"
                value={settings.themeColor}
                onChange={(e) => setSettings({ ...settings, themeColor: e.target.value })}
                className="flex-1 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Refund Policy & Workflow Box */}
      <div className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#D97706]" />
              Refund Policy & Course Revocation Rules
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Approved refunds automatically revoke course enrollment, decrement student counts, and dispatch notifications.
            </p>
          </div>

          <Link
            href="/admin/refunds"
            className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#2563EB] flex items-center gap-1 shadow-2xs"
          >
            Manage Refund Queue
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">Eligible Refund Window (Days)</label>
            <input
              type="number"
              min={1}
              max={60}
              value={settings.refundWindowDays}
              onChange={(e) => setSettings({ ...settings, refundWindowDays: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
            />
            <p className="text-[10px] text-[#94A3B8] mt-1">Students can submit requests within this timeframe from purchase.</p>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
            <div>
              <span className="font-bold text-[#0F172A] block">Auto-Approval Threshold</span>
              <span className="text-[11px] text-[#64748B]">Require manual admin review for all refund requests.</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoRefundApproval}
                onChange={(e) => setSettings({ ...settings, autoRefundApproval: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2563EB]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Live Mode Confirmation Modal */}
      {liveConfirmModal && (
        <Modal
          isOpen={liveConfirmModal}
          onClose={() => setLiveConfirmModal(false)}
          title="Confirm Switching to LIVE Production Mode"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-800 text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Caution: Real Financial Transactions</span>
              </div>
              <p className="leading-relaxed">
                You are about to activate <strong>Live Production Mode</strong>. In Live Mode, student payments will process through your live Razorpay merchant account and debit genuine bank accounts and credit cards.
              </p>
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] cursor-pointer">
              <input
                type="checkbox"
                checked={liveConfirmChecked}
                onChange={(e) => setLiveConfirmChecked(e.target.checked)}
                className="accent-rose-600 mt-0.5"
              />
              <span className="text-[#0F172A] font-semibold">
                I understand and confirm that live credentials are valid and live student transactions will be processed.
              </span>
            </label>

            <div className="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLiveConfirmModal(false)}
                className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-[#0F172A] font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!liveConfirmChecked || saving}
                onClick={() => handleSave(true)}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs disabled:opacity-50"
              >
                {saving ? "Activating..." : "Confirm & Activate Live Mode"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
