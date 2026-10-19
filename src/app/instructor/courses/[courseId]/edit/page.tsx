"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import RichTextEditor from "@/components/ui/RichTextEditor";
import {
  ArrowLeft,
  BookOpen,
  Layers,
  Video,
  Save,
  FolderTree,
  Eye,
  Loader2,
  CheckCircle2,
  Globe,
  Search,
  FileText,
  Clock,
  Sparkles,
  ShieldAlert,
} from "lucide-react";

export default function EditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [categoriesList, setCategoriesList] = useState<{ _id: string; name: string; slug: string }[]>([]);

  // Core metadata
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<"Video" | "Text" | "PDF/Document" | "Mixed">("Video");
  const [category, setCategory] = useState("Web Development");
  const [subcategory, setSubcategory] = useState("");
  const [level, setLevel] = useState("Intermediate");
  const [language, setLanguage] = useState("English");
  const [status, setStatus] = useState("draft");
  const [price, setPrice] = useState("1999");
  const [discountPrice, setDiscountPrice] = useState("1499");
  const [isFree, setIsFree] = useState(false);
  const [accessDurationDays, setAccessDurationDays] = useState("0");
  const [thumbnail, setThumbnail] = useState("");
  const [previewVideoUrl, setPreviewVideoUrl] = useState("");
  const [requirements, setRequirements] = useState("");
  const [whatYouWillLearn, setWhatYouWillLearn] = useState("");
  const [targetAudience, setTargetAudience] = useState("");

  // Independent SEO state
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [seoOgImage, setSeoOgImage] = useState("");
  const [seoCanonicalUrl, setSeoCanonicalUrl] = useState("");
  const [seoNoIndex, setSeoNoIndex] = useState(false);
  const [seoNoFollow, setSeoNoFollow] = useState(false);
  const [canEditSeo, setCanEditSeo] = useState(true);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "instructor" && user.role !== "admin" && user.role !== "super_admin"))) {
      router.push("/student/dashboard");
    }
  }, [user, authLoading, router]);

  // Load instructor quota limits
  useEffect(() => {
    fetch("/api/instructor/limits")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.usage) {
          setCanEditSeo(data.usage.canEditSeo !== false);
        }
      })
      .catch((err) => console.error("Error loading limits:", err));
  }, []);

  // Load available categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (data.success && Array.isArray(data.categories)) {
          setCategoriesList(data.categories);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/courses/${courseId}`);
        const data = await res.json();
        if (data.success && data.course) {
          const c = data.course;
          setCourse(c);
          setTitle(c.title || "");
          setSlug(c.slug || "");
          setSubtitle(c.subtitle || "");
          setDescription(c.description || "");
          setFormat(c.format || "Video");
          setCategory(c.category || "Web Development");
          setSubcategory(c.subcategory || "");
          setLevel(c.level || "Intermediate");
          setLanguage(c.language || "English");
          setStatus(c.status || "draft");
          setPrice(String(c.price || 0));
          setDiscountPrice(c.discountPrice ? String(c.discountPrice) : "");
          setIsFree(Boolean(c.isFree));
          setAccessDurationDays(String(c.accessDurationDays || 0));
          setThumbnail(c.thumbnail || "");
          setPreviewVideoUrl(c.previewVideoUrl || "");
          setRequirements((c.requirements || []).join("\n"));
          setWhatYouWillLearn((c.whatYouWillLearn || []).join("\n"));
          setTargetAudience((c.targetAudience || []).join("\n"));

          // Independent SEO
          if (c.seo) {
            setSeoTitle(c.seo.title || "");
            setSeoDescription(c.seo.description || "");
            setSeoKeywords((c.seo.keywords || []).join(", "));
            setSeoOgImage(c.seo.ogImage || "");
            setSeoCanonicalUrl(c.seo.canonicalUrl || "");
            setSeoNoIndex(Boolean(c.seo.noIndex));
            setSeoNoFollow(Boolean(c.seo.noFollow));
          }
        } else {
          toast.error(data.error || "Course not found");
          router.push("/instructor/courses");
        }
      } catch (err) {
        console.error("Error fetching course:", err);
        toast.error("Failed to load course details");
      } finally {
        setLoading(false);
      }
    }
    if (courseId) fetchCourse();
  }, [courseId, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Please provide a title and description");
      return;
    }

    setSaving(true);
    try {
      const parsedKeywords = seoKeywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          subtitle: subtitle.trim(),
          description: description.trim(),
          format,
          category,
          subcategory: subcategory.trim(),
          level,
          language,
          status,
          price: isFree ? 0 : Number(price || 0),
          discountPrice: isFree || !discountPrice ? undefined : Number(discountPrice),
          isFree,
          accessDurationDays: Number(accessDurationDays || 0),
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
          seo: {
            title: seoTitle.trim() || `${title.trim()} | CodeMentors`,
            description: seoDescription.trim() || subtitle.trim() || description.trim().slice(0, 160),
            keywords: parsedKeywords.length > 0 ? parsedKeywords : [title.trim(), category],
            ogImage: seoOgImage.trim() || thumbnail.trim(),
            canonicalUrl: seoCanonicalUrl.trim() || `/courses/${slug.trim()}`,
            noIndex: seoNoIndex,
            noFollow: seoNoFollow,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Course details & SEO saved successfully!");
        setCourse(data.course);
      } else {
        toast.error(data.error || "Failed to update course");
      }
    } catch {
      toast.error("Failed to save course changes");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="py-20 text-center text-[#64748B]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-3" />
        <p className="text-sm">Loading course details...</p>
      </div>
    );
  }

  // Google SERP Preview Calculation
  const displaySerpTitle = seoTitle.trim() || `${title.trim()} | CodeMentors`;
  const displaySerpDesc = seoDescription.trim() || subtitle.trim() || description.trim().slice(0, 155) || "Explore this course on CodeMentors.";
  const displaySerpUrl = `https://codementors.com${seoCanonicalUrl.trim() || `/courses/${slug.trim() || "course-slug"}`}`;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <Link
            href="/instructor/courses"
            className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-[#64748B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-[#172554] tracking-tight">Edit Course Settings</h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Update metadata, format, independent SEO controls, publication status, and pricing rules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href={`/instructor/courses/${courseId}/curriculum`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-[#2563EB] border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition-colors"
          >
            <FolderTree className="w-3.5 h-3.5" />
            Curriculum Builder
          </Link>
          <Link
            href={`/courses/${course?.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] hover:bg-slate-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </Link>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 shadow-xs">
        {/* 1. Core Information */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#172554] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#2563EB]" />
            1. Core Details & Format
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
              className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Canonical URL Slug <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg font-mono text-[#0F172A] focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Course Format <span className="text-[#DC2626]">*</span>
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg font-semibold text-[#172554] focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
              >
                <option value="Video">Video Course</option>
                <option value="Text">Text / Article Course</option>
                <option value="PDF/Document">PDF / Document Course</option>
                <option value="Mixed">Mixed Media Course</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Publication Status <span className="text-[#DC2626]">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg font-semibold text-[#172554] focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
              >
                <option value="draft">Draft (Work in progress)</option>
                <option value="pending_review">Pending Review (Submit for approval)</option>
                <option value="published">Published (Active on catalog)</option>
                <option value="unpublished">Unpublished (Temporarily hidden)</option>
                <option value="archived">Archived (Hidden from new students)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Subtitle
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
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

        {/* 2. Classification & Pricing */}
        <div className="pt-6 border-t border-[#E2E8F0] space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#172554] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#2563EB]" />
            2. Classification, Quotas & Pricing
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
              >
                {categoriesList.length > 0 ? (
                  categoriesList.map((cat) => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Web Development">Web Development</option>
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="Full Stack">Full Stack</option>
                    <option value="Databases">Databases</option>
                    <option value="DevOps & Cloud">DevOps & Cloud</option>
                    <option value="Mobile Development">Mobile Development</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Subcategory
              </label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="e.g. Next.js 15, FastAPI"
                className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
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
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => setIsFree(e.target.checked)}
                  className="w-4 h-4 text-[#2563EB] rounded border-[#E2E8F0]"
                />
                <span>This is a Free course</span>
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                Access Duration (Days, 0 = Lifetime Access)
              </label>
              <input
                type="number"
                min="0"
                value={accessDurationDays}
                onChange={(e) => setAccessDurationDays(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
              />
            </div>
          </div>

          {!isFree && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  List Price (₹ INR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Discount Price (₹ INR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. Media Assets */}
        <div className="pt-6 border-t border-[#E2E8F0] space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#172554] flex items-center gap-2">
            <Video className="w-4 h-4 text-[#2563EB]" />
            3. Media Assets
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Thumbnail URL
              </label>
              <input
                type="url"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Preview Video URL
              </label>
              <input
                type="text"
                value={previewVideoUrl}
                onChange={(e) => setPreviewVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
              />
            </div>
          </div>
        </div>

        {/* 4. Independent SEO Controls */}
        <div className="pt-6 border-t border-[#E2E8F0] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#172554] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#2563EB]" />
              4. Independent Search Engine Optimization (SEO)
            </h2>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
              Page-by-Page SEO Enabled
            </span>
          </div>

          {!canEditSeo && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Your instructor quota tier does not have custom SEO edit privileges. Default platform metadata will be maintained automatically.</span>
            </div>
          )}

          {/* Google SERP Snippet Preview */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-sans">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Google Search Result Snippet Preview
            </span>
            <div className="text-xs text-[#202124] flex items-center gap-1.5 truncate">
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center font-bold">
                C
              </span>
              <span>{displaySerpUrl}</span>
            </div>
            <div className="text-base text-[#1a0dab] font-medium hover:underline cursor-pointer truncate">
              {displaySerpTitle}
            </div>
            <div className="text-xs text-[#4d5156] line-clamp-2">
              {displaySerpDesc}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-[#0F172A]">
                  Custom SEO Title Tag
                </label>
                <span className="text-[10px] text-[#64748B]">
                  {seoTitle.length}/60 chars
                </span>
              </div>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder={title ? `${title} | CodeMentors` : "Enter high-CTR SEO title..."}
                className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Canonical URL
              </label>
              <input
                type="text"
                value={seoCanonicalUrl}
                onChange={(e) => setSeoCanonicalUrl(e.target.value)}
                placeholder={`/courses/${slug || "course-slug"}`}
                className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg font-mono text-[#0F172A]"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-[#0F172A]">
                Meta Description Tag
              </label>
              <span className="text-[10px] text-[#64748B]">
                {seoDescription.length}/160 chars
              </span>
            </div>
            <textarea
              rows={3}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Concise, keyword-rich summary for search engine results..."
              className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Focus Keywords (Comma-separated)
              </label>
              <input
                type="text"
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                placeholder="e.g. Next.js 15 course, React tutorial, fullstack web dev"
                className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Social Share Image (OG Image URL)
              </label>
              <input
                type="url"
                value={seoOgImage}
                onChange={(e) => setSeoOgImage(e.target.value)}
                placeholder={thumbnail || "https://..."}
                className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
              <input
                type="checkbox"
                checked={seoNoIndex}
                onChange={(e) => setSeoNoIndex(e.target.checked)}
                className="w-4 h-4 text-[#2563EB] rounded border-[#E2E8F0]"
              />
              <span>noindex (Instruct search engines not to index this page)</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
              <input
                type="checkbox"
                checked={seoNoFollow}
                onChange={(e) => setSeoNoFollow(e.target.checked)}
                className="w-4 h-4 text-[#2563EB] rounded border-[#E2E8F0]"
              />
              <span>nofollow (Instruct search engines not to follow outbound links)</span>
            </label>
          </div>
        </div>

        {/* 5. Course Syllabus Bullet Points */}
        <div className="pt-6 border-t border-[#E2E8F0] space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#172554] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#2563EB]" />
            5. Course Learning Outcomes & Prerequisites
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                What You Will Learn (One per line)
              </label>
              <textarea
                rows={4}
                value={whatYouWillLearn}
                onChange={(e) => setWhatYouWillLearn(e.target.value)}
                placeholder="Build production Next.js apps&#10;Master server actions&#10;Implement Razorpay payments"
                className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Course Requirements (One per line)
              </label>
              <textarea
                rows={4}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Basic JavaScript knowledge&#10;A computer with Node.js installed"
                className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#E2E8F0] flex items-center justify-between">
          <Link
            href="/instructor/courses"
            className="px-4 py-2 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#64748B] hover:bg-slate-50"
          >
            Back to Courses
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Course & SEO Settings
          </button>
        </div>
      </form>
    </div>
  );
}
