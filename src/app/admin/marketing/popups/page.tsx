"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Copy,
  CheckCircle2,
  XCircle,
  Calendar,
  MousePointer,
  Percent,
  Upload,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  ArrowRight,
  X,
  ExternalLink,
  Laptop,
  Smartphone,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
} from "lucide-react";

interface PopupItem {
  _id: string;
  name: string;
  headline: string;
  description: string;
  badgeText?: string;
  badgeColor?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  imageAlt: string;
  ctaText: string;
  ctaUrl: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  startDate: string;
  endDate: string;
  status: "draft" | "published" | "archived";
  isEnabled: boolean;
  priority: number;
  targetAudience: "all" | "guests" | "authenticated" | "students" | "instructors";
  targetPages: string[];
  excludedPages: string[];
  displayFrequency: "always" | "once_per_session" | "once_per_day" | "once_per_campaign";
  displayDelaySeconds: number;
  dismissalBehavior: "close_button" | "outside_click" | "both";
  impressions: number;
  clicks: number;
  dismissals: number;
  createdAt: string;
}

export default function PopupsManagementPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [popups, setPopups] = useState<PopupItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    activeNow: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalDismissals: 0,
    averageCtr: 0,
  });

  // Filter & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPopupId, setEditingPopupId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [badgeText, setBadgeText] = useState("");
  const [badgeColor, setBadgeColor] = useState("emerald");
  const [imageUrl, setImageUrl] = useState("");
  const [mobileImageUrl, setMobileImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [ctaText, setCtaText] = useState("Explore Courses");
  const [ctaUrl, setCtaUrl] = useState("/courses");
  const [secondaryCtaText, setSecondaryCtaText] = useState("");
  const [secondaryCtaUrl, setSecondaryCtaUrl] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [isEnabled, setIsEnabled] = useState(false); // Default OFF
  const [priority, setPriority] = useState(1);
  const [targetAudience, setTargetAudience] = useState<
    "all" | "guests" | "authenticated" | "students" | "instructors"
  >("all");
  const [targetPagesStr, setTargetPagesStr] = useState("all");
  const [excludedPagesStr, setExcludedPagesStr] = useState("/checkout, /learn, /login, /register, /admin");
  const [displayFrequency, setDisplayFrequency] = useState<
    "always" | "once_per_session" | "once_per_day" | "once_per_campaign"
  >("once_per_session");
  const [displayDelaySeconds, setDisplayDelaySeconds] = useState(3);
  const [dismissalBehavior, setDismissalBehavior] = useState<"close_button" | "outside_click" | "both">(
    "both"
  );

  // Uploading state
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Interactive Live Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewPopup, setPreviewPopup] = useState<PopupItem | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  const fetchPopups = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/popups?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPopups(data.popups || []);
        if (data.stats) setStats(data.stats);
      } else {
        toast.error(data.error || "Failed to load popups");
      }
    } catch {
      toast.error("Network error loading popups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPopups();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPopups();
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingPopupId(null);
    setName("");
    setHeadline("");
    setDescription("");
    setBadgeText("");
    setBadgeColor("emerald");
    setImageUrl("");
    setMobileImageUrl("");
    setImageAlt("");
    setCtaText("Explore Courses");
    setCtaUrl("/courses");
    setSecondaryCtaText("");
    setSecondaryCtaUrl("");
    setStartDate(new Date().toISOString().slice(0, 16));
    setEndDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16));
    setStatus("draft");
    setIsEnabled(false); // DEFAULT OFF
    setPriority(1);
    setTargetAudience("all");
    setTargetPagesStr("all");
    setExcludedPagesStr("/checkout, /learn, /login, /register, /admin");
    setDisplayFrequency("once_per_session");
    setDisplayDelaySeconds(3);
    setDismissalBehavior("both");
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (pop: PopupItem) => {
    setEditingPopupId(pop._id);
    setName(pop.name);
    setHeadline(pop.headline);
    setDescription(pop.description || "");
    setBadgeText(pop.badgeText || "");
    setBadgeColor(pop.badgeColor || "emerald");
    setImageUrl(pop.imageUrl || "");
    setMobileImageUrl(pop.mobileImageUrl || "");
    setImageAlt(pop.imageAlt || "");
    setCtaText(pop.ctaText || "Explore Courses");
    setCtaUrl(pop.ctaUrl || "/courses");
    setSecondaryCtaText(pop.secondaryCtaText || "");
    setSecondaryCtaUrl(pop.secondaryCtaUrl || "");
    setStartDate(new Date(pop.startDate).toISOString().slice(0, 16));
    setEndDate(new Date(pop.endDate).toISOString().slice(0, 16));
    setStatus(pop.status);
    setIsEnabled(pop.isEnabled);
    setPriority(pop.priority || 1);
    setTargetAudience(pop.targetAudience || "all");
    setTargetPagesStr(pop.targetPages?.join(", ") || "all");
    setExcludedPagesStr(pop.excludedPages?.join(", ") || "");
    setDisplayFrequency(pop.displayFrequency || "once_per_session");
    setDisplayDelaySeconds(pop.displayDelaySeconds ?? 3);
    setDismissalBehavior(pop.dismissalBehavior || "both");
    setModalOpen(true);
  };

  // Image Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit");
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/popups/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setImageUrl(data.url);
        if (!imageAlt.trim()) {
          setImageAlt(file.name.replace(/\.[^/.]+$/, ""));
        }
        toast.success("Campaign banner uploaded successfully!");
      } else {
        toast.error(data.error || "Failed to upload image");
      }
    } catch {
      toast.error("Upload failed due to network error");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Save (Create or Update)
  const handleSavePopup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !headline.trim() || !imageUrl.trim() || !ctaText.trim() || !ctaUrl.trim()) {
      toast.error("Please fill in all required fields (Name, Headline, Image, CTA Button Text, and URL)");
      return;
    }

    setSaving(true);
    try {
      const targetPages = targetPagesStr
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      const excludedPages = excludedPagesStr
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      const payload = {
        name: name.trim(),
        headline: headline.trim(),
        description: description.trim(),
        badgeText: badgeText.trim(),
        badgeColor,
        imageUrl: imageUrl.trim(),
        mobileImageUrl: mobileImageUrl.trim(),
        imageAlt: imageAlt.trim() || headline.trim(),
        ctaText: ctaText.trim(),
        ctaUrl: ctaUrl.trim(),
        secondaryCtaText: secondaryCtaText.trim(),
        secondaryCtaUrl: secondaryCtaUrl.trim(),
        startDate,
        endDate,
        status,
        isEnabled,
        priority: Number(priority || 1),
        targetAudience,
        targetPages: targetPages.length > 0 ? targetPages : ["all"],
        excludedPages,
        displayFrequency,
        displayDelaySeconds: Number(displayDelaySeconds || 0),
        dismissalBehavior,
      };

      const url = editingPopupId ? `/api/admin/popups/${editingPopupId}` : "/api/admin/popups";
      const method = editingPopupId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingPopupId ? "Campaign updated successfully!" : "Campaign created successfully!");
        setModalOpen(false);
        fetchPopups();
      } else {
        toast.error(data.error || "Failed to save popup campaign");
      }
    } catch {
      toast.error("Network error while saving campaign");
    } finally {
      setSaving(false);
    }
  };

  // Toggle IsEnabled switch directly from table
  const handleToggleEnabled = async (pop: PopupItem) => {
    try {
      const nextState = !pop.isEnabled;
      const res = await fetch(`/api/admin/popups/${pop._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: nextState }),
      });
      const data = await res.json();
      if (data.success) {
        setPopups((prev) =>
          prev.map((item) => (item._id === pop._id ? { ...item, isEnabled: nextState } : item))
        );
        toast.success(nextState ? `"${pop.name}" enabled!` : `"${pop.name}" disabled`);
        fetchPopups();
      } else {
        toast.error(data.error || "Failed to toggle status");
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  // Duplicate Campaign
  const handleDuplicate = async (pop: PopupItem) => {
    try {
      const res = await fetch(`/api/admin/popups/${pop._id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(`Duplicated "${pop.name}" as draft!`);
        fetchPopups();
      } else {
        toast.error(data.error || "Failed to duplicate campaign");
      }
    } catch {
      toast.error("Network error during duplication");
    }
  };

  // Delete Campaign
  const handleDelete = async (pop: PopupItem) => {
    if (!confirm(`Are you sure you want to permanently delete campaign "${pop.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/popups/${pop._id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Campaign deleted");
        fetchPopups();
      } else {
        toast.error(data.error || "Failed to delete campaign");
      }
    } catch {
      toast.error("Network error during deletion");
    }
  };

  // Open Live Preview Modal
  const handleOpenPreview = (pop: PopupItem) => {
    setPreviewPopup(pop);
    setPreviewDevice("desktop");
    setPreviewModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-black text-[#172554] tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-[#2563EB]" />
            <span>Events & Promotional Popups</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Create, schedule, target, and monitor high-converting promotional announcements and offer modals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/marketing/popups/new"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#0F172A] text-xs font-semibold shadow-2xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
            Full Form Creator
          </Link>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Popup Campaign</span>
          </button>
        </div>
      </div>

      {/* 2. Key Performance Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
            Total Popups
          </span>
          <span className="text-2xl font-black text-[#172554] mt-1 block">{stats.total}</span>
        </div>

        <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#16A34A] block">
            Active Now
          </span>
          <span className="text-2xl font-black text-[#16A34A] mt-1 block">{stats.activeNow}</span>
        </div>

        <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
            Impressions
          </span>
          <span className="text-2xl font-black text-[#0F172A] mt-1 block">
            {stats.totalImpressions.toLocaleString()}
          </span>
        </div>

        <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB] block">
            CTA Clicks
          </span>
          <span className="text-2xl font-black text-[#2563EB] mt-1 block">
            {stats.totalClicks.toLocaleString()}
          </span>
        </div>

        <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-xs col-span-2 lg:col-span-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#D97706] block">
            Average CTR
          </span>
          <span className="text-2xl font-black text-[#D97706] mt-1 block">{stats.averageCtr}%</span>
        </div>
      </div>

      {/* 3. Search and Status Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 border border-[#E2E8F0] rounded-xl shadow-xs">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {["all", "published", "draft", "archived"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold uppercase text-[11px] transition-colors cursor-pointer ${
                statusFilter === st
                  ? "bg-[#172554] text-white"
                  : "bg-slate-100 text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              {st === "all" ? "All Statuses" : st}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
          />
        </form>
      </div>

      {/* 4. Campaigns List Table */}
      {loading ? (
        <div className="py-16 text-center text-[#64748B]">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-2" />
          <p className="text-xs">Loading marketing campaigns...</p>
        </div>
      ) : popups.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center shadow-xs">
          <Sparkles className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#172554]">No Popups Found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto mt-1 mb-5">
            Default behavior is <strong>Popup OFF</strong>. No promotional overlay will display on the website until you create and explicitly publish & enable a campaign.
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-bold shadow-xs hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Campaign</span>
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-[#E2E8F0]">
              <thead className="bg-slate-50 text-[#64748B] font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Campaign & Creative</th>
                  <th className="p-3.5">Targeting & Frequency</th>
                  <th className="p-3.5">Schedule</th>
                  <th className="p-3.5">Performance</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Live Toggle</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
                {popups.map((pop) => {
                  const ctr =
                    pop.impressions > 0 ? ((pop.clicks / pop.impressions) * 100).toFixed(1) : "0.0";

                  const now = new Date();
                  const isDateActive = new Date(pop.startDate) <= now && new Date(pop.endDate) >= now;
                  const isLiveNow = pop.isEnabled && pop.status === "published" && isDateActive;

                  return (
                    <tr key={pop._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Campaign Info & Thumbnail */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={pop.imageUrl}
                            alt={pop.imageAlt || pop.name}
                            className="w-14 h-10 object-cover rounded-md border border-[#E2E8F0] bg-slate-100 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-sm text-[#0F172A] truncate block max-w-xs">
                                {pop.name}
                              </span>
                              {pop.badgeText && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-[#16A34A] border border-emerald-200 uppercase">
                                  {pop.badgeText}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#64748B] truncate block max-w-xs">
                              {pop.headline}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Targeting */}
                      <td className="p-3.5 text-[#64748B]">
                        <div>
                          <strong className="text-[#0F172A] capitalize">
                            {pop.targetAudience.replace("_", " ")}
                          </strong>
                          <span className="text-[11px] block mt-0.5">
                            Freq: {pop.displayFrequency.replace(/_/g, " ")}
                          </span>
                        </div>
                      </td>

                      {/* Schedule */}
                      <td className="p-3.5 text-[11px] text-[#64748B] whitespace-nowrap">
                        <div>
                          <span>From: {new Date(pop.startDate).toLocaleDateString()}</span>
                          <span className="block text-[#0F172A] font-medium">
                            To: {new Date(pop.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      {/* Performance */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="text-[11px]">
                          <span className="font-bold text-[#0F172A]">
                            {pop.impressions.toLocaleString()} views
                          </span>
                          <span className="text-[#2563EB] block font-semibold">
                            {pop.clicks.toLocaleString()} clicks ({ctr}%)
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            pop.status === "published"
                              ? isLiveNow
                                ? "bg-emerald-50 text-[#16A34A] border-emerald-300"
                                : "bg-blue-50 text-[#2563EB] border-blue-200"
                              : pop.status === "archived"
                              ? "bg-slate-100 text-[#94A3B8] border-[#E2E8F0]"
                              : "bg-amber-50 text-[#D97706] border-amber-200"
                          }`}
                        >
                          {pop.status === "published" && isLiveNow
                            ? "Active Live"
                            : pop.status === "published"
                            ? "Scheduled"
                            : pop.status}
                        </span>
                      </td>

                      {/* Enable / Disable Toggle Switch */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleEnabled(pop)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                            pop.isEnabled
                              ? "bg-emerald-500 text-white shadow-xs"
                              : "bg-slate-200 text-[#64748B] hover:bg-slate-300"
                          }`}
                          title={pop.isEnabled ? "Click to deactivate popup" : "Click to activate popup"}
                        >
                          {pop.isEnabled ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>ON</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>OFF</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenPreview(pop)}
                            className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-100 text-[#64748B] hover:text-[#0F172A] transition-colors"
                            title="Interactive Live Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(pop)}
                            className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-100 text-[#64748B] hover:text-[#2563EB] transition-colors"
                            title="Edit Campaign"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDuplicate(pop)}
                            className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-100 text-[#64748B] hover:text-[#16A34A] transition-colors"
                            title="Duplicate Campaign as Draft"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(pop)}
                            className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-rose-50 text-[#64748B] hover:text-[#DC2626] transition-colors"
                            title="Delete Campaign"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Campaign Editor Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPopupId ? "Edit Promotional Popup Campaign" : "Create New Promotional Popup Campaign"}
      >
        <form onSubmit={handleSavePopup} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Section 1: Overview */}
          <div className="p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-[#172554] uppercase tracking-wider">
              1. Campaign Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                  Internal Campaign Name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Diwali Cyber Week 2026"
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                  Optional Badge Text
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="e.g. 40% OFF / FLASH SALE"
                    className="flex-1 text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                  />
                  <select
                    value={badgeColor}
                    onChange={(e) => setBadgeColor(e.target.value)}
                    className="text-xs px-2 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                  >
                    <option value="emerald">Emerald</option>
                    <option value="blue">Blue</option>
                    <option value="amber">Amber</option>
                    <option value="rose">Rose</option>
                    <option value="purple">Purple</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                Popup Headline <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                required
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Master Full-Stack Engineering with Industry Mentors"
                className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                Short Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enroll in our top-rated tracks today and receive complete access to all project modules."
                className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
              />
            </div>
          </div>

          {/* Section 2: Image Upload */}
          <div className="p-3 bg-blue-50/50 border border-blue-200/60 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-[#172554] uppercase tracking-wider flex items-center justify-between">
              <span>2. Campaign Creative Banner</span>
              <span className="text-[10px] text-[#64748B] font-normal">Max 5MB (JPEG, PNG, WebP)</span>
            </h4>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Preview Thumbnail */}
              <div className="w-36 h-20 rounded-lg border border-[#CBD5E1] bg-white overflow-hidden flex items-center justify-center shrink-0 relative group">
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-2 text-[#94A3B8]">
                    <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                    <span className="text-[10px]">No image</span>
                  </div>
                )}
              </div>

              {/* Upload Action */}
              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
                    className="hidden"
                    id="popup-file-upload"
                  />
                  <label
                    htmlFor="popup-file-upload"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#CBD5E1] text-[#0F172A] hover:bg-slate-50 text-xs font-semibold shadow-2xs cursor-pointer"
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-[#2563EB]" />
                    )}
                    <span>{uploadingImage ? "Uploading..." : "Upload from Device"}</span>
                  </label>

                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="text-xs text-[#DC2626] hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Or enter image URL: /uploads/popups/... or https://..."
                  className="w-full text-xs px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                />

                <input
                  type="text"
                  required
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Image Alt Text (e.g. Diwali discount promotional banner)"
                  className="w-full text-xs px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Call-To-Action (CTA) */}
          <div className="p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-[#172554] uppercase tracking-wider">
              3. Call-To-Action Destinations
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                  Primary Button Text <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="e.g. Explore Courses Now"
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                  Primary Destination URL <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="/courses or https://..."
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                  Optional Secondary Link Text
                </label>
                <input
                  type="text"
                  value={secondaryCtaText}
                  onChange={(e) => setSecondaryCtaText(e.target.value)}
                  placeholder="e.g. View Learning Paths"
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                  Secondary Destination URL
                </label>
                <input
                  type="text"
                  value={secondaryCtaUrl}
                  onChange={(e) => setSecondaryCtaUrl(e.target.value)}
                  placeholder="/learning-paths"
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Schedule & Visibility */}
          <div className="p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-[#172554] uppercase tracking-wider">
              4. Schedule, Status & Activation
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                  Publication Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                >
                  <option value="draft">Draft (Private, not visible)</option>
                  <option value="published">Published (Eligible for display)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                  Display Priority (Higher = Precedence)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                />
              </div>
            </div>

            {/* Enable/Disable switch */}
            <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#0F172A] block">
                  Enable Campaign for Live Website
                </span>
                <span className="text-[11px] text-[#64748B]">
                  Default behavior: <strong>OFF</strong>. Turn ON only when ready to broadcast.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEnabled(!isEnabled)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  isEnabled ? "bg-[#16A34A] text-white" : "bg-slate-200 text-[#64748B]"
                }`}
              >
                {isEnabled ? "ACTIVE (ON)" : "DISABLED (OFF)"}
              </button>
            </div>
          </div>

          {/* Section 5: Audience & Display Frequency */}
          <div className="p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-[#172554] uppercase tracking-wider">
              5. Targeting & Frequency
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                  Target Audience
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                >
                  <option value="all">All Visitors</option>
                  <option value="guests">Guests Only (Unregistered)</option>
                  <option value="authenticated">Logged-In Users Only</option>
                  <option value="students">Students Only</option>
                  <option value="instructors">Instructors Only</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                  Display Frequency
                </label>
                <select
                  value={displayFrequency}
                  onChange={(e) => setDisplayFrequency(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                >
                  <option value="once_per_session">Once per session (Recommended)</option>
                  <option value="once_per_day">Once per day</option>
                  <option value="once_per_campaign">Once per campaign</option>
                  <option value="always">Every eligible visit</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                  Delay Before Showing (secs)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={displayDelaySeconds}
                  onChange={(e) => setDisplayDelaySeconds(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                Target Pages (comma-separated, or "all")
              </label>
              <input
                type="text"
                value={targetPagesStr}
                onChange={(e) => setTargetPagesStr(e.target.value)}
                placeholder="all or /, /courses"
                className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                Excluded Pages (strictly protected against popups)
              </label>
              <input
                type="text"
                value={excludedPagesStr}
                onChange={(e) => setExcludedPagesStr(e.target.value)}
                placeholder="/checkout, /learn, /login, /register, /admin"
                className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{editingPopupId ? "Update Campaign" : "Create Campaign"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* 6. Interactive Device Live Preview Modal */}
      {previewModalOpen && previewPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Preview Toolbar */}
            <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-white">
              <div className="flex items-center gap-2">
                <span className="font-bold">Live Popup Simulation:</span>
                <span className="text-slate-400 font-mono text-[11px]">{previewPopup.name}</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                  <button
                    onClick={() => setPreviewDevice("desktop")}
                    className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 font-semibold ${
                      previewDevice === "desktop" ? "bg-[#2563EB] text-white" : "text-slate-400"
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>Desktop</span>
                  </button>
                  <button
                    onClick={() => setPreviewDevice("mobile")}
                    className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 font-semibold ${
                      previewDevice === "mobile" ? "bg-[#2563EB] text-white" : "text-slate-400"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile</span>
                  </button>
                </div>

                <button
                  onClick={() => setPreviewModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Preview Canvas */}
            <div className="p-8 bg-slate-950/80 flex items-center justify-center min-h-[460px] overflow-auto">
              <div
                className={`bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden transition-all duration-300 relative ${
                  previewDevice === "mobile" ? "w-[340px]" : "w-[480px]"
                }`}
              >
                {/* Close Button Mockup */}
                <button
                  onClick={() => setPreviewModalOpen(false)}
                  className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full bg-white/90 border border-[#CBD5E1] text-[#64748B] flex items-center justify-center shadow-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {previewPopup.imageUrl && (
                  <div className="relative aspect-16/9 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={previewPopup.imageUrl}
                      alt={previewPopup.imageAlt}
                      className="w-full h-full object-cover"
                    />
                    {previewPopup.badgeText && (
                      <div className="absolute top-2.5 left-2.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                          {previewPopup.badgeText}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-5 space-y-3">
                  <h3 className="text-base sm:text-lg font-black text-[#172554] tracking-tight leading-snug">
                    {previewPopup.headline}
                  </h3>
                  {previewPopup.description && (
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      {previewPopup.description}
                    </p>
                  )}

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      onClick={() => alert(`Simulated click to destination: ${previewPopup.ctaUrl}`)}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>{previewPopup.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {previewPopup.secondaryCtaText && (
                      <button
                        onClick={() => alert(`Simulated secondary click: ${previewPopup.secondaryCtaUrl}`)}
                        className="text-center text-xs text-[#2563EB] hover:underline py-1 font-semibold"
                      >
                        {previewPopup.secondaryCtaText}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>This is an interactive preview. Real visitors only see enabled & published popups.</span>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="text-xs text-[#2563EB] hover:underline"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
