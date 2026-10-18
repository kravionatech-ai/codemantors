"use client";

import React from "react";
import Link from "next/link";
import { Star, Clock, BookOpen, Award, CheckCircle } from "lucide-react";

export interface CourseCardProps {
  course: {
    _id: string;
    title: string;
    slug: string;
    subtitle?: string;
    thumbnail: string;
    category: string;
    level: string;
    ratingAverage: number;
    ratingCount: number;
    enrolledCount: number;
    totalDurationMinutes?: number;
    totalLessonsCount?: number;
    price: number;
    discountPrice?: number;
    isFree: boolean;
    certificateEnabled?: boolean;
    instructor?: {
      name: string;
      avatar?: string;
    };
  };
  progress?: number; // 0 to 100 if user is enrolled
  isEnrolled?: boolean;
  continueLessonId?: string;
}

export default function CourseCard({ course, progress, isEnrolled, continueLessonId }: CourseCardProps) {
  const durationHours = course.totalDurationMinutes
    ? (course.totalDurationMinutes / 60).toFixed(1)
    : "4.5";

  const destinationHref = isEnrolled && continueLessonId
    ? `/learn/${course.slug}/${continueLessonId}`
    : `/courses/${course.slug}`;

  return (
    <div className="group flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden hover:border-slate-700 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
      {/* Thumbnail */}
      <Link href={destinationHref} className="relative aspect-video w-full overflow-hidden bg-slate-800">
        <img
          src={course.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop"}
          alt={course.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-950/80 text-blue-400 border border-slate-800 backdrop-blur-md">
            {course.category}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-950/80 text-slate-300 border border-slate-800 backdrop-blur-md">
            {course.level}
          </span>
        </div>

        {course.certificateEnabled && (
          <div className="absolute top-3 right-3 p-1 rounded-md bg-slate-950/80 text-amber-400 border border-slate-800 backdrop-blur-md" title="Certificate Included">
            <Award className="w-3.5 h-3.5" />
          </div>
        )}
      </Link>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Rating & Stats */}
          <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
            <div className="flex items-center gap-1 text-amber-400 font-semibold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{course.ratingAverage?.toFixed(1) || "5.0"}</span>
            </div>
            <span className="text-slate-600">•</span>
            <span>({course.ratingCount || 0} reviews)</span>
            <span className="text-slate-600">•</span>
            <span>{course.enrolledCount || 0} students</span>
          </div>

          {/* Title */}
          <Link href={destinationHref}>
            <h3 className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-2 text-base leading-snug">
              {course.title}
            </h3>
          </Link>

          {/* Subtitle */}
          {course.subtitle && (
            <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {course.subtitle}
            </p>
          )}
        </div>

        {/* Footer Meta */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          {/* Enrolled Progress Bar */}
          {typeof progress === "number" ? (
            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Progress</span>
                <span className={`font-semibold ${progress >= 100 ? "text-emerald-400" : "text-blue-400"}`}>
                  {progress}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    progress >= 100 ? "bg-emerald-500" : "bg-blue-600"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {durationHours} hrs
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                {course.totalLessonsCount || 6} lessons
              </span>
            </div>
          )}

          {/* Price & Action */}
          <div className="flex items-center justify-between">
            {/* Instructor */}
            <div className="flex items-center gap-2">
              {course.instructor?.avatar ? (
                <img
                  src={course.instructor.avatar}
                  alt={course.instructor.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-[10px] flex items-center justify-center font-bold">
                  {course.instructor?.name?.charAt(0) || "C"}
                </div>
              )}
              <span className="text-xs text-slate-300 font-medium truncate max-w-[100px]">
                {course.instructor?.name || "CodeMentors"}
              </span>
            </div>

            {/* Price Badge or Enrolled Button */}
            {isEnrolled ? (
              <Link
                href={destinationHref}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 transition-colors"
              >
                {progress && progress >= 100 ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    Review
                  </>
                ) : (
                  "Continue"
                )}
              </Link>
            ) : (
              <div className="text-right">
                {course.isFree ? (
                  <span className="text-sm font-bold text-emerald-400">Free</span>
                ) : (
                  <div className="flex items-baseline gap-1.5">
                    {course.discountPrice && course.discountPrice < course.price ? (
                      <>
                        <span className="text-sm font-bold text-white">
                          ₹{course.discountPrice.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs text-slate-500 line-through">
                          ₹{course.price.toLocaleString("en-IN")}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-bold text-white">
                        ₹{course.price.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
