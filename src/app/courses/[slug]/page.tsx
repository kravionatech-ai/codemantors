"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import CheckoutModal from "@/components/ui/CheckoutModal";
import Modal from "@/components/ui/Modal";
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
  Share2,
  ShieldCheck,
  ArrowRight,
  Terminal,
  HelpCircle,
  MessageSquare,
} from "lucide-react";

export default function CourseDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [course, setCourse] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & UI States
  const [checkoutOpen, setCheckoutOpen] = useState(false);
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

        // Default expand first 2 modules
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
        toast.success("Enrolled in free course successfully!");
        setIsEnrolled(true);
        const firstLessonId = course.modules?.[0]?.lessons?.[0]?._id;
        router.push(`/learn/${course.slug}/${firstLessonId}`);
      } else {
        toast.error(data.error || "Enrollment failed");
      }
    } catch {
      toast.error("An error occurred during enrollment");
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
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
          reviewText: reviewTextInput.trim(),
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
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs">Loading course curriculum and details...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 rounded-2xl border border-slate-800 bg-slate-900/50 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Course Not Found</h2>
        <p className="text-xs text-slate-400">
          The requested course does not exist or may have been unlisted.
        </p>
        <Link
          href="/courses"
          className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold"
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
    <div className="min-h-screen">
      {/* 1. Header Banner */}
      <section className="border-b border-slate-800/80 bg-slate-950 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Header Info */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {course.category}
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-900 text-slate-300 border border-slate-800">
                  {course.level}
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-900 text-slate-300 border border-slate-800">
                  {course.language}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                {course.title}
              </h1>

              {course.subtitle && (
                <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl">
                  {course.subtitle}
                </p>
              )}

              {/* Rating & Stats row */}
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-400 pt-2">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{course.ratingAverage?.toFixed(1) || "5.0"}</span>
                  <span className="text-slate-500 font-normal">
                    ({course.ratingCount || 0} reviews)
                  </span>
                </div>
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
                    className="w-10 h-10 rounded-full object-cover border border-slate-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                    {course.instructor?.name?.charAt(0) || "C"}
                  </div>
                )}
                <div>
                  <span className="text-xs text-slate-400 block">Created by</span>
                  <span className="text-sm font-semibold text-white">
                    {course.instructor?.name || "CodeMentors Instructor"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Card / Enrollment Box */}
            <div className="lg:col-span-4">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl space-y-6 sticky top-24">
                {/* Preview Thumbnail / Video Trigger */}
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-800 group">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  {course.previewVideoUrl && (
                    <button
                      onClick={() => setPreviewVideoUrl(course.previewVideoUrl)}
                      className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-all z-10"
                      title="Watch Preview Lesson"
                    >
                      <Play className="w-6 h-6 ml-0.5 fill-current" />
                    </button>
                  )}
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-950/80 text-white backdrop-blur-md">
                    Course Preview
                  </span>
                </div>

                {/* Price Display */}
                <div>
                  {isEnrolled ? (
                    <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 text-center space-y-2">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-blue-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        You are enrolled in this course
                      </div>
                      <Link
                        href={`/learn/${course.slug}/${continueLessonId}`}
                        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
                      >
                        Continue Learning
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-baseline gap-2">
                        {course.isFree ? (
                          <span className="text-3xl font-black text-emerald-400">Free</span>
                        ) : (
                          <>
                            <span className="text-3xl font-black text-white">
                              ₹{(course.discountPrice || course.price).toLocaleString("en-IN")}
                            </span>
                            {course.discountPrice && course.discountPrice < course.price && (
                              <span className="text-sm text-slate-500 line-through">
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
                          className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/25 transition-all"
                        >
                          Enroll for Free
                        </button>
                      ) : (
                        <button
                          onClick={() => setCheckoutOpen(true)}
                          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-500/25 transition-all hover:scale-[1.02]"
                        >
                          Buy Course & Start Learning
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Course Inclusions List */}
                <div className="pt-4 border-t border-slate-800 space-y-2.5 text-xs text-slate-300">
                  <span className="font-bold text-slate-100 uppercase tracking-wider text-[11px] block">
                    This course includes:
                  </span>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span>{durationHours} hours of on-demand mixed learning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    <span>{course.totalLessonsCount || 6} structured lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>Coding exercises & timed quizzes</span>
                  </div>
                  {course.certificateEnabled && (
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>Verified Certificate of Completion</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    <span>7-day money-back guarantee</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Details Content */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-12">
            {/* Learning Objectives */}
            {course.whatYouWillLearn?.length > 0 && (
              <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/40 space-y-4">
                <h3 className="text-lg font-bold text-white">What You'll Learn</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {course.whatYouWillLearn.map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Curriculum */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Course Curriculum</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {course.modules?.length || 0} modules • {course.totalLessonsCount || 0} lessons • {durationHours} hrs total
                  </p>
                </div>
              </div>

              {/* Modules Accordion */}
              <div className="space-y-3">
                {course.modules?.map((module: any, mIdx: number) => {
                  const isExpanded = Boolean(expandedModules[module._id]);
                  return (
                    <div
                      key={module._id}
                      className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden"
                    >
                      <button
                        onClick={() => toggleModule(module._id)}
                        className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-slate-850 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-mono font-bold">
                            {mIdx + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-slate-100">{module.title}</h4>
                            {module.description && (
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                                {module.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span>{module.lessons?.length || 0} lessons</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      {/* Lessons List */}
                      {isExpanded && (
                        <div className="border-t border-slate-800/80 divide-y divide-slate-800/60 bg-slate-950/40">
                          {module.lessons?.map((lesson: any, lIdx: number) => {
                            const isClickable = isEnrolled || lesson.isPreview;
                            return (
                              <div
                                key={lesson._id}
                                className="p-3.5 sm:px-6 flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-3">
                                  {lesson.type === "video" ? (
                                    <Play className="w-4 h-4 text-blue-400 shrink-0" />
                                  ) : lesson.type === "quiz" ? (
                                    <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                                  ) : lesson.type === "coding" ? (
                                    <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
                                  ) : (
                                    <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                                  )}

                                  {isClickable ? (
                                    <Link
                                      href={`/learn/${course.slug}/${lesson._id}`}
                                      className="font-medium text-slate-200 hover:text-blue-400 transition-colors"
                                    >
                                      {lesson.title}
                                    </Link>
                                  ) : (
                                    <span className="text-slate-400">{lesson.title}</span>
                                  )}

                                  {lesson.isPreview && !isEnrolled && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                      Preview
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                                  <span>{lesson.durationMinutes || 5} min</span>
                                  {isClickable ? (
                                    <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Lock className="w-3.5 h-3.5 text-slate-600" />
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

            {/* Requirements & Target Audience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {course.requirements?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-base font-bold text-white">Prerequisites</h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {course.requirements.map((req: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {course.targetAudience?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-base font-bold text-white">Who This Course Is For</h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {course.targetAudience.map((aud: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400">•</span>
                        <span>{aud}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">Course Overview</h3>
              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {course.description}
              </div>
            </div>

            {/* Student Reviews Section */}
            <div className="space-y-6 pt-6 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Student Reviews</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-black text-amber-400">
                      {course.ratingAverage?.toFixed(1) || "5.0"}
                    </span>
                    <div className="flex text-amber-400 text-sm">
                      {"★".repeat(Math.round(course.ratingAverage || 5))}
                    </div>
                    <span className="text-xs text-slate-400">
                      based on {reviews.length} authentic reviews
                    </span>
                  </div>
                </div>

                {isEnrolled && (
                  <button
                    onClick={() => setReviewModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Write a Review
                  </button>
                )}
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center rounded-xl bg-slate-900/30 border border-slate-800">
                    No reviews submitted yet. Be the first to enroll and review!
                  </p>
                ) : (
                  reviews.map((r) => (
                    <div
                      key={r._id}
                      className="p-5 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                            {r.userId?.name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">
                              {r.userId?.name || "Student"}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(r.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-amber-400 text-xs">
                          {"★".repeat(r.rating || 5)}
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed italic">
                        "{r.reviewText}"
                      </p>

                      {r.instructorReply?.text && (
                        <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 text-xs text-slate-300 space-y-1">
                          <span className="font-semibold text-blue-400 block text-[11px]">
                            Instructor Response:
                          </span>
                          <p>{r.instructorReply.text}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        course={course}
        onSuccess={() => {
          setIsEnrolled(true);
          fetchCourseData();
        }}
      />

      {/* Preview Video Modal */}
      {previewVideoUrl && (
        <Modal isOpen={Boolean(previewVideoUrl)} onClose={() => setPreviewVideoUrl(null)} title="Lesson Preview">
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
            <video src={previewVideoUrl} controls autoPlay className="w-full h-full object-contain" />
          </div>
        </Modal>
      )}

      {/* Leave Review Modal */}
      <Modal isOpen={reviewModalOpen} onClose={() => setReviewModalOpen(false)} title="Submit Course Review">
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Rating (1 to 5 Stars)</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRatingInput(star)}
                  className={`text-2xl transition-colors ${
                    star <= ratingInput ? "text-amber-400" : "text-slate-600"
                  }`}
                >
                  ★
                </button>
              ))}
              <span className="text-xs font-bold text-slate-300 ml-2">{ratingInput} Stars</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Your Feedback</label>
            <textarea
              required
              rows={4}
              value={reviewTextInput}
              onChange={(e) => setReviewTextInput(e.target.value)}
              placeholder="What did you think of the explanations, projects, and exercises?"
              className="w-full p-3 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submittingReview}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50"
          >
            {submittingReview ? "Submitting..." : "Post Review"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
