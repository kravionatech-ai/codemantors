"use client";

import React, { useState, useEffect } from "react";
import Script from "next/script";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  Tag,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
} from "lucide-react";

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const {
    items,
    subtotal,
    discountAmount,
    finalTotal,
    coupon,
    applyCoupon,
    removeCoupon,
    refreshCart,
  } = useCart();
  const toast = useToast();
  const router = useRouter();

  const [couponInput, setCouponInput] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  // Protect Checkout route: require authenticated account
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/checkout");
    }
  }, [user, authLoading, router]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    await applyCoupon(couponInput.trim());
    setApplyingCoupon(false);
  };

  const handlePaySecurely = async () => {
    if (!user) {
      toast.error("Please log in to complete your purchase");
      return;
    }

    if (!agreedToTerms) {
      toast.error("Please agree to the Terms of Service and Refund Policy to proceed");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty. Please add a course first.");
      router.push("/courses");
      return;
    }

    setProcessingPayment(true);
    try {
      // 1. Create Authoritative Order on Backend
      const createRes = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: coupon?.code || "",
        }),
      });

      const orderData = await createRes.json();
      if (!createRes.ok || !orderData.success) {
        toast.error(orderData.error || "Failed to initialize secure checkout");
        setProcessingPayment(false);
        return;
      }

      // Free Order (e.g. 100% discount): Completed immediately
      if (orderData.isFree) {
        toast.success("Order granted successfully!");
        await refreshCart();
        router.push(`/order-confirmation/${orderData.orderId}`);
        return;
      }

      // 2. Open Razorpay Standard Checkout Modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amountInPaise,
        currency: orderData.currency || "INR",
        name: "CodeMentors LMS",
        description: `Order ${orderData.orderNumber}`,
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&h=120&fit=crop",
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: user.name || "",
          email: user.email || "",
        },
        theme: {
          color: "#172554",
        },
        modal: {
          ondismiss: async () => {
            setProcessingPayment(false);
            toast.error("Checkout was cancelled. Your order has been saved as pending.");
            await fetch("/api/orders/cancel", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: orderData.orderId,
                reason: "User closed Razorpay checkout window",
              }),
            });
          },
        },
        handler: async (response: any) => {
          // 3. Cryptographic Verification on Backend
          try {
            const verifyRes = await fetch("/api/orders/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: orderData.orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              toast.success("Payment verified successfully! Welcome to your courses.");
              await refreshCart();
              router.push(`/order-confirmation/${orderData.orderId}`);
            } else {
              toast.error(verifyData.error || "Payment verification failed");
              setProcessingPayment(false);
            }
          } catch {
            toast.error("Network error during payment verification");
            setProcessingPayment(false);
          }
        },
      };

      if (typeof (window as any).Razorpay !== "undefined") {
        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          toast.error(`Payment failed: ${response.error?.description || "Gateway transaction declined"}`);
          setProcessingPayment(false);
        });
        rzp.open();
      } else {
        console.warn("Razorpay SDK not loaded on window.");
        toast.error("Razorpay secure checkout could not be loaded. Please disable ad-blockers and refresh the page to pay securely.");
        setProcessingPayment(false);
      }
    } catch (err: any) {
      console.error("Checkout submission error:", err);
      toast.error("An error occurred during checkout initialization");
      setProcessingPayment(false);
    }
  };

  if (authLoading) {
    return (
      <div className="py-24 text-center text-[#64748B]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-3" />
        <p className="text-sm">Preparing secure checkout...</p>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="min-h-screen bg-[#F8FAFC] py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header */}
          <div className="pb-4 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1">
              <Link href="/course-basket" className="hover:text-[#172554]">Course Basket</Link>
              <span>/</span>
              <span className="text-[#0F172A] font-semibold">Secure Checkout</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#172554] tracking-tight flex items-center gap-2">
              <Lock className="w-6 h-6 text-[#16A34A]" />
              Secure Checkout
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Account Details & Order Items */}
            <div className="lg:col-span-7 space-y-6">
              {/* Account Card */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#172554]">
                    1. Account Credentials
                  </h2>
                  <span className="text-xs text-[#16A34A] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#64748B] block">Full Name</span>
                    <strong className="text-[#0F172A] font-bold">{user?.name}</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">Email Address</span>
                    <strong className="text-[#0F172A] font-bold">{user?.email}</strong>
                  </div>
                </div>
                <p className="text-[11px] text-[#94A3B8] pt-1">
                  Your course enrollment and official completion certificate will be issued to this name.
                </p>
              </div>

              {/* Order Items Review */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#172554] pb-3 border-b border-[#E2E8F0]">
                  2. Review Selected Courses ({items.length})
                </h2>

                <div className="divide-y divide-[#E2E8F0]">
                  {items.map((item) => (
                    <div key={item.courseId} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img
                          src={item.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"}
                          alt={item.title}
                          className="w-14 h-10 rounded object-cover border border-[#E2E8F0] shrink-0"
                        />
                        <div className="overflow-hidden">
                          <h4 className="font-bold text-[#0F172A] line-clamp-1">{item.title}</h4>
                          <span className="text-[10px] text-[#64748B]">{item.instructorName}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-sm text-[#172554]">
                          {item.isFree ? "Free" : `₹${item.effectivePrice.toLocaleString("en-IN")}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security & Refund Guarantees */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-[#172554] flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="font-bold">Transparent 7-Day Refund Guarantee</strong>
                  <p className="text-[11px] text-[#64748B]">
                    If you complete less than 30% of course content and are not completely satisfied, you are eligible for a 100% refund within 7 days of purchase. Read our{" "}
                    <Link href="/refund-policy" target="_blank" className="text-[#2563EB] underline font-semibold">
                      Refund Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Price Summary & Payment Execution */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-5">
                <h2 className="text-base font-bold text-[#172554] pb-3 border-b border-[#E2E8F0]">
                  Payment Summary
                </h2>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-[#64748B]">
                    <span>Original Price</span>
                    <span className="font-semibold text-[#0F172A]">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[#16A34A] font-semibold">
                      <span>Promo Savings ({coupon?.code})</span>
                      <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-[#E2E8F0] flex justify-between items-baseline">
                    <span className="text-sm font-bold text-[#172554]">Payable Amount</span>
                    <span className="text-2xl font-black text-[#172554]">
                      ₹{finalTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Promo Code Input */}
                <div>
                  {coupon ? (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span>Code Applied: <strong>{coupon.code}</strong></span>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-[11px] text-[#DC2626] hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="Discount Code"
                        className="flex-1 text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg uppercase tracking-wider text-[#0F172A] focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
                      />
                      <button
                        type="submit"
                        disabled={applyingCoupon || !couponInput.trim()}
                        className="px-3.5 py-2 rounded-lg bg-[#172554] text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50"
                      >
                        {applyingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                      </button>
                    </form>
                  )}
                </div>

                {/* Terms Agreement Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-2 text-[11px] text-[#64748B] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="w-4 h-4 text-[#2563EB] rounded border-[#E2E8F0] mt-0.5"
                    />
                    <span>
                      I agree to the{" "}
                      <Link href="/terms" target="_blank" className="text-[#2563EB] underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/refund-policy" target="_blank" className="text-[#2563EB] underline">
                        7-Day Refund Policy
                      </Link>
                      .
                    </span>
                  </label>
                </div>

                {/* Primary CTA */}
                <div>
                  <button
                    onClick={handlePaySecurely}
                    disabled={processingPayment || !agreedToTerms}
                    className="w-full py-3.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {processingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Initializing Razorpay...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Pay Securely ₹{finalTotal.toLocaleString("en-IN")}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-2 text-center text-[10px] text-[#94A3B8] space-y-1">
                  <p>Powered by Razorpay Standard Checkout</p>
                  <p>Supports UPI, Debit/Credit Cards, Net Banking & Wallets</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
