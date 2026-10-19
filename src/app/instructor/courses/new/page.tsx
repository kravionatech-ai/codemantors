"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import RichTextEditor from "@/components/ui/RichTextEditor";
import {
  ArrowLeft,
  Sparkles,
  BookOpen,
  DollarSign,
  Layers,
  Video,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function NewCoursePage() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Web Development");
  const [level, setLevel] = useState("Intermediate");
  const [language, setLanguage] = useState("English");
  const [price, setPrice] = useState("1999");
  const [discountPrice, setDiscountPrice] = useState("1499");
  const [isFree, setIsFree] = useState(false);
  const [thumbnail, setThumbnail] = useState(
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80"
  );
  const [previewVideoUrl, setPreviewVideoUrl] = useState("");
  const [requirements, setRequirements] = useState(
    "Basic JavaScript and computer fundamentals."
  );
  const [whatYouWillLearn, setWhatYouWillLearn] = useState(
    "Build full-stack applications with Next.js and Node.js.\nImplement secure authentication and role-based permissions.\nDeploy production-ready code with automated CI/CD."
  );
  const [targetAudience, setTargetAudience] = useState(
    "Aspiring software engineers, frontend developers, and computer science students."
  );

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "instructor" && user.role !== "admin"))) {
      router.push("/student/dashboard");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Please provide a title and detailed description.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim(),
          description: description.trim(),
          category,
          level,
          language,
          price: isFree ? 0 : Number(price || 0),
          discountPrice: isFree || !discountPrice ? undefined : Number(discountPrice),
          isFree,
          thumbnail: thumbnail.trim(),
          previewVideoUrl: previewVideoUrl.trim(),
          requirements: requirements
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          whatYouWillLearn: whatYouWillLearn
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          targetAudience: targetAudience
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          status: "draft",
        }),
      });

      const data = await res.json();
      if (data.success && data.course) {
        toast.success("Course created as draft! You can now build its curriculum modules.");
        router.push(`/instructor/courses/${data.course._id}/curriculum`);
      } else {
        toast.error(data.error || "Failed to create course");
      }
    } catch (err) {
      console.error("Course create error:", err);
      toast.error("An error occurred while creating course");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-[#E2E8F0]">
        <Link
          href="/instructor/courses"
          className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-[#64748B] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#172554] tracking-tight">Create New Course</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Configure essential curriculum metadata before organizing modules and lessons.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 shadow-xs">
        {/* Basic Details */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#172554] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#2563EB]" />
            1. Core Information
          </h2>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Course Title <span className="text-[#DC2626]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mastering Next.js 16 with Enterprise Architecture"
              className="w-full text-xs px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Short Subtitle
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Build production SaaS applications with Server Actions, Turbopack, and Mongoose"
              className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Detailed Description <span className="text-[#DC2626]">*</span>
            </label>
            <RichTextEditor
              value={description}
              onChange={(val) => setDescription(val)}
              placeholder="Comprehensive description of the syllabus, topics covered, real-world projects, and target competencies..."
              minHeight="220px"
              required
            />
          </div>
        </div>

        {/* Classification & Pricing */}
        <div className="pt-6 border-t border-[#E2E8F0] space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#172554] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#2563EB]" />
            2. Classification & Pricing
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Category <span className="text-[#DC2626]">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
              >
                <option value="Web Development">Web Development</option>
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="Full Stack">Full Stack</option>
                <option value="Databases">Databases</option>
                <option value="DevOps & Cloud">DevOps & Cloud</option>
                <option value="Mobile Development">Mobile Development</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Skill Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="All Levels">All Levels</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Bilingual">Bilingual</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
                className="w-4 h-4 text-[#2563EB] rounded border-[#E2E8F0]"
              />
              <span>This is a Free course (No payment required for enrollment)</span>
            </label>
          </div>

          {!isFree && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  List Price (₹ INR) <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 1999"
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Discounted / Selling Price (₹ INR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  placeholder="e.g. 1499"
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Media & Cover */}
        <div className="pt-6 border-t border-[#E2E8F0] space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#172554] flex items-center gap-2">
            <Video className="w-4 h-4 text-[#2563EB]" />
            3. Media & Syllabus Outcomes
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Course Thumbnail URL
              </label>
              <input
                type="url"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Preview Video URL (YouTube / Vimeo / Direct MP4)
              </label>
              <input
                type="text"
                value={previewVideoUrl}
                onChange={(e) => setPreviewVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              What Students Will Learn (One outcome per line)
            </label>
            <textarea
              rows={3}
              value={whatYouWillLearn}
              onChange={(e) => setWhatYouWillLearn(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-[#E2E8F0] flex items-center justify-between">
          <Link
            href="/instructor/courses"
            className="px-4 py-2 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#64748B] hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Create Course & Proceed to Curriculum
          </button>
        </div>
      </form>
    </div>
  );
}
