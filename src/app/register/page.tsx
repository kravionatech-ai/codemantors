"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import AuthLayout from "@/components/auth/AuthLayout";
import { Lock, Mail, User, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const { user, login } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"student" | "instructor">("student");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect automatically to their dashboard
  useEffect(() => {
    if (user) {
      if (user.role === "admin" || user.role === "super_admin") {
        router.push("/admin/dashboard");
      } else if (user.role === "instructor") {
        router.push("/instructor/dashboard");
      } else {
        router.push("/student/dashboard");
      }
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        login(data.user);
        toast.success(`Account created! Welcome to CodeMentors, ${data.user.name}.`);
        if (data.user.role === "instructor") {
          router.push("/instructor/dashboard");
        } else {
          router.push("/student/dashboard");
        }
      } else {
        toast.error(data.error || "Registration failed");
      }
    } catch {
      toast.error("An unexpected registration error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start building real-world engineering skills with CodeMentors."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Developer"
              className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>
        </div>

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
              placeholder="jane@domain.com"
              className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
            Password (min 6 characters)
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
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

        <div>
          <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
            Account Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                role === "student"
                  ? "bg-blue-50 border-[#2563EB] text-[#2563EB]"
                  : "bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              Student / Learner
            </button>
            <button
              type="button"
              onClick={() => setRole("instructor")}
              className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                role === "instructor"
                  ? "bg-blue-50 border-[#172554] text-[#172554]"
                  : "bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              Course Instructor
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
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <span>Register & Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-[#E2E8F0] text-center text-xs text-[#64748B]">
        Already have an account?{" "}
        <Link href="/login" className="text-[#2563EB] font-semibold hover:underline">
          Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
