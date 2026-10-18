import React from "react";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import { LearningPath } from "@/models/LearningPath";
import { Compass, CheckCircle2, ArrowRight, Clock, BookOpen, Layers, Cpu } from "lucide-react";

export default async function LearningPathsPage() {
  await connectDB();
  const paths = await LearningPath.find({ isPublished: true })
    .populate("courses", "title slug thumbnail level ratingAverage totalDurationMinutes")
    .lean();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs uppercase font-bold tracking-wider text-blue-400">
          Career Roadmaps
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Curated Learning Paths
        </h1>
        <p className="text-sm text-slate-400">
          Structured, step-by-step course sequences crafted to take you from foundational syntax to senior software architecture.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {paths.map((path: any) => (
          <div
            key={path._id.toString()}
            className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 sm:p-10 shadow-2xl space-y-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {path.level}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Estimated Duration: ~{path.estimatedHours || 50} Hours
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white mt-2">{path.title}</h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                  {path.description}
                </p>
              </div>
            </div>

            {/* Learning Objectives */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Competencies You Will Acquire
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {path.learningObjectives?.map((obj: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Sequence Timeline */}
            <div className="space-y-4 pt-4 border-t border-slate-800/80">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Included Courses in This Roadmap
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {path.courses?.map((course: any, idx: number) => (
                  <Link
                    key={course._id.toString()}
                    href={`/courses/${course.slug}`}
                    className="group p-4 rounded-2xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-2">
                        <span>STEP 0{idx + 1}</span>
                        <span className="text-blue-400 font-semibold">{course.level}</span>
                      </div>
                      <h4 className="font-semibold text-xs text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                        {course.title}
                      </h4>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
                      <span>View Course</span>
                      <ArrowRight className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
