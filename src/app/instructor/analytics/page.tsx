"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  BarChart3,
  ArrowLeft,
  Loader2,
  Users,
  BookOpen,
  Star,
  DollarSign,
  Download,
  Calendar,
  Award,
  TrendingUp,
  FileCheck,
  RefreshCcw,
  AlertTriangle,
} from "lucide-react";

export default function InstructorAnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [range, setRange] = useState<"7d" | "30d" | "90d" | "1y" | "all">("30d");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "instructor" && user.role !== "admin" && user.role !== "super_admin"))) {
      router.push("/student/dashboard");
    }
  }, [user, authLoading, router]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/instructor/analytics?range=${range}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        toast.error(json.error || "Failed to load studio analytics");
      }
    } catch (err) {
      console.error("Error loading analytics:", err);
      toast.error("Network error loading analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, range]);

  const handleExportCsv = () => {
    window.open("/api/instructor/analytics/export", "_blank");
    toast.success("Analytics CSV report export started");
  };

  if (authLoading) {
    return (
      <div className="py-24 text-center text-[#64748B] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB]" />
        <p className="text-sm font-medium">Authenticating Instructor Session...</p>
      </div>
    );
  }

  const summary = data?.summary || {};
  const timeSeries: any[] = data?.timeSeries || [];
  const courseMatrix: any[] = data?.courseMatrix || [];
  const quizMetrics = data?.quizMetrics || {};
  const refundSummary = data?.refundSummary || {};

  // Maximum value for SVG chart scaling
  const maxEnrollmentPoint = Math.max(1, ...timeSeries.map((t) => t.enrollments));

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
            <h1 className="text-2xl font-black text-[#172554] tracking-tight">Course Analytics & Outcome Metrics</h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Verified enrollment trajectories, completion rates, and quiz performance metrics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Date Range Selector */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
            {(["7d", "30d", "90d", "1y", "all"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  range === r
                    ? "bg-white text-[#172554] shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {r === "7d"
                  ? "7D"
                  : r === "30d"
                  ? "30D"
                  : r === "90d"
                  ? "90D"
                  : r === "1y"
                  ? "1Y"
                  : "All"}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-[#64748B] space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB]" />
          <p className="text-sm">Calculating performance metrics for {range.toUpperCase()} window...</p>
        </div>
      ) : (
        <>
          {/* KPI Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* Window Enrollments */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-semibold">Window Enrollments</span>
                <Users className="w-4 h-4 text-[#06B6D4]" />
              </div>
              <div className="text-2xl font-black text-[#172554]">{summary.rangeEnrollments || 0}</div>
              <div className="text-[10px] text-slate-500 pt-0.5">
                {summary.totalEnrollments || 0} all-time
              </div>
            </div>

            {/* Course Revenue */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-semibold">Window Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600">
                ₹{(summary.rangeRevenue || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 pt-0.5">
                ₹{(summary.totalRevenue || 0).toLocaleString()} all-time
              </div>
            </div>

            {/* Completion Rate */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-semibold">Completion Rate</span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-[#172554]">{summary.overallCompletionRate || 0}%</div>
              <div className="text-[10px] text-slate-500 pt-0.5">Verified completions</div>
            </div>

            {/* Average Rating */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-semibold">Average Rating</span>
                <Star className="w-4 h-4 text-amber-500 fill-current" />
              </div>
              <div className="text-2xl font-black text-[#172554]">{summary.averageRating || "5.0"}</div>
              <div className="text-[10px] text-slate-500 pt-0.5">Out of 5.0 stars</div>
            </div>

            {/* Quiz Pass Rate */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-semibold">Quiz Pass Rate</span>
                <FileCheck className="w-4 h-4 text-[#2563EB]" />
              </div>
              <div className="text-2xl font-black text-[#2563EB]">{quizMetrics.passRate || 0}%</div>
              <div className="text-[10px] text-slate-500 pt-0.5">
                {quizMetrics.totalAttempts || 0} total attempts
              </div>
            </div>

            {/* Refunds */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-semibold">Refunds</span>
                <RefreshCcw className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-600">
                ₹{(refundSummary.amount || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 pt-0.5">
                {refundSummary.count || 0} refund claims
              </div>
            </div>
          </div>

          {/* Time Series Visual Chart */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#2563EB]" />
                <h2 className="text-sm font-bold text-[#172554]">
                  Enrollment Trajectory & Velocity ({range.toUpperCase()})
                </h2>
              </div>
              <span className="text-xs text-slate-500">Daily student signups</span>
            </div>

            {timeSeries.length === 0 ? (
              <p className="text-xs text-slate-500 py-10 text-center">No trend data for this window.</p>
            ) : (
              <div className="space-y-2">
                <div className="h-44 flex items-end gap-1 sm:gap-2 pt-6 px-2">
                  {timeSeries.map((pt, i) => {
                    const heightPercent = Math.max(8, Math.round((pt.enrollments / maxEnrollmentPoint) * 100));

                    return (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center justify-end h-full group relative"
                      >
                        {/* Hover Tooltip */}
                        <div className="absolute -top-9 hidden group-hover:flex flex-col items-center z-10">
                          <div className="bg-[#172554] text-white text-[10px] py-1 px-2 rounded font-bold whitespace-nowrap shadow-md">
                            {pt.date}: {pt.enrollments} enrollments (₹{pt.revenue.toLocaleString()})
                          </div>
                          <div className="w-1.5 h-1.5 bg-[#172554] rotate-45 -mt-0.5" />
                        </div>

                        {/* Bar */}
                        <div
                          className="w-full bg-[#2563EB] hover:bg-blue-700 rounded-t transition-all cursor-pointer"
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Date Axis preview */}
                <div className="flex justify-between text-[10px] text-slate-400 px-2 pt-1 border-t border-slate-100">
                  <span>{timeSeries[0]?.date}</span>
                  <span>{timeSeries[Math.floor(timeSeries.length / 2)]?.date}</span>
                  <span>{timeSeries[timeSeries.length - 1]?.date}</span>
                </div>
              </div>
            )}
          </div>

          {/* Course Performance Matrix */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#172554]" />
                <h2 className="text-sm font-bold text-[#172554]">Course Performance Matrix</h2>
              </div>
              <span className="text-xs text-slate-500">Comprehensive course telemetry breakdown</span>
            </div>

            {courseMatrix.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No authored courses recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[#64748B] font-semibold">
                      <th className="py-2.5 px-3">Course Title</th>
                      <th className="py-2.5 px-3">Format</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Total Learners</th>
                      <th className="py-2.5 px-3">Window Learners</th>
                      <th className="py-2.5 px-3">Completion %</th>
                      <th className="py-2.5 px-3">Rating</th>
                      <th className="py-2.5 px-3">Gross Revenue</th>
                      <th className="py-2.5 px-3">Quiz Pass %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {courseMatrix.map((c) => (
                      <tr key={c._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#0F172A]">{c.title}</div>
                          <div className="text-[10px] text-slate-500">{c.category} • {c.level}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-700">{c.format}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.status === "published"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">{c.totalEnrollments}</td>
                        <td className="py-3 px-3 font-semibold text-[#2563EB]">{c.rangeEnrollments}</td>
                        <td className="py-3 px-3 font-bold text-slate-700">{c.completionRate}%</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-500 fill-current" />
                            <span className="font-bold text-slate-800">{c.ratingAverage}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-emerald-700">
                          ₹{c.revenue.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-700">{c.quizPassRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
