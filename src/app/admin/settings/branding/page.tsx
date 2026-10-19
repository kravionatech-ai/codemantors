"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import {
  Building2,
  Save,
  Loader2,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  Palette,
} from "lucide-react";

export default function AdminBrandingSettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [companyBranding, setCompanyBranding] = useState({
    enabled: true,
    companyName: "Kraviona Tech Solutions",
    companyUrl: "https://kraviona.com/",
    logoUrl: "",
    tagline: "Web Development | Backend Engineering | Technical SEO | AI Automation",
    shortDescription:
      "Kraviona Tech Solutions is a technology company focused on web development, full-stack application development, backend engineering, technical SEO, web performance, and AI automation.",
    servicesText:
      "MERN Stack Development\nReact.js and Next.js Development\nNode.js Backend and API Development\nTechnical SEO and Website Performance Optimization\nUI/UX and Web Application Development\nAI Automation and AI Chatbot Development\nE-commerce Development",
    contactWebsite: "https://kraviona.com/contact",
    contactEmail: "contact@kraviona.com",
    contactPhone: "+91 96085 53167",
    displayPosition: "both",
    openInNewTab: true,
  });

  const [brandColors, setBrandColors] = useState({
    primaryNavy: "#172554",
    primaryBlue: "#2563EB",
    accentCyan: "#06B6D4",
    background: "#F8FAFC",
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/settings/platform");
        const data = await res.json();
        if (data.success && data.settings) {
          if (data.settings.companyBranding) {
            const cb = data.settings.companyBranding;
            setCompanyBranding({
              enabled: cb.enabled !== false,
              companyName: cb.companyName || "Kraviona Tech Solutions",
              companyUrl: cb.companyUrl || "https://kraviona.com/",
              logoUrl: cb.logoUrl || "",
              tagline: cb.tagline || "",
              shortDescription: cb.shortDescription || "",
              servicesText: (cb.services || []).join("\n"),
              contactWebsite: cb.contact?.website || "https://kraviona.com/contact",
              contactEmail: cb.contact?.email || "contact@kraviona.com",
              contactPhone: cb.contact?.phone || "+91 96085 53167",
              displayPosition: cb.displayPosition || "both",
              openInNewTab: cb.openInNewTab !== false,
            });
          }
          if (data.settings.brandColors) {
            setBrandColors(data.settings.brandColors);
          }
        }
      } catch {
        toast.error("Failed to load branding settings");
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
      const services = companyBranding.servicesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        companyBranding: {
          enabled: companyBranding.enabled,
          companyName: companyBranding.companyName,
          companyUrl: companyBranding.companyUrl,
          logoUrl: companyBranding.logoUrl,
          tagline: companyBranding.tagline,
          shortDescription: companyBranding.shortDescription,
          services,
          contact: {
            website: companyBranding.contactWebsite,
            email: companyBranding.contactEmail,
            phone: companyBranding.contactPhone,
          },
          displayPosition: companyBranding.displayPosition,
          openInNewTab: companyBranding.openInNewTab,
        },
        brandColors,
      };

      const res = await fetch("/api/admin/settings/platform", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "branding", data: payload }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Branding and company attribution updated!");
      } else {
        toast.error(data.error || "Failed to update branding");
      }
    } catch {
      toast.error("Error saving branding settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-[#64748B]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-2" />
        <p className="text-xs">Loading branding settings...</p>
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
        <span className="text-[#0F172A] font-semibold">Company Branding</span>
      </div>

      <div className="border-b border-[#E2E8F0] pb-4">
        <h1 className="text-2xl font-black text-[#172554] tracking-tight flex items-center gap-2">
          <Building2 className="w-6 h-6 text-[#06B6D4]" />
          Company Branding & Attribution
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Manage Kraviona Tech Solutions verified technology provider credits, footer branding, and core services.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Kraviona Attribution Card */}
        <div className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div>
              <span className="font-bold text-sm text-[#0F172A]">Kraviona Tech Solutions Identity</span>
              <p className="text-[#64748B] text-[11px]">Primary technology provider and engineering attribution.</p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save Branding"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Company Legal Name</label>
              <input
                type="text"
                value={companyBranding.companyName}
                onChange={(e) => setCompanyBranding({ ...companyBranding, companyName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Official Company Website URL</label>
              <input
                type="text"
                value={companyBranding.companyUrl}
                onChange={(e) => setCompanyBranding({ ...companyBranding, companyUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-[#0F172A] block mb-1">Company Tagline</label>
              <input
                type="text"
                value={companyBranding.tagline}
                onChange={(e) => setCompanyBranding({ ...companyBranding, tagline: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-[#0F172A] block mb-1">Company Overview</label>
              <textarea
                rows={3}
                value={companyBranding.shortDescription}
                onChange={(e) => setCompanyBranding({ ...companyBranding, shortDescription: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-[#0F172A] block mb-1">Core Services (One per line)</label>
              <textarea
                rows={5}
                value={companyBranding.servicesText}
                onChange={(e) => setCompanyBranding({ ...companyBranding, servicesText: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] font-mono text-[11px]"
              />
            </div>
          </div>
        </div>

        {/* Brand Colors Card */}
        <div className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-[#0F172A]">
            <Palette className="w-4 h-4 text-[#2563EB]" />
            <span>Design System Color Tokens</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="font-semibold text-[#64748B] block mb-1">Deep Navy (Primary)</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandColors.primaryNavy}
                  onChange={(e) => setBrandColors({ ...brandColors, primaryNavy: e.target.value })}
                  className="w-8 h-8 rounded border border-[#E2E8F0] cursor-pointer"
                />
                <span className="font-mono">{brandColors.primaryNavy}</span>
              </div>
            </div>

            <div>
              <span className="font-semibold text-[#64748B] block mb-1">Royal Blue (Secondary)</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandColors.primaryBlue}
                  onChange={(e) => setBrandColors({ ...brandColors, primaryBlue: e.target.value })}
                  className="w-8 h-8 rounded border border-[#E2E8F0] cursor-pointer"
                />
                <span className="font-mono">{brandColors.primaryBlue}</span>
              </div>
            </div>

            <div>
              <span className="font-semibold text-[#64748B] block mb-1">Cyan Accent</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandColors.accentCyan}
                  onChange={(e) => setBrandColors({ ...brandColors, accentCyan: e.target.value })}
                  className="w-8 h-8 rounded border border-[#E2E8F0] cursor-pointer"
                />
                <span className="font-mono">{brandColors.accentCyan}</span>
              </div>
            </div>

            <div>
              <span className="font-semibold text-[#64748B] block mb-1">Background</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandColors.background}
                  onChange={(e) => setBrandColors({ ...brandColors, background: e.target.value })}
                  className="w-8 h-8 rounded border border-[#E2E8F0] cursor-pointer"
                />
                <span className="font-mono">{brandColors.background}</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
