"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
  Printer,
  ShieldCheck,
  Loader2,
  Lock,
} from "lucide-react";

export default function OrderDetailsPage({
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
        }
      } catch (err) {
        console.error("Error fetching order:", err);
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
        <p className="text-sm">Loading order receipt...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-[#DC2626] mx-auto" />
        <h2 className="text-xl font-bold text-[#172554]">Receipt Not Found</h2>
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 sm:py-14">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] print:hidden">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#172554]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-semibold text-[#0F172A] hover:bg-slate-50 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Receipt
          </button>
        </div>

        {/* Printable Invoice Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 sm:p-10 shadow-xs space-y-8">
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#172554] text-[#06B6D4] flex items-center justify-center font-bold text-xs">
                  CM
                </span>
                <span className="font-bold text-lg text-[#172554]">CodeMentors LMS</span>
              </div>
              <p className="text-xs text-[#64748B] mt-1">Official Payment Receipt & Tax Invoice</p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] uppercase tracking-wider text-[#94A3B8] font-bold">
                Invoice Reference
              </span>
              <div className="text-base font-black text-[#172554] font-mono">{order.orderNumber}</div>
              <div className="text-xs text-[#64748B]">
                {new Date(order.paidAt || order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>

          {/* Customer & Gateway Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#94A3B8] font-bold block mb-1">
                Billed To
              </span>
              <div className="font-bold text-[#0F172A] text-sm">{order.userId?.name}</div>
              <div className="text-[#64748B]">{order.userId?.email}</div>
            </div>

            <div className="sm:text-right">
              <span className="text-[11px] uppercase tracking-wider text-[#94A3B8] font-bold block mb-1">
                Payment Verification
              </span>
              <div className="font-mono text-[#0F172A]">Razorpay: {order.razorpayOrderId}</div>
              {order.razorpayPaymentId && (
                <div className="font-mono text-[#16A34A] text-[11px]">
                  Payment ID: {order.razorpayPaymentId}
                </div>
              )}
              <div className="mt-1">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-[#16A34A] border border-emerald-200">
                  Status: {order.status}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                  <th className="py-2.5">Item Description</th>
                  <th className="py-2.5 text-center">Format</th>
                  <th className="py-2.5 text-right">Price (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {order.items?.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="py-3 text-[#0F172A]">
                      <div className="font-bold">{item.title}</div>
                      <div className="text-[11px] text-[#64748B]">
                        Instructor: {item.instructorName || "CodeMentors"}
                      </div>
                    </td>
                    <td className="py-3 text-center text-[#64748B]">Online LMS</td>
                    <td className="py-3 text-right font-bold text-[#172554]">
                      ₹{item.finalPrice?.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Calculation */}
          <div className="pt-4 border-t border-[#E2E8F0] flex justify-end">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-[#64748B]">
                <span>Subtotal</span>
                <span className="font-semibold text-[#0F172A]">
                  ₹{order.subtotal?.toLocaleString("en-IN")}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-[#16A34A] font-semibold">
                  <span>Discount ({order.couponCode})</span>
                  <span>-₹{order.discountAmount?.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="pt-2 border-t border-[#E2E8F0] flex justify-between items-baseline text-sm font-bold text-[#172554]">
                <span>Grand Total (INR)</span>
                <span className="text-xl font-black">₹{order.totalAmount?.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="pt-6 border-t border-[#E2E8F0] text-[11px] text-[#94A3B8] text-center space-y-1">
            <p>Thank you for learning with CodeMentors. All digital purchases include lifetime course updates.</p>
            <p>For questions or support, contact billing@codementors.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
