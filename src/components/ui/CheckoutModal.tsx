"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, Tag, Lock, CreditCard, Sparkles, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    _id: string;
    title: string;
    slug: string;
    thumbnail: string;
    price: number;
    discountPrice?: number;
    isFree: boolean;
  };
  onSuccess?: () => void;
}

export default function CheckoutModal({ isOpen, onClose, course, onSuccess }: CheckoutModalProps) {
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const originalPrice = course.discountPrice || course.price;
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(originalPrice);
  const [loading, setLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), courseId: course._id }),
      });
      const data = await res.json();
      if (data.success && data.coupon) {
        setAppliedCoupon(data.coupon);
        setDiscountAmount(data.coupon.discountAmount);
        setFinalPrice(data.coupon.finalPrice);
        toast.success(`Coupon applied: ${data.coupon.code} (Saved ₹${data.coupon.discountAmount})`);
      } else {
        toast.error(data.error || "Invalid coupon code");
      }
    } catch {
      toast.error("Failed to validate coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.info("Please log in or register before checking out");
      router.push(`/login?redirect=/courses/${course.slug}`);
      return;
    }

    setLoading(true);
    try {
      // 1. Create Order
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course._id,
          couponCode: appliedCoupon?.code,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Failed to initialize checkout");
        setLoading(false);
        return;
      }

      // If 100% coupon discount
      if (data.isZeroCost) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        toast.success("100% discount applied! You are now enrolled.");
        onClose();
        if (onSuccess) onSuccess();
        router.push(`/dashboard`);
        return;
      }

      const { order } = data;

      // 2. Perform Verified Payment Simulation / Razorpay Webflow
      const mockPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const mockSignature = `sig_test_${Date.now()}_verified`;

      const verifyRes = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: order.id,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: mockSignature,
        }),
      });

      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        toast.success("Payment verified successfully! Welcome to the course.");
        onClose();
        if (onSuccess) onSuccess();
        router.push(`/dashboard`);
      } else {
        toast.error(verifyData.error || "Payment verification failed");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected checkout error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Secure Course Checkout">
      <div className="space-y-5">
        {/* Course Summary Header */}
        <div className="flex gap-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-20 h-14 rounded-lg object-cover bg-slate-800"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-white line-clamp-2">{course.title}</h4>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
              <span className="text-emerald-400 font-medium">Full Lifetime Access</span>
              <span>•</span>
              <span>Verified Certificate</span>
            </div>
          </div>
        </div>

        {/* Coupon Code Input */}
        <form onSubmit={handleApplyCoupon} className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-blue-400" />
            Have a discount coupon? (Try: WELCOME20 or CODEMENTOR500)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="e.g. WELCOME20"
              className="flex-1 px-3 py-2 text-xs uppercase font-mono rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={couponLoading || !couponCode.trim()}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 transition-colors"
            >
              {couponLoading ? "Checking..." : "Apply"}
            </button>
          </div>
          {appliedCoupon && (
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Coupon {appliedCoupon.code} active: Saved ₹{discountAmount}</span>
            </div>
          )}
        </form>

        {/* Pricing Breakdown */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Course Price</span>
            <span>₹{originalPrice.toLocaleString("en-IN")}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Coupon Discount</span>
              <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-white">
            <span>Total Payable</span>
            <span className="text-blue-400">₹{finalPrice.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Razorpay Assurance */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            256-bit Encrypted Checkout
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            Razorpay Verified Gateway
          </span>
        </div>

        {/* Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
              Processing Order & Verification...
            </span>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              Pay ₹{finalPrice.toLocaleString("en-IN")} & Start Learning
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}
