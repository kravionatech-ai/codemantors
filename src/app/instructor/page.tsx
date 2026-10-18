"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import {
  GraduationCap,
  BookOpen,
  Users,
  DollarSign,
  Star,
  Plus,
  Edit,
  Eye,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export default function InstructorDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [stats, setStats] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [recentEnrollments, setRecentEnrollments] = useState<any[]>([]);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Course Modal Form
  const [newCourseOpen, setNewCourseOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Web Development");
  const [level, setLevel] = useState("Intermediate");
  const [price, setPrice] = useState("1999");
  const [isFree, setIsFree] = useState(false);
  const [thumbnail, setThumbnail] = useState("");
  const [creatingCourse, setCreatingCourse] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "instructor" && user.role !== "admin"))) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const fetchInstructorStats = async () => {
    try {
      const res = await fetch("/api/instructor/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setCourses(data.courses || []);
        setRecentEnrollments(data.recentEnrollments || []);
        setRecentReviews(data.recentReviews || []);
      }
    } catch (err) {
      console.error("Instructor stats fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === "instructor" || user.role === "admin")) {
      fetchInstructorStats();
    }
  }, [user]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Please provide title and description");
      return;
    }

    setCreatingCourse(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle,
          description,
          category,
          level,
          price: isFree ? 0 : Number(price),
          isFree,
          thumbnail: thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop",
        }),
      });

      const data = await res.json();
      if (data.success && data.course) {
        toast.success("Course draft created! Add modules and lessons next.");
        setNewCourseOpen(false);
        setTitle("");
        setSubtitle("");
        setDescription("");
        fetchInstructorStats();
      } else {
        toast.error(data.error || "Failed to create course");
      }
    } catch {
      toast.error("Error creating course");
    } finally {
      setCreatingCourse(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400">
        <div className="w-10 h-10 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs">Loading Instructor Studio...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-violet-950/20 to-slate-900 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold text-xl border border-violet-500/30">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">Instructor Studio</h1>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
                Author Portal
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Author courses, manage mixed video & text curriculums, and review student progress.
            </p>
          </div>
        </div>

        <button
          onClick={() => setNewCourseOpen(true)}
          className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-500/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New Course
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40">
          <span className="text-[11px] font-semibold uppercase text-slate-400 block">Total Students</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-white">{stats?.totalStudents || 0}</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40">
          <span className="text-[11px] font-semibold uppercase text-slate-400 block">Authored Courses</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-violet-400">{stats?.totalCourses || 0}</span>
            <BookOpen className="w-4 h-4 text-violet-400" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40">
          <span className="text-[11px] font-semibold uppercase text-slate-400 block">Gross Revenue</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-emerald-400">₹{(stats?.totalRevenue || 0).toLocaleString("en-IN")}</span>
            <span className="text-xs text-slate-500">INR</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40">
          <span className="text-[11px] font-semibold uppercase text-slate-400 block">Average Rating</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-amber-400">{stats?.averageRating || "5.0"}</span>
            <Star className="w-4 h-4 text-amber-400 fill-current" />
          </div>
        </div>
      </div>

      {/* Authored Courses Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Your Managed Courses</h3>

        {courses.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">
            You haven't authored any courses yet. Click "Create New Course" to get started!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="pb-3">Course</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Enrolled</th>
                  <th className="pb-3">Rating</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {courses.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-3.5 pr-4 flex items-center gap-3">
                      <img
                        src={c.thumbnail}
                        alt={c.title}
                        className="w-12 h-8 rounded-lg object-cover bg-slate-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-semibold text-white block truncate max-w-xs">{c.title}</span>
                        <span className="text-[10px] text-slate-500">{c.category} • {c.level}</span>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c.status === "published"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : c.status === "pending_review"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 font-semibold text-slate-300">{c.enrolledCount || 0}</td>
                    <td className="py-3.5 text-amber-400 font-semibold flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {c.ratingAverage?.toFixed(1) || "5.0"}
                    </td>
                    <td className="py-3.5 font-mono text-slate-200">
                      {c.isFree ? "Free" : `₹${c.price.toLocaleString("en-IN")}`}
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/courses/${c.slug}`}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="Preview public course page"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create New Course Modal */}
      <Modal isOpen={newCourseOpen} onClose={() => setNewCourseOpen(false)} title="Create New Course Draft">
        <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-300 block mb-1">Course Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Systems in Go & gRPC"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1">Subtitle / Short Hook</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="A concise description of the practical skills built"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-violet-500"
              >
                <option value="Web Development">Web Development</option>
                <option value="Next.js & React">Next.js & React</option>
                <option value="JavaScript & TypeScript">JavaScript & TypeScript</option>
                <option value="Backend & Node.js">Backend & Node.js</option>
                <option value="Python & AI">Python & AI</option>
                <option value="DevOps & Cloud">DevOps & Cloud</option>
                <option value="Databases & System Design">Databases & System Design</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Target Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-violet-500"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="All Levels">All Levels</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Price (INR)</label>
              <input
                type="number"
                disabled={isFree}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-violet-500 disabled:opacity-40"
              />
            </div>

            <div className="pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => setIsFree(e.target.checked)}
                  className="accent-violet-500"
                />
                <span className="font-semibold text-slate-300">Free Course</span>
              </label>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1">Full Curriculum Description</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline what learners will build, the mental models taught, and real-world architectures covered..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={creatingCourse}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50"
          >
            {creatingCourse ? "Creating Draft..." : "Save Draft Course"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
