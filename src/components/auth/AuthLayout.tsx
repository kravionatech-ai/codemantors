"use client";

import React from "react";
import Link from "next/link";
import { Code2 } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC]">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2.5 group mb-4">
          <div className="w-11 h-11 rounded-xl bg-[#172554] flex items-center justify-center shadow-xs transition-colors group-hover:bg-[#1E3A8A]">
            <Code2 className="w-6 h-6 text-[#06B6D4]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#172554]">
              CodeMentors
            </span>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-[#2563EB] border border-blue-200">
              LMS
            </span>
          </div>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
          {title}
        </h1>
        <p className="mt-1.5 text-sm text-[#64748B]">
          {subtitle}
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full sm:max-w-md">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xs">
          {children}
        </div>
      </div>

      {/* Auth Footer */}
      <div className="mt-8 text-center text-xs text-[#64748B] space-x-4">
        <span>© {new Date().getFullYear()} CodeMentors, Inc.</span>
        <span>•</span>
        <Link href="/terms" className="hover:text-[#0F172A] hover:underline">
          Terms
        </Link>
        <span>•</span>
        <Link href="/privacy" className="hover:text-[#0F172A] hover:underline">
          Privacy
        </Link>
        <span>•</span>
        <Link href="/help" className="hover:text-[#0F172A] hover:underline">
          Help
        </Link>
      </div>
    </div>
  );
}
