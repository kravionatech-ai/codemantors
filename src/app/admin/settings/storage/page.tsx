"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import {
  HardDrive,
  Save,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function AdminStorageSettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [storageSettings, setStorageSettings] = useState({
    provider: "local",
    maxImageSizeMb: 5,
    maxVideoSizeMb: 500,
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/settings/platform");
        const data = await res.json();
        if (data.success && data.settings?.storageSettings) {
          const st = data.settings.storageSettings;
          setStorageSettings({
            provider: st.provider || "local",
            maxImageSizeMb: st.maxImageSizeBytes ? Math.round(st.maxImageSizeBytes / (1024 * 1024)) : 5,
            maxVideoSizeMb: st.maxVideoSizeBytes ? Math.round(st.maxVideoSizeBytes / (1024 * 1024)) : 500,
          });
        }
      } catch {
        toast.error("Failed to load storage settings");
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
      const payload = {
        provider: storageSettings.provider,
        maxImageSizeBytes: storageSettings.maxImageSizeMb * 1024 * 1024,
        maxVideoSizeBytes: storageSettings.maxVideoSizeMb * 1024 * 1024,
        allowedImageTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        allowedDocTypes: ["application/pdf", "application/zip"],
      };

      const res = await fetch("/api/admin/settings/platform", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "storage", data: payload }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || "Failed to update storage settings");
      }
    } catch {
      toast.error("Error saving storage settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-[#64748B]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-2" />
        <p className="text-xs">Loading storage settings...</p>
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
        <span className="text-[#0F172A] font-semibold">Storage & Media</span>
      </div>

      <div className="border-b border-[#E2E8F0] pb-4">
        <h1 className="text-2xl font-black text-[#172554] tracking-tight flex items-center gap-2">
          <HardDrive className="w-6 h-6 text-amber-600" />
          File Storage & Upload Restrictions
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Configure file storage providers, media file size limits, and allowed MIME types.
        </p>
      </div>

      <form onSubmit={handleSave} className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-6 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <span className="font-bold text-sm text-[#0F172A]">Storage Provider Rules</span>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save Storage Settings"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">Storage Provider</label>
            <select
              value={storageSettings.provider}
              onChange={(e) => setStorageSettings({ ...storageSettings, provider: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
            >
              <option value="local">Local Filesystem Storage (public/uploads)</option>
              <option value="s3">Amazon S3 / DigitalOcean Spaces</option>
              <option value="cloudinary">Cloudinary Media Rail</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">Max Image Upload Size (MB)</label>
            <input
              type="number"
              min={1}
              max={25}
              value={storageSettings.maxImageSizeMb}
              onChange={(e) => setStorageSettings({ ...storageSettings, maxImageSizeMb: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">Max Video Lecture Size (MB)</label>
            <input
              type="number"
              min={10}
              max={2048}
              value={storageSettings.maxVideoSizeMb}
              onChange={(e) => setStorageSettings({ ...storageSettings, maxVideoSizeMb: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
            />
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-[11px] space-y-1">
          <span className="font-bold text-[#0F172A] block">Accepted File Types</span>
          <p>Images: JPEG, PNG, WebP, GIF • Course Handbooks: PDF, ZIP archives.</p>
        </div>
      </form>
    </div>
  );
}
