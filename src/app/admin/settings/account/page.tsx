"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import RichTextEditor from "@/components/ui/RichTextEditor";
import {
  User,
  Mail,
  ShieldCheck,
  Save,
  Loader2,
  Lock,
  Globe,
  Bell,
  Key,
  Shield,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

export default function AdminAccountSettingsPage() {
  const { user: authUser } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    headline: "",
    bio: "",
    avatar: "",
    website: "",
    socialLinks: {
      github: "",
      twitter: "",
      linkedin: "",
    },
    role: "admin",
  });

  // Change Email Modal State
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState("");
  const [reauthPassword, setReauthPassword] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/admin/account/profile");
        const data = await res.json();
        if (data.success && data.user) {
          setProfile({
            name: data.user.name || "",
            email: data.user.email || "",
            headline: data.user.headline || "",
            bio: data.user.bio || "",
            avatar: data.user.avatar || "",
            website: data.user.website || "",
            socialLinks: {
              github: data.user.socialLinks?.github || "",
              twitter: data.user.socialLinks?.twitter || "",
              linkedin: data.user.socialLinks?.linkedin || "",
            },
            role: data.user.role || "admin",
          });
        }
      } catch (err) {
        toast.error("Failed to load profile details");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Profile information updated successfully!");
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch {
      toast.error("Network error while saving profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangeEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingEmail(true);
    try {
      const res = await fetch("/api/admin/account/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newEmail: newEmailInput,
          currentPassword: reauthPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setProfile((prev) => ({ ...prev, email: data.email }));
        setEmailModalOpen(false);
        setNewEmailInput("");
        setReauthPassword("");
      } else {
        toast.error(data.error || "Failed to change email address");
      }
    } catch {
      toast.error("Error occurred during email change");
    } finally {
      setChangingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-[#64748B]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-3" />
        <p className="text-xs">Loading account settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Settings Navigation Subheader */}
      <div className="border-b border-[#E2E8F0] pb-5">
        <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider block">
          Admin Management & Security
        </span>
        <h1 className="text-2xl font-black text-[#172554] tracking-tight mt-1 flex items-center gap-2">
          <User className="w-6 h-6 text-[#2563EB]" />
          Account & Profile Settings
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Manage your personal administrator identity, verified contact address, and display credentials.
        </p>

        {/* Account Tabs */}
        <div className="flex flex-wrap gap-6 mt-6 border-b border-[#E2E8F0] text-xs font-semibold">
          <Link
            href="/admin/settings/account"
            className="pb-2.5 border-b-2 border-[#2563EB] text-[#2563EB] flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5" />
            Profile Information
          </Link>
          <Link
            href="/admin/settings/security"
            className="pb-2.5 border-b-2 border-transparent text-[#64748B] hover:text-[#0F172A] flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Security & Passwords
          </Link>
          <Link
            href="/admin/settings/notifications"
            className="pb-2.5 border-b-2 border-transparent text-[#64748B] hover:text-[#0F172A] flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5" />
            Notifications
          </Link>
          <Link
            href="/admin/settings/sessions"
            className="pb-2.5 border-b-2 border-transparent text-[#64748B] hover:text-[#0F172A] flex items-center gap-1.5"
          >
            <Smartphone className="w-3.5 h-3.5" />
            Active Sessions
          </Link>
        </div>
      </div>

      {/* Role Protection Banner */}
      <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 flex items-start gap-3">
        <Shield className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-[#172554] block">
            Role: {profile.role === "super_admin" ? "Super Administrator" : "Administrator"}
          </span>
          <p className="text-[#64748B] mt-0.5">
            You hold administrative privileges. Sensitive changes such as modifying your primary email address or updating credentials require server-side cryptographic re-authentication.
          </p>
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSaveProfile} className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A]">Administrator Details</h2>
            <p className="text-xs text-[#64748B]">This information appears on public reviews, notes, and platform author tags.</p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save Profile Changes"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">Full Legal / Display Name *</label>
            <input
              type="text"
              required
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-[#0F172A]">Primary Account Email</label>
              <button
                type="button"
                onClick={() => {
                  setNewEmailInput(profile.email);
                  setEmailModalOpen(true);
                }}
                className="text-[11px] text-[#2563EB] hover:underline font-semibold cursor-pointer"
              >
                Change Email Address
              </button>
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                disabled
                value={profile.email}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E2E8F0] bg-slate-100 text-[#64748B] cursor-not-allowed text-xs font-mono"
              />
            </div>
            <p className="text-[10px] text-[#94A3B8] mt-1">Requires re-authentication password confirmation to modify.</p>
          </div>

          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">Professional Title / Headline</label>
            <input
              type="text"
              value={profile.headline}
              placeholder="e.g. Principal Architect & Platform Administrator"
              onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">Avatar Image URL</label>
            <input
              type="text"
              value={profile.avatar}
              placeholder="https://images.unsplash.com/... or uploaded asset URL"
              onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="font-semibold text-[#0F172A] block mb-1">Bio / Profile Description</label>
            <RichTextEditor
              value={profile.bio}
              placeholder="A brief summary of your role, background, and domain expertise..."
              onChange={(val) => setProfile({ ...profile, bio: val })}
              minHeight="160px"
            />
          </div>

          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">Personal / Organization Website</label>
            <input
              type="text"
              value={profile.website}
              placeholder="https://yourdomain.com"
              onChange={(e) => setProfile({ ...profile, website: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">GitHub Profile Handle / URL</label>
            <input
              type="text"
              value={profile.socialLinks.github}
              placeholder="https://github.com/yourhandle"
              onChange={(e) =>
                setProfile({
                  ...profile,
                  socialLinks: { ...profile.socialLinks, github: e.target.value },
                })
              }
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>
      </form>

      {/* Change Email Modal */}
      {emailModalOpen && (
        <Modal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          title="Change Account Email Address"
        >
          <form onSubmit={handleChangeEmailSubmit} className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Security Re-Authentication Required</span>
                <p>Changing your account email address will immediately change where your password resets, critical alerts, and order confirmations are sent.</p>
              </div>
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Current Password *</label>
              <input
                type="password"
                required
                placeholder="Enter your current password to authorize this change"
                value={reauthPassword}
                onChange={(e) => setReauthPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">New Email Address *</label>
              <input
                type="email"
                required
                placeholder="admin.new@codementors.com"
                value={newEmailInput}
                onChange={(e) => setNewEmailInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEmailModalOpen(false)}
                className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-[#0F172A] font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={changingEmail}
                className="px-4 py-2 rounded-lg bg-[#172554] text-white font-semibold shadow-xs disabled:opacity-50"
              >
                {changingEmail ? "Verifying..." : "Confirm & Update Email"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
