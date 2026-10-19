"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
  ArrowRight,
  BookOpen,
  Download,
  Loader2,
  RotateCcw,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
          if (data.order.status === "paid") {
            try {
              confetti({
                particleCount: 75,
                spread: 70,
                origin: { y: 0.6 },
              });
            } catch {}
          }
        }
      } catch (err) {
        console.error("Error fetching order confirmation:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  if (authLoading || loading) {
    return (
      <div className="py-24 text-center text-[#64748B]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-3" />
        <p className="text-sm">Fetching verified order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-[#DC2626] mx-auto" />
        <h2 className="text-xl font-bold text-[#172554]">Order Not Found</h2>
        <p className="text-xs text-[#64748B]">
          We could not locate the requested order reference. Please check your payment history.
        </p>
        <Link
          href="/student/payments"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
        >
          View Payment History
        </Link>
      </div>
    );
  }

  const isPaid = order.status === "paid";
  const isPending = order.status === "pending";

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Banner Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 sm:p-10 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center">
            {isPaid ? (
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            ) : isPending ? (
              <div className="w-16 h-16 rounded-full bg-amber-50 text-[#D97706] flex items-center justify-center">
                <Clock className="w-10 h-10" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-red-50 text-[#DC2626] flex items-center justify-center">
                <AlertCircle className="w-10 h-10" />
              </div>
            )}
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Order #{order.orderNumber}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#172554] tracking-tight mt-1">
              {isPaid
                ? "Enrollment Confirmed & Unlocked!"
                : isPending
                ? "Payment Verification Pending"
                : "Payment Incomplete or Cancelled"}
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-lg mx-auto mt-2">
              {isPaid
                ? `Thank you for choosing CodeMentors. Your enrollment is officially active with lifetime curriculum access.`
                : isPending
                ? "We are awaiting final provider confirmation from Razorpay. Refresh this page to check progress."
                : "Your transaction was not completed. You can re-open checkout to complete enrollment."}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            {isPaid ? (
              <Link
                href="/student/courses"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
              >
                Go to My Courses
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/checkout"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#172554] hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Retry Checkout
              </Link>
            )}
            <Link
              href={`/orders/${order._id}`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[#E2E8F0] text-xs sm:text-sm font-semibold text-[#0F172A] hover:bg-slate-50 transition-colors"
            >
              View Order Receipt
            </Link>
          </div>
        </div>

        {/* Unlocked Courses Breakdown */}
        {isPaid && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#172554] pb-3 border-b border-[#E2E8F0] flex items-center justify-between">
              <span>Unlocked Courses ({order.items?.length || 0})</span>
              <span className="text-xs text-[#16A34A] font-semibold">Active Enrollment</span>
            </h2>

            <div className="divide-y divide-[#E2E8F0]">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"}
                      alt={item.title}
                      className="w-16 h-11 rounded-lg object-cover border border-[#E2E8F0] shrink-0"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-[#0F172A]">{item.title}</h3>
                      <p className="text-xs text-[#64748B]">Instructor: {item.instructorName || "CodeMentors"}</p>
                    </div>
                  </div>

                  <Link
                    href={`/courses/${item.courseId}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#172554] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Open Curriculum
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction Ledger Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-sm text-[#172554] pb-2 border-b border-[#E2E8F0]">
            Transaction Particulars
          </h3>
          <div className="grid grid-cols-2 gap-2 text-[#64748B]">
            <div>Payment Reference:</div>
            <div className="font-mono text-[#0F172A] text-right">{order.razorpayPaymentId || "Verified by Gateway"}</div>

            <div>Razorpay Order ID:</div>
            <div className="font-mono text-[#0F172A] text-right">{order.razorpayOrderId}</div>

            <div>Total Amount:</div>
            <div className="font-bold text-[#172554] text-right">₹{order.totalAmount?.toLocaleString("en-IN")}</div>

            <div>Date:</div>
            <div className="text-[#0F172A] text-right">
              {new Date(order.paidAt || order.createdAt).toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
