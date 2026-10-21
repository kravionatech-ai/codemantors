"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import RichTextEditor from "@/components/ui/RichTextEditor";
import {
  GraduationCap,
  BookOpen,
  Users,
  DollarSign,
  Star,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Loader2,
  BarChart3,
  Layers,
  Lock,
  Unlock,
  AlertTriangle,
  FolderTree,
  Send,
  ExternalLink,
  ShieldCheck,
  Award,
} from "lucide-react";

function InstructorDashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionParam = searchParams.get("action");

  const [stats, setStats] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [recentEnrollments, setRecentEnrollments] = useState<any[]>([]);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [attentionCourses, setAttentionCourses] = useState<any[]>([]);
  const [courseComparisons, setCourseComparisons] = useState<any[]>([]);
  const [limitsUsage, setLimitsUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Quick Reply Modal
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // New Course Modal Form
  const [newCourseOpen, setNewCourseOpen] = useState(actionParam === "create");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Web Development");
  const [level, setLevel] = useState("Intermediate");
  const [price, setPrice] = useState("1999");
  const [isFree, setIsFree] = useState(false);
  const [thumbnail, setThumbnail] = useState("");
  const [creatingCourse, setCreatingCourse] = useState(false);

  const isInstructorOrAdmin = Boolean(
    user && (user.role === "instructor" || user.role === "admin" || user.role === "super_admin")
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/instructor/dashboard");
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/instructor/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setCourses(data.courses || []);
        setRecentEnrollments(data.recentEnrollments || []);
        setRecentReviews(data.recentReviews || []);
        setAttentionCourses(data.attentionCourses || []);
        setCourseComparisons(data.courseComparisons || []);
        setLimitsUsage(data.quotaUsage || null);
      } else {
        toast.error(data.error || "Failed to load studio metrics");
      }
    } catch (err) {
      console.error("Instructor stats error:", err);
      toast.error("Network error loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isInstructorOrAdmin) {
      fetchDashboardData();
    }
  }, [authLoading, isInstructorOrAdmin]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCourse(true);

    try {
      const res = await fetch("/api/instructor/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle,
          description,
          category,
          level,
          price: isFree ? 0 : Number(price),
          isFree,
          thumbnail:
            thumbnail ||
            "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop",
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Draft course created! Redirecting to curriculum builder...");
        setNewCourseOpen(false);
        setTitle("");
        setSubtitle("");
        setDescription("");
        router.push(`/instructor/courses/${data.course._id}/curriculum`);
      } else {
        toast.error(data.error || "Failed to create course");
      }
    } catch {
      toast.error("Failed to create course");
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleOpenReply = (review: any) => {
    setSelectedReview(review);
    setReplyText(review.instructorReply?.text || "");
    setReplyModalOpen(true);
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview || !replyText.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/instructor/reviews/${selectedReview._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyText: replyText.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Instructor reply published to student!");
        setReplyModalOpen(false);
        setSelectedReview(null);
        setReplyText("");
        fetchDashboardData();
      } else {
        toast.error(data.error || "Failed to submit reply");
      }
    } catch {
      toast.error("Network error while submitting reply");
    } finally {
      setSubmittingReply(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="py-24 text-center text-[#64748B] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB]" />
        <p className="text-sm font-medium">Loading Instructor Studio telemetry...</p>
      </div>
    );
  }

  if (!isInstructorOrAdmin) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-200 flex items-center justify-center mx-auto">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#0F172A]">Access Restricted: Instructor Privileges Required</h2>
        <p className="text-xs text-[#64748B]">
          Your account ({user?.email}) does not currently have instructor permissions.
        </p>
        <div className="pt-2">
          <Link
            href="/student/dashboard"
            className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Go to Student Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Clean Creator SaaS Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
            Instructor Studio
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Manage your courses, track learner progress, and reply to student feedback.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/instructor/courses"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#111827] font-semibold text-xs transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#64748B]" />
            <span>All Courses</span>
          </Link>
          <button
            onClick={() => setNewCourseOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Course</span>
          </button>
        </div>
      </div>

      {/* 2. Concise Author Quotas & Governance Summary */}
      {limitsUsage && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-[#111827]">Author Quotas:</span>
            <span className="text-[#64748B]">
              Published: <strong className="text-[#111827]">{limitsUsage.activeCourses}/{limitsUsage.maxActiveCourses}</strong>
            </span>
            <span className="text-[#CBD5E1] hidden sm:inline">•</span>
            <span className="text-[#64748B]">
              Drafts: <strong className="text-[#111827]">{limitsUsage.draftCourses}/{limitsUsage.maxDraftCourses}</strong>
            </span>
            <span className="text-[#CBD5E1] hidden sm:inline">•</span>
            <span className="text-[#64748B]">
              Pricing: <strong className="text-[#111827]">{limitsUsage.canCreatePaidCourses ? `₹${limitsUsage.minCoursePrice.toLocaleString()} – ₹${limitsUsage.maxCoursePrice.toLocaleString()}` : "Free only"}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {limitsUsage.requireCourseApproval ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-[#D97706] border border-amber-200">
                Admin Review Required
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-[#16A34A] border border-emerald-200">
                Instant Publishing Enabled
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3. Studio Telemetry Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-[#64748B] block">Total Courses</span>
          <div className="text-xl font-bold text-[#111827]">{stats?.totalCourses || 0}</div>
          <div className="text-[10px] text-[#64748B]">{stats?.publishedCourses || 0} live • {stats?.draftCourses || 0} draft</div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-[#64748B] block">Active Learners</span>
          <div className="text-xl font-bold text-[#111827]">{stats?.totalEnrollments || 0}</div>
          <div className="text-[10px] text-[#64748B]">{stats?.uniqueStudents || 0} unique students</div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-[#64748B] block">Completion Rate</span>
          <div className="text-xl font-bold text-[#111827]">{stats?.completionRate || 0}%</div>
          <div className="text-[10px] text-[#64748B]">{stats?.completedEnrollments || 0} completed</div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-[#64748B] block">Avg Rating</span>
          <div className="text-xl font-bold text-[#111827] flex items-center gap-1">
            <span>{stats?.averageRating || "5.0"}</span>
            <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
          </div>
          <div className="text-[10px] text-[#64748B]">{recentReviews.length} reviews</div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-[#64748B] block">Course Revenue</span>
          <div className="text-xl font-bold text-[#0D9488]">₹{(stats?.totalRevenue || 0).toLocaleString()}</div>
          <div className="text-[10px] text-[#64748B]">Via Razorpay</div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-[#64748B] block">Needs Attention</span>
          <div className="text-xl font-bold text-[#D97706]">{(attentionCourses.length || 0) + (stats?.unrepliedReviewsCount || 0)}</div>
          <div className="text-[10px] text-[#64748B]">{stats?.unrepliedReviewsCount || 0} unreplied reviews</div>
        </div>
      </div>

      {/* Attention Alerts Section */}
      {attentionCourses.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Courses Requiring Attention Before Publishing</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {attentionCourses.map((ac: any) => (
              <div
                key={ac._id}
                className="bg-white border border-amber-200 rounded-lg p-3 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{ac.title}</h4>
                  <p className="text-[11px] text-amber-700 mt-0.5">{ac.reason}</p>
                </div>
                <Link
                  href={`/instructor/courses/${ac._id}/curriculum`}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-semibold rounded shrink-0 transition-colors"
                >
                  Edit Curriculum
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Performance Comparisons Matrix */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-base font-bold text-[#111827]">Course Management & Telemetry</h2>
            <p className="text-xs text-[#64748B]">Real-time completion, learners, and revenue across your curriculums</p>
          </div>
          <Link
            href="/instructor/courses"
            className="text-xs font-semibold text-[#2563EB] hover:text-blue-700 inline-flex items-center gap-1"
          >
            <span>Manage All Courses</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {courseComparisons.length === 0 ? (
          <div className="text-center py-10 text-[#64748B] text-xs">
            No courses authored yet. Click "Create Course" above to build your first curriculum.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[#64748B] font-semibold">
                  <th className="py-2.5 px-3">Course Title</th>
                  <th className="py-2.5 px-3">Format & Level</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Learners</th>
                  <th className="py-2.5 px-3">Completion</th>
                  <th className="py-2.5 px-3">Rating</th>
                  <th className="py-2.5 px-3">Revenue</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {courseComparisons.map((c: any) => (
                  <tr key={c._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#111827]">{c.title}</div>
                      <div className="text-[10px] text-[#64748B]">
                        {c.totalLessonsCount} lessons • {c.totalDurationMinutes} mins
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-[#111827]">{c.format}</span>
                      <div className="text-[10px] text-[#64748B]">{c.level}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === "published"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : c.status === "pending_review"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : c.status === "archived"
                            ? "bg-slate-100 text-slate-600 border border-slate-200"
                            : "bg-blue-50 text-[#2563EB] border border-blue-200"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#111827]">{c.enrolledCount}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-[#E2E8F0] rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#2563EB] h-1.5 rounded-full"
                            style={{ width: `${c.completionRate || 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-[#111827]">{c.completionRate}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500 fill-current" />
                        <span className="font-bold text-[#111827]">{c.ratingAverage}</span>
                        <span className="text-[10px] text-[#64748B]">({c.ratingCount})</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#0D9488]">
                      ₹{c.revenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/instructor/courses/${c._id}/curriculum`}
                          className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-[#2563EB] font-semibold text-[11px] transition-colors"
                        >
                          Curriculum
                        </Link>
                        <Link
                          href={`/instructor/courses/${c._id}/edit`}
                          className="px-2 py-1 rounded border border-[#E2E8F0] hover:bg-slate-100 text-[#111827] font-semibold text-[11px] transition-colors"
                        >
                          Settings
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Two-Column Grid: Recent Student Activity & Recent Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Enrollments */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-bold text-[#111827]">Recent Student Activity</h3>
            </div>
            <Link
              href="/instructor/enrollments"
              className="text-xs font-semibold text-[#2563EB] hover:text-blue-700 inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentEnrollments.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No student enrollments recorded yet.</p>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {recentEnrollments.slice(0, 5).map((enr: any) => (
                <div key={enr._id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#172554] text-[#06B6D4] flex items-center justify-center font-bold text-[11px] shrink-0">
                      {enr.userId?.name?.charAt(0) || "S"}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">
                        {enr.userId?.name || "Student"}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {enr.courseId?.title || "Course"}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#2563EB] h-1.5 rounded-full"
                          style={{ width: `${enr.progressPercentage || 0}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700">
                        {enr.progressPercentage || 0}%
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {enr.enrolledAt ? new Date(enr.enrolledAt).toLocaleDateString() : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reviews with Quick Reply */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-current" />
              <h3 className="text-sm font-bold text-[#111827]">Student Reviews & Quick Reply</h3>
            </div>
            <Link
              href="/instructor/reviews"
              className="text-xs font-semibold text-[#2563EB] hover:text-blue-700 inline-flex items-center gap-1"
            >
              <span>Feedback Workspace</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentReviews.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No student evaluations submitted yet.</p>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {recentReviews.slice(0, 4).map((rev: any) => (
                <div key={rev._id} className="py-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{rev.userId?.name || "Student"}</span>
                      <span className="text-[10px] text-slate-400">• {rev.courseId?.title}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded text-amber-800 text-[10px] font-bold">
                      <Star className="w-3 h-3 text-amber-500 fill-current" />
                      <span>{rev.rating} / 5</span>
                    </div>
                  </div>

                  <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">
                    "{rev.reviewText}"
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    {rev.instructorReply?.text ? (
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Replied on {new Date(rev.instructorReply.repliedAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-600 font-semibold">
                        Awaiting your response
                      </span>
                    )}
                    <button
                      onClick={() => handleOpenReply(rev)}
                      className="px-2 py-0.5 rounded border border-blue-200 text-[#2563EB] hover:bg-blue-50 text-[10px] font-semibold transition-colors"
                    >
                      {rev.instructorReply?.text ? "Edit Reply" : "Quick Reply"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Reply Modal */}
      <Modal
        isOpen={replyModalOpen}
        onClose={() => setReplyModalOpen(false)}
        title="Reply to Student Review"
      >
        <form onSubmit={handleSubmitReply} className="space-y-4 text-xs">
          {selectedReview && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-bold">{selectedReview.userId?.name}</span>
                <span className="text-amber-600 font-bold">{selectedReview.rating} / 5 Stars</span>
              </div>
              <p className="text-slate-600 text-[11px]">"{selectedReview.reviewText}"</p>
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-900 block mb-1">
              Your Instructor Response
            </label>
            <textarea
              required
              rows={4}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Thank the student, offer technical clarification, or provide encouragement..."
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#E2E8F0] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setReplyModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingReply}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-semibold shadow-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submittingReply ? "Posting..." : "Post Reply"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Course Modal */}
      <Modal
        isOpen={newCourseOpen}
        onClose={() => setNewCourseOpen(false)}
        title="Create New Technical Course"
      >
        <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">Course Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Production Microservices with Node.js & Docker"
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">Subtitle / One-line Summary</label>
            <input
              type="text"
              required
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Architect scalable, resilient backend distributed systems"
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#E2E8F0] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              >
                <option value="Web Development">Web Development</option>
                <option value="React">React</option>
                <option value="Next.js">Next.js</option>
                <option value="Node.js">Node.js</option>
                <option value="Python">Python</option>
                <option value="Databases">Databases</option>
                <option value="DevOps & Cloud">DevOps & Cloud</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Difficulty Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#E2E8F0] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="All Levels">All Levels</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-[#0F172A]">Course Pricing (INR)</label>
              <label className="flex items-center gap-1.5 cursor-pointer text-[#64748B]">
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => setIsFree(e.target.checked)}
                  className="rounded border-[#E2E8F0]"
                />
                <span>Free Course</span>
              </label>
            </div>
            {!isFree && (
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#E2E8F0] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
            )}
          </div>

          <div>
            <label className="font-semibold text-[#0F172A] block mb-1">Course Description</label>
            <RichTextEditor
              value={description}
              onChange={(val) => setDescription(val)}
              placeholder="What students will master in this comprehensive technical curriculum..."
              minHeight="180px"
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setNewCourseOpen(false)}
              className="px-4 py-2 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A] font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingCourse}
              className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-semibold shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
            >
              {creatingCourse ? "Saving Draft..." : "Create Course"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function InstructorDashboardPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-[#64748B]">Loading studio...</div>}>
      <InstructorDashboardContent />
    </Suspense>
  );
}
