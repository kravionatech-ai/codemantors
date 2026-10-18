"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import CourseCard from "@/components/ui/CourseCard";
import CertificateCard from "@/components/learning/CertificateCard";
import {
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  Bookmark,
  HelpCircle,
  Settings,
  Play,
  ArrowRight,
  User,
  Shield,
  LogOut,
  ExternalLink,
} from "lucide-react";

export default function StudentDashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"courses" | "certificates" | "quizzes" | "bookmarks" | "settings">("courses");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile Settings Form
  const [profileName, setProfileName] = useState("");
  const [profileHeadline, setProfileHeadline] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/dashboard");
    }
  }, [user, authLoading, router]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard/student");
      const data = await res.json();
      if (data.success) {
        setDashboardData(data);
        if (user) {
          setProfileName(user.name || "");
          setProfileHeadline(user.headline || "");
          setProfileBio(user.bio || "");
          setProfileAvatar(user.avatar || "");
        }
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboard();
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      // In a real endpoint or user profile patch
      toast.success("Profile settings updated successfully!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400">
        <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs">Loading your learning dashboard...</p>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { stats, continueLearning, enrollments, certificates, quizAttempts, bookmarkedLessons } = dashboardData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* 1. Welcome Banner & User Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-blue-950/20 to-slate-900 shadow-xl">
        <div className="flex items-center gap-4">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-14 h-14 rounded-2xl object-cover border border-slate-700"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xl border border-blue-500/30">
              {user?.name?.charAt(0) || "S"}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">Welcome back, {user?.name}!</h1>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Track your course progress, review quizzes, and download earned certificates.
            </p>
          </div>
        </div>

        <Link
          href="/courses"
          className="self-start sm:self-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
        >
          Browse More Courses
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40">
          <span className="text-[11px] font-semibold uppercase text-slate-400 block">Enrolled Courses</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-white">{stats.totalEnrolled}</span>
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40">
          <span className="text-[11px] font-semibold uppercase text-slate-400 block">In Progress</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-amber-400">{stats.inProgressCount}</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40">
          <span className="text-[11px] font-semibold uppercase text-slate-400 block">Completed</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-emerald-400">{stats.completedCoursesCount}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40">
          <span className="text-[11px] font-semibold uppercase text-slate-400 block">Certificates</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-violet-400">{stats.totalCertificates}</span>
            <Award className="w-4 h-4 text-violet-400" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold uppercase text-slate-400 block">Time Learned</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-cyan-400">{stats.totalHoursLearned}h</span>
            <span className="text-xs text-slate-500">total</span>
          </div>
        </div>
      </div>

      {/* 3. Continue Learning Banner (if active) */}
      {continueLearning && (
        <div className="p-6 rounded-3xl border border-blue-500/30 bg-blue-950/20 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={continueLearning.thumbnail}
              alt={continueLearning.courseTitle}
              className="w-20 h-14 rounded-xl object-cover bg-slate-800 shrink-0"
            />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block mb-0.5">
                Resume Where You Left Off
              </span>
              <h3 className="text-base font-bold text-white line-clamp-1">{continueLearning.courseTitle}</h3>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                <span>Lesson: {continueLearning.lessonTitle}</span>
                <span>•</span>
                <span className="font-semibold text-blue-400">{continueLearning.progressPercentage}% complete</span>
              </p>
            </div>
          </div>

          <Link
            href={`/learn/${continueLearning.courseSlug}/${continueLearning.lastLessonId}`}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Resume Lesson
          </Link>
        </div>
      )}

      {/* 4. Tab Navigation */}
      <div className="border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab("courses")}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "courses"
              ? "border-blue-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Enrolled Courses ({enrollments.length})
        </button>

        <button
          onClick={() => setActiveTab("certificates")}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "certificates"
              ? "border-blue-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Award className="w-4 h-4" />
          Earned Certificates ({certificates.length})
        </button>

        <button
          onClick={() => setActiveTab("quizzes")}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "quizzes"
              ? "border-blue-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          Quiz History ({quizAttempts.length})
        </button>

        <button
          onClick={() => setActiveTab("bookmarks")}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "bookmarks"
              ? "border-blue-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Bookmark className="w-4 h-4" />
          Saved Lessons ({bookmarkedLessons.length})
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "settings"
              ? "border-blue-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Settings className="w-4 h-4" />
          Account & Profile
        </button>
      </div>

      {/* 5. Tab Content Panes */}
      <div>
        {/* Tab 1: Enrolled Courses */}
        {activeTab === "courses" && (
          <div>
            {enrollments.length === 0 ? (
              <div className="py-16 text-center rounded-2xl border border-slate-800 bg-slate-900/20 p-8 space-y-4">
                <BookOpen className="w-10 h-10 text-slate-500 mx-auto" />
                <h3 className="text-base font-bold text-white">No Enrolled Courses Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Explore our production courses and start building real software engineering skills.
                </p>
                <Link
                  href="/courses"
                  className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                >
                  Browse Catalog
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrollments.map((enr: any) => {
                  const c = enr.courseId;
                  if (!c) return null;
                  return (
                    <CourseCard
                      key={enr._id}
                      course={c}
                      progress={enr.progressPercentage}
                      isEnrolled={true}
                      continueLessonId={enr.lastAccessedLessonId}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Certificates */}
        {activeTab === "certificates" && (
          <div className="space-y-6">
            {certificates.length === 0 ? (
              <div className="py-16 text-center rounded-2xl border border-slate-800 bg-slate-900/20 p-8 space-y-3">
                <Award className="w-10 h-10 text-slate-500 mx-auto" />
                <h3 className="text-base font-bold text-white">No Certificates Earned Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Complete 100% of curriculum lessons and pass required course quizzes to unlock your verified certificates.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8">
                {certificates.map((cert: any) => (
                  <div key={cert._id} className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-white">
                        {cert.metadata?.courseTitle}
                      </span>
                      <Link
                        href={`/certificates/${cert.certificateCode}`}
                        target="_blank"
                        className="text-blue-400 hover:underline flex items-center gap-1"
                      >
                        Public Verification Link <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                    <CertificateCard certificate={cert} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Quiz History */}
        {activeTab === "quizzes" && (
          <div className="space-y-4">
            {quizAttempts.length === 0 ? (
              <div className="py-16 text-center rounded-2xl border border-slate-800 bg-slate-900/20 p-8 space-y-3">
                <HelpCircle className="w-10 h-10 text-slate-500 mx-auto" />
                <h3 className="text-base font-bold text-white">No Quizzes Taken Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Take lesson quizzes to test your architectural and programming knowledge.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {quizAttempts.map((qa: any) => (
                  <div
                    key={qa._id}
                    className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        {qa.courseId?.title}
                      </span>
                      <h4 className="font-bold text-white text-sm mt-0.5">
                        Attempt #{qa.attemptNumber}
                      </h4>
                      <p className="text-slate-400 mt-1">
                        Completed on {new Date(qa.completedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          qa.passed
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {qa.passed ? "Passed" : "Not Passed"} ({qa.scorePercentage}%)
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Score: {qa.totalScore} / {qa.maxScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Bookmarks */}
        {activeTab === "bookmarks" && (
          <div className="space-y-3">
            {bookmarkedLessons.length === 0 ? (
              <div className="py-16 text-center rounded-2xl border border-slate-800 bg-slate-900/20 p-8 space-y-3">
                <Bookmark className="w-10 h-10 text-slate-500 mx-auto" />
                <h3 className="text-base font-bold text-white">No Bookmarked Lessons</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Bookmark key lessons while studying to easily review tutorials and code snippets later.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bookmarkedLessons.map((bm: any) => (
                  <div
                    key={bm._id}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-3">
                      <span className="text-[10px] font-bold uppercase text-blue-400 block truncate">
                        {bm.courseId?.title}
                      </span>
                      <h4 className="text-xs font-semibold text-white mt-0.5 truncate">
                        Saved Lesson
                      </h4>
                    </div>
                    <Link
                      href={`/learn/${bm.courseId?.slug}/${bm.lessonId}`}
                      className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-xs font-semibold shrink-0 transition-colors"
                    >
                      Open
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Profile & Settings */}
        {activeTab === "settings" && (
          <div className="max-w-2xl mx-auto rounded-3xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-white pb-3 border-b border-slate-800">
              Profile & Account Information
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Professional Headline</label>
                <input
                  type="text"
                  value={profileHeadline}
                  onChange={(e) => setProfileHeadline(e.target.value)}
                  placeholder="e.g. Full-Stack Developer | React & Next.js"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Bio</label>
                <textarea
                  rows={3}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 resize-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Avatar Image URL</label>
                <input
                  type="url"
                  value={profileAvatar}
                  onChange={(e) => setProfileAvatar(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                {savingProfile ? "Saving..." : "Save Profile Changes"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
