"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  Eye,
  Loader2,
  ArrowRight,
} from "lucide-react";

export default function StudentOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/orders");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        if (data.success) {
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.error("Error loading orders:", err);
      } finally {
        setLoading(false);
      }
    }
    if (user) loadOrders();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="py-24 text-center text-[#64748B]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-3" />
        <p className="text-sm">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 sm:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#172554] tracking-tight">
              My Orders & Invoices
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Historical purchase receipts, order summaries, and payment transactions.
            </p>
          </div>
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline self-start sm:self-auto"
          >
            Explore Courses →
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center shadow-xs">
            <FileText className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
            <h3 className="text-base font-bold text-[#172554]">No Orders Yet</h3>
            <p className="text-xs text-[#64748B] max-w-md mx-auto mt-1 mb-6">
              When you purchase courses or apply discount coupons, your official invoices will appear here.
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
            >
              Browse Course Catalog
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[#64748B] font-semibold">
                    <th className="py-3 px-4">Order Number</th>
                    <th className="py-3 px-4">Courses</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {orders.map((o) => (
                    <tr key={o._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0F172A]">
                        {o.orderNumber}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#0F172A] max-w-xs truncate">
                        {o.items?.map((i: any) => i.title).join(", ") || "Course Bundle"}
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
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-[#2563EB] hover:bg-blue-50 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Receipt
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
