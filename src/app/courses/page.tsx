"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CourseCard from "@/components/ui/CourseCard";
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
} from "lucide-react";

function CoursesContent() {
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
      .catch(() => {});
  }, []);

  // Fetch courses with active filters
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
      if (selectedLevel && selectedLevel !== "all") params.set("level", selectedLevel);
      if (selectedPrice) params.set("price", selectedPrice);
      if (selectedSort) params.set("sort", selectedSort);
      params.set("page", page.toString());
      params.set("limit", "9");

      // Update browser URL
      router.replace(`/courses?${params.toString()}`, { scroll: false });

      const res = await fetch(`/api/courses?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCourses(data.courses || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      }
    } catch (err) {
      console.error("Fetch courses error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [selectedCategory, selectedLevel, selectedPrice, selectedSort, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCourses();
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedLevel("all");
    setSelectedPrice("");
    setSelectedSort("popular");
    setPage(1);
  };

  const levels = ["All Levels", "Beginner", "Intermediate", "Advanced"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Banner */}
      <div className="mb-10">
        <span className="text-xs uppercase font-bold tracking-wider text-blue-400">
          Course Catalog
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
          Explore Production Engineering Courses
        </h1>
        <p className="text-sm text-slate-400 mt-2 max-w-2xl">
          Structured video lessons, deep-dive technical articles, and hands-on coding practice designed to build real developer competence.
        </p>
      </div>

      {/* Search & Mobile Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses by keyword, instructor, or topic..."
            className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 justify-between sm:justify-end">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-semibold"
          >
            <Filter className="w-4 h-4 text-blue-400" />
            Filters
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 hidden sm:inline">Sort:</span>
            <select
              value={selectedSort}
              onChange={(e) => {
                setSelectedSort(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="popular">Most Popular</option>
              <option value="newest">Newest Releases</option>
              <option value="highest_rated">Highest Rated</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Filters Sidebar + Course Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filter Sidebar (Desktop) */}
        <aside className={`lg:block ${mobileFilterOpen ? "block" : "hidden"} space-y-6`}>
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                Filter Courses
              </h3>
              <button
                onClick={handleResetFilters}
                className="text-xs text-slate-400 hover:text-blue-400 transition-colors"
              >
                Reset All
              </button>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">Category</span>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                <label className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === "all"}
                    onChange={() => {
                      setSelectedCategory("all");
                      setPage(1);
                    }}
                    className="accent-blue-500"
                  />
                  <span>All Categories</span>
                </label>
                {categories.map((cat) => (
                  <label
                    key={cat.slug}
                    className="flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 cursor-pointer py-0.5"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory.toLowerCase() === cat.name.toLowerCase()}
                        onChange={() => {
                          setSelectedCategory(cat.name);
                          setPage(1);
                        }}
                        className="accent-blue-500"
                      />
                      <span>{cat.name}</span>
                    </div>
                    {cat.courseCount > 0 && (
                      <span className="text-[10px] text-slate-600 font-mono">
                        {cat.courseCount}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Level Filter */}
            <div className="space-y-2 pt-4 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-slate-300 block">Difficulty Level</span>
              <div className="space-y-1">
                {levels.map((lvl) => (
                  <label
                    key={lvl}
                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="level"
                      checked={
                        lvl === "All Levels" ? selectedLevel === "all" : selectedLevel === lvl
                      }
                      onChange={() => {
                        setSelectedLevel(lvl === "All Levels" ? "all" : lvl);
                        setPage(1);
                      }}
                      className="accent-blue-500"
                    />
                    <span>{lvl}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Pricing Filter */}
            <div className="space-y-2 pt-4 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-slate-300 block">Pricing</span>
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    checked={selectedPrice === ""}
                    onChange={() => {
                      setSelectedPrice("");
                      setPage(1);
                    }}
                    className="accent-blue-500"
                  />
                  <span>All Prices</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    checked={selectedPrice === "free"}
                    onChange={() => {
                      setSelectedPrice("free");
                      setPage(1);
                    }}
                    className="accent-blue-500"
                  />
                  <span>Free Courses Only</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    checked={selectedPrice === "paid"}
                    onChange={() => {
                      setSelectedPrice("paid");
                      setPage(1);
                    }}
                    className="accent-blue-500"
                  />
                  <span>Paid Courses Only</span>
                </label>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Content: Courses Cards Grid */}
        <main className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5 space-y-4 animate-pulse"
                >
                  <div className="aspect-video w-full rounded-xl bg-slate-800" />
                  <div className="h-4 bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-800 rounded w-1/2" />
                  <div className="pt-4 border-t border-slate-800/80 flex justify-between">
                    <div className="h-4 bg-slate-800 rounded w-1/4" />
                    <div className="h-4 bg-slate-800 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="py-20 text-center rounded-2xl border border-slate-800 bg-slate-900/20 p-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">No Courses Found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No published courses matched your search or active filter criteria. Try clearing some filters or searching for another topic.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <CourseCard key={course._id.toString()} course={course} />
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total courses)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-semibold text-slate-200 px-2">{page}</span>
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading courses...</div>}>
      <CoursesContent />
    </Suspense>
  );
}
