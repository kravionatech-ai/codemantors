"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import {
  Megaphone,
  Save,
  ArrowLeft,
  Calendar,
  Tag,
  Image as ImageIcon,
  Link2,
  Users,
  Eye,
  Settings,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function NewPopupCampaignPage() {
  const toast = useToast();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "images" | "details" | "cta" | "schedule" | "audience" | "appearance">("basic");

  const [formData, setFormData] = useState<any>({
    internalName: "",
    slug: "",
    type: "offer",
    content: {
      title: "",
      subtitle: "",
      description: "",
      badgeText: "LIMITED TIME",
      badgeColor: "#06B6D4",
    },
    images: {
      primary: { url: "", alt: "Campaign banner" },
      desktop: { url: "", alt: "Desktop visual" },
      mobile: { url: "", alt: "Mobile visual" },
    },
    eventDetails: {
      isEvent: false,
      eventName: "",
      eventType: "webinar",
      registrationUrl: "",
    },
    offerDetails: {
      isOffer: true,
      offerTitle: "Special Enrollment Offer",
      discountType: "percentage",
      discountValue: 20,
      couponCode: "SAVE20",
    },
    primaryCTA: {
      label: "Claim Offer Now",
      url: "/courses",
      openInNewTab: false,
    },
    secondaryCTA: {
      label: "Learn More",
      url: "/about",
      openInNewTab: false,
    },
    schedule: {
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      timezone: "UTC",
    },
    targeting: {
      targetAudience: "all",
      targetPages: ["/"],
      excludedPages: ["/checkout", "/cart", "/login", "/register", "/admin"],
      deviceTargeting: "all",
    },
    frequency: {
      frequencyType: "once_per_session",
      displayDelaySeconds: 5,
      dismissalBehavior: "both",
      daysInterval: 1,
    },
    appearance: {
      layout: "modal",
      imagePosition: "top",
      animation: "fade",
      theme: {
        bgColor: "#FFFFFF",
        textColor: "#0F172A",
        accentColor: "#2563EB",
        borderRadius: "xl",
      },
      showCloseButton: true,
      showBackdrop: true,
    },
    publicationStatus: "draft",
    isEnabled: false, // STRICT DEFAULT FALSE
    priority: 5,
    adminNotes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.internalName.trim() || !formData.content.title.trim() || !formData.content.description.trim()) {
      toast.error("Internal Name, Title, and Description are required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/popups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Campaign created as Draft and Disabled.");
        router.push("/admin/marketing/popups");
      } else {
        toast.error(data.error || "Failed to create campaign");
      }
    } catch {
      toast.error("Network error while creating campaign");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-2 text-xs text-[#64748B]">
        <Link href="/admin/marketing/popups" className="hover:text-[#2563EB] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Popup Campaigns
        </Link>
        <span>/</span>
        <span className="text-[#0F172A] font-semibold">New Campaign</span>
      </div>

      <div className="border-b border-[#E2E8F0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#172554] tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-[#2563EB]" />
            Create Database-Driven Popup Campaign
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Build a persistent promotional modal, banner, or announcement. Default state is strictly Draft and Disabled.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="px-5 py-2.5 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? "Creating..." : "Save Campaign"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-4 border-b border-[#E2E8F0] text-xs font-semibold">
        {[
          { id: "basic", label: "Basic Info", icon: Megaphone },
          { id: "images", label: "Images", icon: ImageIcon },
          { id: "details", label: "Event & Offer Details", icon: Tag },
          { id: "cta", label: "CTA Links", icon: Link2 },
          { id: "schedule", label: "Schedule & Status", icon: Calendar },
          { id: "audience", label: "Targeting & Audience", icon: Users },
          { id: "appearance", label: "Appearance & Layout", icon: Settings },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`pb-3 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === t.id
                  ? "border-[#2563EB] text-[#2563EB]"
                  : "border-transparent text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-6 text-xs">
        {activeTab === "basic" && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-[#0F172A]">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Internal Campaign Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali Flash Sale Masterclass 2026"
                  value={formData.internalName}
                  onChange={(e) => setFormData({ ...formData, internalName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Campaign Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                >
                  <option value="offer">Discount Offer</option>
                  <option value="event">Live Event / Webinar</option>
                  <option value="announcement">Announcement</option>
                  <option value="course_launch">New Course Launch</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-[#0F172A] block mb-1">Public Headline / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Production Next.js 15 — Flat 40% Off This Weekend"
                  value={formData.content.title}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      content: { ...formData.content, title: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-[#0F172A] block mb-1">Main Description / Body *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Full description of the offer, learning outcomes, or webinar schedule..."
                  value={formData.content.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      content: { ...formData.content, description: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Badge Text</label>
                <input
                  type="text"
                  value={formData.content.badgeText}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      content: { ...formData.content, badgeText: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Admin Notes</label>
                <input
                  type="text"
                  placeholder="Optional internal campaign tracking notes"
                  value={formData.adminNotes}
                  onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "images" && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-[#0F172A]">Image Assets</h3>
            <div className="space-y-4">
              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Primary Image URL</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/... or uploaded asset"
                  value={formData.images.primary.url}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      images: {
                        ...formData.images,
                        primary: { ...formData.images.primary, url: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Mobile-Specific Image URL (Optional)</label>
                <input
                  type="text"
                  placeholder="Optional cropped image for mobile portrait viewport"
                  value={formData.images.mobile?.url || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      images: {
                        ...formData.images,
                        mobile: { url: e.target.value, alt: "Mobile visual" },
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "details" && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-[#0F172A]">Event & Offer Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Coupon Code</label>
                <input
                  type="text"
                  value={formData.offerDetails?.couponCode || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      offerDetails: { ...formData.offerDetails, couponCode: e.target.value.toUpperCase() },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Discount Percentage (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.offerDetails?.discountValue || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      offerDetails: { ...formData.offerDetails, discountValue: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "cta" && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-[#0F172A]">Calls to Action</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Primary CTA Label *</label>
                <input
                  type="text"
                  required
                  value={formData.primaryCTA.label}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      primaryCTA: { ...formData.primaryCTA, label: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Primary CTA Destination URL *</label>
                <input
                  type="text"
                  required
                  value={formData.primaryCTA.url}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      primaryCTA: { ...formData.primaryCTA, url: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-[#0F172A]">Publication & Scheduling</h3>
            <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-[11px]">
              <strong>Default State Guarantee:</strong> New campaigns are strictly saved as <strong>Draft</strong> and <strong>Disabled</strong> to prevent accidental exposure until verified by administrator.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.schedule.startDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      schedule: { ...formData.schedule, startDate: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.schedule.endDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      schedule: { ...formData.schedule, endDate: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "audience" && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-[#0F172A]">Display & Audience Controls</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Target Audience</label>
                <select
                  value={formData.targeting.targetAudience}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targeting: { ...formData.targeting, targetAudience: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                >
                  <option value="all">All Visitors</option>
                  <option value="guests">Unauthenticated Guests Only</option>
                  <option value="authenticated">Logged-in Users Only</option>
                  <option value="students">Enrolled Students Only</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Display Frequency</label>
                <select
                  value={formData.frequency.frequencyType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      frequency: { ...formData.frequency, frequencyType: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                >
                  <option value="once_per_session">Once Per Browser Session</option>
                  <option value="always">Every Page Visit</option>
                  <option value="once_per_day">Once Per Day</option>
                  <option value="once_per_campaign">Once Per Campaign Lifetime</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === "appearance" && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-[#0F172A]">Appearance & Layout</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Popup Layout</label>
                <select
                  value={formData.appearance.layout}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      appearance: { ...formData.appearance, layout: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                >
                  <option value="modal">Centered Modal Dialog</option>
                  <option value="banner_top">Top Notification Strip</option>
                  <option value="banner_bottom">Bottom Sticky Banner</option>
                  <option value="slide_in_right">Slide-in Right Card</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Entrance Animation</label>
                <select
                  value={formData.appearance.animation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      appearance: { ...formData.appearance, animation: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                >
                  <option value="fade">Subtle Fade In</option>
                  <option value="zoom">Zoom Scale In</option>
                  <option value="slide_up">Slide Up From Bottom</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
