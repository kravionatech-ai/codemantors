"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { CreditCard, CheckCircle2, Clock, RotateCcw, AlertCircle, Loader2 } from "lucide-react";

export default function AdminPaymentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = Boolean(user && (user.role === "admin" || user.role === "super_admin"));

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/admin/payments");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/admin/payments");
        const data = await res.json();
        if (data.success) {
          setPayments(data.payments || []);
        }
      } catch (err) {
        console.error("Error loading payments:", err);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading && isAdmin) {
      loadData();
    }
  }, [authLoading, isAdmin]);

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
          href="/login?redirect=/admin/payments"
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
        <p className="text-xs text-[#64748B]">Your account does not have permission to view payment ledger records.</p>
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
        <p className="text-sm">Loading transactions ledger...</p>
      </div>
    );
  }

  const totalVolume = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-black text-[#172554] tracking-tight">Platform Payment Records</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Complete transaction ledger of Razorpay order IDs, payment methods, receipts, and revenue.
          </p>
        </div>
        <div className="px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200 self-start sm:self-auto">
          <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">Captured Volume</span>
          <span className="text-lg font-black text-[#16A34A]">₹{totalVolume.toLocaleString("en-IN")}</span>
        </div>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[#64748B] font-semibold">
                <th className="py-3 px-4">Receipt / Order ID</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {payments.map((p: any) => (
                <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[#0F172A]">
                    <div>{p.receipt}</div>
                    <div className="text-[#94A3B8] text-[10px]">{p.orderId}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#0F172A]">{p.userId?.name || "Student"}</div>
                    <div className="text-[10px] text-[#64748B]">{p.userId?.email}</div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#0F172A] max-w-xs truncate">
                    {p.courseId?.title || "Course"}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#172554]">
                    ₹{p.amount?.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-4 uppercase text-[10px] text-[#64748B] font-semibold">
                    {p.provider} {p.paymentMethod ? `• ${p.paymentMethod}` : ""}
                  </td>
                  <td className="py-3.5 px-4 text-[#64748B]">
                    {new Date(p.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3.5 px-4">
                    {p.status === "completed" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-[#16A34A] border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Captured
                      </span>
                    )}
                    {p.status === "pending" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-[#D97706] border border-amber-200">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                    {p.status === "refunded" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        <RotateCcw className="w-3 h-3" /> Refunded
                      </span>
                    )}
                    {p.status === "failed" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-[#DC2626] border border-red-200">
                        <AlertCircle className="w-3 h-3" /> Failed
                      </span>
                    )}
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
