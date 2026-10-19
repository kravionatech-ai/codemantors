import React from "react";
import Link from "next/link";
import { Code2, Award, Terminal, ArrowRight } from "lucide-react";

import { Metadata } from "next";
import { resolvePageSeo } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return await resolvePageSeo("/about", {
    title: "About Us | CodeMentors — Developer Education & Standards",
    description: "Learn about the mission, values, and engineering standards behind CodeMentors.",
    canonicalPath: "/about",
  });
}

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16 bg-[#F8FAFC] text-[#0F172A]">
      {/* Hero */}
      <div className="text-center space-y-3">
        <span className="text-xs uppercase font-bold tracking-wider text-[#2563EB]">
          Our Mission
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#172554] tracking-tight">
          Empowering the Next Generation of Software Architects
        </h1>
        <p className="text-sm sm:text-base text-[#64748B] max-w-2xl mx-auto leading-relaxed">
          CodeMentors was founded on a simple premise: technical education should reflect how real software is actually engineered in production.
        </p>
      </div>

      {/* Philosophy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border border-[#E2E8F0] bg-white space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
            <Terminal className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A]">Production Over Toys</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            We don't teach isolated hello-world examples. Our curriculums explore edge cases, distributed concurrency, data mutations, and deployment.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-[#E2E8F0] bg-white space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-[#172554] flex items-center justify-center">
            <Code2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A]">Mixed-Modality Learning</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Engineers learn differently. We provide deep visual architecture walkthroughs along with rich, copyable, syntax-highlighted written articles.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-[#E2E8F0] bg-white space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A]">Verifiable Standards</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Certificates are only earned by completing real coding challenges and passing conceptual evaluations backed by server-side verification.
          </p>
        </div>
      </div>

      {/* Story / Values */}
      <div className="p-8 rounded-xl border border-[#E2E8F0] bg-white shadow-xs space-y-4">
        <h2 className="text-xl font-bold text-[#172554]">Our Engineering Principles</h2>
        <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
          The software industry evolves faster than traditional university programs or static bootcamps can track. At CodeMentors, our curriculum is continually revised by working staff engineers and architects who ship systems serving millions of concurrent users.
        </p>
        <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
          From Next.js App Router nuances and TypeScript type-level metaprogramming to vector databases and distributed idempotency, we build courses that transform aspiring developers into reliable technical leads.
        </p>
      </div>

      {/* Technology Provider Attribution */}
      <div className="p-8 rounded-xl border border-[#E2E8F0] bg-white shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="space-y-1">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#06B6D4]">
              Technology & Platform Provider
            </span>
            <h2 className="text-xl font-bold text-[#172554]">
              Powered by Kraviona Tech Solutions
            </h2>
          </div>
          <a
            href="https://kraviona.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-xs font-semibold text-[#0F172A] transition-colors"
          >
            <span>Visit kraviona.com</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#2563EB]" />
          </a>
        </div>
        <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
          Kraviona Tech Solutions is a technology company focused on web development, full-stack application development, backend engineering, technical SEO, web performance, and AI automation.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
            <span className="font-semibold text-[#0F172A] block">Full-Stack Development</span>
            <span className="text-[11px] text-[#64748B]">MERN, React & Next.js</span>
          </div>
          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
            <span className="font-semibold text-[#0F172A] block">Backend Architecture</span>
            <span className="text-[11px] text-[#64748B]">Node.js & Microservices</span>
          </div>
          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
            <span className="font-semibold text-[#0F172A] block">Technical SEO</span>
            <span className="text-[11px] text-[#64748B]">Speed & Crawl Optimization</span>
          </div>
          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
            <span className="font-semibold text-[#0F172A] block">AI Automation</span>
            <span className="text-[11px] text-[#64748B]">Agents & Custom Chatbots</span>
          </div>
        </div>
        <div className="pt-2 text-xs text-[#64748B] flex flex-wrap items-center gap-4">
          <span>Website: <a href="https://kraviona.com/" target="_blank" rel="noopener noreferrer" className="text-[#2563EB] hover:underline font-medium">https://kraviona.com/</a></span>
          <span>•</span>
          <span>Contact: <a href="https://kraviona.com/contact" target="_blank" rel="noopener noreferrer" className="text-[#2563EB] hover:underline font-medium">kraviona.com/contact</a></span>
          <span>•</span>
          <span>Phone: <a href="tel:+919608553167" className="text-[#2563EB] hover:underline font-medium">+91 96085 53167</a></span>
        </div>
      </div>

      {/* CTA Box */}
      <div className="rounded-xl bg-[#172554] text-white p-8 text-center space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold">Start Your Software Journey Today</h2>
        <p className="text-xs sm:text-sm text-[#94A3B8] max-w-md mx-auto">
          Explore our foundational courses and advanced tracks to build software skills that stand the test of production.
        </p>
        <div className="pt-2">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Browse Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
