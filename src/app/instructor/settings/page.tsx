"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import RichTextEditor from "@/components/ui/RichTextEditor";
import {
  Settings,
  ArrowLeft,
  User,
  Globe,
  Bell,
  ShieldCheck,
  Save,
  Loader2,
  X,
  Plus,
  Layers,
  CheckCircle2,
  Lock,
  ExternalLink,
} from "lucide-react";

export default function InstructorSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [website, setWebsite] = useState("");
  const [experienceYears, setExperienceYears] = useState("0");
  const [profileSlug, setProfileSlug] = useState("");
  const [isPublicProfileVisible, setIsPublicProfileVisible] = useState(true);

  // Skills Chips
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState("");

  // Social Links
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");

  // Notification Preferences
  const [notifEnrollment, setNotifEnrollment] = useState(true);
  const [notifReview, setNotifReview] = useState(true);
  const [notifQuestion, setNotifQuestion] = useState(true);
  const [notifUpdate, setNotifUpdate] = useState(true);

  // Quota usage info
  const [quotaUsage, setQuotaUsage] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "instructor" && user.role !== "admin" && user.role !== "super_admin"))) {
      router.push("/student/dashboard");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/instructor/settings");
        const data = await res.json();
        if (data.success && data.profile) {
          const p = data.profile;
          setName(p.name || "");
          setEmail(p.email || "");
          setHeadline(p.headline || "");
          setBio(p.bio || "");
          setAvatar(p.avatar || "");
          setWebsite(p.website || "");
          setExperienceYears(String(p.experienceYears || 0));
          setProfileSlug(p.profileSlug || p.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "");
          setIsPublicProfileVisible(p.isPublicProfileVisible !== false);
          setSkills(p.skills || ["Full-Stack", "JavaScript", "System Design"]);

          if (p.socialLinks) {
            setGithub(p.socialLinks.github || "");
            setLinkedin(p.socialLinks.linkedin || "");
            setTwitter(p.socialLinks.twitter || "");
            setYoutube(p.socialLinks.youtube || "");
          }

          if (p.notificationPreferences) {
            setNotifEnrollment(p.notificationPreferences.newEnrollment !== false);
            setNotifReview(p.notificationPreferences.newReview !== false);
            setNotifQuestion(p.notificationPreferences.studentQuestion !== false);
            setNotifUpdate(p.notificationPreferences.platformUpdate !== false);
          }

          setQuotaUsage(data.quotaUsage || null);
        } else {
          toast.error(data.error || "Failed to load studio profile");
        }
      } catch (err) {
        console.error("Error loading settings:", err);
        toast.error("Network error loading settings");
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadSettings();
    }
  }, [user]);

  const handleAddSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    const clean = newSkillInput.trim();
    if (clean && !skills.includes(clean)) {
      setSkills([...skills, clean]);
      setNewSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/instructor/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          headline: headline.trim(),
          bio: bio.trim(),
          avatar: avatar.trim(),
          website: website.trim(),
          experienceYears: Number(experienceYears) || 0,
          profileSlug: profileSlug.trim(),
          isPublicProfileVisible,
          skills,
          socialLinks: {
            github: github.trim(),
            linkedin: linkedin.trim(),
            twitter: twitter.trim(),
            youtube: youtube.trim(),
          },
          notificationPreferences: {
            newEnrollment: notifEnrollment,
            newReview: notifReview,
            studentQuestion: notifQuestion,
            platformUpdate: notifUpdate,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Studio profile & preferences saved successfully!");
      } else {
        toast.error(data.error || "Failed to save profile changes");
      }
    } catch {
      toast.error("Network error while saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="py-24 text-center text-[#64748B] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB]" />
        <p className="text-sm font-medium">Loading instructor settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <Link
            href="/instructor/dashboard"
            className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-[#64748B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-[#172554] tracking-tight">Studio Profile & Settings</h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Customize your public instructor credentials, teaching expertise, social profiles, and notifications.
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors self-start sm:self-auto disabled:opacity-50 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
        </button>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Public Profile & Instructor Credentials */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0]">
            <User className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-[#172554]">Public Profile & Credentials</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pb-2">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-slate-900 shrink-0 border border-slate-200">
              {avatar ? (
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg bg-[#172554]">
                  {name.charAt(0) || "I"}
                </div>
              )}
            </div>

            <div className="flex-1 w-full space-y-1">
              <label className="text-xs font-semibold text-slate-800">Avatar Image URL</label>
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] text-slate-900 focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-800 block mb-1">Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-slate-900 focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1">Registered Email (Read Only)</label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-slate-100 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-800 block mb-1">Professional Headline / Title</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Lead Cloud Architect & Full-Stack Mentor"
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-slate-900 focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1">Years of Teaching / Industry Experience</label>
              <input
                type="number"
                min="0"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-slate-900 focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1">Custom Profile URL Slug</label>
              <input
                type="text"
                value={profileSlug}
                onChange={(e) => setProfileSlug(e.target.value)}
                placeholder="e.g. alex-mercer"
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-slate-900 focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-800 block mb-1">Instructor Biography & Philosophy</label>
              <RichTextEditor
                value={bio}
                onChange={(val) => setBio(val)}
                placeholder="Detail your engineering background, production systems you have designed, and your teaching style..."
                minHeight="180px"
              />
            </div>
          </div>

          {/* Skills / Expertise Tags */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-800 block">
              Teaching Expertise & Technologies
            </label>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-[#172554] border border-blue-200 text-xs font-semibold"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1 max-w-sm">
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={handleAddSkill}
                placeholder="Add skill tag (e.g. Docker, Redis)..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] text-slate-900 focus:outline-none focus:border-[#2563EB]"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublicProfileVisible}
                onChange={(e) => setIsPublicProfileVisible(e.target.checked)}
                className="rounded border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB]"
              />
              <span>Display public instructor profile in student search and course details</span>
            </label>
          </div>
        </div>

        {/* Section 2: Social & Web Presence */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0]">
            <Globe className="w-4 h-4 text-[#06B6D4]" />
            <h2 className="text-sm font-bold text-[#172554]">Social Profiles & Web Presence</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-800 block mb-1">GitHub Profile</label>
              <input
                type="url"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-slate-900 focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1">LinkedIn Profile</label>
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-slate-900 focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1">Twitter / X Profile</label>
              <input
                type="url"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="https://x.com/..."
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-slate-900 focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1">Personal Website or Portfolio</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://myportfolio.dev"
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-slate-900 focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Notification Preferences */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0]">
            <Bell className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-[#172554]">Studio Notification Preferences</h2>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-800">
              <input
                type="checkbox"
                checked={notifEnrollment}
                onChange={(e) => setNotifEnrollment(e.target.checked)}
                className="rounded border-[#E2E8F0] text-[#2563EB]"
              />
              <span>Notify me immediately when a new learner enrolls in one of my courses</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-800">
              <input
                type="checkbox"
                checked={notifReview}
                onChange={(e) => setNotifReview(e.target.checked)}
                className="rounded border-[#E2E8F0] text-[#2563EB]"
              />
              <span>Notify me when a student submits an evaluation, rating, or review</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-800">
              <input
                type="checkbox"
                checked={notifQuestion}
                onChange={(e) => setNotifQuestion(e.target.checked)}
                className="rounded border-[#E2E8F0] text-[#2563EB]"
              />
              <span>Notify me when a student asks a technical course question in Q&A</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-800">
              <input
                type="checkbox"
                checked={notifUpdate}
                onChange={(e) => setNotifUpdate(e.target.checked)}
                className="rounded border-[#E2E8F0] text-[#2563EB]"
              />
              <span>Receive periodic platform updates and curriculum authoring tips</span>
            </label>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? "Saving Preferences..." : "Save Studio Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
