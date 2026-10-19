import React from "react";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import { LearningPath } from "@/models/LearningPath";
import { Compass, CheckCircle2, ArrowRight } from "lucide-react";

export default async function LearningPathsPage() {
  await connectDB();
  const paths = await LearningPath.find({ isPublished: true })
    .populate("courses", "title slug thumbnail level ratingAverage totalDurationMinutes")
    .lean();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10 bg-[#F8FAFC] text-[#0F172A]">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs uppercase font-bold tracking-wider text-[#2563EB]">
          Career Roadmaps
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#172554] tracking-tight">
          Curated Learning Paths
        </h1>
        <p className="text-sm text-[#64748B]">
          Structured, step-by-step course sequences crafted to take you from foundational syntax to senior software architecture.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {paths.map((path: any) => (
          <div
            key={path._id.toString()}
            className="rounded-xl border border-[#E2E8F0] bg-white p-6 sm:p-8 shadow-xs space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2E8F0]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-50 text-[#2563EB] border border-blue-200">
                    {path.level}
                  </span>
                  <span className="text-xs text-[#64748B] font-medium">
                    Estimated Duration: ~{path.estimatedHours || 50} Hours
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] mt-2">{path.title}</h2>
                <p className="text-xs sm:text-sm text-[#64748B] max-w-3xl leading-relaxed">
                  {path.description}
                </p>
              </div>
            </div>

            {/* Learning Objectives */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F172A] block">
                Competencies You Will Acquire
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {path.learningObjectives?.map((obj: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#64748B]">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Sequence Timeline */}
            <div className="space-y-3 pt-4 border-t border-[#E2E8F0]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F172A] block">
                Curriculum Progression
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {path.courses?.map((course: any, idx: number) => (
                  <Link
                    key={course._id.toString()}
                    href={`/courses/${course.slug}`}
                    className="group p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:border-slate-300 hover:bg-slate-50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] mb-2">
                        <span>STEP 0{idx + 1}</span>
                        <span className="text-[#2563EB] font-semibold">{course.level}</span>
                      </div>
                      <h3 className="font-bold text-xs text-[#0F172A] group-hover:text-[#2563EB] transition-colors line-clamp-2">
                        {course.title}
                      </h3>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
                      <span>View Course</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#2563EB] group-hover:translate-x-1 transition-transform" />
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
