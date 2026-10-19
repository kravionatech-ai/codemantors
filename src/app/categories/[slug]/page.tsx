import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Category, Course } from "@/models";
import { resolvePageSeo } from "@/lib/seo";
import CourseCard from "@/components/ui/CourseCard";
import {
  Tag,
  BookOpen,
  ArrowRight,
  Layers,
  ChevronRight,
  Home,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;

  try {
    await connectDB();
    const category = await Category.findOne({ slug }).lean();

    if (!category) {
      return {
        title: "Category Not Found | CodeMentors",
        description: "The requested course category could not be found.",
        robots: { index: false, follow: false },
      };
    }

    const defaultTitle = `${category.name} Courses — Tutorials & Certifications | CodeMentors`;
    const defaultDesc =
      category.description ||
      category.shortDescription ||
      `Master ${category.name} with structured courses, hands-on lessons, and accredited certificates on CodeMentors.`;

    return await resolvePageSeo(`/categories/${slug}`, {
      title: category.seo?.title || defaultTitle,
      description: category.seo?.description || defaultDesc,
      ogImage: category.seo?.ogImage || category.bannerImage || category.thumbnail || "",
      canonicalPath: category.seo?.canonicalUrl || `/categories/${slug}`,
      noIndex: Boolean(category.seo?.noIndex),
    });
  } catch (err) {
    console.error("Error generating category metadata:", err);
    return {
      title: "Course Categories | CodeMentors",
      description: "Explore programming and engineering categories on CodeMentors.",
    };
  }
}

export default async function CategoryPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;

  await connectDB();
  const category: any = await Category.findOne({ slug })
    .populate("parentCategory", "name slug")
    .lean();

  if (!category) {
    notFound();
  }

  // Fetch published courses for this category
  const coursesRaw = await Course.find({
    category: { $regex: new RegExp(`^${category.name}$`, "i") },
    status: "published",
  })
    .populate("instructor", "name avatar headline")
    .sort({ enrolledCount: -1, ratingAverage: -1 })
    .lean();

  const courses = JSON.parse(JSON.stringify(coursesRaw));

  // Fetch subcategories
  const subcategoriesRaw = await Category.find({
    parentCategory: category._id,
    status: "active",
  })
    .select("name slug icon description")
    .lean();

  const subcategories = JSON.parse(JSON.stringify(subcategoriesRaw));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.seo?.title || `${category.name} Courses | CodeMentors`,
    description: category.seo?.description || category.description,
    url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005"}/categories/${category.slug}`,
    hasPart: courses.map((c: any, idx: number) => ({
      "@type": "Course",
      position: idx + 1,
      name: c.title,
      description: c.subtitle || c.description?.slice(0, 150),
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005"}/courses/${c.slug}`,
      provider: {
        "@type": "Organization",
        name: "CodeMentors",
      },
    })),
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Schema.org CollectionPage Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header Banner */}
      <section className="bg-gradient-to-b from-[#172554] via-[#1E293B] to-[#0F172A] text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <Link href="/courses" className="hover:text-white transition-colors">
              Courses
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            {category.parentCategory && (
              <>
                <Link
                  href={`/categories/${category.parentCategory.slug}`}
                  className="hover:text-white transition-colors"
                >
                  {category.parentCategory.name}
                </Link>
                <ChevronRight className="w-3 h-3 text-slate-600" />
              </>
            )}
            <span className="text-blue-400 font-semibold">{category.name}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-semibold">
                <Tag className="w-3.5 h-3.5" />
                <span>Domain Category</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                {category.name}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {category.detailedDescription ||
                  category.description ||
                  `Master ${category.name} with production-ready curriculum, video lessons, and accredited certificates.`}
              </p>
            </div>

            <div className="flex items-center gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shrink-0">
              <div className="text-center px-3 border-r border-slate-800">
                <div className="text-2xl font-black text-white">{courses.length}</div>
                <div className="text-[11px] text-slate-400 font-medium">Courses</div>
              </div>
              <div className="text-center px-3">
                <div className="text-2xl font-black text-emerald-400">Verified</div>
                <div className="text-[11px] text-slate-400 font-medium">Curriculum</div>
              </div>
            </div>
          </div>

          {/* Subcategories Pills */}
          {subcategories.length > 0 && (
            <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-semibold">Subcategories:</span>
              {subcategories.map((sub: any) => (
                <Link
                  key={sub.slug}
                  href={`/categories/${sub.slug}`}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Courses Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#2563EB]" />
            <span>Available {category.name} Masterclasses</span>
          </h2>
          <span className="text-xs text-[#64748B]">Showing {courses.length} published courses</span>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto">
              <Tag className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[#0F172A] text-base">New Courses Launching Soon</h3>
            <p className="text-xs text-[#64748B]">
              Our engineering curriculum committee is currently curating practical masterclasses for{" "}
              {category.name}.
            </p>
            <div className="pt-2">
              <Link
                href="/courses"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <span>Explore All Courses</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course: any) => (
              <CourseCard key={course._id || course.slug} course={course} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
