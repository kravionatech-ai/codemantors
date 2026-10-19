"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import {
  Globe,
  Save,
  Search,
  ExternalLink,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Edit,
  Eye,
  SlidersHorizontal,
  Layout,
  Share2,
  Smartphone,
  Monitor,
  Code,
  FileCheck,
  Sparkles,
  RefreshCw,
} from "lucide-react";

export default function AdminSeoControlCenter() {
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<"pages" | "defaults" | "redirects" | "technical">("pages");
  const [loading, setLoading] = useState(true);

  // Pages state
  const [pages, setPages] = useState<any[]>([]);
  const [pagesStats, setPagesStats] = useState<any>({ totalPages: 0, overriddenCount: 0, withIssuesCount: 0, avgScore: 100 });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Page SEO Editor Modal State
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [socialPreviewType, setSocialPreviewType] = useState<"google" | "twitter" | "facebook">("google");
  const [savingPage, setSavingPage] = useState(false);
  const [deletingOverride, setDeletingOverride] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validating, setValidating] = useState(false);

  // Global SEO Defaults
  const [seoDefaults, setSeoDefaults] = useState<any>({
    defaultTitle: "",
    titleTemplate: "",
    defaultDescription: "",
    defaultOgImage: "",
    canonicalDomain: "",
    googleSiteVerification: "",
    bingSiteVerification: "",
    robotsTxtContent: "",
    sitemapEnabled: true,
  });
  const [savingDefaults, setSavingDefaults] = useState(false);

  // Redirects
  const [redirects, setRedirects] = useState<any[]>([]);
  const [newRedirectModal, setNewRedirectModal] = useState(false);
  const [sourcePath, setSourcePath] = useState("");
  const [destinationPath, setDestinationPath] = useState("");
  const [statusCode, setStatusCode] = useState<301 | 302>(301);
  const [redirectNotes, setRedirectNotes] = useState("");
  const [savingRedirect, setSavingRedirect] = useState(false);

  const fetchPages = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (selectedType !== "all") params.set("type", selectedType);
      if (selectedStatus !== "all") params.set("status", selectedStatus);

      const res = await fetch(`/api/admin/seo/pages?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPages(data.pages || []);
        if (data.stats) setPagesStats(data.stats);
      }
    } catch {
      toast.error("Failed to load SEO pages");
    }
  };

  const fetchGlobalData = async () => {
    try {
      const [diagRes, redirRes] = await Promise.all([
        fetch("/api/admin/seo"),
        fetch("/api/redirects"),
      ]);

      const diagData = await diagRes.json();
      const redirData = await redirRes.json();

      if (diagData.success && diagData.seoDefaults) {
        setSeoDefaults(diagData.seoDefaults);
      }
      if (redirData.success) {
        setRedirects(redirData.redirects || []);
      }
    } catch {
      toast.error("Failed to load global SEO configuration");
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPages(), fetchGlobalData()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPages();
  }, [searchQuery, selectedType, selectedStatus]);

  // Open Page Editor
  const handleOpenEditor = (page: any) => {
    setEditingPage({
      ...page,
      title: page.title || "",
      description: page.description || "",
      canonicalUrl: page.canonicalUrl || "",
      ogTitle: page.ogTitle || page.title || "",
      ogDescription: page.ogDescription || page.description || "",
      ogImage: page.ogImage || "",
      twitterCard: page.twitterCard || "summary_large_image",
      twitterTitle: page.twitterTitle || page.title || "",
      twitterDescription: page.twitterDescription || page.description || "",
      twitterImage: page.twitterImage || page.ogImage || "",
      structuredDataType: page.structuredDataType || "None",
      structuredDataCustom: page.structuredDataCustom || "",
      noIndex: Boolean(page.noIndex),
      noFollow: Boolean(page.noFollow),
      status: page.status || "published",
    });
    setEditorModalOpen(true);
    triggerValidation(page);
  };

  const triggerValidation = async (pageData: any) => {
    setValidating(true);
    try {
      const res = await fetch("/api/admin/seo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pageData),
      });
      const data = await res.json();
      if (data.success) {
        setValidationResult(data.diagnostics);
      }
    } catch {
      // silent
    } finally {
      setValidating(false);
    }
  };

  const handleEditorFieldChange = (field: string, value: any) => {
    const updated = { ...editingPage, [field]: value };
    setEditingPage(updated);
    // Debounce validation
    triggerValidation(updated);
  };

  const handleSavePageSeo = async (statusOverride?: "draft" | "published") => {
    if (!editingPage) return;
    setSavingPage(true);
    try {
      const payload = {
        ...editingPage,
        status: statusOverride || editingPage.status || "published",
      };

      const res = await fetch("/api/admin/seo/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`SEO settings saved for ${editingPage.path}`);
        setEditorModalOpen(false);
        fetchPages();
      } else {
        toast.error(data.error || "Failed to save page SEO");
      }
    } catch {
      toast.error("Network error while saving page SEO");
    } finally {
      setSavingPage(false);
    }
  };

  const handleDeleteOverride = async () => {
    if (!editingPage?._id || editingPage._id.startsWith("virtual_")) return;
    if (!confirm(`Reset SEO for "${editingPage.path}" back to dynamic content defaults?`)) return;

    setDeletingOverride(true);
    try {
      const res = await fetch(`/api/admin/seo/pages/${editingPage._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setEditorModalOpen(false);
        fetchPages();
      } else {
        toast.error(data.error || "Failed to remove override");
      }
    } catch {
      toast.error("Error removing override");
    } finally {
      setDeletingOverride(false);
    }
  };

  const handleSaveSeoDefaults = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDefaults(true);
    try {
      const res = await fetch("/api/admin/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(seoDefaults),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Global SEO defaults saved successfully!");
        fetchGlobalData();
      } else {
        toast.error(data.error || "Failed to update SEO defaults");
      }
    } catch {
      toast.error("Network error saving SEO defaults");
    } finally {
      setSavingDefaults(false);
    }
  };

  const handleCreateRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRedirect(true);
    try {
      const res = await fetch("/api/redirects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourcePath,
          destinationPath,
          statusCode,
          notes: redirectNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Safe redirect rule added!");
        setNewRedirectModal(false);
        setSourcePath("");
        setDestinationPath("");
        setRedirectNotes("");
        fetchGlobalData();
      } else {
        toast.error(data.error || "Failed to create redirect");
      }
    } catch {
      toast.error("Failed to create redirect");
    } finally {
      setSavingRedirect(false);
    }
  };

  const handleDeleteRedirect = async (id: string) => {
    if (!confirm("Are you sure you want to remove this redirect?")) return;
    try {
      const res = await fetch(`/api/redirects?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Redirect deleted");
        fetchGlobalData();
      } else {
        toast.error(data.error || "Failed to delete redirect");
      }
    } catch {
      toast.error("Error deleting redirect");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-[#2563EB] uppercase tracking-wider">
              Search Engine Optimization
            </span>
            <span className="text-xs text-[#64748B]">Next.js App Router Metadata</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172554] tracking-tight mt-1 flex items-center gap-2.5">
            <Globe className="w-7 h-7 text-[#2563EB]" />
            SEO Management Center
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Configure independent SEO titles, meta descriptions, Open Graph cards, robots directives, and canonical URLs for every public page.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/sitemap.xml"
            target="_blank"
            className="px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#0F172A] text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <FileCheck className="w-3.5 h-3.5 text-[#16A34A]" />
            View sitemap.xml
          </Link>
          <Link
            href="/robots.txt"
            target="_blank"
            className="px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#0F172A] text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
            View robots.txt
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#E2E8F0] gap-8 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("pages")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === "pages"
              ? "border-[#2563EB] text-[#2563EB]"
              : "border-transparent text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <Layout className="w-4 h-4" />
          Page-by-Page SEO ({pagesStats.totalPages || pages.length})
        </button>

        <button
          onClick={() => setActiveTab("defaults")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === "defaults"
              ? "border-[#2563EB] text-[#2563EB]"
              : "border-transparent text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <Globe className="w-4 h-4" />
          Global Defaults & Verification
        </button>

        <button
          onClick={() => setActiveTab("redirects")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === "redirects"
              ? "border-[#2563EB] text-[#2563EB]"
              : "border-transparent text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          Safe URL Redirects ({redirects.length})
        </button>

        <button
          onClick={() => setActiveTab("technical")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === "technical"
              ? "border-[#2563EB] text-[#2563EB]"
              : "border-transparent text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <Code className="w-4 h-4" />
          Technical Standards & Schema
        </button>
      </div>

      {/* TAB 1: Page-by-Page SEO Management */}
      {activeTab === "pages" && (
        <div className="space-y-6">
          {/* Diagnostic Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                Total Indexable Pages
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-[#0F172A]">{pagesStats.totalPages}</span>
                <span className="text-xs text-[#2563EB] font-semibold bg-blue-50 px-2 py-0.5 rounded">
                  All Types
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                Custom Overrides Configured
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-[#16A34A]">{pagesStats.overriddenCount}</span>
                <span className="text-xs text-[#64748B]">
                  {pagesStats.totalPages > 0
                    ? Math.round((pagesStats.overriddenCount / pagesStats.totalPages) * 100)
                    : 0}% covered
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                Pages with Warnings / Issues
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-[#D97706]">{pagesStats.withIssuesCount}</span>
                <span className="text-xs text-[#D97706] font-semibold bg-amber-50 px-2 py-0.5 rounded">
                  Needs Attention
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                Average SEO Health Score
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-[#0F172A]">{pagesStats.avgScore}/100</span>
                <span className="text-xs text-[#16A34A] font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                  Optimized
                </span>
              </div>
            </div>
          </div>

          {/* Search & Filters Bar */}
          <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search any page by name, URL path, title, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Type:</span>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="all">All Content Types</option>
                  <option value="homepage">Homepage</option>
                  <option value="course_catalog">Course Catalog</option>
                  <option value="course">Individual Courses</option>
                  <option value="category">Categories</option>
                  <option value="learning_path">Learning Paths</option>
                  <option value="blog_post">Blog Posts</option>
                  <option value="instructor">Instructors</option>
                  <option value="cms_page">Static & CMS Pages</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                <span>Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="all">All Pages</option>
                  <option value="override_only">Custom Override Only</option>
                  <option value="has_issues">Has Warnings</option>
                  <option value="draft">Drafts</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <button
                onClick={fetchPages}
                className="p-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#64748B] hover:text-[#0F172A] transition-colors"
                title="Refresh list"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pages Table */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-2xs overflow-hidden">
            {loading ? (
              <div className="py-20 text-center text-[#64748B]">
                <Loader2 className="w-7 h-7 animate-spin mx-auto text-[#2563EB] mb-2" />
                <p className="text-xs">Analyzing catalog & SEO overrides...</p>
              </div>
            ) : pages.length === 0 ? (
              <div className="py-16 text-center text-[#64748B] space-y-2">
                <Globe className="w-8 h-8 mx-auto text-[#94A3B8]" />
                <p className="text-xs font-semibold text-[#0F172A]">No pages found</p>
                <p className="text-[11px]">No content matches the selected search filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold border-b border-[#E2E8F0]">
                    <tr>
                      <th className="px-5 py-3.5">Page / URL Path</th>
                      <th className="px-5 py-3.5">Type</th>
                      <th className="px-5 py-3.5">SEO Title & Meta Description</th>
                      <th className="px-5 py-3.5">Robots</th>
                      <th className="px-5 py-3.5 text-center">Score</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {pages.map((p) => {
                      const hasIssues = p.issues && p.issues.length > 0;
                      return (
                        <tr key={p._id || p.path} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3.5 max-w-[240px]">
                            <div className="font-bold text-[#0F172A] truncate">{p.pageName}</div>
                            <div className="font-mono text-[11px] text-[#2563EB] truncate mt-0.5">
                              {p.path}
                            </div>
                            {p.hasOverride && (
                              <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                Custom Override Active
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-[#475569] uppercase tracking-wider">
                              {p.entityType.replace(/_/g, " ")}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 max-w-[340px]">
                            <div className="font-semibold text-[#0F172A] truncate">
                              {p.title || <span className="text-rose-500 italic">Missing title</span>}
                            </div>
                            <p className="text-[#64748B] text-[11px] line-clamp-1 mt-0.5">
                              {p.description || <span className="text-amber-500 italic">Missing meta description</span>}
                            </p>
                            {hasIssues && (
                              <div className="flex items-center gap-1 text-amber-600 text-[10px] font-medium mt-1">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>{p.issues[0]}</span>
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-3.5">
                            <div className="space-y-1">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  p.noIndex
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}
                              >
                                {p.noIndex ? "noindex" : "index"}
                              </span>
                              <span
                                className={`inline-block ml-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                  p.noFollow
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {p.noFollow ? "nofollow" : "follow"}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-3.5 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-black ${
                                p.seoScore >= 90
                                  ? "bg-emerald-50 text-emerald-700"
                                  : p.seoScore >= 70
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {p.seoScore || 100}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 text-right space-x-2">
                            <button
                              onClick={() => handleOpenEditor(p)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white text-[11px] font-semibold shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" />
                              Edit SEO
                            </button>

                            <Link
                              href={p.path}
                              target="_blank"
                              className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-[#64748B] hover:text-[#0F172A] inline-flex items-center"
                              title="Preview actual public page"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Global SEO Defaults */}
      {activeTab === "defaults" && (
        <form onSubmit={handleSaveSeoDefaults} className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Global Meta Defaults & Webmaster Verifications</h2>
              <p className="text-xs text-[#64748B]">These values act as global fallbacks when page-specific SEO overrides are empty.</p>
            </div>
            <button
              type="submit"
              disabled={savingDefaults}
              className="px-4 py-2 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {savingDefaults ? "Saving..." : "Save Global Defaults"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Default Site Meta Title</label>
              <input
                type="text"
                value={seoDefaults.defaultTitle}
                onChange={(e) => setSeoDefaults({ ...seoDefaults, defaultTitle: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Title Template Pattern</label>
              <input
                type="text"
                value={seoDefaults.titleTemplate}
                placeholder="%s | CodeMentors"
                onChange={(e) => setSeoDefaults({ ...seoDefaults, titleTemplate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-semibold text-[#0F172A] block mb-1">Default Meta Description</label>
              <textarea
                rows={3}
                value={seoDefaults.defaultDescription}
                onChange={(e) => setSeoDefaults({ ...seoDefaults, defaultDescription: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Canonical Domain</label>
              <input
                type="text"
                placeholder="http://localhost:3005"
                value={seoDefaults.canonicalDomain}
                onChange={(e) => setSeoDefaults({ ...seoDefaults, canonicalDomain: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Default Open Graph / Social Image URL</label>
              <input
                type="text"
                value={seoDefaults.defaultOgImage}
                onChange={(e) => setSeoDefaults({ ...seoDefaults, defaultOgImage: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Google Search Console Verification Token</label>
              <input
                type="text"
                placeholder="e.g. google-site-verification=abc..."
                value={seoDefaults.googleSiteVerification || ""}
                onChange={(e) => setSeoDefaults({ ...seoDefaults, googleSiteVerification: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Bing Webmaster Verification Token</label>
              <input
                type="text"
                placeholder="e.g. msvalidate.01=..."
                value={seoDefaults.bingSiteVerification || ""}
                onChange={(e) => setSeoDefaults({ ...seoDefaults, bingSiteVerification: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-semibold text-[#0F172A] block mb-1">Custom robots.txt Rules</label>
              <textarea
                rows={4}
                value={seoDefaults.robotsTxtContent || ""}
                onChange={(e) => setSeoDefaults({ ...seoDefaults, robotsTxtContent: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] font-mono text-xs focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: Safe URL Redirects */}
      {activeTab === "redirects" && (
        <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-2xs overflow-hidden">
          <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#0F172A] flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-[#2563EB]" />
                Safe URL Redirects ({redirects.length})
              </h3>
              <p className="text-xs text-[#64748B]">
                Prevent 404 broken links when courses or pages change slugs. Circular redirect loops are automatically blocked.
              </p>
            </div>

            <button
              onClick={() => setNewRedirectModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Redirect
            </button>
          </div>

          {redirects.length === 0 ? (
            <div className="p-8 text-center text-[#64748B] text-xs">
              No URL redirect rules configured yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-3">Source URL</th>
                    <th className="px-6 py-3">Destination URL</th>
                    <th className="px-6 py-3">Status Code</th>
                    <th className="px-6 py-3">Hits</th>
                    <th className="px-6 py-3">Notes</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {redirects.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3 font-mono font-semibold text-[#0F172A]">
                        {r.sourcePath}
                      </td>
                      <td className="px-6 py-3 font-mono text-[#2563EB]">
                        {r.destinationPath}
                      </td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-[#2563EB]">
                          {r.statusCode}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-[#64748B]">{r.hitCount || 0}</td>
                      <td className="px-6 py-3 text-[#64748B] truncate max-w-[200px]">
                        {r.notes || "—"}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => handleDeleteRedirect(r._id)}
                          className="p-1.5 rounded hover:bg-rose-50 text-rose-600 cursor-pointer"
                          title="Delete Redirect"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Technical Standards & Schema */}
      {activeTab === "technical" && (
        <div className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-6 text-xs text-[#0F172A]">
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">Technical SEO Architecture & JSON-LD Schemas</h2>
            <p className="text-xs text-[#64748B]">Overview of server-rendered metadata tags and Schema.org structured data.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <span className="font-bold text-sm text-[#172554] block">1. Server-Side Rendering (SSR)</span>
              <p className="text-[#64748B] leading-relaxed">
                Metadata is strictly rendered on the server using Next.js App Router's native <code className="bg-slate-200 px-1 py-0.5 rounded">generateMetadata()</code>. Crawlers like Googlebot and Twitterbot receive full static HTML titles, descriptions, and Open Graph tags without relying on client-side hydration.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <span className="font-bold text-sm text-[#172554] block">2. Supported Structured Data</span>
              <p className="text-[#64748B] leading-relaxed">
                - <strong>EducationalOrganization & WebSite:</strong> Rendered in RootLayout with SearchAction.<br />
                - <strong>Course Schema:</strong> Dynamic Schema.org/Course JSON-LD with workload, price, and provider.<br />
                - <strong>Article / BlogPosting:</strong> Technical blog posts.<br />
                - <strong>Person Schema:</strong> Instructor and mentor profile cards.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <span className="font-bold text-sm text-[#172554] block">3. Canonical Domain Enforcement</span>
              <p className="text-[#64748B] leading-relaxed">
                All pages render normalized absolute canonical links based on the configured Canonical Domain. Trailing slashes and query strings from checkout or marketing campaigns are excluded from canonical URLs.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <span className="font-bold text-sm text-[#172554] block">4. Sensitive Flow Exclusion</span>
              <p className="text-[#64748B] leading-relaxed">
                Routes like <code className="bg-slate-200 px-1 py-0.5 rounded">/checkout</code>, <code className="bg-slate-200 px-1 py-0.5 rounded">/cart</code>, <code className="bg-slate-200 px-1 py-0.5 rounded">/admin/*</code>, <code className="bg-slate-200 px-1 py-0.5 rounded">/student/*</code>, and <code className="bg-slate-200 px-1 py-0.5 rounded">/learn/*</code> are disallowed in <code className="bg-slate-200 px-1 py-0.5 rounded">robots.txt</code> and excluded from <code className="bg-slate-200 px-1 py-0.5 rounded">sitemap.xml</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE PAGE SEO EDITOR MODAL */}
      {editorModalOpen && editingPage && (
        <Modal
          isOpen={editorModalOpen}
          onClose={() => setEditorModalOpen(false)}
          title={`Edit SEO Metadata: ${editingPage.pageName}`}
          maxWidth="max-w-5xl"
        >
          <div className="space-y-6 text-xs max-h-[80vh] overflow-y-auto pr-1">
            {/* Top Info Bar */}
            <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">
                  Target Route Path
                </span>
                <span className="font-mono font-bold text-sm text-[#172554]">{editingPage.path}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-[#2563EB]">
                  Type: {editingPage.entityType}
                </span>
                <Link
                  href={editingPage.path}
                  target="_blank"
                  className="px-2.5 py-1 rounded border border-[#E2E8F0] bg-white text-[#0F172A] font-semibold text-[11px] hover:bg-slate-50 flex items-center gap-1"
                >
                  <Eye className="w-3 h-3 text-[#2563EB]" />
                  View Live Page
                </Link>
              </div>
            </div>

            {/* Diagnostic Warnings Box */}
            {validationResult?.issues && validationResult.issues.length > 0 && (
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>SEO Diagnostic Warnings ({validationResult.issues.length})</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
                  {validationResult.issues.map((iss: string, idx: number) => (
                    <li key={idx}>{iss}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Two-Column Editor Layout: Left Form Inputs, Right Real-Time Snippet Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form Fields (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* SEO Title Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#0F172A]">SEO Title Tag *</label>
                    <span
                      className={`text-[11px] font-mono font-semibold ${
                        (editingPage.title || "").length >= 40 && (editingPage.title || "").length <= 60
                          ? "text-[#16A34A]"
                          : (editingPage.title || "").length > 60
                          ? "text-[#DC2626]"
                          : "text-[#D97706]"
                      }`}
                    >
                      {(editingPage.title || "").length} / 60 chars (Recommended: 40–60)
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={editingPage.title}
                    onChange={(e) => handleEditorFieldChange("title", e.target.value)}
                    placeholder="Primary keyword — Secondary keyword | CodeMentors"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                {/* Meta Description Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#0F172A]">Meta Description *</label>
                    <span
                      className={`text-[11px] font-mono font-semibold ${
                        (editingPage.description || "").length >= 120 && (editingPage.description || "").length <= 160
                          ? "text-[#16A34A]"
                          : (editingPage.description || "").length > 160
                          ? "text-[#DC2626]"
                          : "text-[#D97706]"
                      }`}
                    >
                      {(editingPage.description || "").length} / 160 chars (Recommended: 120–160)
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={editingPage.description}
                    onChange={(e) => handleEditorFieldChange("description", e.target.value)}
                    placeholder="Clear summary explaining what students will learn, including primary call to action..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                {/* Canonical URL Input */}
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Canonical URL</label>
                  <input
                    type="text"
                    value={editingPage.canonicalUrl}
                    onChange={(e) => handleEditorFieldChange("canonicalUrl", e.target.value)}
                    placeholder="https://codementors.com/courses/nextjs-mastery"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] font-mono focus:outline-none focus:border-[#2563EB]"
                  />
                  <p className="text-[10px] text-[#94A3B8] mt-0.5">Leave blank to use default domain + path.</p>
                </div>

                {/* Open Graph Image URL */}
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Open Graph / Social Share Image URL</label>
                  <input
                    type="text"
                    value={editingPage.ogImage}
                    onChange={(e) => handleEditorFieldChange("ogImage", e.target.value)}
                    placeholder="https://images.unsplash.com/... or /og-image.png"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                {/* Robots Directives */}
                <div className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
                  <span className="font-bold text-[#0F172A] block text-[11px]">Robots Directives</span>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!editingPage.noIndex}
                        onChange={(e) => handleEditorFieldChange("noIndex", !e.target.checked)}
                        className="accent-[#2563EB]"
                      />
                      <span className="text-xs text-[#0F172A]">Allow Search Indexing (index)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!editingPage.noFollow}
                        onChange={(e) => handleEditorFieldChange("noFollow", !e.target.checked)}
                        className="accent-[#2563EB]"
                      />
                      <span className="text-xs text-[#0F172A]">Follow Links (follow)</span>
                    </label>
                  </div>
                </div>

                {/* Structured Data Schema */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-[#0F172A] block mb-1">Structured Data Type</label>
                    <select
                      value={editingPage.structuredDataType}
                      onChange={(e) => handleEditorFieldChange("structuredDataType", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                    >
                      <option value="None">None / Auto-Detected</option>
                      <option value="Course">Schema.org Course</option>
                      <option value="Article">Schema.org Article / BlogPosting</option>
                      <option value="WebSite">Schema.org WebSite</option>
                      <option value="Organization">Schema.org Organization</option>
                      <option value="Person">Schema.org Person (Instructor)</option>
                      <option value="BreadcrumbList">Schema.org BreadcrumbList</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-[#0F172A] block mb-1">Publication Status</label>
                    <select
                      value={editingPage.status}
                      onChange={(e) => handleEditorFieldChange("status", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                    >
                      <option value="published">Published & Active</option>
                      <option value="draft">Draft (Private)</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Previews (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                  <span className="font-bold text-[#0F172A] text-xs">Live Snippet & Card Preview</span>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px]">
                    <button
                      type="button"
                      onClick={() => setSocialPreviewType("google")}
                      className={`px-2 py-1 rounded font-semibold cursor-pointer ${
                        socialPreviewType === "google" ? "bg-white text-[#0F172A] shadow-2xs" : "text-[#64748B]"
                      }`}
                    >
                      Google SERP
                    </button>
                    <button
                      type="button"
                      onClick={() => setSocialPreviewType("twitter")}
                      className={`px-2 py-1 rounded font-semibold cursor-pointer ${
                        socialPreviewType === "twitter" ? "bg-white text-[#0F172A] shadow-2xs" : "text-[#64748B]"
                      }`}
                    >
                      Twitter Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setSocialPreviewType("facebook")}
                      className={`px-2 py-1 rounded font-semibold cursor-pointer ${
                        socialPreviewType === "facebook" ? "bg-white text-[#0F172A] shadow-2xs" : "text-[#64748B]"
                      }`}
                    >
                      Social (OG)
                    </button>
                  </div>
                </div>

                {/* Google Preview */}
                {socialPreviewType === "google" && (
                  <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-[#2563EB]">
                        C
                      </div>
                      <div>
                        <span className="font-semibold text-[11px] text-[#202124] block">CodeMentors</span>
                        <span className="text-[10px] text-[#5f6368] font-mono block">
                          https://codementors.com{editingPage.path}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-[#1a0dab] hover:underline font-medium text-sm leading-snug cursor-pointer">
                      {editingPage.title || "Page Title — Site Name"}
                    </h4>
                    <p className="text-[#4d5156] text-[11px] leading-relaxed line-clamp-3">
                      {editingPage.description || "Enter a compelling meta description to see how it appears on Google desktop and mobile search result pages."}
                    </p>
                  </div>
                )}

                {/* Twitter / Social Card Preview */}
                {(socialPreviewType === "twitter" || socialPreviewType === "facebook") && (
                  <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-2xs overflow-hidden">
                    <div className="aspect-video w-full bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      {editingPage.ogImage ? (
                        <img
                          src={editingPage.ogImage}
                          alt="Social preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center text-[#94A3B8] p-4">
                          <Share2 className="w-8 h-8 mx-auto mb-1 opacity-50" />
                          <span className="text-[11px]">No Open Graph Image URL Provided</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3.5 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#64748B] block">
                        codementors.com
                      </span>
                      <h4 className="font-bold text-xs text-[#0F172A] line-clamp-1">
                        {editingPage.ogTitle || editingPage.title || "Page Title"}
                      </h4>
                      <p className="text-[11px] text-[#64748B] line-clamp-2">
                        {editingPage.ogDescription || editingPage.description || "Page summary preview on feed."}
                      </p>
                    </div>
                  </div>
                )}

                {/* SEO Score Gauge Card */}
                <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-[#0F172A] block">SEO Readiness Score</span>
                    <span className="text-[11px] text-[#64748B]">
                      {validationResult?.score >= 90
                        ? "Optimal configuration for search engines"
                        : "Recommended improvements detected"}
                    </span>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-sm font-black ${
                      (validationResult?.score || 100) >= 90
                        ? "bg-emerald-100 text-emerald-800"
                        : (validationResult?.score || 100) >= 70
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {validationResult?.score || 100} / 100
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
              <div>
                {editingPage._id && !editingPage._id.startsWith("virtual_") && (
                  <button
                    type="button"
                    onClick={handleDeleteOverride}
                    disabled={deletingOverride}
                    className="px-3 py-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs cursor-pointer disabled:opacity-50"
                  >
                    {deletingOverride ? "Resetting..." : "Reset to Dynamic Defaults"}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditorModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-[#0F172A] font-semibold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleSavePageSeo("draft")}
                  disabled={savingPage}
                  className="px-3.5 py-2 rounded-lg border border-[#2563EB] text-[#2563EB] hover:bg-blue-50 font-semibold text-xs cursor-pointer disabled:opacity-50"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  onClick={() => handleSavePageSeo("published")}
                  disabled={savingPage}
                  className="px-4 py-2 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingPage ? "Saving..." : "Save & Publish Changes"}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Safe Redirect Modal */}
      {newRedirectModal && (
        <Modal
          isOpen={newRedirectModal}
          onClose={() => setNewRedirectModal(false)}
          title="Configure Safe URL Redirect"
        >
          <form onSubmit={handleCreateRedirect} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Source Path (Old URL) *</label>
              <input
                type="text"
                required
                placeholder="/courses/old-course-slug"
                value={sourcePath}
                onChange={(e) => setSourcePath(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] font-mono text-xs focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1">Destination Path (New URL) *</label>
              <input
                type="text"
                required
                placeholder="/courses/new-course-slug"
                value={destinationPath}
                onChange={(e) => setDestinationPath(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] font-mono text-xs focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">HTTP Status Code</label>
                <select
                  value={statusCode}
                  onChange={(e) => setStatusCode(Number(e.target.value) as any)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                >
                  <option value={301}>301 — Permanent Redirect (SEO Recommended)</option>
                  <option value={302}>302 — Temporary Redirect</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Admin Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Slugs consolidated"
                  value={redirectNotes}
                  onChange={(e) => setRedirectNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-[#172554] text-[11px] space-y-1">
              <span className="font-bold block">Loop Prevention Check</span>
              <p>The system automatically verifies that the destination path does not redirect back to the source.</p>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewRedirectModal(false)}
                className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-[#0F172A] font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingRedirect}
                className="px-4 py-2 rounded-lg bg-[#172554] text-white font-semibold shadow-xs disabled:opacity-50"
              >
                {savingRedirect ? "Creating..." : "Save Redirect"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
