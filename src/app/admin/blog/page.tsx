"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import RichTextEditor from "@/components/ui/RichTextEditor";
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Calendar,
} from "lucide-react";

export default function AdminBlogManagerPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Post Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Engineering");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [creating, setCreating] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/blog?all=true");
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts || []);
      } else {
        toast.error(data.error || "Failed to load blog posts");
      }
    } catch {
      toast.error("Network error while loading posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !content.trim()) {
      toast.error("Title, slug, and content are required");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          category,
          excerpt: excerpt.trim() || title.trim(),
          content,
          status,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Post "${title}" created successfully!`);
        setCreateModalOpen(false);
        setTitle("");
        setSlug("");
        setContent("");
        setExcerpt("");
        fetchPosts();
      } else {
        toast.error(data.error || "Failed to create post");
      }
    } catch {
      toast.error("Network error while creating post");
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePost = async (postSlug: string, postTitle: string) => {
    if (!confirm(`Delete "${postTitle}"?`)) return;

    try {
      const res = await fetch(`/api/blog/${postSlug}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(`Post "${postTitle}" removed`);
        fetchPosts();
      } else {
        toast.error(data.error || "Failed to delete post");
      }
    } catch {
      toast.error("Error deleting post");
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-[#64748B]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-3" />
        <p className="text-sm">Loading technical articles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-[#2563EB]" />
            Technical Publication & Blog Management
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Author and publish engineering articles, system design guides, and tutorials.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#06B6D4]" />
          Write Article
        </button>
      </div>

      {/* Posts Table */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-2xs overflow-hidden">
        <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
          <span className="font-bold text-xs text-[#0F172A] uppercase tracking-wider">
            All Articles ({posts.length})
          </span>
          <Link
            href="/blog"
            target="_blank"
            className="text-xs font-semibold text-[#2563EB] hover:text-blue-700 inline-flex items-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Public Blog
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="p-12 text-center text-[#64748B] text-xs">
            No articles found. Click &apos;Write Article&apos; above to publish your first post.
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {posts.map((post) => {
              const author = post.authorId || {};
              const isPublished = post.status === "published";

              return (
                <div
                  key={post._id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-base text-[#0F172A]">{post.title}</h3>
                      {isPublished ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-[#16A34A] border border-emerald-200">
                          Published
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-[#64748B]">
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#64748B]">
                      <span className="font-mono text-[11px] text-[#2563EB]">/blog/{post.slug}</span>
                      <span>•</span>
                      <span>By {author.name || "CodeMentors Team"}</span>
                      <span>•</span>
                      <span>{post.viewsCount || 0} views</span>
                      <span>•</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className="p-2 rounded-lg border border-[#E2E8F0] hover:bg-white text-[#64748B] hover:text-[#0F172A] text-xs transition-colors"
                      title="Read Article"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => handleDeletePost(post.slug, post.title)}
                      className="p-2 rounded-lg border border-[#E2E8F0] hover:bg-rose-50 text-[#64748B] hover:text-rose-600 text-xs transition-colors cursor-pointer"
                      title="Delete Article"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Write New Engineering Article"
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleCreatePost} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Article Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Building Scalable Rate Limiters with Redis and Next.js"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slug) {
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, "")
                    );
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">URL Slug *</label>
                <div className="flex items-center">
                  <span className="px-3 py-2 rounded-l-lg border border-r-0 border-[#E2E8F0] bg-slate-50 text-[#64748B]">
                    /blog/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-r-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Architecture">Architecture</option>
                  <option value="Next.js">Next.js</option>
                  <option value="TypeScript">TypeScript</option>
                  <option value="DevOps & Docker">DevOps & Docker</option>
                  <option value="Database Systems">Database Systems</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Excerpt / Meta Summary *</label>
              <textarea
                rows={2}
                required
                placeholder="Short summary for preview cards and Google search results..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Article Content *</label>
              <RichTextEditor
                value={content}
                onChange={(val) => setContent(val)}
                placeholder="Write rich article content, format code blocks, or import markdown..."
                minHeight="260px"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              >
                <option value="published">Publish Immediately</option>
                <option value="draft">Save as Draft</option>
              </select>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-[#0F172A] font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 rounded-lg bg-[#172554] text-white font-semibold shadow-xs disabled:opacity-50"
              >
                {creating ? "Saving..." : "Publish Article"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
