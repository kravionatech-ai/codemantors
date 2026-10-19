"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import {
  Star,
  ArrowLeft,
  Loader2,
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  CornerDownRight,
  BookOpen,
} from "lucide-react";

export default function InstructorReviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [reviews, setReviews] = useState<any[]>([]);
  const [courses, setCourses] = useState<{ _id: string; title: string }[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<Record<number, number>>({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  });
  const [totalReviews, setTotalReviews] = useState(0);
  const [averageRating, setAverageRating] = useState("5.0");
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedRating, setSelectedRating] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all"); // "all", "replied", "unreplied"
  const [search, setSearch] = useState("");

  // Reply Modal
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [activeReview, setActiveReview] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "instructor" && user.role !== "admin" && user.role !== "super_admin"))) {
      router.push("/student/dashboard");
    }
  }, [user, authLoading, router]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: selectedStatus,
      });

      if (selectedCourse !== "all") params.append("courseId", selectedCourse);
      if (selectedRating !== "all") params.append("rating", selectedRating);
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/instructor/reviews?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        setCourses(data.courses || []);
        setRatingDistribution(data.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
        setTotalReviews(data.totalReviews || 0);
        setAverageRating(data.averageRating || "5.0");
      } else {
        toast.error(data.error || "Failed to load reviews");
      }
    } catch (err) {
      console.error("Error loading reviews:", err);
      toast.error("Network error loading reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchReviews();
    }
  }, [user, selectedCourse, selectedRating, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReviews();
  };

  const openReplyModal = (rev: any) => {
    setActiveReview(rev);
    setReplyText(rev.instructorReply?.text || "");
    setReplyModalOpen(true);
  };

  const handleApplyTemplate = (template: string) => {
    setReplyText(template);
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReview || !replyText.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/instructor/reviews/${activeReview._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyText: replyText.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Instructor response submitted successfully!");
        setReplyModalOpen(false);
        setActiveReview(null);
        setReplyText("");
        fetchReviews();
      } else {
        toast.error(data.error || "Failed to submit reply");
      }
    } catch {
      toast.error("Error submitting response");
    } finally {
      setSubmittingReply(false);
    }
  };

  if (authLoading) {
    return (
      <div className="py-24 text-center text-[#64748B] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB]" />
        <p className="text-sm font-medium">Authenticating Instructor Session...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <Link
            href="/instructor/dashboard"
            className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-[#64748B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-[#172554] tracking-tight">Student Feedback & Reviews</h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Inspect student ratings, identify course improvement areas, and reply directly to learner evaluations.
            </p>
          </div>
        </div>
      </div>

      {/* Ratings Breakdown Overview */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Average Rating Card */}
        <div className="md:col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col justify-center items-center text-center space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Average</span>
          <div className="text-4xl font-black text-[#172554] flex items-center gap-2">
            <span>{averageRating}</span>
            <Star className="w-7 h-7 text-amber-500 fill-current" />
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Based on {totalReviews} verified student evaluations
          </p>
        </div>

        {/* Star Distribution Progress Bars */}
        <div className="md:col-span-8 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-slate-800 mb-2">Rating Distribution</h3>
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = ratingDistribution[stars] || 0;
            const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-bold text-slate-700 flex items-center gap-1">
                  <span>{stars}</span>
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                </span>

                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-400 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <span className="w-10 text-right text-slate-500 font-semibold">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Query and Filters Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <form onSubmit={handleSearchSubmit} className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search feedback text or student..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E2E8F0] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2563EB]"
            />
          </form>

          <div className="sm:col-span-3">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] text-slate-900 bg-white focus:outline-none focus:border-[#2563EB]"
            >
              <option value="all">All Authored Courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] text-slate-900 bg-white focus:outline-none focus:border-[#2563EB]"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] text-slate-900 bg-white focus:outline-none focus:border-[#2563EB]"
            >
              <option value="all">All Feedback</option>
              <option value="unreplied">Needs Reply</option>
              <option value="replied">Replied</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="py-20 text-center text-[#64748B] space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB]" />
          <p className="text-sm">Fetching student evaluations...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center shadow-xs space-y-3">
          <Star className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-[#172554]">No Matching Reviews Found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            {search || selectedCourse !== "all" || selectedRating !== "all" || selectedStatus !== "all"
              ? "No reviews matched your filter settings. Try resetting filters."
              : "When students complete your courses and submit evaluations, they will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev._id}
              className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#172554] text-[#06B6D4] flex items-center justify-center font-bold text-xs shrink-0">
                    {rev.userId?.name?.charAt(0) || "S"}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#0F172A]">{rev.userId?.name || "Student"}</h4>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                      <span className="font-semibold text-[#2563EB]">{rev.courseId?.title}</span>
                      <span>•</span>
                      <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                    <span className="text-xs font-bold text-amber-800">{rev.rating} / 5</span>
                  </div>

                  <button
                    onClick={() => openReplyModal(rev)}
                    className="px-2.5 py-1 rounded-lg border border-blue-200 text-[#2563EB] hover:bg-blue-50 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {rev.instructorReply?.text ? "Edit Response" : "Reply to Student"}
                  </button>
                </div>
              </div>

              {/* Review Text */}
              <p className="text-xs text-slate-700 leading-relaxed pl-10">
                "{rev.reviewText}"
              </p>

              {/* Existing Instructor Reply */}
              {rev.instructorReply?.text && (
                <div className="ml-10 p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#172554]">
                    <CornerDownRight className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Your Response</span>
                    <span className="text-[10px] font-normal text-slate-500">
                      • {new Date(rev.instructorReply.repliedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed pl-5">
                    "{rev.instructorReply.text}"
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      <Modal
        isOpen={replyModalOpen}
        onClose={() => setReplyModalOpen(false)}
        title="Instructor Response to Student Evaluation"
      >
        <form onSubmit={handleSubmitReply} className="space-y-4 text-xs">
          {activeReview && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-slate-800 font-bold">
                <span>{activeReview.userId?.name}</span>
                <span className="text-amber-700">{activeReview.rating} / 5 Stars</span>
              </div>
              <p className="text-[11px] text-slate-600">"{activeReview.reviewText}"</p>
            </div>
          )}

          {/* Quick Response Templates */}
          <div>
            <span className="font-semibold text-slate-800 block mb-1">Quick Templates:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Thank you for the review! Glad you enjoyed the curriculum.",
                "Thank you for taking the course! Best of luck with your next projects.",
                "Appreciate the feedback! I will expand on this topic in the next module update.",
              ].map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] text-slate-700 font-medium transition-colors"
                >
                  Template {i + 1}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-800 block mb-1">
              Your Official Response (visible on course page)
            </label>
            <textarea
              required
              rows={4}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a professional, encouraging note to the learner..."
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#E2E8F0] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setReplyModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingReply}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-semibold shadow-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submittingReply ? "Posting..." : "Publish Response"}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
