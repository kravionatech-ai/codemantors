"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Star,
  Trash2,
  Loader2,
  Shield,
  Search,
} from "lucide-react";

export default function AdminCoursesPage() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const isAdmin = Boolean(user && (user.role === "admin" || user.role === "super_admin"));

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/admin/courses");
    }
  }, [user, authLoading, router]);

  const fetchCourses = async () => {
    try {
      const res = await fetch(`/api/admin/courses?status=${statusFilter}`);
      const data = await res.json();
      if (data.success) {
        setCourses(data.courses || []);
      }
    } catch (err) {
      console.error("Error loading courses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchCourses();
    }
  }, [authLoading, isAdmin, statusFilter]);

  const handleUpdateStatus = async (courseId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/courses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Course updated to ${newStatus}!`);
        fetchCourses();
      } else {
        toast.error(data.error || "Failed to update course status");
      }
    } catch {
      toast.error("Failed to update course");
    }
  };

  const handleToggleFeatured = async (courseId: string, currentVal: boolean) => {
    try {
      const res = await fetch("/api/admin/courses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, isFeatured: !currentVal }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Featured status updated!`);
        fetchCourses();
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (authLoading) {
    return (
      <div className="py-20 text-center text-[#64748B] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#DC2626]" />
        <p className="text-sm font-medium">Authenticating Administrative Session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-20 text-center text-[#64748B] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#DC2626]" />
        <p className="text-sm font-medium">Redirecting to administrator sign in...</p>
        <Link
          href="/login?redirect=/admin/courses"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#DC2626] rounded-lg hover:bg-rose-700 transition-colors"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#DC2626] border border-rose-200 flex items-center justify-center mx-auto">
          <BookOpen className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#0F172A]">Access Restricted: Administrator Privileges Required</h2>
        <p className="text-xs text-[#64748B]">Your account ({user.email}) does not have permission to moderate platform courses.</p>
        <div className="pt-2">
          <Link
            href="/student/dashboard"
            className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-[#64748B]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-3" />
        <p className="text-sm">Loading course catalog...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-black text-[#172554] tracking-tight">Course Moderation & Approvals</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Review instructor submissions, approve courses for catalog publication, and toggle featured courses.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] self-start sm:self-auto"
        >
          <option value="all">All Statuses</option>
          <option value="pending_review">Pending Review</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[#64748B] font-semibold">
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Instructor</th>
                <th className="py-3 px-4">Pricing</th>
                <th className="py-3 px-4">Students</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Featured</th>
                <th className="py-3 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {courses.map((c: any) => (
                <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-[#0F172A] line-clamp-1 max-w-xs">{c.title}</div>
                    <div className="text-[10px] text-[#64748B]">{c.category} • {c.level}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-[#0F172A]">{c.instructor?.name || "Instructor"}</div>
                    <div className="text-[10px] text-[#64748B]">{c.instructor?.email}</div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#172554]">
                    {c.isFree ? "Free" : `₹${(c.discountPrice || c.price || 0).toLocaleString("en-IN")}`}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                    {c.enrolledCount || 0}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                        c.status === "published"
                          ? "bg-emerald-50 text-[#16A34A] border-emerald-200"
                          : c.status === "pending_review"
                          ? "bg-amber-50 text-[#D97706] border-amber-200"
                          : "bg-slate-100 text-[#64748B] border-slate-200"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggleFeatured(c._id, Boolean(c.isFeatured))}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                        c.isFeatured
                          ? "bg-blue-50 text-[#2563EB] border border-blue-200"
                          : "text-[#94A3B8] hover:text-[#0F172A]"
                      }`}
                    >
                      {c.isFeatured ? "★ Featured" : "☆ Standard"}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {c.status !== "published" && (
                        <button
                          onClick={() => handleUpdateStatus(c._id, "published")}
                          className="px-2 py-1 rounded bg-[#16A34A] text-white text-[10px] font-bold hover:bg-green-700 transition-colors"
                        >
                          Approve & Publish
                        </button>
                      )}
                      {c.status === "published" && (
                        <button
                          onClick={() => handleUpdateStatus(c._id, "draft")}
                          className="px-2 py-1 rounded bg-slate-100 text-[#64748B] text-[10px] font-semibold hover:bg-slate-200 transition-colors"
                        >
                          Unpublish
                        </button>
                      )}
                      <Link
                        href={`/courses/${c.slug}`}
                        target="_blank"
                        className="p-1 rounded text-[#64748B] hover:text-[#0F172A]"
                        title="View Course Page"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
