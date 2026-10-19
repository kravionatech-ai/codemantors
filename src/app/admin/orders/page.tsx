"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  Eye,
  Loader2,
  Filter,
} from "lucide-react";

export default function AdminOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const isAdmin = Boolean(user && (user.role === "admin" || user.role === "super_admin"));

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/admin/orders");
    }
  }, [user, authLoading, router]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchTerm.trim()) params.append("search", searchTerm.trim());

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Error loading admin orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchOrders();
    }
  }, [authLoading, isAdmin, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
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
          href="/login?redirect=/admin/orders"
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
        <h2 className="text-lg font-bold text-[#0F172A]">Access Restricted: Administrator Privileges Required</h2>
        <p className="text-xs text-[#64748B]">Your account does not have permission to view customer orders.</p>
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
        <p className="text-sm">Loading platform orders...</p>
      </div>
    );
  }

  const totalRevenue = orders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-black text-[#172554] tracking-tight">Order & Checkout Governance</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Real-time multi-course shopping orders, Razorpay transactions, and financial auditing.
          </p>
        </div>
        <div className="px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200 self-start sm:self-auto">
          <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">Completed Revenue</span>
          <span className="text-lg font-black text-[#16A34A]">₹{totalRevenue.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by order number or Razorpay ID..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[#64748B] font-semibold">
                <th className="py-3 px-4">Order Number / Razorpay ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Courses</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {orders.map((o) => (
                <tr key={o._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[#0F172A]">
                    <div className="font-bold">{o.orderNumber}</div>
                    <div className="text-[10px] text-[#94A3B8]">{o.razorpayOrderId}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#0F172A]">{o.userId?.name || "Customer"}</div>
                    <div className="text-[10px] text-[#64748B]">{o.userId?.email}</div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#0F172A] max-w-xs truncate">
                    {o.items?.map((i: any) => i.title).join(", ") || "Bundle"}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#172554]">
                    ₹{o.totalAmount?.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-4 text-[#64748B]">
                    {new Date(o.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3.5 px-4">
                    {o.status === "paid" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-[#16A34A] border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Paid
                      </span>
                    )}
                    {o.status === "pending" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-[#D97706] border border-amber-200">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                    {o.status === "failed" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-[#DC2626] border border-red-200">
                        <AlertCircle className="w-3 h-3" /> Failed
                      </span>
                    )}
                    {o.status === "cancelled" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-[#64748B] border border-slate-200">
                        Cancelled
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/orders/${o._id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-[#2563EB] hover:bg-blue-50"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </Link>
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
