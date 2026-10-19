"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Shield,
  Loader2,
  ArrowLeft,
  Filter,
} from "lucide-react";

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Status Change Confirmation Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  const isAdmin = Boolean(user && (user.role === "admin" || user.role === "super_admin"));

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/admin/users");
    }
  }, [user, authLoading, router]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append("search", searchTerm.trim());
      if (roleFilter !== "all") params.append("role", roleFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchUsers();
    }
  }, [authLoading, isAdmin, roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const openStatusConfirm = (u: any) => {
    setTargetUser(u);
    setStatusModalOpen(true);
  };

  const handleToggleStatus = async () => {
    if (!targetUser) return;
    setUpdating(true);
    try {
      const newStatus = !targetUser.isActive;
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetUser._id,
          isActive: newStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`User account ${newStatus ? "activated" : "deactivated"} successfully!`);
        setStatusModalOpen(false);
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to update user");
      }
    } catch {
      toast.error("Failed to update user");
    } finally {
      setUpdating(false);
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
          href="/login?redirect=/admin/users"
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
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#0F172A]">Access Restricted: Administrator Privileges Required</h2>
        <p className="text-xs text-[#64748B]">Your account ({user.email}) does not have permission to manage platform users.</p>
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
        <p className="text-sm">Loading user registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-black text-[#172554] tracking-tight">User & Role Management</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Search, moderate credentials, and toggle account activation across the platform.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[#172554] text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#94A3B8]" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="instructor">Instructors</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[#64748B] font-semibold">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Account Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {users.map((u: any) => (
                <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#172554] text-[#06B6D4] flex items-center justify-center font-bold text-xs shrink-0">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-[#0F172A]">{u.name}</div>
                        <div className="text-[#64748B] text-[11px]">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                        u.role === "admin"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : u.role === "instructor"
                          ? "bg-blue-50 text-[#2563EB] border-blue-200"
                          : "bg-slate-100 text-[#64748B] border-slate-200"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#64748B]">
                    {new Date(u.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3.5 px-4">
                    {u.isActive !== false ? (
                      <span className="inline-flex items-center gap-1 text-[#16A34A] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#DC2626] font-semibold">
                        <XCircle className="w-3.5 h-3.5" /> Deactivated
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {u._id !== user?.id && (
                      <button
                        onClick={() => openStatusConfirm(u)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
                          u.isActive !== false
                            ? "bg-red-50 text-[#DC2626] hover:bg-red-100"
                            : "bg-emerald-50 text-[#16A34A] hover:bg-emerald-100"
                        }`}
                      >
                        {u.isActive !== false ? "Deactivate" : "Activate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Confirm User Status Change"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#64748B]">
            Are you sure you want to{" "}
            <strong>{targetUser?.isActive !== false ? "deactivate" : "activate"}</strong> the account of{" "}
            <strong className="text-[#0F172A]">{targetUser?.name}</strong> ({targetUser?.email})?
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
            <button
              onClick={() => setStatusModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#64748B] hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleToggleStatus}
              disabled={updating}
              className={`px-4 py-1.5 rounded-lg text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 ${
                targetUser?.isActive !== false ? "bg-[#DC2626] hover:bg-red-700" : "bg-[#16A34A] hover:bg-green-700"
              }`}
            >
              {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Confirm Action
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
