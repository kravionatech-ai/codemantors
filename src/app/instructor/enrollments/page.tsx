"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import {
  Users,
  ArrowLeft,
  Loader2,
  BookOpen,
  Clock,
  Download,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileCheck,
  Calendar,
  AlertCircle,
} from "lucide-react";

export default function InstructorEnrollmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<{ _id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedProgress, setSelectedProgress] = useState("all");
  const [sortOrder, setSortOrder] = useState("enrolled_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Telemetry Detail Drawer / Modal
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "instructor" && user.role !== "admin" && user.role !== "super_admin"))) {
      router.push("/student/dashboard");
    }
  }, [user, authLoading, router]);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: "15",
        status: selectedStatus,
        progress: selectedProgress,
        sort: sortOrder,
      });

      if (selectedCourse !== "all") params.append("courseId", selectedCourse);
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/instructor/enrollments?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEnrollments(data.enrollments || []);
        setCourses(data.courses || []);
        setTotalCount(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        toast.error(data.error || "Failed to load enrollments");
      }
    } catch (err) {
      console.error("Error fetching enrollments:", err);
      toast.error("Network error loading enrollment telemetry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEnrollments();
    }
  }, [user, currentPage, selectedCourse, selectedStatus, selectedProgress, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEnrollments();
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (selectedCourse !== "all") params.append("courseId", selectedCourse);
    window.open(`/api/instructor/enrollments/export?${params.toString()}`, "_blank");
    toast.success("CSV export download started");
  };

  const openTelemetryDrawer = (enr: any) => {
    setSelectedEnrollment(enr);
    setDetailModalOpen(true);
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
        <div className="flex items-center gap-3">
          <Link
            href="/instructor/dashboard"
            className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-[#64748B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-[#172554] tracking-tight">Student Enrollments & Telemetry</h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Live learner progress, quiz scores, and academic completion rates across your authored courses.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#E2E8F0] hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-600" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter and Query Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name or email..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E2E8F0] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2563EB]"
            />
          </form>

          {/* Course Select */}
          <div className="sm:col-span-3">
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] text-slate-900 bg-white focus:outline-none focus:border-[#2563EB]"
            >
              <option value="all">All Authored Courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Progress Filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedProgress}
              onChange={(e) => {
                setSelectedProgress(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] text-slate-900 bg-white focus:outline-none focus:border-[#2563EB]"
            >
              <option value="all">All Progress</option>
              <option value="not_started">Not Started (0%)</option>
              <option value="in_progress">In Progress (1-99%)</option>
              <option value="completed">Completed (100%)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] text-slate-900 bg-white focus:outline-none focus:border-[#2563EB]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Learners</option>
              <option value="completed">Completed</option>
              <option value="refunded">Refunded</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enrollments Table */}
      {loading ? (
        <div className="py-20 text-center text-[#64748B] space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB]" />
          <p className="text-sm">Fetching student enrollment telemetry...</p>
        </div>
      ) : enrollments.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center shadow-xs space-y-3">
          <Users className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-[#172554]">No Enrollments Found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            {search || selectedCourse !== "all" || selectedStatus !== "all" || selectedProgress !== "all"
              ? "No enrollments matched the given filters. Try resetting search parameters."
              : "When learners enroll in your free or paid courses, their telemetry will appear here."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[#64748B] font-semibold">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Progress & Completed</th>
                  <th className="py-3 px-4">Quiz Score</th>
                  <th className="py-3 px-4">Enrolled Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {enrollments.map((enr: any) => {
                  const latestQuiz = enr.quizAttempts && enr.quizAttempts[0];

                  return (
                    <tr key={enr._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#172554] text-[#06B6D4] flex items-center justify-center font-bold text-[11px] shrink-0">
                            {enr.userId?.name?.charAt(0) || "S"}
                          </div>
                          <div>
                            <div className="font-bold text-[#0F172A]">{enr.userId?.name || "Student"}</div>
                            <div className="text-[10px] text-[#64748B]">{enr.userId?.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-medium text-[#0F172A]">
                        {enr.courseId?.title || "Course"}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#2563EB] h-1.5 rounded-full"
                              style={{ width: `${enr.progressPercentage || 0}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-800">{enr.progressPercentage || 0}%</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {enr.completedLessons?.length || 0} lessons done
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {latestQuiz ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                latestQuiz.passed
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {latestQuiz.scorePercentage}% {latestQuiz.passed ? "Passed" : "Retake"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">No attempts</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {enr.enrolledAt ? new Date(enr.enrolledAt).toLocaleDateString() : ""}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            enr.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : enr.status === "active"
                              ? "bg-blue-50 text-[#172554] border border-blue-200"
                              : enr.status === "refunded"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {enr.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openTelemetryDrawer(enr)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3.5 border-t border-[#E2E8F0] flex items-center justify-between text-xs bg-slate-50">
              <span className="text-slate-500">
                Page <span className="font-bold text-slate-900">{currentPage}</span> of{" "}
                <span className="font-bold text-slate-900">{totalPages}</span> ({totalCount} enrollments)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Telemetry Detail Drawer / Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Student Learning Telemetry & Quiz Scores"
      >
        {selectedEnrollment && (
          <div className="space-y-4 text-xs">
            {/* Header Identity */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#172554] text-[#06B6D4] flex items-center justify-center font-bold text-sm shrink-0">
                {selectedEnrollment.userId?.name?.charAt(0) || "S"}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-[#0F172A]">{selectedEnrollment.userId?.name}</h3>
                <p className="text-[11px] text-slate-500">{selectedEnrollment.userId?.email}</p>
                <div className="text-[10px] text-[#2563EB] font-semibold mt-0.5">
                  Course: {selectedEnrollment.courseId?.title}
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg">
                <span className="text-[10px] font-semibold text-slate-600">Progress</span>
                <p className="text-base font-black text-[#172554]">{selectedEnrollment.progressPercentage || 0}%</p>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-semibold text-slate-600">Lessons Completed</span>
                <p className="text-base font-black text-[#0F172A]">{selectedEnrollment.completedLessons?.length || 0}</p>
              </div>

              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                <span className="text-[10px] font-semibold text-slate-600">Status</span>
                <p className="text-xs font-black text-emerald-800 uppercase mt-1">{selectedEnrollment.status}</p>
              </div>
            </div>

            {/* Quiz Performance Telemetry */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Quiz Evaluation History</span>
              </h4>

              {selectedEnrollment.quizAttempts && selectedEnrollment.quizAttempts.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedEnrollment.quizAttempts.map((q: any, i: number) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-[11px]"
                    >
                      <div>
                        <span className="font-bold text-slate-900">Attempt #{q.attemptNumber || i + 1}</span>
                        <div className="text-[10px] text-slate-500">
                          {q.completedAt ? new Date(q.completedAt).toLocaleString() : ""}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">
                          Score: {q.totalScore} / {q.maxScore}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            q.passed
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {q.scorePercentage}% ({q.passed ? "Passed" : "Failed"})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic p-3 bg-slate-50 rounded-lg border border-slate-200">
                  No quiz attempts submitted by this student for this course yet.
                </p>
              )}
            </div>

            {/* Privacy Notice */}
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[10px] text-slate-500">
              <strong className="text-slate-700">Data Privacy:</strong> Student passwords, tokens, and payment instrument credentials are encrypted and never exposed in instructor telemetry.
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold"
              >
                Close Telemetry
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
