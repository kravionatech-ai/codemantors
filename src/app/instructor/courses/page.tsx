"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import {
  BookOpen,
  Plus,
  Edit3,
  FolderTree,
  Eye,
  Trash2,
  Users,
  Star,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Archive,
  RotateCcw,
  Copy,
  Search,
  Filter,
  Check,
  Globe,
  Send,
  Video,
  FileText,
  Layers,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LayoutGrid,
  List,
} from "lucide-react";

export default function InstructorCoursesPage() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [limitsUsage, setLimitsUsage] = useState<any>(null);

  // Deletion Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Validation Error Modal
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [actionCourse, setActionCourse] = useState<any>(null);

  // Action in progress
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const isInstructorOrAdmin = Boolean(
    user && (user.role === "instructor" || user.role === "admin" || user.role === "super_admin")
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/instructor/courses");
    }
  }, [user, authLoading, router]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: "9",
        status: statusFilter,
        format: formatFilter,
        sort: sortOrder,
      });
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/instructor/courses?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCourses(data.courses || []);
        setTotal(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        toast.error(data.error || "Failed to load courses");
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
      toast.error("Network error loading courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isInstructorOrAdmin) {
      fetchCourses();
      fetch("/api/instructor/limits")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.usage) {
            setLimitsUsage(data.usage);
          }
        })
        .catch(() => {});
    }
  }, [authLoading, isInstructorOrAdmin, currentPage, statusFilter, formatFilter, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCourses();
  };

  const handleDuplicate = async (course: any) => {
    setActionInProgress(`duplicate-${course._id}`);
    try {
      const res = await fetch(`/api/instructor/courses/${course._id}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Course duplicated successfully as "${data.course?.title}"`);
        fetchCourses();
      } else {
        toast.error(data.error || "Failed to duplicate course");
      }
    } catch {
      toast.error("Error duplicating course");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleToggleArchive = async (course: any) => {
    setActionInProgress(`archive-${course._id}`);
    try {
      const res = await fetch(`/api/instructor/courses/${course._id}/archive`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Course archive status updated");
        fetchCourses();
      } else {
        toast.error(data.error || "Failed to toggle archive");
      }
    } catch {
      toast.error("Error toggling archive");
    } finally {
      setActionInProgress(null);
    }
  };

  const handlePublishOrSubmit = async (course: any) => {
    setActionInProgress(`publish-${course._id}`);
    try {
      const res = await fetch(`/api/instructor/courses/${course._id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Course published successfully!");
        fetchCourses();
      } else {
        if (data.validationErrors && Array.isArray(data.validationErrors)) {
          setActionCourse(course);
          setValidationErrors(data.validationErrors);
          setValidationModalOpen(true);
        } else {
          toast.error(data.error || "Failed to publish course");
        }
      }
    } catch {
      toast.error("Error publishing course");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleUnpublish = async (course: any) => {
    setActionInProgress(`unpublish-${course._id}`);
    try {
      const res = await fetch(`/api/instructor/courses/${course._id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unpublish" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Course reverted to draft");
        fetchCourses();
      } else {
        toast.error(data.error || "Failed to unpublish course");
      }
    } catch {
      toast.error("Error unpublishing course");
    } finally {
      setActionInProgress(null);
    }
  };

  const confirmDelete = (course: any) => {
    setCourseToDelete(course);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!courseToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/courses/${courseToDelete.slug}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Course removed successfully");
        setDeleteModalOpen(false);
        setCourseToDelete(null);
        fetchCourses();
      } else {
        toast.error(data.error || "Failed to delete course");
      }
    } catch {
      toast.error("Failed to delete course");
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="py-24 text-center text-[#64748B] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB]" />
        <p className="text-sm font-medium">Authenticating Instructor Session...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">Course Management Studio</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Create, duplicate, edit curriculum, manage independent SEO, and publish courses.
          </p>
        </div>

        <Link
          href="/instructor/dashboard?action=create"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Course</span>
        </Link>
      </div>

      {/* Author Quotas & Publishing Summary */}
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

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs space-y-3">
        {/* Status Tabs and View Switcher */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
            {[
              { id: "all", label: "All Statuses" },
              { id: "published", label: "Published" },
              { id: "draft", label: "Drafts" },
              { id: "pending_review", label: "Pending Review" },
              { id: "archived", label: "Archived" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-[#2563EB] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 border border-[#E2E8F0] rounded-lg p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === "table" ? "bg-white text-[#2563EB] shadow-2xs" : "text-[#64748B] hover:text-[#111827]"
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === "grid" ? "bg-white text-[#2563EB] shadow-2xs" : "text-[#64748B] hover:text-[#111827]"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>
        </div>

        {/* Search & Select Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          <form onSubmit={handleSearchSubmit} className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, summary, or slug..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E2E8F0] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2563EB]"
            />
          </form>

          <div className="sm:col-span-3">
            <select
              value={formatFilter}
              onChange={(e) => {
                setFormatFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] text-slate-900 bg-white focus:outline-none focus:border-[#2563EB]"
            >
              <option value="all">All Formats</option>
              <option value="video">Video Formats</option>
              <option value="text">Text / Article Formats</option>
              <option value="pdf">PDF / Document Formats</option>
              <option value="mixed">Mixed Media Formats</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] text-slate-900 bg-white focus:outline-none focus:border-[#2563EB]"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="enrolled_desc">Sort: Highest Enrolled</option>
              <option value="rating_desc">Sort: Highest Rated</option>
              <option value="title_asc">Sort: Title A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses Grid / List */}
      {loading ? (
        <div className="py-20 text-center text-[#64748B] space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB]" />
          <p className="text-sm">Filtering authored courses...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center shadow-xs space-y-3">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-[#172554]">No Matching Courses Found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            {search || statusFilter !== "all" || formatFilter !== "all"
              ? "Try resetting your search filters or viewing all statuses."
              : "You haven't authored any courses yet. Get started by creating your first technical curriculum."}
          </p>
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-semibold">
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-3">Format & Level</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Pricing</th>
                  <th className="py-3 px-3">Learners</th>
                  <th className="py-3 px-3">Rating</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {courses.map((course) => {
                  const isPublishing = actionInProgress === `publish-${course._id}`;
                  const isUnpublishing = actionInProgress === `unpublish-${course._id}`;
                  const isDuplicating = actionInProgress === `duplicate-${course._id}`;
                  const isArchiving = actionInProgress === `archive-${course._id}`;

                  return (
                    <tr key={course._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={course.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop"}
                            alt={course.title}
                            className="w-12 h-8 rounded object-cover border border-[#E2E8F0] shrink-0"
                          />
                          <div className="min-w-0 max-w-xs sm:max-w-sm">
                            <p className="font-bold text-[#111827] truncate" title={course.title}>
                              {course.title}
                            </p>
                            <p className="text-[11px] text-[#64748B] truncate">
                              {course.category} • {course.totalLessonsCount || 0} lessons • {course.totalDurationMinutes || 0} min
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-[#111827]">{course.format || "Mixed"}</span>
                        <p className="text-[10px] text-[#64748B]">{course.level || "Intermediate"}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            course.status === "published"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : course.status === "pending_review"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : course.status === "archived"
                              ? "bg-slate-100 text-slate-600 border border-slate-200"
                              : "bg-blue-50 text-[#2563EB] border border-blue-200"
                          }`}
                        >
                          {course.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#111827]">
                        {course.isFree ? "Free" : `₹${course.price?.toLocaleString()}`}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 font-semibold text-[#111827]">
                          <Users className="w-3.5 h-3.5 text-[#64748B]" />
                          <span>{course.enrolledCount || 0}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 font-semibold text-[#111827]">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                          <span>{course.ratingAverage?.toFixed(1) || "5.0"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <Link
                            href={`/instructor/courses/${course._id}/curriculum`}
                            className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-[#2563EB] font-semibold text-xs transition-colors"
                          >
                            Curriculum
                          </Link>
                          <Link
                            href={`/instructor/courses/${course._id}/edit`}
                            className="px-2.5 py-1 rounded border border-[#E2E8F0] hover:bg-slate-100 text-[#111827] font-semibold text-xs transition-colors"
                          >
                            Settings
                          </Link>

                          {course.status === "published" ? (
                            <button
                              onClick={() => handleUnpublish(course)}
                              disabled={isUnpublishing}
                              className="px-2 py-1 rounded border border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100 font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {isUnpublishing ? "..." : "Unpublish"}
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePublishOrSubmit(course)}
                              disabled={isPublishing}
                              className="px-2 py-1 rounded border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {isPublishing ? "..." : "Publish"}
                            </button>
                          )}

                          <button
                            onClick={() => handleDuplicate(course)}
                            disabled={isDuplicating}
                            title="Duplicate Course"
                            className="p-1 rounded hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleArchive(course)}
                            disabled={isArchiving}
                            title={course.status === "archived" ? "Restore" : "Archive"}
                            className="p-1 rounded hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => confirmDelete(course)}
                            title="Delete Course"
                            className="p-1 rounded hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => {
            const isPublishing = actionInProgress === `publish-${course._id}`;
            const isUnpublishing = actionInProgress === `unpublish-${course._id}`;
            const isDuplicating = actionInProgress === `duplicate-${course._id}`;
            const isArchiving = actionInProgress === `archive-${course._id}`;

            return (
              <div
                key={course._id}
                className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail / Header */}
                  <div className="relative h-40 bg-slate-900 overflow-hidden">
                    <img
                      src={course.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop"}
                      alt={course.title}
                      className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          course.status === "published"
                            ? "bg-emerald-500 text-white"
                            : course.status === "pending_review"
                            ? "bg-amber-500 text-white"
                            : course.status === "archived"
                            ? "bg-slate-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {course.status.replace("_", " ")}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium backdrop-blur-xs">
                        {course.format || "Mixed"}
                      </span>
                    </div>

                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold">
                      {course.isFree ? "FREE" : `₹${course.price?.toLocaleString()}`}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">
                      {course.category} {course.subcategory ? `• ${course.subcategory}` : ""}
                    </div>
                    <h3 className="font-bold text-sm text-[#0F172A] line-clamp-1" title={course.title}>
                      {course.title}
                    </h3>
                    <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                      {course.subtitle || course.description}
                    </p>

                    {/* Meta stats */}
                    <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800">{course.enrolledCount || 0}</span> learners
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{course.totalDurationMinutes || 0} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                        <span className="font-semibold text-slate-800">{course.ratingAverage || 5.0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-3 bg-slate-50 border-t border-[#E2E8F0] space-y-2">
                  {/* Primary Builder Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/instructor/courses/${course._id}/curriculum`}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#172554] hover:bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      <FolderTree className="w-3.5 h-3.5 text-[#06B6D4]" />
                      <span>Curriculum</span>
                    </Link>

                    <Link
                      href={`/instructor/courses/${course._id}/edit`}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                      <span>Settings & SEO</span>
                    </Link>
                  </div>

                  {/* Secondary Quick Controls */}
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <div className="flex items-center gap-1">
                      {course.status === "published" ? (
                        <button
                          onClick={() => handleUnpublish(course)}
                          disabled={isUnpublishing}
                          className="px-2 py-0.5 rounded border border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100 font-semibold transition-colors disabled:opacity-50"
                        >
                          {isUnpublishing ? "Reverting..." : "Unpublish"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePublishOrSubmit(course)}
                          disabled={isPublishing}
                          className="px-2 py-0.5 rounded border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-semibold transition-colors disabled:opacity-50"
                        >
                          {isPublishing ? "Checking..." : "Publish / Submit"}
                        </button>
                      )}

                      <button
                        onClick={() => handleToggleArchive(course)}
                        disabled={isArchiving}
                        className="px-2 py-0.5 rounded border border-slate-200 text-slate-700 bg-white hover:bg-slate-100 font-semibold transition-colors disabled:opacity-50"
                      >
                        {isArchiving
                          ? "Updating..."
                          : course.status === "archived"
                          ? "Restore"
                          : "Archive"}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDuplicate(course)}
                        disabled={isDuplicating}
                        title="Duplicate course hierarchy"
                        className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <Link
                        href={`/courses/${course.slug}`}
                        target="_blank"
                        title="Preview Public Page"
                        className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => confirmDelete(course)}
                        title="Delete Course"
                        className="p-1 rounded hover:bg-rose-100 text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0] text-xs">
          <span className="text-slate-500">
            Showing Page <span className="font-bold text-slate-900">{currentPage}</span> of{" "}
            <span className="font-bold text-slate-900">{totalPages}</span> ({total} courses)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Publication Prerequisite Validation Modal */}
      <Modal
        isOpen={validationModalOpen}
        onClose={() => setValidationModalOpen(false)}
        title="Publication Prerequisites Required"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2.5 text-amber-900">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Course Cannot Be Published Yet</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Before publishing "{actionCourse?.title}" to students, please resolve the following curriculum items:
              </p>
            </div>
          </div>

          <ul className="space-y-1.5 list-disc list-inside text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
            {validationErrors.map((err, i) => (
              <li key={i} className="text-[11px] font-medium text-rose-700">
                {err}
              </li>
            ))}
          </ul>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setValidationModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 font-semibold"
            >
              Close
            </button>
            {actionCourse && (
              <Link
                href={`/instructor/courses/${actionCourse._id}/curriculum`}
                className="px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-semibold transition-colors"
              >
                Go to Curriculum Builder
              </Link>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Course Removal"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Are you sure you want to remove <span className="font-bold text-slate-900">{courseToDelete?.title}</span>?
          </p>
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-[11px]">
            <strong>Note:</strong> If students are already enrolled, this course will be safely archived rather than permanently deleted so enrolled learners retain access.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors disabled:opacity-50"
            >
              {deleting ? "Removing..." : "Confirm Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
