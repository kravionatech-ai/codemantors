import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { BlogPost, User } from "@/models";
import { BookOpen, Clock, User as UserIcon, Calendar, ArrowRight, Tag } from "lucide-react";

export const metadata: Metadata = {
  title: "Engineering Blog & Technical Insights | CodeMentors",
  description:
    "In-depth articles, system design analyses, and web framework tutorials written by senior engineers and industry instructors.",
};

export default async function BlogListingPage() {
  await connectDB();
  const posts = await BlogPost.find({ status: "published" })
    .populate("authorId", "name avatar headline")
    .sort({ publishedAt: -1, createdAt: -1 })
    .lean();

  const categories = Array.from(new Set(posts.map((p) => p.category || "Engineering")));

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero Header */}
      <section className="bg-[#172554] text-white py-14 lg:py-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-[#06B6D4] border border-white/10">
            <BookOpen className="w-3.5 h-3.5" />
            CodeMentors Engineering Publication
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Technical Articles & Architecture Deep-Dives
          </h1>
          <p className="text-sm sm:text-base text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
            Practical insights on Next.js 15, TypeScript 5.5, distributed systems, Docker pipelines, and software design patterns.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mr-2">
            Categories:
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#172554] text-white">
            All Articles ({posts.length})
          </span>
          {categories.map((cat) => (
            <span
              key={cat}
              className="px-3 py-1 rounded-full text-xs font-medium bg-white border border-[#E2E8F0] text-[#0F172A] hover:border-[#CBD5E1] transition-colors cursor-pointer"
            >
              {cat}
            </span>
          ))}
        </div>

        {posts.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-[#E2E8F0] bg-white text-[#64748B] space-y-3">
            <BookOpen className="w-8 h-8 mx-auto text-[#94A3B8]" />
            <h3 className="font-bold text-[#0F172A]">No Articles Published Yet</h3>
            <p className="text-xs">Check back soon for new software engineering articles and guides.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: any) => {
              const author = post.authorId || {};
              const pubDate = post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Recent";

              return (
                <article
                  key={post._id.toString()}
                  className="flex flex-col rounded-xl border border-[#E2E8F0] bg-white overflow-hidden hover:border-[#CBD5E1] hover:shadow-xs transition-all group"
                >
                  {/* Thumbnail / Header */}
                  <Link href={`/blog/${post.slug}`} className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    <img
                      src={
                        post.coverImage ||
                        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=450&fit=crop"
                      }
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white/95 text-[#2563EB] border border-[#E2E8F0] shadow-2xs">
                        {post.category || "Architecture"}
                      </span>
                    </div>
                  </Link>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-xs text-[#64748B]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {post.readingTimeMinutes || 5} min read
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {pubDate}
                        </span>
                      </div>

                      <Link href={`/blog/${post.slug}`}>
                        <h2 className="font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors text-lg leading-snug line-clamp-2">
                          {post.title}
                        </h2>
                      </Link>

                      <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>

                    {/* Author & Read More */}
                    <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {author.avatar ? (
                          <img
                            src={author.avatar}
                            alt={author.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[#172554] text-[#06B6D4] flex items-center justify-center text-[10px] font-bold">
                            {author.name?.charAt(0) || "C"}
                          </div>
                        )}
                        <span className="text-xs font-semibold text-[#0F172A]">
                          {author.name || "CodeMentors Team"}
                        </span>
                      </div>

                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-xs font-semibold text-[#2563EB] hover:text-blue-700 inline-flex items-center gap-1"
                      >
                        Read
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
