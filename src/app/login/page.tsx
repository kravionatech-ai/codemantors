"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Code2, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";

function LoginContent() {
  const { login } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

        if (redirectUrl) {
          router.push(redirectUrl);
        } else if (data.user.role === "admin") {
          router.push("/admin");
        } else if (data.user.role === "instructor") {
          router.push("/instructor");
        } else {
          router.push("/dashboard");
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

  // Quick Demo Account Auto-Fill
  const fillDemoAccount = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("Password@12345");
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25">
          <Code2 className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Sign In to CodeMentors
        </h2>
        <p className="text-xs text-slate-400">
          Access your courses, bookmarks, and verifiable certificates.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Quick Demo Logins Pill Box */}
          <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-500/20 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" />
              1-Click Demo Accounts (Pass: Password@12345)
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-[10px] font-semibold">
              <button
                type="button"
                onClick={() => fillDemoAccount("student@codemetors.com")}
                className="py-1 px-1.5 rounded bg-slate-900 hover:bg-slate-800 text-blue-300 border border-slate-800 transition-colors"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount("alex@codemetors.com")}
                className="py-1 px-1.5 rounded bg-slate-900 hover:bg-slate-800 text-violet-300 border border-slate-800 transition-colors"
              >
                Instructor
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount("admin@codemetors.com")}
                className="py-1 px-1.5 rounded bg-slate-900 hover:bg-slate-800 text-rose-300 border border-slate-800 transition-colors"
              >
                Admin
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-300">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-blue-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                "Signing In..."
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            Don't have an account yet?{" "}
            <Link href="/register" className="text-blue-400 font-semibold hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading sign in...</div>}>
      <LoginContent />
    </Suspense>
  );
}
