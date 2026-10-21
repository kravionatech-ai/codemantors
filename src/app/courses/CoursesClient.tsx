"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CourseCard from "@/components/ui/CourseCard";
import { StaggerContainer, StaggerItem, RevealSection } from "@/components/ui/MotionComponents";
import {
  Search,
  Filter,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Loader2,
  Video,
  FileText,
  Layers,
} from "lucide-react";

export default function CoursesClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Filter states
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [selectedLevel, setSelectedLevel] = useState(searchParams.get("level") || "all");
  const [selectedFormat, setSelectedFormat] = useState(searchParams.get("format") || "all");
  const [selectedPrice, setSelectedPrice] = useState(searchParams.get("price") || "");
  const [selectedSort, setSelectedSort] = useState(searchParams.get("sort") || "popular");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Load categories
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCategories(data.categories || []);
      })
      .catch((err) => console.error("Error loading categories:", err));
  }, []);

  // Fetch courses with filters
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (selectedCategory !== "all") params.set("category", selectedCategory);
        if (selectedLevel !== "all") params.set("level", selectedLevel);
        if (selectedFormat !== "all") params.set("format", selectedFormat);
        if (selectedPrice) params.set("price", selectedPrice);
        if (selectedSort) params.set("sort", selectedSort);
        params.set("page", page.toString());
        params.set("limit", "9");

        const res = await fetch(`/api/courses?${params.toString()}`);
        const data = await res.json();

        if (data.success) {
          setCourses(data.courses || []);
          setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
        }
      } catch (err) {
        console.error("Error fetching courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [search, selectedCategory, selectedLevel, selectedFormat, selectedPrice, selectedSort, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedLevel("all");
    setSelectedFormat("all");
    setSelectedPrice("");
    setSelectedSort("popular");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* 1. Developer Catalog Header */}
      <div className="bg-white border-b border-[#E2E8F0] py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-xl">
              <span className="text-[11px] uppercase font-bold tracking-wider text-[#2563EB]">
                Course Catalog
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight mt-1">
                Engineering Masterclasses & Curriculums
              </h1>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 leading-relaxed">
                Practical, production-grade courses designed by senior software engineers. Master modern frameworks, cloud systems, and distributed architectures.
              </p>
            </div>

            {/* Quick Keyword Search in Header */}
            <form onSubmit={handleSearchSubmit} className="w-full md:w-80 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search courses (e.g. Next.js, Docker)..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#111827] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </form>
          </div>

          {/* Category Filter Pills */}
          <div className="pt-2 flex flex-wrap items-center gap-1.5 border-t border-[#E2E8F0]/60">
            <button
              onClick={() => {
                setSelectedCategory("all");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#111827] hover:border-slate-300"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => {
                  setSelectedCategory(cat.slug || cat.name);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedCategory === (cat.slug || cat.name)
                    ? "bg-[#2563EB] text-white shadow-xs"
                    : "bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#111827] hover:border-slate-300"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-5 rounded-xl border border-[#E2E8F0] bg-white shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#111827] flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#2563EB]" />
                Filter Catalog
              </span>
              <button
                onClick={handleResetFilters}
                className="text-xs text-[#2563EB] hover:underline font-semibold cursor-pointer"
              >
                Reset All
              </button>
            </div>

            {/* Level Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#111827] block">Skill Level</label>
              {["all", "Beginner", "Intermediate", "Advanced"].map((lvl) => (
                <label
                  key={lvl}
                  className="flex items-center gap-2 text-xs text-[#64748B] hover:text-[#111827] cursor-pointer"
                >
                  <input
                    type="radio"
                    name="levelFilter"
                    checked={selectedLevel === lvl}
                    onChange={() => {
                      setSelectedLevel(lvl);
                      setPage(1);
                    }}
                    className="accent-[#2563EB]"
                  />
                  <span>{lvl === "all" ? "All Skill Levels" : lvl}</span>
                </label>
              ))}
            </div>

            {/* Format Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#111827] block">Learning Format</label>
              {[
                { id: "all", label: "All Formats" },
                { id: "video", label: "Video Masterclasses" },
                { id: "article", label: "Interactive Articles & Notes" },
                { id: "mixed", label: "Mixed Media Tracks" },
              ].map((fmt) => (
                <label
                  key={fmt.id}
                  className="flex items-center gap-2 text-xs text-[#64748B] hover:text-[#111827] cursor-pointer"
                >
                  <input
                    type="radio"
                    name="formatFilter"
                    checked={selectedFormat === fmt.id}
                    onChange={() => {
                      setSelectedFormat(fmt.id);
                      setPage(1);
                    }}
                    className="accent-[#2563EB]"
                  />
                  <span>{fmt.label}</span>
                </label>
              ))}
            </div>

            {/* Pricing Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#111827] block">Pricing</label>
              {[
                { id: "", label: "All Courses" },
                { id: "free", label: "Free Curriculums Only" },
                { id: "paid", label: "Paid Masterclasses" },
              ].map((pr) => (
                <label
                  key={pr.id}
                  className="flex items-center gap-2 text-xs text-[#64748B] hover:text-[#111827] cursor-pointer"
                >
                  <input
                    type="radio"
                    name="priceFilter"
                    checked={selectedPrice === pr.id}
                    onChange={() => {
                      setSelectedPrice(pr.id);
                      setPage(1);
                    }}
                    className="accent-[#2563EB]"
                  />
                  <span>{pr.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Main Catalog View */}
        <div className="lg:col-span-3 space-y-6">
          {/* Top Sort & Count Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
            <span className="text-xs text-[#64748B]">
              Showing <strong className="text-[#111827]">{pagination.total}</strong> published courses
            </span>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#64748B]">Sort by:</span>
              <select
                value={selectedSort}
                onChange={(e) => {
                  setSelectedSort(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#111827] focus:outline-none focus:border-[#2563EB]"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Recently Published</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Grid or Empty */}
          {loading ? (
            <div className="py-24 text-center text-[#64748B]">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-2" />
              <p className="text-xs">Loading course catalog...</p>
            </div>
          ) : courses.length > 0 ? (
            <>
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <StaggerItem key={course._id}>
                    <CourseCard course={course} />
                  </StaggerItem>
                ))}
              </StaggerContainer>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-2 rounded-lg border border-[#E2E8F0] bg-white text-[#111827] disabled:opacity-40 cursor-pointer shadow-2xs hover:bg-slate-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-medium text-[#64748B]">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    className="p-2 rounded-lg border border-[#E2E8F0] bg-white text-[#111827] disabled:opacity-40 cursor-pointer shadow-2xs hover:bg-slate-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center bg-white rounded-xl border border-[#E2E8F0] p-8 space-y-3">
              <BookOpen className="w-10 h-10 text-[#94A3B8] mx-auto" />
              <h3 className="text-base font-bold text-[#111827]">No Courses Found</h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                No published courses matched your search or filters. Try adjusting your query or resetting all filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-2 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
