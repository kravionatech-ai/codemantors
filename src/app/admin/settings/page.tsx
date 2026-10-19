"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  Settings,
  Shield,
  History,
  CheckCircle2,
  Loader2,
  Building2,
  ExternalLink,
  Globe,
  Mail,
  HardDrive,
  CreditCard,
  Lock,
  Sliders,
  Share2,
  User,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function AdminSettingsHubPage() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = Boolean(user && (user.role === "admin" || user.role === "super_admin"));

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/admin/settings");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadData() {
      try {
        const auditRes = await fetch("/api/admin/audit");
        const auditData = await auditRes.json();
        if (auditData.success) {
          setLogs(auditData.logs?.slice(0, 5) || []);
        }
      } catch (err) {
        console.error("Error loading audit logs:", err);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading && isAdmin) {
      loadData();
    }
  }, [authLoading, isAdmin]);

  if (authLoading) {
    return (
      <div className="py-20 text-center text-[#64748B] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#DC2626]" />
        <p className="text-sm font-medium">Authenticating Administrative Session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-20 text-center text-[#64748B] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#DC2626]" />
        <p className="text-sm font-medium">Redirecting to administrator sign in...</p>
        <Link
          href="/login?redirect=/admin/settings"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#DC2626] rounded-lg hover:bg-rose-700 transition-colors"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs text-center space-y-4">
        <h2 className="text-lg font-bold text-[#0F172A]">Access Restricted: Administrator Privileges Required</h2>
        <p className="text-xs text-[#64748B]">Your account does not have permission to view or manage platform settings.</p>
        <div className="pt-2">
          <Link
            href="/student/dashboard"
            className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const settingsCards = [
    {
      title: "General Platform Settings",
      description: "Platform name, tagline, canonical public domain, and customer support contact information.",
      href: "/admin/settings/general",
      icon: Settings,
      color: "text-[#2563EB] bg-blue-50",
    },
    {
      title: "Company Branding & Attribution",
      description: "Manage Kraviona Tech Solutions technology provider credits, footer branding, and services.",
      href: "/admin/settings/branding",
      icon: Building2,
      color: "text-[#06B6D4] bg-cyan-50",
    },
    {
      title: "Payment Gateway & Razorpay",
      description: "Configure Razorpay test & live credentials, currencies, webhooks, and refund policy thresholds.",
      href: "/admin/settings/payments/razorpay",
      icon: CreditCard,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      title: "Page-by-Page SEO & Metadata",
      description: "Configure independent SEO titles, meta descriptions, Open Graph cards, and canonical URLs for every page.",
      href: "/admin/seo",
      icon: Globe,
      color: "text-purple-600 bg-purple-50",
    },
    {
      title: "Email & SMTP Delivery",
      description: "SMTP configuration, sender identities, transactional order receipts, and automated email alerts.",
      href: "/admin/settings/email",
      icon: Mail,
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      title: "File Storage & Media Uploads",
      description: "Configure local disk vs. S3 cloud storage, image file size limits, and video upload policies.",
      href: "/admin/settings/storage",
      icon: HardDrive,
      color: "text-amber-600 bg-amber-50",
    },
    {
      title: "Security & Passwords",
      description: "Cryptographic password updates, 2FA policy flags, brute-force lockouts, and Super Admin safeguards.",
      href: "/admin/settings/security",
      icon: Lock,
      color: "text-rose-600 bg-rose-50",
    },
    {
      title: "Instructor Limits & Quotas",
      description: "Course creation limits per instructor, maximum file sizes, and course approval requirements.",
      href: "/admin/settings/limits",
      icon: Sliders,
      color: "text-teal-600 bg-teal-50",
    },
    {
      title: "Third-Party Integrations",
      description: "Google Analytics 4 (GA4), Google Tag Manager, Meta Pixel, and marketing tracker IDs.",
      href: "/admin/settings/integrations",
      icon: Share2,
      color: "text-blue-600 bg-blue-50",
    },
    {
      title: "Administrator Account Profile",
      description: "Personal administrator identity, email change re-authentication, and active device sessions.",
      href: "/admin/settings/account",
      icon: User,
      color: "text-slate-700 bg-slate-100",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-5">
        <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider block">
          Platform Governance
        </span>
        <h1 className="text-2xl font-black text-[#172554] tracking-tight mt-1 flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#2563EB]" />
          Platform Settings Center
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Centralized configuration for platform infrastructure, payment processing, branding, technical SEO, and security policies.
        </p>
      </div>

      {/* Grid of Settings Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              href={card.href}
              className="p-6 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#2563EB]/40 hover:shadow-md transition-all group flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className={`w-11 h-11 rounded-lg ${card.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-semibold text-[#2563EB]">
                <span>Manage Settings</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Audit History Preview */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-2xs overflow-hidden">
        <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
              <History className="w-4 h-4 text-[#2563EB]" />
              Recent Configuration & Security Audit Events
            </h3>
            <p className="text-xs text-[#64748B]">All administrative mutations are permanently logged.</p>
          </div>
          <Link
            href="/admin/audit"
            className="text-xs text-[#2563EB] hover:underline font-semibold"
          >
            View Full Audit Log
          </Link>
        </div>

        {logs.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#64748B]">No recent audit logs available.</div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {logs.map((log) => (
              <div key={log._id} className="p-4 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-mono font-bold text-[#0F172A]">{log.action}</span>
                  <span className="text-[#64748B] block text-[11px]">
                    Category: {log.category || log.resource} • Actor: {log.actorRole || "admin"}
                  </span>
                </div>
                <span className="text-[11px] text-[#94A3B8]">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
