"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Tag,
  AlertCircle,
  Loader2,
  CheckCircle2,
  BookOpen,
  Play,
  Layers,
  GraduationCap,
  Sparkles,
  Lock,
} from "lucide-react";

export default function CourseBasketPage() {
  const { user } = useAuth();
  const {
    items,
    subtotal,
    discountAmount,
    finalTotal,
    coupon,
    loading,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const router = useRouter();

  const [couponInput, setCouponInput] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    await applyCoupon(couponInput.trim());
    setApplyingCoupon(false);
  };

  const handleRemoveItem = async (courseId: string) => {
    setRemovingId(courseId);
    await removeFromCart(courseId);
    setRemovingId(null);
  };

  const hasAlreadyEnrolledItems = items.some((i) => i.isAlreadyEnrolled);

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Breadcrumb & Title */}
        <div className="pb-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1">
              <Link href="/" className="hover:text-[#172554] transition-colors">Home</Link>
              <span>/</span>
              <span className="text-[#0F172A] font-semibold">Course Basket</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#172554] text-[#06B6D4] flex items-center justify-center shadow-xs">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#172554] tracking-tight">
                  Course Basket
                </h1>
                <p className="text-xs sm:text-sm text-[#64748B]">
                  {items.length === 1
                    ? "1 engineering course ready for enrollment"
                    : `${items.length} courses ready for enrollment`}
                </p>
              </div>
            </div>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="inline-flex items-center gap-1.5 text-xs text-[#DC2626] font-semibold hover:underline self-start sm:self-auto cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Empty Basket
            </button>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty Basket State */
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 sm:p-16 text-center shadow-xs max-w-2xl mx-auto">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto mb-5 border border-blue-100 shadow-xs">
              <ShoppingBag className="w-10 h-10 text-[#2563EB]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#172554]">Your Course Basket is Empty</h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-2 mb-8 max-w-md mx-auto leading-relaxed">
              Explore our industry-standard software engineering curriculum, practical coding exercises, and verified certification pathways.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/courses"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
              >
                Explore All Courses
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/learning-paths"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-slate-100 text-[#0F172A] text-xs sm:text-sm font-semibold transition-colors"
              >
                <Layers className="w-4 h-4 text-[#2563EB]" />
                Browse Learning Paths
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Basket Items */}
            <div className="lg:col-span-8 space-y-4">
              {hasAlreadyEnrolledItems && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-xs">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Duplicate Enrollment Warning:</strong> One or more courses in your basket are already active in your account. Please remove them before proceeding to checkout.
                  </div>
                </div>
              )}

              <div className="bg-white border border-[#E2E8F0] rounded-2xl divide-y divide-[#E2E8F0] shadow-xs overflow-hidden">
                {items.map((item) => (
                  <div
                    key={item.courseId}
                    className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-4 overflow-hidden">
                      <Link href={`/courses/${item.slug}`} className="shrink-0 group">
                        <img
                          src={item.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"}
                          alt={item.title}
                          className="w-24 h-16 sm:w-28 sm:h-20 rounded-xl object-cover border border-[#E2E8F0] shadow-2xs group-hover:opacity-90 transition-opacity"
                        />
                      </Link>

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {item.category || "Development"}
                          </span>
                          <span className="text-[10px] font-medium text-[#64748B] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 capitalize">
                            {item.level || "All Levels"}
                          </span>
                          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                            <Play className="w-2.5 h-2.5 fill-current" />
                            <BookOpen className="w-2.5 h-2.5" />
                            Video + Text
                          </span>
                          {item.isAlreadyEnrolled && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                              Already Enrolled
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/courses/${item.slug}`}
                          className="font-bold text-sm sm:text-base text-[#0F172A] hover:text-[#2563EB] transition-colors line-clamp-1 block"
                        >
                          {item.title}
                        </Link>

                        <p className="text-xs text-[#64748B] flex items-center gap-1.5">
                          <span>Instructor:</span>
                          <span className="font-medium text-[#0F172A]">{item.instructorName || "CodeMentors Team"}</span>
                        </p>
                      </div>
                    </div>

                    {/* Price and Remove CTA */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-[#E2E8F0] gap-2">
                      <div className="text-left sm:text-right">
                        <div className="text-base sm:text-lg font-black text-[#172554]">
                          {item.isFree ? (
                            <span className="text-[#16A34A]">Free</span>
                          ) : (
                            `₹${item.effectivePrice.toLocaleString("en-IN")}`
                          )}
                        </div>
                        {item.discountPrice && item.discountPrice < item.price && (
                          <div className="text-xs text-[#94A3B8] line-through">
                            ₹{item.price.toLocaleString("en-IN")}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.courseId)}
                        disabled={removingId === item.courseId}
                        className="inline-flex items-center gap-1 text-xs text-[#DC2626] hover:text-red-700 font-semibold p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Remove from Basket"
                      >
                        {removingId === item.courseId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span className="sm:hidden">Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Basket Reassurance Banner */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-[#172554] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 font-medium">
                  <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0" />
                  <span>Adding courses to your basket saves them safely to your account without initiating charges.</span>
                </div>
                <Link href="/courses" className="text-[#2563EB] font-bold hover:underline whitespace-nowrap">
                  Browse More →
                </Link>
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-6">
                <h2 className="text-base font-bold text-[#172554] pb-3 border-b border-[#E2E8F0]">
                  Basket Summary
                </h2>

                {/* Subtotal, Discount & Total */}
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span>Original Price ({items.length} items):</span>
                    <span className="font-semibold text-[#0F172A]">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-[#16A34A]">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" /> Coupon Discount:
                      </span>
                      <span className="font-bold">-₹{discountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-sm sm:text-base">
                    <span className="font-bold text-[#172554]">Total Amount:</span>
                    <span className="text-xl sm:text-2xl font-black text-[#172554]">
                      ₹{finalTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Coupon Code Input */}
                <div className="pt-2">
                  {coupon ? (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                        <div>
                          <p className="font-bold">{coupon.code} Applied</p>
                          <p className="text-[11px] text-emerald-600">Saved ₹{coupon.discountAmount.toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-xs text-[#DC2626] font-semibold hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="space-y-2">
                      <label className="text-xs font-semibold text-[#0F172A] block">Have a Coupon Code?</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          placeholder="e.g. WELCOME20"
                          className="flex-1 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs focus:outline-hidden focus:border-[#2563EB] uppercase font-mono"
                        />
                        <button
                          type="submit"
                          disabled={applyingCoupon || !couponInput.trim()}
                          className="px-4 py-2 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {applyingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                        </button>
                      </div>
                      <p className="text-[11px] text-[#64748B]">Try code: <span className="font-mono font-bold text-[#2563EB]">WELCOME20</span> for 20% off.</p>
                    </form>
                  )}
                </div>

                {/* Checkout CTA */}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => router.push("/checkout")}
                    disabled={hasAlreadyEnrolledItems || items.length === 0}
                    className="w-full py-3.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    Proceed to Secure Checkout
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-[11px] text-[#64748B] text-center">
                    Authoritative server calculation ensures zero unexpected fees.
                  </p>
                </div>

                {/* Trust Guarantees */}
                <div className="pt-4 border-t border-[#E2E8F0] space-y-2.5 text-xs text-[#64748B]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
                    <span>256-bit SSL encrypted transaction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>Lifetime access & verifiable certificate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#06B6D4] shrink-0" />
                    <span>7-day risk-free money-back guarantee</span>
                  </div>
                </div>
              </div>

              {/* Continue Browsing */}
              <div className="text-center">
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#172554] transition-colors"
                >
                  ← Continue Browsing Courses
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
