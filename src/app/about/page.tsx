import React from "react";
import Link from "next/link";
import { Code2, ShieldCheck, Award, Users, Terminal, Sparkles, ArrowRight } from "lucide-react";

export const metadata = {
  title: "About Us",
  description: "Learn about the mission, values, and engineering standards behind CodeMentors.",
};

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Hero */}
      <div className="text-center space-y-4">
        <span className="text-xs uppercase font-bold tracking-wider text-blue-400">
          Our Mission
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          Empowering the Next Generation of Software Architects
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          CodeMentors was founded on a simple premise: technical education should reflect how real software is actually engineered in production.
        </p>
      </div>

      {/* Philosophy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center">
            <Terminal className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Production Over Toys</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            We don't teach isolated hello-world examples. Our curriculums explore edge cases, distributed concurrency, data mutations, and deployment.
          </p>
        </div>

        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center">
            <Code2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Mixed-Modality Learning</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Engineers learn differently. We provide deep visual architecture walkthroughs along with rich, copyable, syntax-highlighted written articles.
          </p>
        </div>

        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Verifiable Standards</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Certificates are only earned by completing real coding challenges and passing conceptual evaluations backed by server-side verification.
          </p>
        </div>
      </div>

      {/* Leadership & Instructors */}
      <div className="space-y-6 pt-8 border-t border-slate-800">
        <h2 className="text-2xl font-bold text-white">Curriculum Directorate</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 flex items-center gap-4">
            <img
              src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=faces"
              alt="Alex Rivers"
              className="w-16 h-16 rounded-2xl object-cover bg-slate-800"
            />
            <div>
              <h4 className="font-bold text-white text-base">Alex Rivers</h4>
              <p className="text-xs text-blue-400 font-medium">Head of Curriculum & Architecture</p>
              <p className="text-xs text-slate-400 mt-1">Ex-Staff Architect with 12+ years building cloud-scale web platforms.</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 flex items-center gap-4">
            <img
              src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=faces"
              alt="Dr. Sarah Chen"
              className="w-16 h-16 rounded-2xl object-cover bg-slate-800"
            />
            <div>
              <h4 className="font-bold text-white text-base">Dr. Sarah Chen</h4>
              <p className="text-xs text-violet-400 font-medium">Principal Systems & AI Fellow</p>
              <p className="text-xs text-slate-400 mt-1">PhD in Distributed Systems. Leads TypeScript & LLM orchestration research.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
