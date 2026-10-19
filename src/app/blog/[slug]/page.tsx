import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { BlogPost, SiteSettings } from "@/models";
import FormattedContentRenderer from "@/components/ui/FormattedContentRenderer";
import {
  ArrowLeft,
  Clock,
  Calendar,
  Eye,
  Tag,
  Share2,
  BookOpen,
  Sparkles,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  await connectDB();
  const post = await BlogPost.findOne({ slug: slug.toLowerCase() }).lean();
  const settings = await SiteSettings.findOne({ key: "global_config" }).lean();

  if (!post) {
    return { title: "Article Not Found | CodeMentors" };
  }

  const title = post.seo?.title || `${post.title} | CodeMentors Blog`;
  const description = post.seo?.description || post.excerpt;
  const canonicalUrl =
    post.seo?.canonicalUrl ||
    `${settings?.seoDefaults?.canonicalDomain || "http://localhost:3005"}/blog/${post.slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    robots: {
      index: !post.seo?.noIndex,
      follow: !post.seo?.noFollow,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "article",
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
  };
}

export default async function BlogPostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connectDB();

  const post = await BlogPost.findOne({ slug: slug.toLowerCase() })
    .populate("authorId", "name avatar headline bio")
    .lean();

  if (!post || (post.status !== "published" && process.env.NODE_ENV === "production")) {
    notFound();
  }

  const author = (post.authorId as any) || {};
  const pubDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Recently published";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Person",
      name: author.name || "CodeMentors Team",
    },
    publisher: {
      "@type": "Organization",
      name: "CodeMentors",
      logo: {
        "@type": "ImageObject",
        url: "http://localhost:3005/logo.png",
      },
    },
    image: post.coverImage || undefined,
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header Banner */}
      <section className="bg-[#172554] text-white py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs text-[#06B6D4] hover:text-cyan-300 font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Articles
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-500/20 text-[#06B6D4] border border-blue-400/20">
              {post.category || "Engineering"}
            </span>
            <span className="flex items-center gap-1 text-xs text-[#94A3B8]">
              <Clock className="w-3.5 h-3.5" />
              {post.readingTimeMinutes || 5} min read
            </span>
            <span className="text-[#94A3B8]">•</span>
            <span className="flex items-center gap-1 text-xs text-[#94A3B8]">
              <Calendar className="w-3.5 h-3.5" />
              {pubDate}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {post.title}
          </h1>

          <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed">
            {post.excerpt}
          </p>

          {/* Author info pill */}
          <div className="flex items-center gap-3 pt-4 border-t border-white/10">
            {author.avatar ? (
              <img
                src={author.avatar}
                alt={author.name}
                className="w-10 h-10 rounded-full object-cover border border-white/20"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/10 text-[#06B6D4] flex items-center justify-center font-bold text-sm">
                {author.name?.charAt(0) || "C"}
              </div>
            )}
            <div>
              <span className="text-xs text-[#94A3B8] block">Written by</span>
              <span className="text-sm font-semibold text-white">
                {author.name || "CodeMentors Engineering Team"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Article Body */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white p-6 sm:p-12 rounded-xl border border-[#E2E8F0] shadow-xs space-y-8">
          {post.coverImage && (
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-100">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <FormattedContentRenderer content={post.content} className="text-slate-800" />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="pt-6 border-t border-[#E2E8F0] flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[#64748B] flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                Tags:
              </span>
              {post.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded text-xs bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Author Bio Footer Card */}
          <div className="p-6 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-4">
            {author.avatar ? (
              <img
                src={author.avatar}
                alt={author.name}
                className="w-12 h-12 rounded-full object-cover border border-[#CBD5E1]"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#172554] text-[#06B6D4] flex items-center justify-center font-bold text-base">
                {author.name?.charAt(0) || "C"}
              </div>
            )}
            <div className="space-y-1">
              <h4 className="font-bold text-[#0F172A] text-sm sm:text-base">
                About {author.name || "the Author"}
              </h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                {author.bio ||
                  author.headline ||
                  "Staff Software Engineer & Course Architect at CodeMentors specializing in distributed systems and modern web frameworks."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
