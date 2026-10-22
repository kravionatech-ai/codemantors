"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, Clock, BookOpen, Award, CheckCircle, ShoppingBag, Loader2, Video, FileText, Layers } from "lucide-react";
import { motion } from "framer-motion";
import { cardHoverProps } from "@/lib/motion";
import { Card3DTilt } from "@/components/ui/MotionComponents";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export interface CourseCardProps {
  course: {
    _id: string;
    title: string;
    slug: string;
    subtitle?: string;
    thumbnail: string;
    category: string;
    level: string;
    format?: "video" | "text" | "mixed" | string;
    ratingAverage: number;
    ratingCount: number;
    enrolledCount: number;
    totalDurationMinutes?: number;
    totalLessonsCount?: number;
    price: number;
    discountPrice?: number;
    isFree: boolean;
    certificateEnabled?: boolean;
    badge?: string;
    actionLabel?: string;
    instructor?: {
      name: string;
      avatar?: string;
      headline?: string;
    };
  };
  progress?: number; // 0 to 100 if user is enrolled
  isEnrolled?: boolean;
  continueLessonId?: string;
  variant?: "default" | "reference";
}

export default function CourseCard({ course, progress, isEnrolled, continueLessonId, variant = "default" }: CourseCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart, isInCart } = useCart();
  const [adding, setAdding] = useState(false);

  const durationHours = course.totalDurationMinutes
    ? (course.totalDurationMinutes / 60).toFixed(1)
    : "4.5";

  const destinationHref = isEnrolled && continueLessonId
    ? `/learn/${course.slug}/${continueLessonId}`
    : `/courses/${course.slug}`;

  const inCart = isInCart(course._id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/courses/${course.slug}`)}`);
      return;
    }
    setAdding(true);
    await addToCart(course._id);
    setAdding(false);
  };

  return (
    <Card3DTilt
      className="group flex flex-col rounded-xl border border-[#E2E8F0] bg-white overflow-hidden hover:border-[#CBD5E1] hover:shadow-md transition-shadow h-full"
      maxTilt={4.5}
    >
      {/* Thumbnail */}
      <Link href={destinationHref} className="relative aspect-video w-full overflow-hidden bg-slate-100">
        <img
          src={course.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop"}
          alt={course.title}
          className="h-full w-full object-cover group-hover:scale-103 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
          {course.badge && (
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shadow-2xs ${
                course.badge.toLowerCase().includes("best")
                  ? "bg-amber-400 text-[#14213D]"
                  : course.badge.toLowerCase().includes("hot")
                  ? "bg-rose-500 text-white"
                  : "bg-teal-600 text-white"
              }`}
            >
              {course.badge}
            </span>
          )}
          {variant !== "reference" && (
            <>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white/95 text-[#2563EB] border border-[#E2E8F0] shadow-2xs">
                {course.category}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-white/95 text-[#111827] border border-[#E2E8F0] shadow-2xs">
                {course.level}
              </span>
              {course.format === "video" && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#111827]/90 text-white flex items-center gap-1 shadow-2xs border border-white/20">
                  <Video className="w-3 h-3 text-blue-400" />
                  Video
                </span>
              )}
              {course.format === "text" && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#0D9488]/90 text-white flex items-center gap-1 shadow-2xs border border-white/20">
                  <FileText className="w-3 h-3 text-teal-200" />
                  Text
                </span>
              )}
              {course.format === "mixed" && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1E293B]/90 text-white flex items-center gap-1 shadow-2xs border border-white/20">
                  <Layers className="w-3 h-3 text-cyan-300" />
                  Mixed
                </span>
              )}
            </>
          )}
        </div>

        {course.certificateEnabled && (
          <div className="absolute top-2.5 right-2.5 p-1 rounded bg-white/95 text-[#0D9488] border border-[#E2E8F0] shadow-2xs" title="Verified Certificate Included">
            <Award className="w-3.5 h-3.5" />
          </div>
        )}
      </Link>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Rating & Stats */}
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            {course.ratingCount && course.ratingCount > 0 ? (
              <div className="flex items-center gap-1 text-[#D97706] font-semibold">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{course.ratingAverage?.toFixed(1) || "5.0"}</span>
                <span className="text-[#64748B] font-normal">({course.ratingCount})</span>
              </div>
            ) : (
              <span className="text-[#94A3B8]">Not yet rated</span>
            )}
            <span>•</span>
            <span>{course.enrolledCount || 0} {course.enrolledCount === 1 ? "learner" : "learners"}</span>
          </div>

          {/* Title */}
          <Link href={destinationHref}>
            <h3 className="font-bold text-[#111827] group-hover:text-[#2563EB] transition-colors line-clamp-2 text-base leading-snug">
              {course.title}
            </h3>
          </Link>

          {/* Subtitle */}
          {course.subtitle && (
            <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
              {course.subtitle}
            </p>
          )}

          {/* Instructor */}
          {course.instructor?.name && (
            <div className="flex items-center gap-2 pt-0.5">
              {course.instructor.avatar ? (
                <img
                  src={course.instructor.avatar}
                  alt={course.instructor.name}
                  className="w-5 h-5 rounded-full object-cover border border-[#E2E8F0]"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-slate-100 text-[#111827] text-[10px] font-bold flex items-center justify-center border border-[#E2E8F0]">
                  {course.instructor.name.charAt(0)}
                </div>
              )}
              <p className="text-[11px] text-[#64748B]">
                By <span className="font-semibold text-[#111827]">{course.instructor.name}</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer Meta & Price / Progress */}
        <div className="pt-3 border-t border-[#E2E8F0]">
          {isEnrolled ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B] font-medium">Your Progress</span>
                <span className="font-bold text-[#2563EB]">{progress || 0}%</span>
              </div>
              <div className="w-full bg-[#E2E8F0] rounded-full h-1.5">
                <div
                  className="bg-[#2563EB] h-1.5 rounded-full transition-all"
                  style={{ width: `${progress || 0}%` }}
                />
              </div>
              <Link
                href={destinationHref}
                className="inline-flex items-center justify-center gap-1 w-full mt-2 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Continue Learning
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-[#64748B]">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
                    <span>{durationHours}h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-[#94A3B8]" />
                    <span>{course.totalLessonsCount || 12} lessons</span>
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  {course.isFree ? (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200">
                      Free
                    </span>
                  ) : course.discountPrice && course.discountPrice < course.price ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold text-[#111827]">
                        ₹{course.discountPrice}
                      </span>
                      <span className="text-xs text-[#94A3B8] line-through">
                        ₹{course.price}
                      </span>
                    </div>
                  ) : (
                    <span className="text-base font-bold text-[#111827]">
                      ₹{course.price}
                    </span>
                  )}
                </div>
              </div>

              {/* Course Purchase & Navigation Actions */}
              {!course.isFree ? (
                variant === "reference" ? (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={adding}
                      className="p-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#64748B] hover:text-[#2563EB] transition-colors shrink-0 cursor-pointer shadow-2xs"
                      title={inCart ? "In Basket" : "Add to Basket"}
                      aria-label="Add to Basket"
                    >
                      <ShoppingBag className={`w-4 h-4 ${inCart ? "text-[#16A34A]" : ""}`} />
                    </button>

                    {course.actionLabel === "Add to Cart" ? (
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={adding}
                        className="flex-1 py-2 px-3 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center transition-colors cursor-pointer"
                      >
                        {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                        {inCart ? "In Basket" : "Add to Cart"}
                      </button>
                    ) : (
                      <Link
                        href={`/courses/${course.slug}`}
                        className="flex-1 py-2 px-3 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs text-center transition-colors block"
                      >
                        {course.actionLabel || "Enroll Now"}
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-1">
                    {inCart ? (
                      <Link
                        href="/course-basket"
                        className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#16A34A] border border-emerald-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-[#16A34A]" />
                        In Basket
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={adding}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#111827] border border-[#CBD5E1] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {adding ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />
                        ) : (
                          <ShoppingBag className="w-3.5 h-3.5 text-[#2563EB]" />
                        )}
                        Add to Basket
                      </button>
                    )}
                    <Link
                      href={`/courses/${course.slug}`}
                      className="py-1.5 px-3 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold transition-colors text-center"
                    >
                      View
                    </Link>
                  </div>
                )
              ) : (
                <Link
                  href={`/courses/${course.slug}`}
                  className="w-full py-1.5 rounded-lg bg-[#16A34A] hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center transition-colors text-center"
                >
                  Enroll Free
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </Card3DTilt>
  );
}
