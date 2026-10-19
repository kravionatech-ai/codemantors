"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import FormattedContentRenderer from "@/components/ui/FormattedContentRenderer";
import {
  Star,
  Clock,
  BookOpen,
  Award,
  CheckCircle2,
  Play,
  FileText,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ArrowRight,
  Terminal,
  HelpCircle,
  Loader2,
  ShoppingBag,
  CreditCard,
} from "lucide-react";

export default function CourseDetailsClient({
  slug,
  initialCourse,
}: {
  slug: string;
  initialCourse?: any;
}) {
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { addToCart, isInCart } = useCart();

  const [course, setCourse] = useState<any>(initialCourse || null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(!initialCourse);

  // Modals & UI States
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [ratingInput, setRatingInput] = useState(5);
  const [reviewTextInput, setReviewTextInput] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchCourseData = async () => {
    try {
      const res = await fetch(`/api/courses/${slug}`);
      const data = await res.json();
      if (data.success && data.course) {
        setCourse(data.course);
        setIsEnrolled(data.isEnrolled);
        setEnrollment(data.enrollment);
        setReviews(data.reviews || []);

        const initialExpanded: Record<string, boolean> = {};
        (data.course.modules || []).forEach((m: any, i: number) => {
          initialExpanded[m._id] = i < 2;
        });
        setExpandedModules(initialExpanded);
      }
    } catch (err) {
      console.error("Fetch course details error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [slug]);

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const handleFreeEnroll = async () => {
    if (!user) {
      toast.info("Please sign in or create an account to enroll");
      router.push(`/login?redirect=/courses/${slug}`);
      return;
    }

    try {
      const res = await fetch("/api/enrollments/free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course._id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Successfully enrolled in free foundational course!");
        setIsEnrolled(true);
        fetchCourseData();
        router.push(`/student/dashboard`);
      } else {
        toast.error(data.error || "Enrollment failed");
      }
    } catch {
      toast.error("Failed to complete free enrollment");
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      toast.info("Please sign in or create an account to proceed to checkout");
      router.push(`/login?redirect=/courses/${slug}`);
      return;
    }
    setBuyingNow(true);
    try {
      if (!isInCart(course._id)) {
        await addToCart(course._id);
      }
      router.push("/checkout");
    } catch {
      toast.error("Failed to proceed to checkout");
    } finally {
      setBuyingNow(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.info("Please sign in or create an account to add items to your basket");
      router.push(`/login?redirect=/courses/${slug}`);
      return;
    }
    setAddingToCart(true);
    try {
      await addToCart(course._id);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTextInput.trim()) return;

    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course._id,
          rating: ratingInput,
          comment: reviewTextInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Review submitted! Thank you for your feedback.");
        setReviewModalOpen(false);
        setReviewTextInput("");
        fetchCourseData();
      } else {
        toast.error(data.error || "Failed to submit review");
      }
    } catch {
      toast.error("Error submitting review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center text-[#64748B]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-3" />
        <p className="text-sm">Loading course curriculum and details...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 rounded-xl border border-[#E2E8F0] bg-white text-center space-y-4 shadow-xs">
        <h2 className="text-xl font-bold text-[#0F172A]">Course Not Found</h2>
        <p className="text-xs text-[#64748B]">
          The requested course does not exist or may have been unlisted.
        </p>
        <Link
          href="/courses"
          className="inline-block px-4 py-2 rounded-lg bg-[#172554] text-white text-xs font-semibold"
        >
          Back to Course Catalog
        </Link>
      </div>
    );
  }

  const durationHours = course.totalDurationMinutes
    ? (course.totalDurationMinutes / 60).toFixed(1)
    : "5.0";

  const firstLessonId = course.modules?.[0]?.lessons?.[0]?._id;
  const continueLessonId = enrollment?.lastAccessedLessonId || firstLessonId;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* 1. Header Banner */}
      <section className="bg-[#172554] text-white py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Header Info */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded text-xs font-semibold bg-blue-500/20 text-[#06B6D4] border border-blue-400/20">
                  {course.category}
                </span>
                <span className="px-2.5 py-1 rounded text-xs font-medium bg-white/10 text-white/90">
                  {course.level}
                </span>
                <span className="px-2.5 py-1 rounded text-xs font-medium bg-white/10 text-white/90">
                  {course.language}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                {course.title}
              </h1>

              {course.subtitle && (
                <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed max-w-3xl">
                  {course.subtitle}
                </p>
              )}

              {/* Rating & Stats row */}
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#94A3B8] pt-2">
                {course.ratingCount && course.ratingCount > 0 ? (
                  <div className="flex items-center gap-1.5 text-[#D97706] font-bold">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{course.ratingAverage?.toFixed(1) || "5.0"}</span>
                    <span className="text-[#94A3B8] font-normal">
                      ({course.ratingCount} {course.ratingCount === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                ) : (
                  <span className="text-[#94A3B8]">Not yet rated</span>
                )}
                <span>•</span>
                <span>{course.enrolledCount || 0} students enrolled</span>
                <span>•</span>
                <span>Last updated {new Date(course.updatedAt).toLocaleDateString()}</span>
              </div>

              {/* Instructor info preview */}
              <div className="flex items-center gap-3 pt-3">
                {course.instructor?.avatar ? (
                  <img
                    src={course.instructor.avatar}
                    alt={course.instructor.name}
                    className="w-10 h-10 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/10 text-[#06B6D4] flex items-center justify-center font-bold text-sm">
                    {course.instructor?.name?.charAt(0) || "C"}
                  </div>
                )}
                <div>
                  <span className="text-xs text-[#94A3B8] block">Instructor</span>
                  <span className="text-sm font-semibold text-white">
                    {course.instructor?.name || "CodeMentors Instructor"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Card / Enrollment Box */}
            <div className="lg:col-span-4">
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-xl space-y-6 text-[#0F172A] sticky top-24">
                {/* Preview Thumbnail */}
                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-100 group">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  {course.previewVideoUrl && (
                    <button
                      onClick={() => setPreviewVideoUrl(course.previewVideoUrl)}
                      className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-[#172554]/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-all cursor-pointer z-10"
                      title="Watch Preview Lesson"
                    >
                      <Play className="w-5 h-5 ml-0.5 fill-current" />
                    </button>
                  )}
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-white/95 text-[#0F172A] shadow-2xs">
                    Preview Available
                  </span>
                </div>

                {/* Price Display */}
                <div>
                  {isEnrolled ? (
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-center space-y-2">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-[#2563EB] font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                        You are enrolled in this course
                      </div>
                      <Link
                        href={`/learn/${course.slug}/${continueLessonId}`}
                        className="w-full py-2.5 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                      >
                        Continue Learning
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-baseline gap-2">
                        {course.isFree ? (
                          <span className="text-3xl font-black text-[#16A34A]">Free</span>
                        ) : (
                          <>
                            <span className="text-3xl font-black text-[#0F172A]">
                              ₹{(course.discountPrice || course.price).toLocaleString("en-IN")}
                            </span>
                            {course.discountPrice && course.discountPrice < course.price && (
                              <span className="text-sm text-[#94A3B8] line-through">
                                ₹{course.price.toLocaleString("en-IN")}
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Primary CTA */}
                      {course.isFree ? (
                        <button
                          onClick={handleFreeEnroll}
                          className="w-full py-3 rounded-lg bg-[#16A34A] hover:bg-emerald-700 text-white font-bold text-sm shadow-xs transition-colors cursor-pointer"
                        >
                          Enroll for Free
                        </button>
                      ) : (
                        <div className="space-y-2.5">
                          {/* Buy Now Button */}
                          <button
                            onClick={handleBuyNow}
                            disabled={buyingNow || addingToCart}
                            className="w-full py-3 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white font-bold text-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                          >
                            {buyingNow ? (
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                            ) : (
                              <CreditCard className="w-4 h-4 text-[#06B6D4]" />
                            )}
                            Buy Now
                          </button>

                          {/* Add to Basket or View In Basket */}
                          {isInCart(course._id) ? (
                            <Link
                              href="/course-basket"
                              className="w-full py-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#16A34A] border border-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                              Item in Basket — View Basket
                            </Link>
                          ) : (
                            <button
                              onClick={handleAddToCart}
                              disabled={addingToCart || buyingNow}
                              className="w-full py-2.5 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0F172A] border border-[#CBD5E1] font-semibold text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
                            >
                              {addingToCart ? (
                                <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
                              ) : (
                                <ShoppingBag className="w-4 h-4 text-[#2563EB]" />
                              )}
                              Add to Basket
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Course Inclusions List */}
                <div className="pt-4 border-t border-[#E2E8F0] space-y-2.5 text-xs text-[#64748B]">
                  <span className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px] block">
                    This course includes:
                  </span>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#2563EB]" />
                    <span>{durationHours} hours of on-demand mixed learning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#172554]" />
                    <span>{course.totalLessonsCount || 6} structured lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[#16A34A]" />
                    <span>Coding exercises & timed quizzes</span>
                  </div>
                  {course.certificateEnabled && (
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#06B6D4]" />
                      <span>Verifiable Certificate of Completion</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#64748B]" />
                    <span>7-day money-back guarantee</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Details Content */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-[#0F172A]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-12">
            {/* Learning Objectives */}
            {course.whatYouWillLearn?.length > 0 && (
              <div className="p-6 sm:p-8 rounded-xl border border-[#E2E8F0] bg-white shadow-xs space-y-4">
                <h3 className="text-lg font-bold text-[#0F172A]">What You'll Master</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {course.whatYouWillLearn.map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#64748B]">
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Description & Syllabus Overview */}
            {course.description && (
              <div className="p-6 sm:p-8 rounded-xl border border-[#E2E8F0] bg-white shadow-xs space-y-4">
                <h3 className="text-lg font-bold text-[#0F172A]">Course Overview & Detailed Syllabus</h3>
                <FormattedContentRenderer
                  content={course.description}
                  className="text-slate-800"
                />
              </div>
            )}

            {/* Course Curriculum */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-[#0F172A]">Course Curriculum</h3>
                <p className="text-xs text-[#64748B] mt-1">
                  {course.modules?.length || 0} modules • {course.totalLessonsCount || 0} lessons • {durationHours} hrs total
                </p>
              </div>

              {/* Modules Accordion */}
              <div className="space-y-3">
                {course.modules?.map((module: any, mIdx: number) => {
                  const isExpanded = Boolean(expandedModules[module._id]);
                  return (
                    <div
                      key={module._id}
                      className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden shadow-xs"
                    >
                      <button
                        onClick={() => toggleModule(module._id)}
                        className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded bg-slate-100 text-[#0F172A] flex items-center justify-center text-xs font-mono font-bold">
                            {mIdx + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-[#0F172A]">{module.title}</h4>
                            {module.description && (
                              <p className="text-xs text-[#64748B] mt-0.5 line-clamp-1">
                                {module.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#64748B]">
                          <span>{module.lessons?.length || 0} lessons</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      {/* Lessons List */}
                      {isExpanded && (
                        <div className="border-t border-[#E2E8F0] divide-y divide-[#E2E8F0] bg-[#F8FAFC]">
                          <div className="p-3 sm:px-6 bg-slate-50 flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] text-[#64748B]">
                            <span className="font-bold text-[#172554] uppercase tracking-wider text-[10px]">
                              Module Assets:
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-[#0F172A] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                              <Play className="w-3 h-3 text-[#2563EB]" />
                              <span>Video Lecture</span>
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-[#0F172A] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                              <BookOpen className="w-3 h-3 text-[#04AA6D]" />
                              <span>W3Schools Style Notes</span>
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-[#0F172A] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                              <FileText className="w-3 h-3 text-[#DC2626]" />
                              <span>PDF Handbook</span>
                            </span>
                          </div>
                          {module.lessons?.map((lesson: any) => {
                            const isClickable = isEnrolled || lesson.isPreview;
                            return (
                              <div
                                key={lesson._id}
                                className="p-3.5 sm:px-6 flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-3">
                                  {lesson.type === "video" ? (
                                    <Play className="w-4 h-4 text-[#2563EB] shrink-0" />
                                  ) : lesson.type === "quiz" ? (
                                    <HelpCircle className="w-4 h-4 text-[#D97706] shrink-0" />
                                  ) : lesson.type === "coding" ? (
                                    <Terminal className="w-4 h-4 text-[#16A34A] shrink-0" />
                                  ) : (
                                    <FileText className="w-4 h-4 text-[#172554] shrink-0" />
                                  )}

                                  {isClickable ? (
                                    <Link
                                      href={`/learn/${course.slug}/${lesson._id}`}
                                      className="font-medium text-[#0F172A] hover:text-[#2563EB] transition-colors"
                                    >
                                      {lesson.title}
                                    </Link>
                                  ) : (
                                    <span className="text-[#64748B]">{lesson.title}</span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 text-[11px] text-[#64748B]">
                                  <span>{lesson.durationMinutes} mins</span>
                                  {lesson.isPreview ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#2563EB] border border-blue-200">
                                      PREVIEW
                                    </span>
                                  ) : isEnrolled ? (
                                    <Unlock className="w-3.5 h-3.5 text-[#16A34A]" />
                                  ) : (
                                    <Lock className="w-3.5 h-3.5 text-[#94A3B8]" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Student Reviews */}
            <div className="p-6 sm:p-8 rounded-xl border border-[#E2E8F0] bg-white shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">Student Reviews & Ratings</h3>
                  <p className="text-xs text-[#64748B]">Real reviews from verified enrolled learners</p>
                </div>
                {isEnrolled && (
                  <button
                    onClick={() => setReviewModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-[#172554] text-white text-xs font-semibold hover:bg-[#1E3A8A]"
                  >
                    Write a Review
                  </button>
                )}
              </div>

              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((r: any) => (
                    <div key={r._id} className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#0F172A]">{r.userId?.name || "Student"}</span>
                        <div className="flex items-center gap-1 text-[#D97706] text-xs font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{r.rating}.0</span>
                        </div>
                      </div>
                      <p className="text-xs text-[#64748B] italic">"{r.comment}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#64748B]">No reviews yet for this course. Be the first to share your thoughts!</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Preview Video Modal */}
      {previewVideoUrl && (
        <Modal
          isOpen={Boolean(previewVideoUrl)}
          onClose={() => setPreviewVideoUrl(null)}
          title="Free Lesson Preview"
          maxWidth="max-w-3xl"
        >
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
            <iframe
              src={previewVideoUrl}
              className="w-full h-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </Modal>
      )}

      {/* Write Review Modal */}
      {reviewModalOpen && (
        <Modal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          title="Write a Course Review"
        >
          <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Star Rating (1 to 5)</label>
              <select
                value={ratingInput}
                onChange={(e) => setRatingInput(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              >
                <option value={5}>⭐⭐⭐⭐⭐ (5 - Exceptional)</option>
                <option value={4}>⭐⭐⭐⭐ (4 - Very Good)</option>
                <option value={3}>⭐⭐⭐ (3 - Average)</option>
                <option value={2}>⭐⭐ (2 - Below Expectations)</option>
                <option value={1}>⭐ (1 - Unsatisfied)</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Your Detailed Feedback</label>
              <textarea
                required
                rows={4}
                value={reviewTextInput}
                onChange={(e) => setReviewTextInput(e.target.value)}
                placeholder="What did you think of the explanations, exercises, and overall course pace?"
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-[#0F172A] font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingReview}
                className="px-4 py-2 rounded-lg bg-[#172554] text-white font-semibold shadow-xs disabled:opacity-50"
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
