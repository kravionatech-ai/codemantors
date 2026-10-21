"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import CourseCard from "@/components/ui/CourseCard";
import CertificateCard from "@/components/learning/CertificateCard";
import RichTextEditor from "@/components/ui/RichTextEditor";
import FormattedContentRenderer from "@/components/ui/FormattedContentRenderer";
import {
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  Bookmark,
  Play,
  ArrowRight,
  ExternalLink,
  Loader2,
  FileText,
  User,
  Sparkles,
  TrendingUp,
  Bell,
  Compass,
} from "lucide-react";

function StudentDashboardContent() {
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<"courses" | "continue" | "certificates" | "quizzes" | "bookmarks" | "announcements" | "settings">(
    (tabParam as any) || "courses"
  );
  const [courseFilter, setCourseFilter] = useState<"all" | "in_progress" | "completed">("all");

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile Settings Form
  const [profileName, setProfileName] = useState("");
  const [profileHeadline, setProfileHeadline] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/student/dashboard");
      } else if (user.role === "instructor") {
        router.replace("/instructor/dashboard");
      } else if (user.role === "admin" || user.role === "super_admin") {
        router.replace("/admin/dashboard");
      }
    }
  }, [user, authLoading, router]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard/student", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (res.status === 403) {
        if (user?.role === "instructor") {
          router.replace("/instructor/dashboard");
        } else if (user?.role === "admin" || user?.role === "super_admin") {
          router.replace("/admin/dashboard");
        }
        return;
      }
      const data = await res.json();
      if (data.success) {
        setDashboardData(data);
        if (user) {
          setProfileName(user.name || "");
          setProfileHeadline(user.headline || "");
          setProfileBio(user.bio || "");
        }
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && user.role === "student") {
      fetchDashboard();
    }
  }, [authLoading, user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/dashboard/student", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName,
          headline: profileHeadline,
          bio: profileBio,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Profile updated successfully!");
        await refreshUser();
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
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
          href="/login?redirect=/student/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] rounded-lg hover:bg-blue-700 transition-colors"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-[#64748B] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB]" />
        <p className="text-sm font-medium">Loading your student learning dashboard...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs text-center space-y-4">
        <h2 className="text-lg font-bold text-[#0F172A]">Unable to Load Student Dashboard</h2>
        <p className="text-xs text-[#64748B]">There was a problem loading your course enrollments and progress.</p>
        <button
          onClick={() => fetchDashboard()}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats, continueLearning, enrollments, certificates, quizAttempts, bookmarkedLessons, notifications } = dashboardData;

  const continueList = Array.isArray(continueLearning)
    ? continueLearning
    : continueLearning && continueLearning.courseTitle
    ? [continueLearning]
    : [];

  const activeEnrollment = (enrollments || []).find((e: any) => (e.progressPercentage || 0) < 100) || (enrollments || [])[0];
  const mostRecentResume = continueList[0] || (activeEnrollment?.courseId ? {
    courseTitle: activeEnrollment.courseId.title,
    courseSlug: activeEnrollment.courseId.slug,
    lastLessonTitle: "Resume Curriculum",
    lastLessonId: activeEnrollment.lastAccessedLessonId || activeEnrollment.courseId.modules?.[0]?.lessons?.[0]?._id?.toString() || "",
    progressPercentage: activeEnrollment.progressPercentage || 0,
    lastLessonType: "video",
  } : null);

  const inProgressEnrollments = (enrollments || []).filter((e: any) => (e.progressPercentage || 0) < 100);
  const completedEnrollments = (enrollments || []).filter((e: any) => (e.progressPercentage || 0) >= 100);
  const displayedEnrollments = courseFilter === "in_progress" 
    ? inProgressEnrollments 
    : courseFilter === "completed" 
    ? completedEnrollments 
    : (enrollments || []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Compact Human-Centric Greeting & Live Progress Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
            Hi, {user?.name || "Student"}
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            {inProgressEnrollments.length > 0
              ? `${inProgressEnrollments.length} ${inProgressEnrollments.length === 1 ? "course" : "courses"} currently in progress`
              : "Track your enrolled curriculums, assessments, and verified credentials."}
          </p>
        </div>

        {/* Learning Metrics Strip */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs text-[#64748B] shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[#111827]">{enrollments?.length || 0}</span>
            <span>Enrolled</span>
          </div>
          <span className="text-[#CBD5E1] hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[#2563EB]">{inProgressEnrollments.length}</span>
            <span>In Progress</span>
          </div>
          <span className="text-[#CBD5E1] hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[#0D9488]">{completedEnrollments.length}</span>
            <span>Completed</span>
          </div>
          <span className="text-[#CBD5E1] hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[#111827]">{certificates?.length || 0}</span>
            <span>Certificates</span>
          </div>
        </div>
      </div>

      {/* 2. Primary Next Action: Continue Learning Resume Card */}
      {mostRecentResume && mostRecentResume.courseSlug && mostRecentResume.lastLessonId ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-[#CBD5E1] transition-colors">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Continue Learning
              </span>
              <span className="text-xs text-[#64748B]">
                Course: <span className="font-medium text-[#111827]">{mostRecentResume.courseTitle}</span>
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#111827]">
              {mostRecentResume.lastLessonTitle || "Resume Next Lesson"}
            </h2>
            <div className="flex items-center gap-3 pt-1">
              <div className="w-48 bg-[#E2E8F0] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#2563EB] h-1.5 rounded-full transition-all"
                  style={{ width: `${mostRecentResume.progressPercentage}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-[#64748B]">
                {mostRecentResume.progressPercentage}% completed
              </span>
            </div>
          </div>
          <Link
            href={`/learn/${mostRecentResume.courseSlug}/${mostRecentResume.lastLessonId}`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors whitespace-nowrap cursor-pointer shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Resume Lesson</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        /* Empty State when student has no courses yet */
        enrollments?.length === 0 && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-[#94A3B8] mx-auto" />
            <h3 className="text-sm font-bold text-[#111827]">Start Your First Course</h3>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              Explore our curated library of engineering masterclasses in modern web development, backend systems, and cloud architecture.
            </p>
            <div className="pt-1">
              <Link
                href="/courses"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
              >
                <span>Browse Courses</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )
      )}

      {/* 3. Navigation Tabs */}
      <div className="border-b border-[#E2E8F0] flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("courses")}
          className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "courses"
              ? "border-[#2563EB] text-[#2563EB]"
              : "border-transparent text-[#64748B] hover:text-[#111827]"
          }`}
        >
          My Courses ({enrollments?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("announcements")}
          className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === "announcements"
              ? "border-[#2563EB] text-[#2563EB]"
              : "border-transparent text-[#64748B] hover:text-[#111827]"
          }`}
        >
          <Bell className="w-3.5 h-3.5 text-[#2563EB]" />
          Announcements
        </button>
        <button
          onClick={() => setActiveTab("bookmarks")}
          className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "bookmarks"
              ? "border-[#2563EB] text-[#2563EB]"
              : "border-transparent text-[#64748B] hover:text-[#111827]"
          }`}
        >
          Bookmarks ({bookmarkedLessons?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("quizzes")}
          className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "quizzes"
              ? "border-[#2563EB] text-[#2563EB]"
              : "border-transparent text-[#64748B] hover:text-[#111827]"
          }`}
        >
          Quizzes & Results ({quizAttempts?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("certificates")}
          className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "certificates"
              ? "border-[#2563EB] text-[#2563EB]"
              : "border-transparent text-[#64748B] hover:text-[#111827]"
          }`}
        >
          Certificates ({certificates?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "settings"
              ? "border-[#2563EB] text-[#2563EB]"
              : "border-transparent text-[#64748B] hover:text-[#111827]"
          }`}
        >
          Profile Settings
        </button>
      </div>

      {/* Tab 1: Enrolled Courses */}
      {activeTab === "courses" && (
        <div className="space-y-6">
          {/* Sub-Filter Controls for Course Status Separation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCourseFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                courseFilter === "all"
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#111827]"
              }`}
            >
              All Courses ({enrollments?.length || 0})
            </button>
            <button
              onClick={() => setCourseFilter("in_progress")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                courseFilter === "in_progress"
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#111827]"
              }`}
            >
              In Progress ({inProgressEnrollments.length})
            </button>
            <button
              onClick={() => setCourseFilter("completed")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                courseFilter === "completed"
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#111827]"
              }`}
            >
              Completed ({completedEnrollments.length})
            </button>
          </div>

          {displayedEnrollments && displayedEnrollments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedEnrollments.map((enr: any) => {
                const c = enr.courseId;
                if (!c) return null;
                return (
                  <div
                    key={enr._id}
                    className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs flex flex-col justify-between hover:border-[#CBD5E1] transition-all"
                  >
                    <div>
                      <div className="h-40 bg-slate-100 relative overflow-hidden">
                        <img
                          src={c.thumbnail || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80"}
                          alt={c.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/95 text-[#111827] shadow-2xs border border-[#E2E8F0]">
                          {enr.status}
                        </span>
                      </div>
                      <div className="p-5 space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {c.level || "Intermediate"}
                        </span>
                        <h3 className="text-base font-bold text-[#111827] line-clamp-1">
                          {c.title}
                        </h3>
                        <p className="text-xs text-[#64748B] line-clamp-2">
                          {c.subtitle || c.description}
                        </p>
                        {/* Progress */}
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-xs text-[#64748B]">
                            <span>Progress</span>
                            <span className="font-semibold text-[#111827]">{enr.progressPercentage || 0}%</span>
                          </div>
                          <div className="w-full bg-[#E2E8F0] rounded-full h-1.5">
                            <div
                              className="bg-[#2563EB] h-1.5 rounded-full"
                              style={{ width: `${enr.progressPercentage || 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <Link
                        href={`/courses/${c.slug}`}
                        className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        <span>{enr.progressPercentage >= 100 ? "Review Course" : "Continue Learning"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-[#94A3B8] mx-auto" />
              <h3 className="text-base font-bold text-[#111827]">
                {courseFilter === "completed" 
                  ? "No Completed Courses Yet" 
                  : courseFilter === "in_progress" 
                  ? "No Courses Currently In Progress" 
                  : "No Enrolled Courses Yet"}
              </h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                {courseFilter === "completed"
                  ? "Keep studying and complete all modules to earn your verified certificates."
                  : "Explore our catalog to start learning modern web engineering, architecture, and AI."}
              </p>
              <div className="pt-2">
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold"
                >
                  <span>Explore Courses</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Announcements & Mentor Updates */}
      {activeTab === "announcements" && (
        <div className="space-y-4">
          {notifications && notifications.length > 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-xs divide-y divide-[#E2E8F0]">
              {notifications.map((notif: any) => (
                <div key={notif._id} className="py-5 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] border border-blue-200">
                      {notif.type || "Update"}
                    </span>
                    <span className="text-xs text-[#94A3B8]">
                      {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : "Recent"}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#0F172A]">{notif.title}</h3>
                  <FormattedContentRenderer content={notif.message} className="text-xs text-[#64748B] leading-relaxed" />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#0F172A]">No Announcements Yet</h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto mt-1">
                Announcements and direct mentor updates from your enrolled courses will be published here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Bookmarks */}
      {activeTab === "bookmarks" && (
        <div className="space-y-4">
          {bookmarkedLessons && bookmarkedLessons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookmarkedLessons.map((bm: any) => (
                <div
                  key={bm._id}
                  className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded">
                      Bookmarked Lesson
                    </span>
                    <h3 className="text-sm font-bold text-[#0F172A]">{bm.lessonTitle || "Saved Tutorial"}</h3>
                    <p className="text-xs text-[#64748B]">{bm.courseTitle || "Course Material"}</p>
                  </div>
                  {bm.courseSlug && bm.lessonId && (
                    <Link
                      href={`/learn/${bm.courseSlug}/${bm.lessonId}`}
                      className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#172554] hover:bg-slate-100"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center text-[#64748B]">
              <Bookmark className="w-10 h-10 text-[#94A3B8] mx-auto mb-2" />
              <p className="text-sm font-bold text-[#0F172A]">No Bookmarks Saved</p>
              <p className="text-xs text-[#64748B] mt-1">
                While studying any video or article lesson, click the bookmark icon to save key lessons here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Quizzes */}
      {activeTab === "quizzes" && (
        <div className="space-y-4">
          {quizAttempts && quizAttempts.length > 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#0F172A]">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Quiz / Assessment</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4">Passing Grade</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Completed On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {quizAttempts.map((q: any) => (
                      <tr key={q._id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-[#0F172A]">
                          {q.quizId?.title || "Course Knowledge Check"}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#2563EB]">
                          {q.scorePercentage}%
                        </td>
                        <td className="py-3 px-4 text-[#64748B]">
                          {q.quizId?.passingScore || 70}%
                        </td>
                        <td className="py-3 px-4">
                          {q.passed ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200">
                              PASSED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-[#DC2626] border border-rose-200">
                              RETRY NEEDED
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#64748B]">
                          {new Date(q.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center text-[#64748B]">
              <CheckCircle2 className="w-10 h-10 text-[#94A3B8] mx-auto mb-2" />
              <p className="text-sm font-bold text-[#0F172A]">No Quiz Attempts Yet</p>
              <p className="text-xs text-[#64748B] mt-1">
                Complete module quizzes to validate your engineering skills and earn your certificates.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Certificates */}
      {activeTab === "certificates" && (
        <div className="space-y-4">
          {certificates && certificates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certificates.map((cert: any) => (
                <div key={cert._id} className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Verified Certificate
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#64748B]">
                      {cert.certificateCode}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0F172A]">
                      {cert.courseId?.title || cert.metadata?.courseTitle || "Accredited Program"}
                    </h3>
                    <p className="text-xs text-[#64748B] mt-1">
                      Awarded to <span className="font-semibold text-[#0F172A]">{cert.metadata?.studentName || user?.name}</span> with a grade of <span className="font-semibold text-[#2563EB]">{cert.gradePercentage}%</span>.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-3">
                    <Link
                      href={`/certificates/${cert.certificateCode}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Award className="w-3.5 h-3.5" />
                      View Certificate
                    </Link>
                    <Link
                      href={`/certificates/verify?code=${cert.certificateCode}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#111827] text-xs font-medium transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Verify Public Link
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center text-[#64748B]">
              <Award className="w-10 h-10 text-[#94A3B8] mx-auto mb-2" />
              <p className="text-sm font-bold text-[#111827]">No Certificates Earned Yet</p>
              <p className="text-xs text-[#64748B] mt-1">
                Complete all required lessons and quizzes in eligible courses to earn your official certificates.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Profile Settings */}
      {activeTab === "settings" && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 max-w-2xl shadow-xs">
          <h2 className="text-base font-bold text-[#111827] mb-1">Student Profile & Settings</h2>
          <p className="text-xs text-[#64748B] mb-6">
            Manage your personal learning information and public credentials.
          </p>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2E8F0] bg-white text-[#111827] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] cursor-not-allowed"
              />
              <span className="text-[11px] text-[#94A3B8] mt-1 block">
                Primary account identifier managed by your security settings.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                Headline / Title
              </label>
              <input
                type="text"
                value={profileHeadline}
                onChange={(e) => setProfileHeadline(e.target.value)}
                placeholder="Full Stack Developer | Aspiring Software Engineer"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2E8F0] bg-white text-[#111827] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                Bio
              </label>
              <RichTextEditor
                value={profileBio}
                onChange={(val) => setProfileBio(val)}
                placeholder="Tell instructors and peer learners about your software journey..."
                minHeight="160px"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-60 cursor-pointer transition-colors"
              >
                {savingProfile ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-[#64748B]">Loading dashboard...</div>}>
      <StudentDashboardContent />
    </Suspense>
  );
}
