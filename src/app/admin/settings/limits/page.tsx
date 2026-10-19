"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import {
  Sliders,
  Save,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

export default function AdminLimitsSettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [limitsSettings, setLimitsSettings] = useState({
    maxCoursesPerInstructor: 50,
    maxFileSizeMb: 100,
    requireCourseApproval: false,
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/settings/platform");
        const data = await res.json();
        if (data.success && data.settings?.limitsSettings) {
          setLimitsSettings({
            maxCoursesPerInstructor: data.settings.limitsSettings.maxCoursesPerInstructor || 50,
            maxFileSizeMb: data.settings.limitsSettings.maxFileSizeMb || 100,
            requireCourseApproval: Boolean(data.settings.limitsSettings.requireCourseApproval),
          });
        }
      } catch {
        toast.error("Failed to load limit settings");
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
        body: JSON.stringify({ section: "limits", data: limitsSettings }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || "Failed to update limits");
      }
    } catch {
      toast.error("Error saving limits settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-[#64748B]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-2" />
        <p className="text-xs">Loading limits configuration...</p>
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
        <span className="text-[#0F172A] font-semibold">Instructor Limits</span>
      </div>

      <div className="border-b border-[#E2E8F0] pb-4">
        <h1 className="text-2xl font-black text-[#172554] tracking-tight flex items-center gap-2">
          <Sliders className="w-6 h-6 text-teal-600" />
          Platform Limits & Approval Gates
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Configure quotas, instructor limits, review approval policies, and upload restrictions.
        </p>
      </div>

      <form onSubmit={handleSave} className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-6 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <span className="font-bold text-sm text-[#0F172A]">Instructor Quotas</span>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save Limits"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">Max Courses Allowed Per Instructor</label>
            <input
              type="number"
              min={1}
              max={500}
              value={limitsSettings.maxCoursesPerInstructor}
              onChange={(e) => setLimitsSettings({ ...limitsSettings, maxCoursesPerInstructor: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">Max Global File Upload Limit (MB)</label>
            <input
              type="number"
              min={5}
              max={1000}
              value={limitsSettings.maxFileSizeMb}
              onChange={(e) => setLimitsSettings({ ...limitsSettings, maxFileSizeMb: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
          <span className="font-bold text-sm text-[#0F172A] block">Curriculum Publication Workflow</span>

          <label className="flex items-start justify-between p-3.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] cursor-pointer">
            <div>
              <span className="font-bold text-[#0F172A] block">Require Mandatory Admin Approval for New Courses</span>
              <span className="text-[11px] text-[#64748B]">
                When checked, courses published by instructors remain in "pending_review" until an administrator approves them.
              </span>
            </div>
            <input
              type="checkbox"
              checked={limitsSettings.requireCourseApproval}
              onChange={(e) => setLimitsSettings({ ...limitsSettings, requireCourseApproval: e.target.checked })}
              className="accent-[#2563EB] mt-1"
            />
          </label>
        </div>
      </form>
    </div>
  );
}
