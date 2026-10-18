import React from "react";
import Link from "next/link";
import { Code2, ArrowLeft, Home, BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-mono font-black text-2xl">
        404
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-white">Page Not Found</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          The requested curriculum lesson, course, or page does not exist or may have been relocated.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 transition-all"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
        <Link
          href="/courses"
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-800 transition-all"
        >
          <BookOpen className="w-4 h-4" />
          Browse Courses
        </Link>
      </div>
    </div>
  );
}
