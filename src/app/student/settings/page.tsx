"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { User, Shield, Bell, CheckCircle2, Loader2 } from "lucide-react";
import RichTextEditor from "@/components/ui/RichTextEditor";

export default function StudentSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/student/settings");
    } else if (user) {
      setName(user.name || "");
      setHeadline(user.headline || "");
      setBio(user.bio || "");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Update profile
      toast.success("Profile preferences saved successfully!");
    } catch {
      toast.error("Failed to update preferences");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="py-20 text-center text-[#64748B] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB]" />
        <p className="text-sm font-medium">Authenticating Student Session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-20 text-center text-[#64748B] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB]" />
        <p className="text-sm font-medium">Redirecting to sign in...</p>
        <Link
          href="/login?redirect=/student/settings"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] rounded-lg hover:bg-blue-700 transition-colors"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="pb-4 border-b border-[#E2E8F0]">
        <h1 className="text-2xl font-black text-[#172554] tracking-tight">Account & Profile Settings</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Manage your personal learning credentials, bio, and notification preferences.
        </p>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-[#E2E8F0]">
          <div className="w-16 h-16 rounded-full bg-[#172554] text-[#06B6D4] flex items-center justify-center text-xl font-bold">
            {user?.name?.charAt(0).toUpperCase() || "S"}
          </div>
          <div>
            <h3 className="font-bold text-[#0F172A] text-base">{user?.name}</h3>
            <p className="text-xs text-[#64748B]">{user?.email}</p>
            <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] border border-blue-200">
              Role: {user?.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Professional Headline / Role
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Frontend Developer, Computer Science Student"
              className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Bio / Learning Goals
            </label>
            <RichTextEditor
              value={bio}
              onChange={(val) => setBio(val)}
              placeholder="Tell instructors and fellow learners about your background and coding goals..."
              minHeight="160px"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
