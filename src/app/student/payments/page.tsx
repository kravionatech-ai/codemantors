"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertCircle,
  Loader2,
  FileText,
  ExternalLink,
} from "lucide-react";

export default function StudentPaymentsPage() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Refund Request Modal state
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [refundReason, setRefundReason] = useState("");
  const [submittingRefund, setSubmittingRefund] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/student/payments");
      } else if (user.role === "instructor") {
        router.replace("/instructor/dashboard");
      } else if (user.role === "admin" || user.role === "super_admin") {
        router.replace("/admin/dashboard");
      }
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      const res = await fetch("/api/dashboard/student");
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments || []);
      }
    } catch (err) {
      console.error("Error loading payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) loadData();
  }, [authLoading, user]);

  const handleOpenRefundModal = (payment: any) => {
    setSelectedPayment(payment);
    setRefundReason("");
    setRefundModalOpen(true);
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;

    setSubmittingRefund(true);
    try {
      const res = await fetch("/api/payments/refund/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: selectedPayment._id,
          reason: refundReason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Refund request submitted successfully! Our team will review it within 24 hours.");
        setRefundModalOpen(false);
        loadData();
      } else {
        toast.error(data.error || "Failed to submit refund request");
      }
    } catch {
      toast.error("Failed to submit refund request");
    } finally {
      setSubmittingRefund(false);
    }
  };

  if (authLoading) {
    return (
      <div className="py-20 text-center text-[#64748B] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB]" />
        <p className="text-sm font-medium">Authenticating Student Session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-20 text-center text-[#64748B] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB]" />
        <p className="text-sm font-medium">Redirecting to sign in...</p>
        <Link
          href="/login?redirect=/student/payments"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] rounded-lg hover:bg-blue-700 transition-colors"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-[#64748B]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-3" />
        <p className="text-sm">Loading your transaction records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-xl font-bold text-[#111827] tracking-tight">Payment History & Orders</h1>
          <p className="text-xs text-[#64748B] mt-1">
            View your verified payment receipts, Razorpay order IDs, and cancellation status.
          </p>
        </div>
        <Link
          href="/refund-policy"
          className="text-xs font-semibold text-[#2563EB] hover:underline self-start sm:self-auto"
        >
          View Refund Policy →
        </Link>
      </div>

      {payments.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center shadow-xs">
          <CreditCard className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
          <h3 className="text-sm font-bold text-[#111827]">No Payment Transactions Found</h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto mt-1 mb-6">
            You haven't made any course purchases yet. Free courses do not require payment receipts.
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Explore Courses
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[#64748B] font-semibold">
                  <th className="py-3 px-4">Receipt / Order ID</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {payments.map((p: any) => {
                  const course = p.courseId;
                  const canRefund =
                    p.status === "completed" &&
                    new Date().getTime() - new Date(p.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000;

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#111827]">
                        <div>{p.receipt}</div>
                        <div className="text-[#94A3B8] text-[10px]">{p.orderId}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#111827] max-w-xs truncate">
                        {course?.title || "Course Enrollment"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#111827]">
                        ₹{p.amount?.toLocaleString("en-IN")}
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
                            <CheckCircle2 className="w-3 h-3" /> Paid
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
                      <td className="py-3.5 px-4 text-right">
                        {canRefund ? (
                          <button
                            onClick={() => handleOpenRefundModal(p)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#DC2626] hover:underline"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Request Refund
                          </button>
                        ) : p.status === "refunded" ? (
                          <span className="text-[11px] text-[#94A3B8]">Processed</span>
                        ) : (
                          <span className="text-[11px] text-[#94A3B8]">Standard</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Refund Request Confirmation Dialog */}
      <Modal
        isOpen={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        title="Request Course Refund"
      >
        <form onSubmit={handleRefundSubmit} className="space-y-4">
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
            <strong>7-Day Guarantee:</strong> Refunds are eligible within 7 calendar days of purchase if less than 30% of course content has been accessed.
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Course
            </label>
            <input
              type="text"
              readOnly
              value={selectedPayment?.courseId?.title || "Selected Course"}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#E2E8F0] rounded-lg text-[#64748B]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Reason for Refund Request <span className="text-[#DC2626]">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Please let us know why you are requesting a refund..."
              className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setRefundModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#64748B] hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingRefund}
              className="px-4 py-1.5 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {submittingRefund ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Confirm Refund Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
