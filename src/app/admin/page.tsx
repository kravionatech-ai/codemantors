"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  ShieldAlert,
  Users,
  BookOpen,
  DollarSign,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Search,
  Filter,
  Eye,
  Check,
  AlertTriangle,
  UserCheck,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"overview" | "users" | "courses" | "refunds">("overview");
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [refundsList, setRefundsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // User search & filters
  const [userSearch, setUserSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const fetchAdminStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.metrics);
      }
    } catch (err) {
      console.error("Admin stats fetch error:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(userSearch)}&role=${selectedRole}`);
      const data = await res.json();
      if (data.success) setUsersList(data.users || []);
    } catch {}
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch(`/api/admin/courses`);
      const data = await res.json();
      if (data.success) setCoursesList(data.courses || []);
    } catch {}
  };

  const fetchRefunds = async () => {
    try {
      const res = await fetch(`/api/admin/refunds`);
      const data = await res.json();
      if (data.success) setRefundsList(data.refunds || []);
    } catch {}
  };

  useEffect(() => {
    if (user && user.role === "admin") {
      Promise.all([fetchAdminStats(), fetchUsers(), fetchCourses(), fetchRefunds()]).finally(() =>
        setLoading(false)
      );
    }
  }, [user]);

  // Update user role / status
  const handleUpdateUser = async (userId: string, updates: { role?: string; isActive?: boolean }) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...updates }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("User updated successfully");
        fetchUsers();
        fetchAdminStats();
      } else {
        toast.error(data.error || "Update failed");
      }
    } catch {
      toast.error("Error updating user");
    }
  };

  // Moderate course
  const handleModerateCourse = async (courseId: string, updates: { status?: string; isFeatured?: boolean }) => {
    try {
      const res = await fetch("/api/admin/courses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, ...updates }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Course moderation state saved");
        fetchCourses();
        fetchAdminStats();
      } else {
        toast.error(data.error || "Moderation update failed");
      }
    } catch {
      toast.error("Error updating course");
    }
  };

  // Process refund
  const handleProcessRefund = async (refundId: string, action: "approve" | "reject") => {
    try {
      const res = await fetch("/api/admin/refunds", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refundId, action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Refund ${action === "approve" ? "approved" : "rejected"}`);
        fetchRefunds();
        fetchAdminStats();
      } else {
        toast.error(data.error || "Refund processing failed");
      }
    } catch {
      toast.error("Error processing refund");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400">
        <div className="w-10 h-10 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs">Loading Admin Control Suite...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center font-bold text-xl border border-rose-500/30">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">Platform Administration</h1>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Root Admin
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time platform financial ledgers, user role delegations, course moderation, and refunds.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
          <span className="text-[10px] font-semibold uppercase text-slate-400 block">Total Users</span>
          <span className="text-2xl font-black text-white mt-1 block">{stats?.totalUsers || 0}</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
          <span className="text-[10px] font-semibold uppercase text-slate-400 block">Students</span>
          <span className="text-2xl font-black text-blue-400 mt-1 block">{stats?.totalStudents || 0}</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
          <span className="text-[10px] font-semibold uppercase text-slate-400 block">Instructors</span>
          <span className="text-2xl font-black text-violet-400 mt-1 block">{stats?.totalInstructors || 0}</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
          <span className="text-[10px] font-semibold uppercase text-slate-400 block">Enrollments</span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">{stats?.totalEnrollments || 0}</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
          <span className="text-[10px] font-semibold uppercase text-slate-400 block">Gross Revenue</span>
          <span className="text-xl font-black text-white mt-1 block">
            ₹{(stats?.grossRevenue || 0).toLocaleString("en-IN")}
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
          <span className="text-[10px] font-semibold uppercase text-slate-400 block">Refunds</span>
          <span className="text-xl font-black text-rose-400 mt-1 block">
            ₹{(stats?.refundedAmount || 0).toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "overview"
              ? "border-rose-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Overview & Activity
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "users"
              ? "border-rose-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users className="w-4 h-4" />
          User Management ({usersList.length})
        </button>

        <button
          onClick={() => setActiveTab("courses")}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "courses"
              ? "border-rose-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Course Moderation ({coursesList.length})
        </button>

        <button
          onClick={() => setActiveTab("refunds")}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "refunds"
              ? "border-rose-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          Refund Review Queue ({refundsList.length})
        </button>
      </div>

      {/* Tab Panes */}
      <div>
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Platform Architecture State
              </h3>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Database Engine:</span>
                  <span className="font-mono text-emerald-400">MongoDB Active</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Payment Gateway:</span>
                  <span className="font-mono text-blue-400">Razorpay (Test & Production)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Cryptographic Signatures:</span>
                  <span className="font-mono text-indigo-400">HMAC-SHA256 Verified</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Accredited Certificates:</span>
                  <span className="font-mono text-amber-400">Enabled</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Quick Seed Actions
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Need to re-populate standard demo data for testing? The seeding engine installs sample courses, lessons, quizzes, coding exercises, coupons, and test accounts.
              </p>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/seed", { method: "POST" });
                    const d = await res.json();
                    if (d.success) {
                      toast.success("Database re-seeded successfully!");
                      fetchAdminStats();
                      fetchUsers();
                      fetchCourses();
                      fetchRefunds();
                    }
                  } catch {
                    toast.error("Seed error");
                  }
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                Re-Run Database Seed
              </button>
            </div>
          </div>
        )}

        {/* Users Management Tab */}
        {activeTab === "users" && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <h3 className="text-base font-bold text-white">Registered Users</h3>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search user by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500"
                />
                <button
                  onClick={fetchUsers}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold"
                >
                  Filter
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="pb-3">User</th>
                    <th className="pb-3">Current Role</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Joined</th>
                    <th className="pb-3 text-right">Role Delegation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {usersList.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="py-3 pr-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name?.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-white block">{u.name}</span>
                          <span className="text-slate-400 text-[11px]">{u.email}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.role === "admin"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : u.role === "instructor"
                              ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleUpdateUser(u._id, { isActive: !u.isActive })}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            u.isActive
                              ? "text-emerald-400 bg-emerald-500/10"
                              : "text-rose-400 bg-rose-500/10"
                          }`}
                        >
                          {u.isActive ? "Active" : "Suspended"}
                        </button>
                      </td>
                      <td className="py-3 text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.role !== "student" && (
                            <button
                              onClick={() => handleUpdateUser(u._id, { role: "student" })}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300"
                            >
                              Make Student
                            </button>
                          )}
                          {u.role !== "instructor" && (
                            <button
                              onClick={() => handleUpdateUser(u._id, { role: "instructor" })}
                              className="px-2 py-1 rounded bg-violet-950/40 hover:bg-violet-900/60 border border-violet-500/30 text-[10px] font-semibold text-violet-300"
                            >
                              Make Instructor
                            </button>
                          )}
                          {u.role !== "admin" && (
                            <button
                              onClick={() => handleUpdateUser(u._id, { role: "admin" })}
                              className="px-2 py-1 rounded bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-[10px] font-semibold text-rose-300"
                            >
                              Make Admin
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Course Moderation Tab */}
        {activeTab === "courses" && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
            <h3 className="text-base font-bold text-white">Course Publication & Moderation</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="pb-3">Course</th>
                    <th className="pb-3">Instructor</th>
                    <th className="pb-3">Current Status</th>
                    <th className="pb-3">Featured</th>
                    <th className="pb-3 text-right">Moderation Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {coursesList.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="py-3 pr-4 flex items-center gap-3">
                        <img
                          src={c.thumbnail}
                          alt={c.title}
                          className="w-12 h-8 rounded-lg object-cover bg-slate-800 shrink-0"
                        />
                        <span className="font-bold text-white truncate max-w-xs">{c.title}</span>
                      </td>
                      <td className="py-3 text-slate-300">{c.instructor?.name || "CodeMentors"}</td>
                      <td className="py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            c.status === "published"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleModerateCourse(c._id, { isFeatured: !c.isFeatured })}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            c.isFeatured ? "text-amber-400 bg-amber-500/10" : "text-slate-500 bg-slate-800"
                          }`}
                        >
                          {c.isFeatured ? "Featured ★" : "Standard"}
                        </button>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {c.status !== "published" ? (
                            <button
                              onClick={() => handleModerateCourse(c._id, { status: "published" })}
                              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px]"
                            >
                              Publish Course
                            </button>
                          ) : (
                            <button
                              onClick={() => handleModerateCourse(c._id, { status: "draft" })}
                              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[10px]"
                            >
                              Unpublish (Draft)
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Refund Review Queue Tab */}
        {activeTab === "refunds" && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
            <h3 className="text-base font-bold text-white">Refund Requests Queue</h3>

            {refundsList.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                No refund requests pending review. All clear!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="pb-3">Student</th>
                      <th className="pb-3">Course</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Reason</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Review Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {refundsList.map((rf) => (
                      <tr key={rf._id} className="hover:bg-slate-850/40 transition-colors">
                        <td className="py-3 pr-3">
                          <span className="font-bold text-white block">{rf.userId?.name}</span>
                          <span className="text-[10px] text-slate-400">{rf.userId?.email}</span>
                        </td>
                        <td className="py-3 font-medium text-slate-200 max-w-xs truncate">
                          {rf.courseId?.title}
                        </td>
                        <td className="py-3 font-mono font-bold text-white">
                          ₹{rf.amount?.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 text-slate-400 max-w-xs truncate italic">
                          "{rf.reason}"
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              rf.status === "succeeded"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : rf.status === "rejected"
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {rf.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {rf.status === "requested" && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleProcessRefund(rf._id, "approve")}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px]"
                              >
                                Approve & Refund
                              </button>
                              <button
                                onClick={() => handleProcessRefund(rf._id, "reject")}
                                className="px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 font-semibold text-[10px] border border-rose-500/30"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
