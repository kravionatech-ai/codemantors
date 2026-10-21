"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import CourseCard from "@/components/ui/CourseCard";
import { BookOpen, Play, ArrowRight, Loader2, Sparkles } from "lucide-react";

export default function StudentCoursesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/student/courses");
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
          setEnrollments(data.enrollments || []);
        }
      } catch (err) {
        console.error("Error loading courses:", err);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading && user) loadData();
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <div className="py-20 text-center text-[#64748B] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB]" />
        <p className="text-sm font-medium">Authenticating Student Session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-20 text-center text-[#64748B] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB]" />
        <p className="text-sm font-medium">Redirecting to sign in...</p>
        <Link
          href="/login?redirect=/student/courses"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] rounded-lg hover:bg-blue-700 transition-colors"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-[#64748B]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-3" />
        <p className="text-sm">Loading your enrolled courses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-xl font-bold text-[#111827] tracking-tight">My Enrolled Courses</h1>
          <p className="text-xs text-[#64748B] mt-1">
            Access your courses, track lesson progress, and continue learning.
          </p>
        </div>
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          Explore More Courses
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {enrollments.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center shadow-xs">
          <BookOpen className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
          <h3 className="text-sm font-bold text-[#111827]">No Enrolled Courses Yet</h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto mt-1 mb-6">
            You haven't enrolled in any courses yet. Browse our curated catalog of software engineering and web development courses.
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Browse Course Catalog
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enr: any) => {
            const course = enr.courseId;
            if (!course) return null;

            const firstLessonId =
              enr.lastAccessedLessonId || course.modules?.[0]?.lessons?.[0]?._id;

            return (
              <div
                key={enr._id}
                className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs hover:border-[#2563EB]/40 transition-all flex flex-col"
              >
                <div className="relative aspect-video bg-slate-100 overflow-hidden">
                  <img
                    src={course.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#111827]/80 backdrop-blur-xs text-[10px] font-bold text-white">
                    {course.category}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-[#111827] text-sm line-clamp-2 leading-snug">
                      {course.title}
                    </h3>
                    <p className="text-xs text-[#64748B] line-clamp-1 mt-1">
                      {course.subtitle || course.instructor?.name || "Professional Course"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#64748B]">Progress</span>
                      <span className="font-bold text-[#111827]">
                        {enr.progressPercentage || 0}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          enr.progressPercentage >= 100 ? "bg-[#16A34A]" : "bg-[#2563EB]"
                        }`}
                        style={{ width: `${enr.progressPercentage || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                    <Link
                      href={`/courses/${course.slug}`}
                      className="text-xs font-semibold text-[#64748B] hover:text-[#111827]"
                    >
                      Syllabus
                    </Link>
                    {firstLessonId ? (
                      <Link
                        href={`/learn/${course.slug}/${firstLessonId}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Continue
                      </Link>
                    ) : (
                      <Link
                        href={`/courses/${course.slug}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-medium"
                      >
                        Start Learning
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
