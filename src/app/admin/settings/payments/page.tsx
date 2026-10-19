"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Coins,
  RotateCcw,
  Receipt,
  Settings,
} from "lucide-react";

export default function AdminPaymentsOverviewPage() {
  const [razorpayConfig, setRazorpayConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings/payments/razorpay")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setRazorpayConfig(data.settings);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      <div className="border-b border-[#E2E8F0] pb-5">
        <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider block">
          Platform Infrastructure
        </span>
        <h1 className="text-2xl font-black text-[#172554] tracking-tight mt-1 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-[#2563EB]" />
          Payment Gateways & Financial Settings
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Manage supported payment providers, test sandbox switches, multi-currency pricing, and refund queues.
        </p>
      </div>

      {/* Gateways Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Razorpay Gateway Card */}
        <div className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-black text-xl">
                ₹
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0F172A]">Razorpay Standard Checkout</h3>
                <span className="text-xs text-[#64748B]">Primary Indian & International Payment Rail</span>
              </div>
            </div>

            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                razorpayConfig?.isEnabled
                  ? "bg-emerald-50 text-[#16A34A] border border-emerald-200"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {razorpayConfig?.isEnabled ? "ACTIVE" : "PAUSED"}
            </span>
          </div>

          <p className="text-xs text-[#64748B] leading-relaxed">
            Supports UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards (Visa, Mastercard, RuPay), NetBanking (50+ banks), and EMI.
          </p>

          <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
            <span className="text-[#64748B]">
              Mode:{" "}
              <strong className="text-[#0F172A] uppercase">
                {razorpayConfig?.mode || "test"}
              </strong>
            </span>

            <Link
              href="/admin/settings/payments/razorpay"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white font-semibold shadow-xs"
            >
              Configure Gateway
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Refunds & Invoicing Card */}
        <div className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0F172A]">Student Refund Workflow</h3>
                <span className="text-xs text-[#64748B]">Review, approve, or reject refund claims</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#64748B] leading-relaxed">
            Approved refunds automatically revoke student course access, decrement enrollment counters, and dispatch confirmation emails.
          </p>

          <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
            <span className="text-[#64748B]">Policy Window: <strong>7 Days</strong></span>

            <Link
              href="/admin/refunds"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A] font-semibold"
            >
              Open Refund Queue
              <ExternalLink className="w-3.5 h-3.5 text-[#2563EB]" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
