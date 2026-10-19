"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  DollarSign,
  User,
} from "lucide-react";

export default function AdminRefundsPage() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Review & Confirmation Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<any>(null);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const isAdmin = Boolean(user && (user.role === "admin" || user.role === "super_admin"));

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/admin/refunds");
    }
  }, [user, authLoading, router]);

  const fetchRefunds = async () => {
    try {
      const res = await fetch("/api/admin/refunds");
      const data = await res.json();
      if (data.success) {
        setRefunds(data.refunds || []);
      }
    } catch (err) {
      console.error("Error loading refunds:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchRefunds();
    }
  }, [authLoading, isAdmin]);

  const openActionModal = (refund: any, action: "approve" | "reject") => {
    setSelectedRefund(refund);
    setActionType(action);
    setAdminNotes(
      action === "approve"
        ? "Verified learning metrics under 30% threshold. Approved full refund."
        : "Course completion exceeds allowable refund policy threshold."
    );
    setReviewModalOpen(true);
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRefund) return;

    setProcessing(true);
    try {
      const res = await fetch("/api/admin/refunds", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refundId: selectedRefund._id,
          action: actionType,
          adminNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Refund request ${actionType === "approve" ? "approved" : "rejected"} successfully!`);
        setReviewModalOpen(false);
        fetchRefunds();
      } else {
        toast.error(data.error || "Failed to process refund");
      }
    } catch {
      toast.error("Failed to process refund");
    } finally {
      setProcessing(false);
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
          href="/login?redirect=/admin/refunds"
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
        <p className="text-xs text-[#64748B]">Your account does not have permission to process refund requests.</p>
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
        <p className="text-sm">Loading refund requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-black text-[#172554] tracking-tight">Refund Governance Queue</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Review student cancellation requests against the 7-day fair use policy and execute financial payouts.
          </p>
        </div>
      </div>

      {refunds.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center shadow-xs">
          <RotateCcw className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
          <h3 className="text-base font-bold text-[#172554]">No Refund Requests In Queue</h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto mt-1">
            When learners submit refund requests for enrolled courses, they will appear here for administrative verification.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[#64748B] font-semibold">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Requested</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {refunds.map((r: any) => (
                  <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#0F172A]">{r.userId?.name || "Student"}</div>
                      <div className="text-[10px] text-[#64748B]">{r.userId?.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#0F172A] max-w-xs truncate">
                      {r.courseId?.title || "Course"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#172554]">
                      ₹{r.amount?.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-[#64748B] max-w-xs truncate">
                      "{r.reason}"
                    </td>
                    <td className="py-3.5 px-4 text-[#64748B]">
                      {new Date(r.requestedAt || r.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      {r.status === "succeeded" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-[#16A34A] border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      )}
                      {r.status === "rejected" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-[#DC2626] border border-red-200">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      )}
                      {r.status === "requested" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-[#D97706] border border-amber-200">
                          <Clock className="w-3 h-3" /> Pending Review
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {r.status === "requested" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openActionModal(r, "approve")}
                            className="px-2.5 py-1 rounded bg-[#16A34A] text-white text-[10px] font-bold hover:bg-green-700 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openActionModal(r, "reject")}
                            className="px-2.5 py-1 rounded border border-[#E2E8F0] text-[#DC2626] text-[10px] font-semibold hover:bg-red-50 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#94A3B8]">Concluded</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={actionType === "approve" ? "Approve Refund & Revoke Access" : "Reject Refund Request"}
      >
        <form onSubmit={handleProcessRefund} className="space-y-4">
          <p className="text-xs text-[#64748B]">
            {actionType === "approve"
              ? `You are about to approve a refund of ₹${selectedRefund?.amount} for ${selectedRefund?.userId?.name}. Course access will be revoked immediately.`
              : `You are about to reject the refund request for ${selectedRefund?.userId?.name}. Course access will remain active.`}
          </p>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Administrative Review Notes
            </label>
            <textarea
              rows={3}
              required
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setReviewModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#64748B] hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className={`px-4 py-1.5 rounded-lg text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 ${
                actionType === "approve" ? "bg-[#16A34A] hover:bg-green-700" : "bg-[#DC2626] hover:bg-red-700"
              }`}
            >
              {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Confirm {actionType === "approve" ? "Approval" : "Rejection"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
