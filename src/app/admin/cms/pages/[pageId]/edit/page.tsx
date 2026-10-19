"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import RichTextEditor from "@/components/ui/RichTextEditor";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Globe,
  Settings,
} from "lucide-react";

export default function EditCmsPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = use(params);
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"sections" | "seo" | "settings">("sections");

  // Page fields
  const [page, setPage] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [sections, setSections] = useState<any[]>([]);

  // SEO fields
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [noIndex, setNoIndex] = useState(false);
  const [noFollow, setNoFollow] = useState(false);

  // Add Section Modal
  const [addSectionModalOpen, setAddSectionModalOpen] = useState(false);
  const [newSectionType, setNewSectionType] = useState<string>("text_block");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionSubtitle, setNewSectionSubtitle] = useState("");
  const [newSectionContent, setNewSectionContent] = useState("");

  const fetchPage = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/cms/pages/${pageId}`);
      const data = await res.json();
      if (data.success && data.page) {
        setPage(data.page);
        setTitle(data.page.title);
        setSlug(data.page.slug);
        setStatus(data.page.status);
        setSections(data.page.sections || []);

        setSeoTitle(data.page.seo?.title || "");
        setSeoDescription(data.page.seo?.description || "");
        setCanonicalUrl(data.page.seo?.canonicalUrl || "");
        setOgImage(data.page.seo?.ogImage || "");
        setNoIndex(Boolean(data.page.seo?.noIndex));
        setNoFollow(Boolean(data.page.seo?.noFollow));
      } else {
        toast.error(data.error || "Failed to load page");
      }
    } catch {
      toast.error("Network error while loading page");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage();
  }, [pageId]);

  const handleSavePage = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/cms/pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          status,
          sections,
          seo: {
            title: seoTitle.trim(),
            description: seoDescription.trim(),
            canonicalUrl: canonicalUrl.trim(),
            ogImage: ogImage.trim(),
            noIndex,
            noFollow,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Page and sections saved successfully!");
        fetchPage();
      } else {
        toast.error(data.error || "Failed to save page");
      }
    } catch {
      toast.error("Error saving page");
    } finally {
      setSaving(false);
    }
  };

  // Section Reordering
  const moveSection = (idx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const copy = [...sections];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;

    // re-assign order numbers
    copy.forEach((s, i) => {
      s.order = i + 1;
    });

    setSections(copy);
  };

  const toggleSectionVisibility = (idx: number) => {
    const copy = [...sections];
    copy[idx].isVisible = !copy[idx].isVisible;
    setSections(copy);
  };

  const removeSection = (idx: number) => {
    const copy = sections.filter((_, i) => i !== idx);
    copy.forEach((s, i) => {
      s.order = i + 1;
    });
    setSections(copy);
  };

  const updateSectionField = (idx: number, field: string, value: any) => {
    const copy = [...sections];
    copy[idx][field] = value;
    setSections(copy);
  };

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    const newSection = {
      id: `sec_${Date.now()}`,
      type: newSectionType,
      title: newSectionTitle.trim(),
      subtitle: newSectionSubtitle.trim(),
      content: newSectionContent,
      order: sections.length + 1,
      isVisible: true,
      config: {},
    };

    setSections([...sections, newSection]);
    setAddSectionModalOpen(false);
    setNewSectionTitle("");
    setNewSectionSubtitle("");
    setNewSectionContent("");
    toast.success("Section added to page! Remember to click Save.");
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-[#64748B]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-3" />
        <p className="text-sm">Loading page builder and sections...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/cms/pages"
            className="p-2 rounded-lg border border-[#E2E8F0] hover:bg-white text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-[#0F172A]">
              Page Builder: {page?.title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-[#64748B] mt-0.5">
              <span className="font-mono text-[#2563EB]">/pages/{slug}</span>
              <span>•</span>
              <span>Status: <strong className="capitalize">{status}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/pages/${slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] shadow-2xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Live Preview
          </Link>

          <button
            onClick={handleSavePage}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-[#06B6D4]" />}
            Save All Changes
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0]">
        <button
          onClick={() => setActiveTab("sections")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "sections"
              ? "border-[#2563EB] text-[#2563EB]"
              : "border-transparent text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <Layers className="w-4 h-4" />
          Content Sections ({sections.length})
        </button>

        <button
          onClick={() => setActiveTab("seo")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "seo"
              ? "border-[#2563EB] text-[#2563EB]"
              : "border-transparent text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <Globe className="w-4 h-4" />
          SEO & Social Metadata
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "settings"
              ? "border-[#2563EB] text-[#2563EB]"
              : "border-transparent text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <Settings className="w-4 h-4" />
          Page Settings & Status
        </button>
      </div>

      {/* TAB 1: SECTIONS BUILDER */}
      {activeTab === "sections" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
              Sections Layout Order
            </span>
            <button
              onClick={() => setAddSectionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Section
            </button>
          </div>

          {sections.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-dashed border-[#CBD5E1] bg-white text-[#64748B] space-y-3">
              <Layers className="w-8 h-8 mx-auto text-[#94A3B8]" />
              <p className="text-xs">No sections added yet. Click &apos;Add Section&apos; above to start building.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((sec, idx) => (
                <div
                  key={sec.id || idx}
                  className={`rounded-xl border transition-all ${
                    sec.isVisible
                      ? "border-[#E2E8F0] bg-white shadow-2xs"
                      : "border-dashed border-slate-300 bg-slate-50 opacity-60"
                  }`}
                >
                  {/* Section Bar */}
                  <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#172554] text-white flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-xs text-[#0F172A] uppercase tracking-wider">
                          {sec.type.replace("_", " ")}
                        </span>
                        <span className="text-xs text-[#64748B] ml-2">
                          {sec.title || "Untitled section"}
                        </span>
                      </div>
                    </div>

                    {/* Section Controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveSection(idx, "up")}
                        disabled={idx === 0}
                        className="p-1.5 rounded hover:bg-slate-200 text-[#64748B] disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => moveSection(idx, "down")}
                        disabled={idx === sections.length - 1}
                        className="p-1.5 rounded hover:bg-slate-200 text-[#64748B] disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => toggleSectionVisibility(idx)}
                        className="p-1.5 rounded hover:bg-slate-200 text-[#64748B] cursor-pointer"
                        title={sec.isVisible ? "Hide Section" : "Show Section"}
                      >
                        {sec.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => removeSection(idx)}
                        className="p-1.5 rounded hover:bg-rose-100 text-rose-600 cursor-pointer"
                        title="Delete Section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Section Inline Editor */}
                  <div className="p-5 space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-[#0F172A] block mb-1">Section Title</label>
                        <input
                          type="text"
                          value={sec.title || ""}
                          onChange={(e) => updateSectionField(idx, "title", e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-[#0F172A] block mb-1">Subtitle / Badge</label>
                        <input
                          type="text"
                          value={sec.subtitle || ""}
                          onChange={(e) => updateSectionField(idx, "subtitle", e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-[#0F172A] block mb-1">
                        Content Body
                      </label>
                      <RichTextEditor
                        value={sec.content || ""}
                        onChange={(val) => updateSectionField(idx, "content", val)}
                        placeholder="Write rich formatted section content or paste markdown..."
                        minHeight="180px"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SEO & SOCIAL METADATA */}
      {activeTab === "seo" && (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-2xs space-y-4 text-xs">
          <div>
            <h2 className="font-bold text-sm text-[#0F172A]">Search Engine Optimization (SEO)</h2>
            <p className="text-[#64748B] mt-0.5">
              Configure precise meta tags, canonical URL, and index directives for /pages/{slug}.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">SEO Meta Title</label>
              <input
                type="text"
                placeholder={title}
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              />
              <span className="text-[11px] text-[#64748B]">Recommended: 50–60 characters.</span>
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Meta Description</label>
              <textarea
                rows={3}
                placeholder="Brief summary of this page for Google search snippets..."
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              />
              <span className="text-[11px] text-[#64748B]">Recommended: 120–160 characters.</span>
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Canonical URL</label>
              <input
                type="text"
                placeholder={`http://localhost:3005/pages/${slug}`}
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Social Sharing Image URL (Open Graph)</label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/photo-..."
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              />
            </div>

            <div className="pt-2 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noIndex}
                  onChange={(e) => setNoIndex(e.target.checked)}
                  className="rounded border-[#CBD5E1] text-[#2563EB]"
                />
                <span className="font-semibold text-[#0F172A]">noindex (Prevent search engines from indexing)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noFollow}
                  onChange={(e) => setNoFollow(e.target.checked)}
                  className="rounded border-[#CBD5E1] text-[#2563EB]"
                />
                <span className="font-semibold text-[#0F172A]">nofollow (Instruct crawlers not to follow links)</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PAGE SETTINGS */}
      {activeTab === "settings" && (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-2xs space-y-4 text-xs">
          <div>
            <h2 className="font-bold text-sm text-[#0F172A]">Page Publication Settings</h2>
            <p className="text-[#64748B] mt-0.5">Control the URL path and release status of this page.</p>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Page Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">URL Slug</label>
              <div className="flex items-center">
                <span className="px-3 py-2 rounded-l-lg border border-r-0 border-[#E2E8F0] bg-slate-50 text-[#64748B]">
                  /pages/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-r-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                />
              </div>
              <span className="text-[11px] text-[#2563EB] mt-1 block">
                💡 Note: Changing the slug automatically generates a permanent 301 redirect from the old URL to prevent 404 errors.
              </span>
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              >
                <option value="draft">Draft (Private)</option>
                <option value="published">Published (Public)</option>
                <option value="archived">Archived (Unlisted)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {addSectionModalOpen && (
        <Modal
          isOpen={addSectionModalOpen}
          onClose={() => setAddSectionModalOpen(false)}
          title="Add New Content Section"
        >
          <form onSubmit={handleAddSection} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Section Type</label>
              <select
                value={newSectionType}
                onChange={(e) => setNewSectionType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              >
                <option value="hero">Hero Banner (Title, Subtitle, CTA buttons)</option>
                <option value="text_block">Rich Text Block (Markdown & Code)</option>
                <option value="course_grid">Course Grid (Pulls real platform courses)</option>
                <option value="faq">FAQ Accordion (Expandable Q&A)</option>
                <option value="testimonials">Testimonials (Learner feedback cards)</option>
                <option value="cta_banner">CTA Conversion Banner</option>
                <option value="features">Features Grid (3-column icon cards)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Section Title</label>
              <input
                type="text"
                placeholder="e.g. Master Enterprise Cloud Architecture"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Subtitle / Badge (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Hands-On Curriculum"
                value={newSectionSubtitle}
                onChange={(e) => setNewSectionSubtitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Content Body (Optional)</label>
              <RichTextEditor
                value={newSectionContent}
                onChange={(val) => setNewSectionContent(val)}
                placeholder="Write rich formatted section content or import markdown..."
                minHeight="180px"
              />
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddSectionModalOpen(false)}
                className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-[#0F172A] font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#172554] text-white font-semibold shadow-xs"
              >
                Add Section to Page
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
