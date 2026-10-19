"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import {
  Settings,
  Save,
  Loader2,
  Globe,
  Mail,
  Phone,
  MapPin,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

export default function AdminGeneralSettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    siteName: "CodeMentors",
    tagline: "Learn to Code. Build Real Skills. Grow Your Career.",
    logoUrl: "",
    faviconUrl: "",
    contactSettings: {
      supportEmail: "support@codementors.com",
      supportPhone: "+91 96085 53167",
      address: "Tech Innovation Hub, Cyber City, Bangalore, India",
    },
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/settings/platform");
        const data = await res.json();
        if (data.success && data.settings) {
          setForm({
            siteName: data.settings.siteName || "CodeMentors",
            tagline: data.settings.tagline || "",
            logoUrl: data.settings.logoUrl || "",
            faviconUrl: data.settings.faviconUrl || "",
            contactSettings: {
              supportEmail: data.settings.contactSettings?.supportEmail || "support@codementors.com",
              supportPhone: data.settings.contactSettings?.supportPhone || "+91 96085 53167",
              address: data.settings.contactSettings?.address || "",
            },
          });
        }
      } catch {
        toast.error("Failed to load general settings");
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
        body: JSON.stringify({ section: "general", data: form }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || "Failed to update settings");
      }
    } catch {
      toast.error("Error saving general settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-[#64748B]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-2" />
        <p className="text-xs">Loading general settings...</p>
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
        <span className="text-[#0F172A] font-semibold">General Settings</span>
      </div>

      <div className="border-b border-[#E2E8F0] pb-4">
        <h1 className="text-2xl font-black text-[#172554] tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#2563EB]" />
          General Platform Settings
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Configure default application metadata, platform identity, and global contact credentials.
        </p>
      </div>

      <form onSubmit={handleSave} className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-6 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <span className="font-bold text-sm text-[#0F172A]">Platform Identity</span>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">Platform Brand Name *</label>
            <input
              type="text"
              required
              value={form.siteName}
              onChange={(e) => setForm({ ...form, siteName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">Brand Tagline</label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">Logo URL</label>
            <input
              type="text"
              value={form.logoUrl}
              placeholder="/logo.png or https://..."
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">Favicon URL</label>
            <input
              type="text"
              value={form.faviconUrl}
              placeholder="/favicon.ico"
              onChange={(e) => setForm({ ...form, faviconUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[#E2E8F0] space-y-4">
          <span className="font-bold text-sm text-[#0F172A] block">Public Contact & Support Information</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Support Email Address</label>
              <input
                type="email"
                value={form.contactSettings.supportEmail}
                onChange={(e) =>
                  setForm({
                    ...form,
                    contactSettings: { ...form.contactSettings, supportEmail: e.target.value },
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Support Telephone / Hotline</label>
              <input
                type="text"
                value={form.contactSettings.supportPhone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    contactSettings: { ...form.contactSettings, supportPhone: e.target.value },
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-[#0F172A] block mb-1">Headquarters Physical Address</label>
              <input
                type="text"
                value={form.contactSettings.address}
                onChange={(e) =>
                  setForm({
                    ...form,
                    contactSettings: { ...form.contactSettings, address: e.target.value },
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
