import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { CmsPage, Course, SiteSettings } from "@/models";
import CourseCard from "@/components/ui/CourseCard";
import FormattedContentRenderer from "@/components/ui/FormattedContentRenderer";
import {
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Star,
  Sparkles,
  BookOpen,
  Terminal,
  ShieldCheck,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  await connectDB();
  const page = await CmsPage.findOne({ slug: slug.toLowerCase(), status: "published" }).lean();
  const settings = await SiteSettings.findOne({ key: "global_config" }).lean();

  if (!page) {
    return {
      title: "Page Not Found | CodeMentors",
    };
  }

  const title = page.seo?.title || `${page.title} | CodeMentors`;
  const description = page.seo?.description || settings?.seoDefaults?.defaultDescription || "CodeMentors LMS";
  const canonicalUrl = page.seo?.canonicalUrl || `${settings?.seoDefaults?.canonicalDomain || "http://localhost:3005"}/pages/${page.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: !page.seo?.noIndex,
      follow: !page.seo?.noFollow,
    },
    openGraph: {
      title: page.seo?.title || page.title,
      description,
      url: canonicalUrl,
      images: page.seo?.ogImage ? [{ url: page.seo.ogImage }] : undefined,
    },
  };
}

export default async function DynamicCmsPageView({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connectDB();

  const page = await CmsPage.findOne({ slug: slug.toLowerCase() }).lean();
  if (!page || (page.status !== "published" && process.env.NODE_ENV === "production")) {
    notFound();
  }

  // Pre-fetch courses if any section needs course_grid
  let featuredCourses: any[] = [];
  const hasCourseGrid = page.sections?.some((s) => s.type === "course_grid" && s.isVisible);
  if (hasCourseGrid) {
    featuredCourses = await Course.find({ status: "published" })
      .populate("instructor", "name avatar headline")
      .limit(6)
      .lean();
  }

  const sortedSections = [...(page.sections || [])]
    .filter((s) => s.isVisible)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {sortedSections.map((section, idx) => {
        switch (section.type) {
          case "hero":
            return (
              <section key={section.id || idx} className="bg-[#172554] text-white py-16 lg:py-24">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
                  {section.subtitle && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-[#06B6D4] border border-white/10">
                      <Sparkles className="w-3.5 h-3.5" />
                      {section.subtitle}
                    </div>
                  )}
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                    {section.title || page.title}
                  </h1>
                  {section.content && (
                    <p className="text-base sm:text-lg text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
                      {section.content}
                    </p>
                  )}
                  {section.config?.primaryBtnText && (
                    <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                      <Link
                        href={section.config.primaryBtnLink || "/courses"}
                        className="px-6 py-3 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white font-semibold text-sm shadow-md transition-colors inline-flex items-center gap-2"
                      >
                        {section.config.primaryBtnText}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </div>
              </section>
            );

          case "text_block":
            return (
              <section key={section.id || idx} className="py-12 lg:py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 sm:p-12 rounded-xl border border-[#E2E8F0] shadow-xs">
                  {section.title && (
                    <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-4">
                      {section.title}
                    </h2>
                  )}
                  {section.subtitle && (
                    <p className="text-sm font-medium text-[#2563EB] mb-6">{section.subtitle}</p>
                  )}
                  <FormattedContentRenderer content={section.content} className="text-slate-800" />
                </div>
              </section>
            );

          case "course_grid":
            return (
              <section key={section.id || idx} className="py-12 lg:py-16 bg-[#F8FAFC]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                  <div className="text-center max-w-2xl mx-auto space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A]">
                      {section.title || "Featured Courses"}
                    </h2>
                    {section.subtitle && (
                      <p className="text-sm text-[#64748B]">{section.subtitle}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredCourses.map((c: any) => (
                      <CourseCard key={c._id.toString()} course={c} />
                    ))}
                  </div>
                </div>
              </section>
            );

          case "faq":
            const faqItems = section.config?.faqs || [
              {
                q: "What makes CodeMentors different?",
                a: "We focus exclusively on rigorous, production-grade engineering topics with verified certificates, real-world coding challenges, and comprehensive architectural code reviews.",
              },
              {
                q: "Do I get lifetime access to purchased courses?",
                a: "Yes. All purchased masterclasses include unlimited lifetime access, lesson updates, downloadable cheatsheets, and community forums.",
              },
              {
                q: "What is your refund policy?",
                a: "We offer a 30-day money-back guarantee if you have consumed less than 20% of the lessons and have not taken the final graded certification quiz.",
              },
            ];

            return (
              <section key={section.id || idx} className="py-12 lg:py-16 bg-white border-y border-[#E2E8F0]">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A]">
                      {section.title || "Frequently Asked Questions"}
                    </h2>
                    {section.subtitle && (
                      <p className="text-sm text-[#64748B]">{section.subtitle}</p>
                    )}
                  </div>
                  <div className="space-y-4">
                    {faqItems.map((faq: any, fIdx: number) => (
                      <div
                        key={fIdx}
                        className="rounded-xl border border-[#E2E8F0] p-5 bg-[#F8FAFC] space-y-2"
                      >
                        <h4 className="font-bold text-[#0F172A] text-sm sm:text-base flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-[#2563EB] shrink-0" />
                          {faq.q}
                        </h4>
                        <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed pl-6">
                          {faq.a}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );

          case "testimonials":
            const reviews = Array.isArray(section.config?.reviews) ? section.config.reviews : [];

            return (
              <section key={section.id || idx} className="py-12 lg:py-16 bg-[#F8FAFC]">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A]">
                      {section.title || "What Learners Say"}
                    </h2>
                    {section.subtitle && (
                      <p className="text-sm text-[#64748B]">{section.subtitle}</p>
                    )}
                  </div>
                  {reviews.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {reviews.map((rev: any, rIdx: number) => (
                        <div
                          key={rIdx}
                          className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-xs space-y-3"
                        >
                          <div className="flex items-center gap-1 text-[#D97706]">
                            {[...Array(rev.rating || 5)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-current" />
                            ))}
                          </div>
                          <p className="text-xs sm:text-sm text-[#0F172A] italic leading-relaxed">
                            &ldquo;{rev.comment}&rdquo;
                          </p>
                          <div className="pt-2 border-t border-[#E2E8F0]">
                            <span className="font-bold text-xs text-[#0F172A] block">{rev.name}</span>
                            <span className="text-[11px] text-[#64748B]">{rev.role}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 px-4 text-center rounded-xl border border-dashed border-[#CBD5E1] bg-white">
                      <p className="text-sm font-semibold text-[#64748B]">No testimonials configured for this page yet.</p>
                    </div>
                  )}
                </div>
              </section>
            );

          case "cta_banner":
            return (
              <section key={section.id || idx} className="py-12 lg:py-16">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="p-8 sm:p-12 rounded-2xl bg-gradient-to-r from-[#172554] to-[#1E3A8A] text-white text-center space-y-6 shadow-xl">
                    <h2 className="text-3xl sm:text-4xl font-black text-white">
                      {section.title || "Ready to Level Up Your Engineering Career?"}
                    </h2>
                    <p className="text-sm sm:text-base text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
                      {section.content || "Join thousands of developers mastering system architecture and high-performance engineering."}
                    </p>
                    <div className="pt-2">
                      <Link
                        href={section.config?.btnLink || "/courses"}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-sm shadow-md transition-colors"
                      >
                        {section.config?.btnText || "Explore Masterclasses"}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            );

          case "features":
            const features = section.config?.features || [
              { title: "Deep Architecture", desc: "No shallow tutorials. Real production-grade systems.", icon: Terminal },
              { title: "Accredited Credentials", desc: "Earn verified certificates upon course completion.", icon: ShieldCheck },
              { title: "Active Community", desc: "Collaborate with peers and instructor code reviewers.", icon: BookOpen },
            ];

            return (
              <section key={section.id || idx} className="py-12 lg:py-16 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                  <div className="text-center max-w-2xl mx-auto space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A]">
                      {section.title || "Built for Software Craftsmen"}
                    </h2>
                    {section.subtitle && (
                      <p className="text-sm text-[#64748B]">{section.subtitle}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {features.map((feat: any, fIdx: number) => {
                      const Icon = feat.icon || CheckCircle2;
                      return (
                        <div
                          key={fIdx}
                          className="p-6 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3"
                        >
                          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 text-[#2563EB] flex items-center justify-center">
                            <Icon className="w-5 h-5" />
                          </div>
                          <h4 className="font-bold text-[#0F172A] text-base">{feat.title}</h4>
                          <p className="text-xs text-[#64748B] leading-relaxed">{feat.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
