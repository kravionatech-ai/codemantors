"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import {
  Sliders,
  Save,
  CheckCircle2,
  Users,
  Settings,
  ShieldCheck,
  Edit2,
  RotateCcw,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function AdminInstructorLimitsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [globalLimits, setGlobalLimits] = useState<any>({
    maxActiveCourses: 5,
    maxDraftCourses: 10,
    maxModulesPerCourse: 20,
    maxLessonsPerCourse: 100,
    maxVideoDurationMinutes: 90,
    maxUploadFileSizeMB: 250,
    minCoursePrice: 0,
    maxCoursePrice: 50000,
    maxDiscountPercent: 80,
    canCreatePaidCourses: true,
    requireCourseApproval: false,
    canEditSeo: true,
    canPublishBlog: true,
  });

  const [instructors, setInstructors] = useState<any[]>([]);
  const [customOverrides, setCustomOverrides] = useState<any[]>([]);

  // Override Modal
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<any>(null);
  const [instructorFormLimits, setInstructorFormLimits] = useState<any>({});
  const [savingOverride, setSavingOverride] = useState(false);

  const fetchLimitsData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/instructors/limits");
      const data = await res.json();
      if (data.success) {
        if (data.globalLimit) setGlobalLimits(data.globalLimit);
        setInstructors(data.instructors || []);
        setCustomOverrides(data.customOverrides || []);
      } else {
        toast.error(data.error || "Failed to load instructor quotas");
      }
    } catch {
      toast.error("Network error while loading quotas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLimitsData();
  }, []);

  const handleSaveGlobal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGlobal(true);
    try {
      const res = await fetch("/api/admin/instructors/limits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isGlobalDefault: true,
          limits: globalLimits,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Global platform instructor limits saved!");
        fetchLimitsData();
      } else {
        toast.error(data.error || "Failed to update global limits");
      }
    } catch {
      toast.error("Network error while saving limits");
    } finally {
      setSavingGlobal(false);
    }
  };

  const openOverrideModal = (inst: any) => {
    setSelectedInstructor(inst);
    const existing = customOverrides.find((o) => o.instructorId?._id === inst._id || o.instructorId === inst._id);
    setInstructorFormLimits(existing || { ...globalLimits });
    setOverrideModalOpen(true);
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstructor) return;
    setSavingOverride(true);
    try {
      const res = await fetch("/api/admin/instructors/limits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructorId: selectedInstructor._id,
          limits: instructorFormLimits,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Custom limits saved for ${selectedInstructor.name}`);
        setOverrideModalOpen(false);
        fetchLimitsData();
      } else {
        toast.error(data.error || "Failed to save instructor override");
      }
    } catch {
      toast.error("Network error while saving override");
    } finally {
      setSavingOverride(false);
    }
  };

  const handleRemoveOverride = async (instructorId: string) => {
    try {
      const res = await fetch("/api/admin/instructors/limits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructorId,
          removeOverride: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Restored global defaults for this instructor");
        setOverrideModalOpen(false);
        fetchLimitsData();
      } else {
        toast.error(data.error || "Failed to remove override");
      }
    } catch {
      toast.error("Network error while removing override");
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-[#64748B]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-3" />
        <p className="text-sm">Loading instructor quotas and policy boundaries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] flex items-center gap-2.5">
          <Sliders className="w-7 h-7 text-[#2563EB]" />
          Instructor Limits & Quota Governance
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          Define global capacity and pricing boundaries, and configure individualized quota exceptions for authorized educators.
        </p>
      </div>

      {/* Global Default Limits Card */}
      <form onSubmit={handleSaveGlobal} className="rounded-xl border border-[#E2E8F0] bg-white shadow-2xs overflow-hidden">
        <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
            <h2 className="font-bold text-sm sm:text-base text-[#0F172A]">
              Platform-Wide Default Limits
            </h2>
          </div>
          <button
            type="submit"
            disabled={savingGlobal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {savingGlobal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-[#06B6D4]" />}
            Save Global Policy
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Max Active Courses */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#0F172A] block">Max Active (Published) Courses</label>
            <input
              type="number"
              min={1}
              max={100}
              value={globalLimits.maxActiveCourses}
              onChange={(e) => setGlobalLimits({ ...globalLimits, maxActiveCourses: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
            />
            <span className="text-[11px] text-[#64748B]">Prevents publishing beyond this threshold.</span>
          </div>

          {/* Max Draft Courses */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#0F172A] block">Max Draft / Pending Courses</label>
            <input
              type="number"
              min={1}
              max={100}
              value={globalLimits.maxDraftCourses}
              onChange={(e) => setGlobalLimits({ ...globalLimits, maxDraftCourses: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
            />
            <span className="text-[11px] text-[#64748B]">Maximum unreleased drafts per instructor.</span>
          </div>

          {/* Max Video Duration */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#0F172A] block">Max Video Duration (Minutes)</label>
            <input
              type="number"
              min={5}
              max={300}
              value={globalLimits.maxVideoDurationMinutes}
              onChange={(e) => setGlobalLimits({ ...globalLimits, maxVideoDurationMinutes: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
            />
            <span className="text-[11px] text-[#64748B]">Upper bound for single video lessons.</span>
          </div>

          {/* Max Modules */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#0F172A] block">Max Modules Per Course</label>
            <input
              type="number"
              min={1}
              max={50}
              value={globalLimits.maxModulesPerCourse}
              onChange={(e) => setGlobalLimits({ ...globalLimits, maxModulesPerCourse: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
            />
          </div>

          {/* Pricing Limits */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#0F172A] block">Max Course Price (₹ INR)</label>
            <input
              type="number"
              min={100}
              max={200000}
              value={globalLimits.maxCoursePrice}
              onChange={(e) => setGlobalLimits({ ...globalLimits, maxCoursePrice: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-[#0F172A] block">Max Discount Percentage (%)</label>
            <input
              type="number"
              min={0}
              max={95}
              value={globalLimits.maxDiscountPercent}
              onChange={(e) => setGlobalLimits({ ...globalLimits, maxDiscountPercent: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
            />
          </div>

          {/* Feature Toggles */}
          <div className="md:col-span-3 pt-4 border-t border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={globalLimits.requireCourseApproval}
                onChange={(e) => setGlobalLimits({ ...globalLimits, requireCourseApproval: e.target.checked })}
                className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-0"
              />
              <span className="font-semibold text-[#0F172A]">Require Admin Course Approval</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={globalLimits.canCreatePaidCourses}
                onChange={(e) => setGlobalLimits({ ...globalLimits, canCreatePaidCourses: e.target.checked })}
                className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-0"
              />
              <span className="font-semibold text-[#0F172A]">Allow Paid Course Creation</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={globalLimits.canEditSeo}
                onChange={(e) => setGlobalLimits({ ...globalLimits, canEditSeo: e.target.checked })}
                className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-0"
              />
              <span className="font-semibold text-[#0F172A]">Allow Instructors to Edit SEO</span>
            </label>
          </div>
        </div>
      </form>

      {/* Per-Instructor Overrides Table */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-2xs overflow-hidden">
        <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <h3 className="font-bold text-sm sm:text-base text-[#0F172A] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#2563EB]" />
            Educator Overrides & Quota Assignments ({instructors.length})
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Configure custom limits for individual instructors that override the platform defaults.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold border-b border-[#E2E8F0]">
              <tr>
                <th className="px-6 py-3">Instructor</th>
                <th className="px-6 py-3">Max Active</th>
                <th className="px-6 py-3">Max Drafts</th>
                <th className="px-6 py-3">Price Ceiling</th>
                <th className="px-6 py-3">Approval Required</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {instructors.map((inst) => {
                const override = customOverrides.find(
                  (o) => o.instructorId?._id === inst._id || o.instructorId === inst._id
                );
                const hasCustom = Boolean(override);

                return (
                  <tr key={inst._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {inst.avatar ? (
                          <img src={inst.avatar} alt={inst.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#172554] text-[#06B6D4] flex items-center justify-center font-bold text-xs">
                            {inst.name?.charAt(0) || "I"}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-[#0F172A] block">{inst.name}</span>
                          <span className="text-[11px] text-[#64748B]">{inst.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#0F172A]">
                      {hasCustom ? override.maxActiveCourses : globalLimits.maxActiveCourses}
                    </td>
                    <td className="px-6 py-4 text-[#64748B]">
                      {hasCustom ? override.maxDraftCourses : globalLimits.maxDraftCourses}
                    </td>
                    <td className="px-6 py-4 text-[#64748B]">
                      ₹{(hasCustom ? override.maxCoursePrice : globalLimits.maxCoursePrice).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      {(hasCustom ? override.requireCourseApproval : globalLimits.requireCourseApproval) ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-[#D97706] border border-amber-200">
                          Required
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-[#16A34A] border border-emerald-200">
                          Direct Publish
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {hasCustom ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          Custom Override
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#94A3B8]">Global Policy</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openOverrideModal(inst)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] shadow-2xs transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#2563EB]" />
                        Configure
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructor Override Modal */}
      {overrideModalOpen && selectedInstructor && (
        <Modal
          isOpen={overrideModalOpen}
          onClose={() => setOverrideModalOpen(false)}
          title={`Configure Quota: ${selectedInstructor.name}`}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSaveOverride} className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-[#172554] space-y-1">
              <span className="font-bold block">Individualized Exception Policy</span>
              <p className="text-[11px] text-[#64748B]">
                Settings here override platform defaults specifically for {selectedInstructor.name} ({selectedInstructor.email}).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Max Active Courses</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={instructorFormLimits.maxActiveCourses || 5}
                  onChange={(e) =>
                    setInstructorFormLimits({ ...instructorFormLimits, maxActiveCourses: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Max Draft Courses</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={instructorFormLimits.maxDraftCourses || 10}
                  onChange={(e) =>
                    setInstructorFormLimits({ ...instructorFormLimits, maxDraftCourses: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Max Course Price (₹)</label>
                <input
                  type="number"
                  min={100}
                  max={500000}
                  value={instructorFormLimits.maxCoursePrice || 50000}
                  onChange={(e) =>
                    setInstructorFormLimits({ ...instructorFormLimits, maxCoursePrice: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Max Video Length (min)</label>
                <input
                  type="number"
                  min={5}
                  max={600}
                  value={instructorFormLimits.maxVideoDurationMinutes || 90}
                  onChange={(e) =>
                    setInstructorFormLimits({
                      ...instructorFormLimits,
                      maxVideoDurationMinutes: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                />
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(instructorFormLimits.requireCourseApproval)}
                  onChange={(e) =>
                    setInstructorFormLimits({ ...instructorFormLimits, requireCourseApproval: e.target.checked })
                  }
                  className="rounded border-[#CBD5E1] text-[#2563EB]"
                />
                <span className="font-semibold text-[#0F172A]">Enforce Administrator Approval for this Instructor</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(instructorFormLimits.canCreatePaidCourses)}
                  onChange={(e) =>
                    setInstructorFormLimits({ ...instructorFormLimits, canCreatePaidCourses: e.target.checked })
                  }
                  className="rounded border-[#CBD5E1] text-[#2563EB]"
                />
                <span className="font-semibold text-[#0F172A]">Authorize Paid Course Creation</span>
              </label>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleRemoveOverride(selectedInstructor._id)}
                className="text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
              >
                Reset to Global Policy
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOverrideModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-[#0F172A] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingOverride}
                  className="px-4 py-2 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {savingOverride ? "Saving..." : "Save Override"}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
