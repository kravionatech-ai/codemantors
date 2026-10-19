"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react";

export default function AdminCmsPagesPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Page Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newStatus, setNewStatus] = useState<"draft" | "published">("draft");
  const [creating, setCreating] = useState(false);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/cms/pages");
      const data = await res.json();
      if (data.success) {
        setPages(data.pages || []);
      } else {
        toast.error(data.error || "Failed to load CMS pages");
      }
    } catch {
      toast.error("Network error while loading CMS pages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSlug.trim()) {
      toast.error("Title and slug are required");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/cms/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          slug: newSlug.trim(),
          status: newStatus,
          sections: [
            {
              id: `sec_${Date.now()}`,
              type: "hero",
              title: newTitle.trim(),
              subtitle: "Custom Built with CodeMentors CMS",
              content: "Welcome to our newly designed dynamic content page.",
              order: 1,
              isVisible: true,
            },
          ],
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`CMS Page "${newTitle}" created!`);
        setCreateModalOpen(false);
        setNewTitle("");
        setNewSlug("");
        fetchPages();
      } else {
        toast.error(data.error || "Failed to create CMS page");
      }
    } catch {
      toast.error("Network error while creating page");
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePage = async (pageId: string, pageTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${pageTitle}"?`)) return;

    try {
      const res = await fetch(`/api/cms/pages/${pageId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(`Page "${pageTitle}" removed`);
        fetchPages();
      } else {
        toast.error(data.error || "Failed to delete page");
      }
    } catch {
      toast.error("Error deleting page");
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-[#64748B]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-3" />
        <p className="text-sm">Loading dynamic CMS pages...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-[#2563EB]" />
            Dynamic CMS Pages & Sections
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Build and manage landing pages, promotional campaigns, and technical content using the modular section builder.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#06B6D4]" />
          Create New Page
        </button>
      </div>

      {/* Pages List */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-2xs overflow-hidden">
        <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
          <span className="font-bold text-xs text-[#0F172A] uppercase tracking-wider">
            All Pages ({pages.length})
          </span>
          <span className="text-xs text-[#64748B]">All pages rendered at clean URL /pages/[slug]</span>
        </div>

        {pages.length === 0 ? (
          <div className="p-12 text-center text-[#64748B] space-y-3">
            <FileText className="w-8 h-8 mx-auto text-[#94A3B8]" />
            <p className="text-sm">No custom CMS pages created yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {pages.map((p) => {
              const sectionCount = p.sections?.length || 0;
              const isPublished = p.status === "published";

              return (
                <div
                  key={p._id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-base text-[#0F172A]">{p.title}</h3>
                      {isPublished ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-[#16A34A] border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Published
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-[#64748B] border border-[#CBD5E1] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#64748B]">
                      <span className="font-mono text-[11px] text-[#2563EB]">/pages/{p.slug}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        {sectionCount} section{sectionCount !== 1 ? "s" : ""}
                      </span>
                      <span>•</span>
                      <span>Updated {new Date(p.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/pages/${p.slug}`}
                      target="_blank"
                      className="p-2 rounded-lg border border-[#E2E8F0] hover:bg-white text-[#64748B] hover:text-[#0F172A] text-xs transition-colors"
                      title="Preview Live Page"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>

                    <Link
                      href={`/admin/cms/pages/${p._id}/edit`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white text-xs font-semibold transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#06B6D4]" />
                      Edit Sections & SEO
                    </Link>

                    <button
                      onClick={() => handleDeletePage(p._id, p.title)}
                      className="p-2 rounded-lg border border-[#E2E8F0] hover:bg-rose-50 text-[#64748B] hover:text-rose-600 text-xs transition-colors cursor-pointer"
                      title="Delete Page"
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

      {/* Create New Page Modal */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Create New Dynamic CMS Page"
        >
          <form onSubmit={handleCreatePage} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Page Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Enterprise Engineering Training"
                value={newTitle}
                onChange={(e) => {
                  setNewTitle(e.target.value);
                  if (!newSlug) {
                    setNewSlug(
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

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">URL Slug *</label>
              <div className="flex items-center">
                <span className="px-3 py-2 rounded-l-lg border border-r-0 border-[#E2E8F0] bg-slate-50 text-[#64748B]">
                  /pages/
                </span>
                <input
                  type="text"
                  required
                  placeholder="enterprise-training"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-r-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Initial Publication Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              >
                <option value="draft">Draft (Private, not public)</option>
                <option value="published">Published (Public live immediately)</option>
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
                {creating ? "Creating..." : "Create & Open Builder"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
