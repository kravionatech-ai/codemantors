"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  X,
  Clock,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Layers,
  Terminal,
  Code2,
  FileCode,
  GraduationCap,
  Play,
  RotateCcw,
  Sparkles,
  Check,
} from "lucide-react";

interface CourseRef {
  _id: string;
  title: string;
  slug: string;
  subtitle?: string;
  thumbnail?: string;
  level: string;
  totalDurationMinutes?: number;
  enrolledCount?: number;
  ratingAverage?: number;
  isFree?: boolean;
  price?: number;
}

interface LearningPathItem {
  _id: string;
  title: string;
  slug: string;
  description: string;
  icon?: string;
  category?: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
  estimatedHours: number;
  courses: CourseRef[];
  learningObjectives: string[];
  isPublished: boolean;
  createdAt?: string;
}

interface LearningPathsClientProps {
  initialPaths: LearningPathItem[];
}

export default function LearningPathsClient({ initialPaths }: LearningPathsClientProps) {
  const { user } = useAuth();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedDuration, setSelectedDuration] = useState<string>("All");
  const [expandedCurriculums, setExpandedCurriculums] = useState<Record<string, boolean>>({});

  // Student enrollments for progress derivation
  const [studentEnrollments, setStudentEnrollments] = useState<any[]>([]);

  useEffect(() => {
    if (user && user.role === "student") {
      fetch("/api/dashboard/student")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.enrollments)) {
            setStudentEnrollments(data.enrollments);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  // Map enrolled course IDs to their progress
  const enrollmentMap = useMemo(() => {
    const map = new Map<string, { progressPercentage: number; completedLessonsCount?: number }>();
    for (const enr of studentEnrollments) {
      const cId = typeof enr.courseId === "object" && enr.courseId?._id
        ? enr.courseId._id.toString()
        : enr.courseId?.toString();
      if (cId) {
        map.set(cId, {
          progressPercentage: enr.progressPercentage || 0,
        });
      }
    }
    return map;
  }, [studentEnrollments]);

  // Extract available unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    initialPaths.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [initialPaths]);

  // Toggle curriculum stage accordion
  const toggleCurriculum = (pathId: string) => {
    setExpandedCurriculums((prev) => ({
      ...prev,
      [pathId]: !prev[pathId],
    }));
  };

  // Filtered learning paths
  const filteredPaths = useMemo(() => {
    return initialPaths.filter((path) => {
      // Level filter
      if (selectedLevel !== "All" && path.level !== selectedLevel) {
        return false;
      }

      // Category filter
      if (selectedCategory !== "All" && path.category !== selectedCategory) {
        return false;
      }

      // Duration filter
      if (selectedDuration === "<30" && path.estimatedHours >= 30) return false;
      if (selectedDuration === "30-50" && (path.estimatedHours < 30 || path.estimatedHours > 50)) return false;
      if (selectedDuration === "50+" && path.estimatedHours <= 50) return false;

      // Search keyword filter (matches title, description, learningObjectives, or included course titles)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = path.title.toLowerCase().includes(query);
        const matchesDesc = path.description.toLowerCase().includes(query);
        const matchesCategory = (path.category || "").toLowerCase().includes(query);
        const matchesObjectives = path.learningObjectives?.some((obj) =>
          obj.toLowerCase().includes(query)
        );
        const matchesCourses = path.courses?.some((c) =>
          c.title?.toLowerCase().includes(query)
        );

        if (!matchesTitle && !matchesDesc && !matchesCategory && !matchesObjectives && !matchesCourses) {
          return false;
        }
      }

      return true;
    });
  }, [initialPaths, searchQuery, selectedLevel, selectedCategory, selectedDuration]);

  // Helper to compute progress for a learning path
  const getPathProgress = (path: LearningPathItem) => {
    if (!user || user.role !== "student" || !path.courses || path.courses.length === 0) {
      return null;
    }

    const totalCourses = path.courses.length;
    let enrolledCoursesCount = 0;
    let completedCoursesCount = 0;
    let totalProgressSum = 0;

    for (const course of path.courses) {
      const enr = enrollmentMap.get(course._id.toString());
      if (enr) {
        enrolledCoursesCount++;
        totalProgressSum += enr.progressPercentage;
        if (enr.progressPercentage >= 100) {
          completedCoursesCount++;
        }
      }
    }

    if (enrolledCoursesCount === 0) {
      return null;
    }

    const overallPercentage = Math.round(totalProgressSum / totalCourses);

    return {
      enrolledCoursesCount,
      completedCoursesCount,
      totalCourses,
      overallPercentage,
      isFullyCompleted: completedCoursesCount === totalCourses,
    };
  };

  // Find next actionable course in path for student
  const getActionableCourse = (path: LearningPathItem) => {
    if (!path.courses || path.courses.length === 0) return null;

    if (!user || user.role !== "student") {
      return path.courses[0];
    }

    // First course that is not 100% completed
    for (const course of path.courses) {
      const enr = enrollmentMap.get(course._id.toString());
      if (!enr || enr.progressPercentage < 100) {
        return course;
      }
    }

    return path.courses[0];
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedLevel !== "All" ||
    selectedCategory !== "All" ||
    selectedDuration !== "All";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedLevel("All");
    setSelectedCategory("All");
    setSelectedDuration("All");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 sm:py-14 text-[#111827]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* 1. Header Section */}
        <div className="pb-6 border-b border-[#E2E8F0] space-y-3">
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <Link href="/" className="hover:text-[#111827] transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-[#111827] font-semibold">Learning Paths</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
                Curated Learning Paths & Career Roadmaps
              </h1>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-3xl leading-relaxed">
                Structured, sequential course sequences curated by senior software engineers. Progress methodically from core syntax and testing paradigms to production full-stack architectures.
              </p>
            </div>

            <div className="text-xs text-[#64748B] font-medium shrink-0 bg-white px-3 py-1.5 rounded-lg border border-[#E2E8F0] shadow-2xs">
              Showing <span className="font-bold text-[#111827]">{filteredPaths.length}</span> of {initialPaths.length} roadmaps
            </div>
          </div>
        </div>

        {/* 2. Search & Discovery Controls */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search roadmaps by role, technology, or skills (e.g. Next.js, Node, TypeScript)..."
                className="w-full pl-9 pr-9 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#111827] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#111827] cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="md:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB] cursor-pointer"
              >
                <option value="All">All Categories ({initialPaths.length})</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Estimated Duration Dropdown */}
            <div className="md:col-span-3">
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB] cursor-pointer"
              >
                <option value="All">All Durations</option>
                <option value="<30">&lt; 30 Hours</option>
                <option value="30-50">30 – 50 Hours</option>
                <option value="50+">50+ Hours</option>
              </select>
            </div>
          </div>

          {/* Skill Level Filter Pills & Reset Action */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E2E8F0] text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mr-1">
                Skill Level:
              </span>
              {["All", "Beginner", "Intermediate", "Advanced"].map((lvl) => {
                const count = lvl === "All"
                  ? initialPaths.length
                  : initialPaths.filter((p) => p.level === lvl).length;
                const isActive = selectedLevel === lvl;

                return (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? "bg-[#2563EB] text-white shadow-2xs font-semibold"
                        : "bg-[#F8FAFC] text-[#64748B] hover:text-[#111827] border border-[#E2E8F0] hover:bg-slate-100"
                    }`}
                  >
                    <span>{lvl}</span>
                    <span className={`text-[10px] px-1 py-0.2 rounded ${isActive ? "bg-blue-700/60 text-white" : "text-[#94A3B8]"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs text-[#2563EB] hover:text-blue-800 font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* 3. Learning Paths List Presentation */}
        {filteredPaths.length === 0 ? (
          /* Empty Search / Filter State */
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center shadow-xs space-y-4 max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto border border-blue-100 shadow-2xs">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827]">
                No Learning Paths Found
              </h3>
              <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto leading-relaxed">
                No learning roadmaps match your active search keywords or filter criteria. Try clearing your filters or exploring our individual course catalog.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
              <Link
                href="/courses"
                className="px-4 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#111827] text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                Browse All Courses
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPaths.map((path) => {
              const progress = getPathProgress(path);
              const actionableCourse = getActionableCourse(path);
              const isCurriculumExpanded = Boolean(expandedCurriculums[path._id]);

              return (
                <div
                  key={path._id}
                  className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden transition-all hover:border-[#CBD5E1]"
                >
                  {/* Card Header & Primary Telemetry */}
                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Metadata Badges & Title */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                              path.level === "Beginner"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : path.level === "Intermediate"
                                ? "bg-blue-50 text-[#2563EB] border-blue-200"
                                : "bg-purple-50 text-purple-700 border-purple-200"
                            }`}
                          >
                            {path.level}
                          </span>

                          {path.category && (
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-[#475569] border border-slate-200">
                              {path.category}
                            </span>
                          )}

                          <span className="inline-flex items-center gap-1 text-[11px] text-[#64748B]">
                            <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                            <span>~{path.estimatedHours} Hours</span>
                          </span>

                          <span className="text-[#CBD5E1]">•</span>

                          <span className="inline-flex items-center gap-1 text-[11px] text-[#64748B]">
                            <BookOpen className="w-3.5 h-3.5 text-[#64748B]" />
                            <span>{path.courses?.length || 0} Courses in Sequence</span>
                          </span>
                        </div>

                        <h2 className="text-lg sm:text-xl font-bold text-[#111827]">
                          {path.title}
                        </h2>
                      </div>

                      {/* Right: Real Student Progress & Primary CTA */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                        {progress && (
                          <div className="text-xs bg-slate-50 border border-[#E2E8F0] px-3 py-2 rounded-lg space-y-1 w-full sm:w-auto">
                            <div className="flex items-center justify-between gap-3 text-[11px]">
                              <span className="text-[#64748B]">Your Progress:</span>
                              <span className="font-bold text-[#111827]">
                                {progress.completedCoursesCount}/{progress.totalCourses} Courses ({progress.overallPercentage}%)
                              </span>
                            </div>
                            <div className="w-full sm:w-36 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  progress.isFullyCompleted ? "bg-[#16A34A]" : "bg-[#2563EB]"
                                }`}
                                style={{ width: `${progress.overallPercentage}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {actionableCourse ? (
                          <Link
                            href={`/courses/${actionableCourse.slug}`}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          >
                            <span>
                              {progress ? (progress.isFullyCompleted ? "Review Path" : "Continue Path") : "Start Learning Path"}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <Link
                            href="/courses"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                          >
                            <span>Browse Courses</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-4xl">
                      {path.description}
                    </p>

                    {/* Competencies & Skills Acquired */}
                    {path.learningObjectives?.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#111827] block mb-2">
                          Key Skills & Competencies Acquired:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {path.learningObjectives.map((obj, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-[#475569]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{obj}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4. Progressive Curriculum Sequence Stage Preview */}
                  <div className="border-t border-[#E2E8F0] bg-[#F8FAFC]">
                    <div className="px-5 sm:px-6 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-[#111827]">Curriculum Progression:</span>
                        <span className="text-[#64748B]">
                          {path.courses?.length || 0} sequential steps in roadmap
                        </span>
                      </div>

                      <button
                        onClick={() => toggleCurriculum(path._id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:text-blue-800 transition-colors cursor-pointer"
                      >
                        <span>{isCurriculumExpanded ? "Collapse Stages" : "View Ordered Stages"}</span>
                        {isCurriculumExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {isCurriculumExpanded && (
                      <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-[#E2E8F0]/60 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {path.courses?.map((course, idx) => {
                            const enr = enrollmentMap.get(course._id.toString());
                            const isCompleted = enr && enr.progressPercentage >= 100;
                            const isInProgress = enr && enr.progressPercentage > 0 && !isCompleted;
                            const durationHours = course.totalDurationMinutes
                              ? Math.round(course.totalDurationMinutes / 60)
                              : 6;

                            return (
                              <Link
                                key={course._id.toString()}
                                href={`/courses/${course.slug}`}
                                className="group p-4 rounded-lg border border-[#E2E8F0] bg-white hover:border-[#2563EB]/40 hover:shadow-xs transition-all flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-center justify-between text-[11px] mb-2">
                                    <span className="font-mono font-bold text-[#2563EB]">
                                      STAGE 0{idx + 1}
                                    </span>
                                    {isCompleted ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                        <Check className="w-3 h-3" /> Completed
                                      </span>
                                    ) : isInProgress ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                        In Progress ({enr.progressPercentage}%)
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-medium text-[#64748B] bg-slate-100 px-2 py-0.5 rounded">
                                        {course.level}
                                      </span>
                                    )}
                                  </div>

                                  <h4 className="text-xs sm:text-sm font-semibold text-[#111827] group-hover:text-[#2563EB] transition-colors line-clamp-2">
                                    {course.title}
                                  </h4>

                                  {course.subtitle && (
                                    <p className="text-[11px] text-[#64748B] line-clamp-1 mt-1">
                                      {course.subtitle}
                                    </p>
                                  )}
                                </div>

                                <div className="mt-4 pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
                                  <span>~{durationHours} Hours • Syllabus</span>
                                  <ArrowRight className="w-3.5 h-3.5 text-[#2563EB] group-hover:translate-x-1 transition-transform" />
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
