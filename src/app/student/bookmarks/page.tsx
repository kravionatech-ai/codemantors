"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Bookmark, Play, ArrowRight, Loader2, BookOpen } from "lucide-react";

export default function StudentBookmarksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/student/bookmarks");
      } else if (user.role === "instructor") {
        router.replace("/instructor/dashboard");
      } else if (user.role === "admin" || user.role === "super_admin") {
        router.replace("/admin/dashboard");
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/dashboard/student");
        const data = await res.json();
        if (data.success) {
          setBookmarks(data.bookmarkedLessons || []);
        }
      } catch (err) {
        console.error("Error loading bookmarks:", err);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading && user && user.role === "student") loadData();
  }, [authLoading, user]);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#E2E8F0]">
        <h1 className="text-2xl font-black text-[#172554] tracking-tight">Saved Bookmarks</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Quickly revisit key lectures, tutorials, and technical reference modules you've saved.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#64748B] space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB]" />
          <p className="text-sm font-medium">Loading your bookmarked lessons...</p>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center shadow-xs">
          <Bookmark className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
          <h3 className="text-base font-bold text-[#172554]">No Saved Bookmarks</h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto mt-1 mb-6">
            While learning in any video or text lesson, click the bookmark icon in the top header to save it here for fast reference.
          </p>
          <Link
            href="/student/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Go to My Courses
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0] shadow-xs">
          {bookmarks.map((bm: any) => {
            const course = bm.courseId;
            return (
              <div key={bm._id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                    <Bookmark className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A] line-clamp-1">
                      {bm.lessonTitle || `Lesson: ${bm.lessonId}`}
                    </h4>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      Course: {course?.title || "Enrolled Course"}
                    </p>
                  </div>
                </div>

                {course?.slug && (
                  <Link
                    href={`/learn/${course.slug}/${bm.lessonId}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#172554] hover:bg-slate-800 text-white text-xs font-semibold shrink-0 transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Open Lesson
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
