"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import {
  Share2,
  Save,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  BarChart,
} from "lucide-react";

export default function AdminIntegrationsSettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [integrations, setIntegrations] = useState({
    googleAnalyticsId: "",
    googleTagManagerId: "",
    metaPixelId: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/settings/platform");
        const data = await res.json();
        if (data.success && data.settings?.integrationsSettings) {
          setIntegrations({
            googleAnalyticsId: data.settings.integrationsSettings.googleAnalyticsId || "",
            googleTagManagerId: data.settings.integrationsSettings.googleTagManagerId || "",
            metaPixelId: data.settings.integrationsSettings.metaPixelId || "",
          });
        }
      } catch {
        toast.error("Failed to load integrations");
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
        body: JSON.stringify({ section: "integrations", data: integrations }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || "Failed to update integrations");
      }
    } catch {
      toast.error("Error saving integration settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-[#64748B]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-2" />
        <p className="text-xs">Loading integration trackers...</p>
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
        <span className="text-[#0F172A] font-semibold">Integrations</span>
      </div>

      <div className="border-b border-[#E2E8F0] pb-4">
        <h1 className="text-2xl font-black text-[#172554] tracking-tight flex items-center gap-2">
          <Share2 className="w-6 h-6 text-blue-600" />
          Third-Party Analytics & Integrations
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Connect tracking measurement tags, Google Analytics 4, Tag Manager, and conversion pixels.
        </p>
      </div>

      <form onSubmit={handleSave} className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-6 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <span className="font-bold text-sm text-[#0F172A]">Measurement IDs</span>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save Integrations"}
          </button>
        </div>

        <div className="space-y-4 max-w-lg">
          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">Google Analytics 4 Measurement ID</label>
            <input
              type="text"
              placeholder="e.g. G-XXXXXXXXXX"
              value={integrations.googleAnalyticsId}
              onChange={(e) => setIntegrations({ ...integrations, googleAnalyticsId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] font-mono focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">Google Tag Manager Container ID</label>
            <input
              type="text"
              placeholder="e.g. GTM-XXXXXXX"
              value={integrations.googleTagManagerId}
              onChange={(e) => setIntegrations({ ...integrations, googleTagManagerId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] font-mono focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">Meta (Facebook) Pixel ID</label>
            <input
              type="text"
              placeholder="e.g. 123456789012345"
              value={integrations.metaPixelId}
              onChange={(e) => setIntegrations({ ...integrations, metaPixelId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] font-mono focus:outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-[11px] leading-relaxed">
          Tracking scripts are injected safely according to customer consent preferences and do not run on sensitive checkout or payment routes.
        </div>
      </form>
    </div>
  );
}
