"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { tabContentVariants } from "@/lib/motion";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import {
  ShieldAlert,
  Users,
  BookOpen,
  DollarSign,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Sparkles,
  Search,
  Filter,
  Eye,
  Check,
  AlertTriangle,
  UserCheck,
  Ticket,
  Star,
  Award,
  LifeBuoy,
  Settings,
  History,
  Tag,
  Loader2,
  Lock,
} from "lucide-react";

function AdminDashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "users"
    | "courses"
    | "approvals"
    | "categories"
    | "enrollments"
    | "payments"
    | "refunds"
    | "coupons"
    | "reviews"
    | "certificates"
    | "reports"
    | "support"
    | "settings"
    | "audit"
  >((tabParam as any) || "overview");

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [refundsList, setRefundsList] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // User search & filters
  const [userSearch, setUserSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  // Destructive Action Confirmation Modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => Promise<void>>(() => async () => {});
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmTitle, setConfirmTitle] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const isAdmin = Boolean(user && (user.role === "admin" || user.role === "super_admin"));

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/admin/dashboard");
    }
  }, [user, authLoading, router]);

  const fetchAdminStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.metrics);
      } else {
        throw new Error(data.error || "Failed to load admin stats");
      }
    } catch (err) {
      console.error("Admin stats fetch error:", err);
      throw err;
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setUsersList(data.users || []);
      } else {
        throw new Error(data.error || "Failed to load users");
      }
    } catch (err) {
      console.error("Admin users error:", err);
      throw err;
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/admin/courses");
      const data = await res.json();
      if (data.success) {
        setCoursesList(data.courses || []);
      } else {
        throw new Error(data.error || "Failed to load courses");
      }
    } catch (err) {
      console.error("Admin courses error:", err);
      throw err;
    }
  };

  const fetchRefunds = async () => {
    try {
      const res = await fetch("/api/admin/refunds");
      const data = await res.json();
      if (data.success) {
        setRefundsList(data.refunds || []);
      } else {
        throw new Error(data.error || "Failed to load refunds");
      }
    } catch (err) {
      console.error("Admin refunds error:", err);
      throw err;
    }
  };

  const loadAdminData = useCallback(async () => {
    if (!isAdmin) return;
    setDataLoading(true);
    setFetchError(null);
    try {
      const results = await Promise.allSettled([
        fetchAdminStats(),
        fetchUsers(),
        fetchCourses(),
        fetchRefunds(),
      ]);
      const failures = results.filter((r) => r.status === "rejected");
      if (failures.length > 0) {
        console.warn("Some admin telemetry failed to load:", failures);
        setFetchError("Some telemetry records could not be loaded. Please check server connection or retry.");
      }
    } catch (err: any) {
      console.error("Admin dashboard load error:", err);
      setFetchError(err?.message || "Failed to load governance telemetry.");
    } finally {
      setDataLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!authLoading && isAdmin) {
      loadAdminData();
    }
  }, [authLoading, isAdmin, loadAdminData]);

  // Handle Refund Process with Confirmation
  const openRefundConfirmation = (refundId: string, action: "approve" | "reject") => {
    setConfirmTitle(action === "approve" ? "Confirm Refund Approval" : "Confirm Refund Rejection");
    setConfirmMessage(
      action === "approve"
        ? "Are you sure you want to approve this refund? The funds will be credited to the student and their course enrollment will be revoked."
        : "Are you sure you want to reject this refund request?"
    );
    setConfirmAction(() => async () => {
      setActionLoading(true);
      try {
        const res = await fetch("/api/admin/refunds", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refundId, action }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success(`Refund request ${action}d successfully`);
          fetchRefunds();
          fetchAdminStats();
        } else {
          toast.error(data.error || "Failed to process refund");
        }
      } catch {
        toast.error("An error occurred while updating refund");
      } finally {
        setActionLoading(false);
        setConfirmModalOpen(false);
      }
    });
    setConfirmModalOpen(true);
  };

  // Handle Course Approval / Status Change
  const updateCourseStatus = async (courseId: string, status: string) => {
    try {
      const res = await fetch("/api/admin/courses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Course status updated to ${status}`);
        fetchCourses();
        fetchAdminStats();
      } else {
        toast.error(data.error || "Failed to update course");
      }
    } catch {
      toast.error("Failed to update course status");
    }
  };

  // Handle User Active Toggle
  const toggleUserStatus = (userId: string, currentStatus: boolean, userName: string) => {
    const nextStatus = !currentStatus;
    setConfirmTitle(nextStatus ? "Reactivate User Account" : "Deactivate User Account");
    setConfirmMessage(
      nextStatus
        ? `Are you sure you want to reactivate access for ${userName}?`
        : `Are you sure you want to deactivate ${userName}? They will be blocked from logging in.`
    );
    setConfirmAction(() => async () => {
      setActionLoading(true);
      try {
        const res = await fetch("/api/admin/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, isActive: nextStatus }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success(`User ${nextStatus ? "reactivated" : "deactivated"} successfully`);
          fetchUsers();
          fetchAdminStats();
        } else {
          toast.error(data.error || "Failed to update user");
        }
      } catch {
        toast.error("Failed to update user status");
      } finally {
        setActionLoading(false);
        setConfirmModalOpen(false);
      }
    });
    setConfirmModalOpen(true);
  };

  if (authLoading) {
    return (
      <div className="py-20 text-center text-[#64748B] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#DC2626]" />
        <p className="text-sm font-medium">Authenticating Admin Session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-20 text-center text-[#64748B] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#DC2626]" />
        <p className="text-sm font-medium">Redirecting to administrator sign in...</p>
        <div>
          <Link
            href="/login?redirect=/admin/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#DC2626] rounded-lg hover:bg-rose-700 transition-colors"
          >
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#DC2626] border border-rose-200 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#0F172A]">Access Restricted: Administrator Privileges Required</h2>
        <p className="text-xs text-[#64748B] leading-relaxed">
          Your account ({user.email}) is currently assigned the role{" "}
          <span className="font-semibold text-[#0F172A] capitalize">"{user.role}"</span>, which does not grant permission to view the Platform Governance Console.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={user.role === "instructor" ? "/instructor/dashboard" : "/student/dashboard"}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to {user.role === "instructor" ? "Instructor Studio" : "Student Dashboard"}
          </Link>
          <Link
            href="/login?redirect=/admin/dashboard"
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-[#0F172A] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Sign In with Different Account
          </Link>
        </div>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="py-20 text-center text-[#64748B] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#DC2626]" />
        <p className="text-sm font-medium">Synchronizing Platform Governance Console...</p>
        <p className="text-xs text-[#94A3B8]">Loading telemetry, user roster, course submissions, and refund requests...</p>
      </div>
    );
  }

  if (fetchError && !stats) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-rose-200 rounded-2xl shadow-xs text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#DC2626] border border-rose-200 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#0F172A]">Governance Telemetry Synchronization Failed</h2>
        <p className="text-xs text-[#64748B] leading-relaxed">{fetchError}</p>
        <button
          onClick={() => loadAdminData()}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#DC2626] rounded-lg hover:bg-rose-700 transition-colors cursor-pointer"
        >
          Retry Synchronization
        </button>
      </div>
    );
  }

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = selectedRole === "all" || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const pendingCourses = coursesList.filter((c) => c.status === "pending_review");

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {fetchError && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button
            onClick={() => loadAdminData()}
            className="px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-md font-semibold transition-colors cursor-pointer"
          >
            Retry Synchronization
          </button>
        </div>
      )}

      {/* 1. Platform Governance Console Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
              Platform Governance Console
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-[#16A34A] border border-emerald-200">
              Operational
            </span>
          </div>
          <p className="text-xs text-[#64748B]">
            System administration, course moderation queue, user management, and verified financial telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 shadow-xs text-right">
            <span className="text-[10px] uppercase font-semibold text-[#64748B] block">Net Revenue</span>
            <span className="text-lg font-bold text-[#0D9488]">
              ₹{(stats?.netRevenue || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Priority Moderation Notification (if pending submissions exist) */}
      {pendingCourses.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900 font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {pendingCourses.length} {pendingCourses.length === 1 ? "course requires" : "courses require"} administrator review before publishing.
            </span>
          </div>
          <button
            onClick={() => setActiveTab("approvals")}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors cursor-pointer shrink-0 text-center"
          >
            Review Moderation Queue
          </button>
        </div>
      )}

      {/* 3. Operational Telemetry Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-[#64748B] block">Total Registered Users</span>
          <p className="text-xl font-bold text-[#111827]">
            {stats?.totalUsers || 0}
          </p>
          <span className="text-[10px] text-[#64748B] block">
            {stats?.totalStudents || 0} students • {stats?.totalInstructors || 0} instructors
          </span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-[#64748B] block">Course Catalog</span>
          <p className="text-xl font-bold text-[#111827]">
            {stats?.totalCourses || 0}
          </p>
          <span className="text-[10px] text-[#64748B] block">
            {stats?.publishedCourses || 0} published • {stats?.pendingCourses || 0} pending review
          </span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-[#64748B] block">Active Enrollments</span>
          <p className="text-xl font-bold text-[#111827]">
            {stats?.totalEnrollments || 0}
          </p>
          <span className="text-[10px] text-[#64748B] block">Verified student enrollments</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-[#64748B] block">Gross Transaction Volume</span>
          <p className="text-xl font-bold text-[#111827]">
            ₹{(stats?.grossRevenue || 0).toLocaleString()}
          </p>
          <span className="text-[10px] text-[#64748B] block">
            ₹{(stats?.refundedAmount || 0).toLocaleString()} refunded
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E2E8F0] flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "overview"
              ? "border-[#2563EB] text-[#2563EB]"
              : "border-transparent text-[#64748B] hover:text-[#111827]"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("approvals")}
          className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === "approvals"
              ? "border-[#2563EB] text-[#2563EB]"
              : "border-transparent text-[#64748B] hover:text-[#111827]"
          }`}
        >
          <span>Moderation Queue</span>
          {pendingCourses.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
              {pendingCourses.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "users"
              ? "border-[#2563EB] text-[#2563EB]"
              : "border-transparent text-[#64748B] hover:text-[#111827]"
          }`}
        >
          User Management ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab("courses")}
          className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "courses"
              ? "border-[#2563EB] text-[#2563EB]"
              : "border-transparent text-[#64748B] hover:text-[#111827]"
          }`}
        >
          Courses ({coursesList.length})
        </button>
        <button
          onClick={() => setActiveTab("refunds")}
          className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "refunds"
              ? "border-[#2563EB] text-[#2563EB]"
              : "border-transparent text-[#64748B] hover:text-[#111827]"
          }`}
        >
          Refunds ({refundsList.length})
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "settings"
              ? "border-[#2563EB] text-[#2563EB]"
              : "border-transparent text-[#64748B] hover:text-[#111827]"
          }`}
        >
          System Settings
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={tabContentVariants}
        >
          {/* Tab: Overview */}
          {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Approvals Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#111827]">Courses Awaiting Moderation</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-[#D97706] border border-amber-200">
                {pendingCourses.length} pending
              </span>
            </div>
            {pendingCourses.length > 0 ? (
              <div className="space-y-3">
                {pendingCourses.slice(0, 3).map((c) => (
                  <div key={c._id} className="p-3.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#111827]">{c.title}</p>
                      <p className="text-[11px] text-[#64748B]">Instructor: {c.instructor?.name || "Instructor"}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateCourseStatus(c._id, "published")}
                        className="px-2.5 py-1 rounded bg-[#16A34A] text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateCourseStatus(c._id, "draft")}
                        className="px-2.5 py-1 rounded bg-slate-100 border border-[#E2E8F0] text-[#111827] text-xs font-semibold hover:bg-slate-200 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#64748B] py-6 text-center">
                All submitted courses are reviewed and moderated!
              </p>
            )}
          </div>

          {/* Quick Refunds Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#111827]">Recent Refund Requests</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] border border-blue-200">
                {refundsList.length} total
              </span>
            </div>
            {refundsList.length > 0 ? (
              <div className="space-y-3">
                {refundsList.slice(0, 3).map((r) => (
                  <div key={r._id} className="p-3.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#111827]">₹{r.amount} — {r.courseId?.title || "Course"}</p>
                      <p className="text-[11px] text-[#64748B]">Learner: {r.userId?.name || "Student"} ({r.userId?.email || "N/A"})</p>
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-[#D97706] border border-amber-200">
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#64748B] py-6 text-center">
                No outstanding refund requests.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tab: Users */}
      {activeTab === "users" && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user by name or email..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-[#64748B]">Filter Role:</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-[#E2E8F0] bg-white text-[#111827]"
              >
                <option value="all">All Roles</option>
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#111827]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#111827]">{u.name}</p>
                      <p className="text-[11px] text-[#64748B]">{u.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-[#2563EB] border border-blue-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {u.isActive !== false ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-[#DC2626] border border-rose-200">
                          DEACTIVATED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#64748B]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => toggleUserStatus(u._id, u.isActive !== false, u.name)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                          u.isActive !== false
                            ? "bg-rose-50 text-[#DC2626] hover:bg-rose-100 border border-rose-200"
                            : "bg-emerald-50 text-[#16A34A] hover:bg-emerald-100 border border-emerald-200"
                        }`}
                      >
                        {u.isActive !== false ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Courses Moderation */}
      {activeTab === "courses" && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#111827]">All Platform Courses</h2>
            <span className="text-xs text-[#64748B]">{coursesList.length} courses total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#111827]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                <tr>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4 text-right">Moderate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {coursesList.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#111827]">{c.title}</p>
                      <p className="text-[11px] text-[#64748B]">{c.category} • {c.level}</p>
                    </td>
                    <td className="py-3 px-4 text-[#64748B]">
                      {c.instructor?.name || "Instructor"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-[#2563EB] border border-blue-200">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#111827]">
                      {c.isFree ? "Free" : `₹${c.price}`}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {c.status !== "published" && (
                        <button
                          onClick={() => updateCourseStatus(c._id, "published")}
                          className="px-2.5 py-1 rounded bg-[#16A34A] text-white text-[11px] font-semibold hover:bg-emerald-700 transition-colors"
                        >
                          Publish
                        </button>
                      )}
                      {c.status === "published" && (
                        <button
                          onClick={() => updateCourseStatus(c._id, "archived")}
                          className="px-2.5 py-1 rounded bg-slate-100 border border-[#E2E8F0] text-[#111827] text-[11px] font-semibold hover:bg-slate-200 transition-colors"
                        >
                          Archive
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Course Approvals */}
      {activeTab === "approvals" && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#111827]">Courses Pending Administrator Review</h2>
          {pendingCourses.length > 0 ? (
            <div className="space-y-4">
              {pendingCourses.map((c) => (
                <div key={c._id} className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-[#D97706] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Pending Review
                    </span>
                    <h3 className="text-sm font-bold text-[#111827]">{c.title}</h3>
                    <p className="text-xs text-[#64748B]">{c.subtitle}</p>
                    <p className="text-[11px] text-[#64748B]">Author: {c.instructor?.name || "Author"} • Price: ₹{c.price}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCourseStatus(c._id, "published")}
                      className="px-3 py-1.5 rounded-lg bg-[#16A34A] hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      Approve & Publish
                    </button>
                    <button
                      onClick={() => updateCourseStatus(c._id, "draft")}
                      className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-100 text-[#111827] text-xs font-semibold transition-colors"
                    >
                      Request Revisions
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[#64748B] space-y-2">
              <CheckCircle2 className="w-10 h-10 text-[#16A34A] mx-auto" />
              <p className="text-sm font-bold text-[#111827]">Queue Is Empty</p>
              <p className="text-xs">There are no courses waiting for administrative approval.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Refunds */}
      {activeTab === "refunds" && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#111827]">Refund Processing Queue</h2>
            <span className="text-xs text-[#64748B]">Governed by CodeMentors Refund Policy</span>
          </div>

          {refundsList.length > 0 ? (
            <div className="space-y-4">
              {refundsList.map((r) => (
                <div key={r._id} className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-[#111827]">₹{r.amount}</span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          r.status === "succeeded"
                            ? "bg-emerald-50 text-[#16A34A] border border-emerald-200"
                            : r.status === "rejected"
                            ? "bg-rose-50 text-[#DC2626] border border-rose-200"
                            : "bg-amber-50 text-[#D97706] border border-amber-200"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#111827]">{r.courseId?.title || "Course"}</p>
                    <p className="text-xs text-[#64748B]">Requested by: {r.userId?.name || "Student"} ({r.userId?.email || "N/A"})</p>
                    <p className="text-[11px] text-[#64748B] italic">Reason: "{r.reason}"</p>
                  </div>

                  {r.status === "requested" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openRefundConfirmation(r._id, "approve")}
                        className="px-3 py-1.5 rounded-lg bg-[#16A34A] hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        Approve Refund
                      </button>
                      <button
                        onClick={() => openRefundConfirmation(r._id, "reject")}
                        className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-[#DC2626] text-xs font-semibold transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#64748B] text-center py-12">
              No refund requests submitted.
            </p>
          )}
        </div>
      )}

      {/* Tab: System Settings */}
      {activeTab === "settings" && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 max-w-2xl shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-[#111827]">Platform Configuration & Security</h2>
            <p className="text-xs text-[#64748B]">Global feature flags, security policies, and payment credentials.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#111827]">Razorpay Payment Gateway</p>
                <p className="text-[11px] text-[#64748B]">Production test keys configured with HMAC SHA-256 verification</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200">
                CONNECTED
              </span>
            </div>

            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#111827]">JWT Session Authentication</p>
                <p className="text-[11px] text-[#64748B]">HTTP-only cookies with 7-day expiration & strict CSRF lax mode</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200">
                ACTIVE
              </span>
            </div>

            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#111827]">Certificate Auto-Issuance Engine</p>
                <p className="text-[11px] text-[#64748B]">Generate unique verifiable codes upon 100% course syllabus completion</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200">
                ENABLED
              </span>
            </div>
          </div>
        </div>
      )}
        </motion.div>
      </AnimatePresence>

      {/* Destructive Action Confirmation Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title={confirmTitle}
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
            <p className="leading-relaxed">{confirmMessage}</p>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => setConfirmModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A] font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={confirmAction}
              className="px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white font-semibold shadow-xs disabled:opacity-50"
            >
              {actionLoading ? "Processing..." : "Confirm & Proceed"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-[#64748B]">Loading admin console...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
