"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import AuthLayout from "@/components/auth/AuthLayout";
import { Lock, Mail, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";

function LoginContent() {
  const { user, login } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const safeRedirectUrl = redirectUrl && redirectUrl.startsWith("/") && !redirectUrl.startsWith("//") ? redirectUrl : "";

  // If already logged in, redirect automatically to the appropriate role dashboard
  useEffect(() => {
    if (user) {
      if (safeRedirectUrl) {
        router.push(safeRedirectUrl);
      } else if (user.role === "admin" || user.role === "super_admin") {
        router.push("/admin/dashboard");
      } else if (user.role === "instructor") {
        router.push("/instructor/dashboard");
      } else {
        router.push("/student/dashboard");
      }
    }
  }, [user, safeRedirectUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        login(data.user);
        toast.success(`Welcome back, ${data.user.name}!`);

        if (safeRedirectUrl) {
          router.push(safeRedirectUrl);
        } else if (data.user.role === "admin" || data.user.role === "super_admin") {
          router.push("/admin/dashboard");
        } else if (data.user.role === "instructor") {
          router.push("/instructor/dashboard");
        } else {
          router.push("/student/dashboard");
        }
      } else {
        toast.error(data.error || "Login failed. Check your email and password.");
      }
    } catch {
      toast.error("An error occurred during sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Access your enrolled courses, lesson progress, and certificates."
    >
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
              Email Address
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#0F172A]">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-[#2563EB] hover:text-[#1D4ED8] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 text-sm rounded-lg bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#0F172A]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
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
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-[#E2E8F0] text-center text-xs text-[#64748B]">
          Don't have an account yet?{" "}
          <Link href="/register" className="text-[#2563EB] font-semibold hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-[#64748B]">Loading sign in...</div>}>
      <LoginContent />
    </Suspense>
  );
}
