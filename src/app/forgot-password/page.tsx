"use client";

import React, { useState } from "react";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your account email to receive a password recovery link."
    >
      {submitted ? (
        <div className="text-center space-y-4 py-2">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#0F172A]">Password Reset Dispatched</h2>
          <p className="text-xs text-[#64748B] leading-relaxed">
            If an account exists for <strong className="text-[#0F172A]">{email}</strong>, you will receive password reset instructions within a few minutes.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Sign In
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
              Account Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white font-semibold text-sm shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending link...</span>
              </>
            ) : (
              <span>Send Password Reset Link</span>
            )}
          </button>

          <div className="pt-2 text-center">
            <Link
              href="/login"
              className="text-xs text-[#64748B] hover:text-[#0F172A] inline-flex items-center gap-1.5 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
