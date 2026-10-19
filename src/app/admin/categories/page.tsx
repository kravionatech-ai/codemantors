"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import RichTextEditor from "@/components/ui/RichTextEditor";
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Globe,
  Search,
  Layers,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Eye,
  ExternalLink,
  X,
  Save,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  Check,
  Shield,
  FolderTree,
} from "lucide-react";

export default function AdminCategoriesPage() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "media" | "seo">("general");

  // Form State
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formShortDesc, setFormShortDesc] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDetailedDesc, setFormDetailedDesc] = useState("");
  const [formIcon, setFormIcon] = useState("Code");
  const [formParent, setFormParent] = useState("");
  const [formDisplayOrder, setFormDisplayOrder] = useState("0");
  const [formStatus, setFormStatus] = useState("active");
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formThumbnail, setFormThumbnail] = useState("");
  const [formBannerImage, setFormBannerImage] = useState("");

  // SEO Form State
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoCanonicalUrl, setSeoCanonicalUrl] = useState("");
  const [seoOgImage, setSeoOgImage] = useState("");
  const [seoNoIndex, setSeoNoIndex] = useState(false);
  const [seoNoFollow, setSeoNoFollow] = useState(false);
  const [seoKeywords, setSeoKeywords] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // Delete & Reassign Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<any | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState("");
  const [deleting, setDeleting] = useState(false);

  const isAdmin = Boolean(user && (user.role === "admin" || user.role === "super_admin"));

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/admin/categories");
    }
  }, [user, authLoading, router]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories?status=all");
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
      } else {
        toast.error(data.error || "Failed to load categories");
      }
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAdmin) {
      loadCategories();
    }
  }, [authLoading, isAdmin]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormName("");
    setFormSlug("");
    setFormShortDesc("");
    setFormDesc("");
    setFormDetailedDesc("");
    setFormIcon("Code");
    setFormParent("");
    setFormDisplayOrder(String(categories.length + 1));
    setFormStatus("active");
    setFormIsFeatured(false);
    setFormThumbnail("");
    setFormBannerImage("");
    setSeoTitle("");
    setSeoDescription("");
    setSeoCanonicalUrl("");
    setSeoOgImage("");
    setSeoNoIndex(false);
    setSeoNoFollow(false);
    setSeoKeywords("");
    setActiveTab("general");
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (cat: any) => {
    setEditingCategory(cat);
    setFormName(cat.name || "");
    setFormSlug(cat.slug || "");
    setFormShortDesc(cat.shortDescription || "");
    setFormDesc(cat.description || "");
    setFormDetailedDesc(cat.detailedDescription || "");
    setFormIcon(cat.icon || "Code");
    setFormParent(cat.parentCategory?._id || cat.parentCategory || "");
    setFormDisplayOrder(String(cat.displayOrder || 0));
    setFormStatus(cat.status || "active");
    setFormIsFeatured(Boolean(cat.isFeatured));
    setFormThumbnail(cat.thumbnail || "");
    setFormBannerImage(cat.bannerImage || "");
    setSeoTitle(cat.seo?.title || "");
    setSeoDescription(cat.seo?.description || "");
    setSeoCanonicalUrl(cat.seo?.canonicalUrl || "");
    setSeoOgImage(cat.seo?.ogImage || "");
    setSeoNoIndex(Boolean(cat.seo?.noIndex));
    setSeoNoFollow(Boolean(cat.seo?.noFollow));
    setSeoKeywords((cat.seo?.keywords || []).join(", "));
    setActiveTab("general");
    setModalOpen(true);
  };

  // Auto-generate slug on name change
  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingCategory) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setFormSlug(generated);
      if (!seoTitle) {
        setSeoTitle(`${val.trim()} Courses | CodeMentors`);
      }
    }
  };

  // Save (Create or Update)
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Category name is required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        slug: formSlug.trim(),
        shortDescription: formShortDesc.trim(),
        description: formDesc.trim(),
        detailedDescription: formDetailedDesc.trim(),
        icon: formIcon,
        parentCategory: formParent ? formParent : null,
        displayOrder: Number(formDisplayOrder || 0),
        status: formStatus,
        isFeatured: formIsFeatured,
        thumbnail: formThumbnail.trim(),
        bannerImage: formBannerImage.trim(),
        seo: {
          title: seoTitle.trim(),
          description: seoDescription.trim(),
          canonicalUrl: seoCanonicalUrl.trim(),
          ogImage: seoOgImage.trim(),
          noIndex: seoNoIndex,
          noFollow: seoNoFollow,
          keywords: seoKeywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
        },
      };

      const url = editingCategory
        ? `/api/categories/${editingCategory._id}`
        : `/api/categories`;
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Category saved successfully!");
        setModalOpen(false);
        loadCategories();
      } else {
        toast.error(data.error || "Failed to save category");
      }
    } catch {
      toast.error("Network error while saving category");
    } finally {
      setSubmitting(false);
    }
  };

  // Reorder category (Move Up / Down)
  const handleReorder = async (cat: any, direction: "up" | "down") => {
    const sorted = [...categories].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    const currIdx = sorted.findIndex((c) => c._id === cat._id);
    if (currIdx === -1) return;

    if (direction === "up" && currIdx === 0) return;
    if (direction === "down" && currIdx === sorted.length - 1) return;

    const targetIdx = direction === "up" ? currIdx - 1 : currIdx + 1;
    const targetCat = sorted[targetIdx];

    const tempOrder = cat.displayOrder || currIdx;
    const targetOrder = targetCat.displayOrder || targetIdx;

    try {
      await fetch(`/api/categories/${cat._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayOrder: targetOrder }),
      });

      await fetch(`/api/categories/${targetCat._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayOrder: tempOrder }),
      });

      toast.success("Order updated!");
      loadCategories();
    } catch {
      toast.error("Failed to reorder categories");
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (cat: any) => {
    setCategoryToDelete(cat);
    setReassignTargetId("");
    setDeleteModalOpen(true);
  };

  // Execute Delete
  const handleExecuteDelete = async () => {
    if (!categoryToDelete) return;
    setDeleting(true);

    try {
      let url = `/api/categories/${categoryToDelete._id}`;
      if (categoryToDelete.courseCount > 0 && reassignTargetId) {
        url += `?reassignTo=${reassignTargetId}`;
      } else if (categoryToDelete.courseCount > 0) {
        url += `?force=true`;
      }

      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message || "Category removed successfully");
        setDeleteModalOpen(false);
        loadCategories();
      } else {
        toast.error(data.error || "Failed to delete category");
      }
    } catch {
      toast.error("Failed to delete category");
    } finally {
      setDeleting(false);
    }
  };

  // Filter categories
  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      cat.name?.toLowerCase().includes(search.toLowerCase()) ||
      cat.slug?.toLowerCase().includes(search.toLowerCase()) ||
      cat.description?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ? true : cat.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (authLoading) {
    return (
      <div className="py-20 text-center text-[#64748B] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#DC2626]" />
        <p className="text-sm font-medium">Authenticating Administrative Session...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs text-center space-y-4">
        <h2 className="text-lg font-bold text-[#0F172A]">Access Restricted: Administrator Privileges Required</h2>
        <p className="text-xs text-[#64748B]">Your account does not have permission to manage course taxonomy.</p>
        <div className="pt-2">
          <Link
            href="/student/dashboard"
            className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#172554] tracking-tight">Taxonomy & Category CMS</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
              {categories.length} Categories
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Configure learning domains, subcategories, curriculum hierarchies, and independent page-by-page SEO.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/seo"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>SEO Center</span>
          </Link>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search categories by name, slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-[#64748B] hidden sm:inline">Status:</span>
          <div className="flex rounded-lg border border-[#E2E8F0] p-0.5 bg-slate-50 text-xs">
            {["all", "active", "draft", "archived"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md capitalize font-medium transition-colors ${
                  statusFilter === st
                    ? "bg-white text-[#172554] shadow-xs font-bold"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Categories Table & List */}
      {loading ? (
        <div className="py-20 text-center text-[#64748B]">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-3" />
          <p className="text-sm">Loading categories taxonomy...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center space-y-3 max-w-md mx-auto">
          <Tag className="w-8 h-8 text-[#94A3B8] mx-auto" />
          <h3 className="font-bold text-[#0F172A] text-sm">No Categories Found</h3>
          <p className="text-xs text-[#64748B]">
            No category matches your current filter criteria.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2563EB] rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Category
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[#64748B] font-semibold">
                  <th className="py-3 px-4 w-12 text-center">Order</th>
                  <th className="py-3 px-4">Category Details</th>
                  <th className="py-3 px-4">Subcategory Of</th>
                  <th className="py-3 px-4 text-center">Courses</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">SEO Config</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredCategories.map((cat, idx) => (
                  <tr key={cat._id || cat.slug} className="hover:bg-slate-50/80 transition-colors">
                    {/* Order Controls */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleReorder(cat, "up")}
                          disabled={idx === 0}
                          className="p-1 text-[#94A3B8] hover:text-[#0F172A] disabled:opacity-20 cursor-pointer"
                          title="Move up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleReorder(cat, "down")}
                          disabled={idx === filteredCategories.length - 1}
                          className="p-1 text-[#94A3B8] hover:text-[#0F172A] disabled:opacity-20 cursor-pointer"
                          title="Move down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Category Title & Slug */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200">
                          <Tag className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#0F172A] text-sm">{cat.name}</span>
                            {cat.isFeatured && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                                Featured
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-mono text-[#64748B]">/categories/{cat.slug}</span>
                            <Link
                              href={`/categories/${cat.slug}`}
                              target="_blank"
                              className="text-[#94A3B8] hover:text-[#2563EB]"
                              title="View Public Page"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                          {cat.shortDescription && (
                            <p className="text-[11px] text-[#94A3B8] line-clamp-1 mt-0.5">
                              {cat.shortDescription}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Parent Category */}
                    <td className="py-3 px-4">
                      {cat.parentCategory ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-slate-100 text-[#475569] font-medium border border-slate-200">
                          <FolderTree className="w-3 h-3 text-[#64748B]" />
                          {cat.parentCategory.name}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#94A3B8] italic">Top-Level Domain</span>
                      )}
                    </td>

                    {/* Courses Count */}
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-1 rounded-full bg-slate-100 font-bold text-[#172554] text-xs">
                        {cat.courseCount || 0}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          cat.status === "active"
                            ? "bg-emerald-50 text-[#16A34A] border border-emerald-200"
                            : cat.status === "draft"
                            ? "bg-amber-50 text-amber-600 border border-amber-200"
                            : "bg-slate-100 text-[#64748B] border border-slate-200"
                        }`}
                      >
                        {cat.status || "active"}
                      </span>
                    </td>

                    {/* SEO Status */}
                    <td className="py-3 px-4">
                      {cat.seo?.title && cat.seo?.description ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Custom Metadata</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-600 text-[11px] font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Default Metadata</span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-blue-50 hover:text-[#2563EB] text-[#64748B] transition-colors cursor-pointer"
                          title="Edit Category & SEO"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(cat)}
                          className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-red-50 hover:text-[#DC2626] text-[#64748B] transition-colors cursor-pointer"
                          title="Delete or Archive Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE & EDIT MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? `Edit Category: ${editingCategory.name}` : "Create Course Category"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          {/* Tabs */}
          <div className="flex border-b border-[#E2E8F0] gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={`pb-2.5 transition-colors border-b-2 cursor-pointer ${
                activeTab === "general"
                  ? "border-[#2563EB] text-[#2563EB]"
                  : "border-transparent text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              1. General Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("media")}
              className={`pb-2.5 transition-colors border-b-2 cursor-pointer ${
                activeTab === "media"
                  ? "border-[#2563EB] text-[#2563EB]"
                  : "border-transparent text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              2. Media & Creatives
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("seo")}
              className={`pb-2.5 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === "seo"
                  ? "border-[#2563EB] text-[#2563EB]"
                  : "border-transparent text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>3. Independent SEO Controls</span>
            </button>
          </div>

          {/* TAB 1: GENERAL */}
          {activeTab === "general" && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Web Development, AI & ML"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    URL Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. web-development"
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Parent Category (Optional Subcategory Assignment)
                </label>
                <select
                  value={formParent}
                  onChange={(e) => setFormParent(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] bg-white focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="">None (Top-Level Domain Category)</option>
                  {categories
                    .filter((c) => !editingCategory || c._id !== editingCategory._id)
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.slug})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  value={formShortDesc}
                  onChange={(e) => setFormShortDesc(e.target.value)}
                  placeholder="One sentence overview shown on catalog cards..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Detailed Description (Public Page Header)
                </label>
                <RichTextEditor
                  value={formDetailedDesc || formDesc}
                  onChange={(val) => {
                    setFormDetailedDesc(val);
                    setFormDesc(val);
                  }}
                  placeholder="Provide comprehensive background and learning curriculum details for this domain..."
                  minHeight="180px"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] bg-white"
                  >
                    <option value="active">Active (Published)</option>
                    <option value="draft">Draft (Hidden)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="featured-checkbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="rounded text-[#2563EB] focus:ring-0"
                  />
                  <label htmlFor="featured-checkbox" className="text-xs font-semibold text-[#0F172A] cursor-pointer">
                    Feature on Homepage
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MEDIA */}
          {activeTab === "media" && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Thumbnail Image URL
                </label>
                <input
                  type="url"
                  value={formThumbnail}
                  onChange={(e) => setFormThumbnail(e.target.value)}
                  placeholder="https://example.com/images/category-thumb.jpg"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Banner Image URL (Landing Page Header)
                </label>
                <input
                  type="url"
                  value={formBannerImage}
                  onChange={(e) => setFormBannerImage(e.target.value)}
                  placeholder="https://example.com/images/category-banner.jpg"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              {(formThumbnail || formBannerImage) && (
                <div className="p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl space-y-2">
                  <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Preview</span>
                  <div className="h-28 w-full rounded-lg overflow-hidden border border-[#E2E8F0] bg-slate-200">
                    <img
                      src={formBannerImage || formThumbnail}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SEO */}
          {activeTab === "seo" && (
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#0F172A]">SEO Title</label>
                  <span
                    className={`text-[10px] font-mono ${
                      seoTitle.length > 60 ? "text-amber-600 font-bold" : "text-[#94A3B8]"
                    }`}
                  >
                    {seoTitle.length}/60 chars
                  </span>
                </div>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="e.g. Master Web Development — Tutorials & Certification | CodeMentors"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#0F172A]">Meta Description</label>
                  <span
                    className={`text-[10px] font-mono ${
                      seoDescription.length > 160 ? "text-amber-600 font-bold" : "text-[#94A3B8]"
                    }`}
                  >
                    {seoDescription.length}/160 chars
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Authoritative search snippet describing the course category..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">Canonical URL</label>
                  <input
                    type="text"
                    value={seoCanonicalUrl}
                    onChange={(e) => setSeoCanonicalUrl(e.target.value)}
                    placeholder={`/categories/${formSlug || "slug"}`}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-[#E2E8F0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">Social Sharing Image (OG Image)</label>
                  <input
                    type="url"
                    value={seoOgImage}
                    onChange={(e) => setSeoOgImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">Meta Keywords (Comma separated)</label>
                <input
                  type="text"
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                  placeholder="web development, nextjs, react, backend"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0]"
                />
              </div>

              {/* Robots Directives */}
              <div className="p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl flex items-center gap-6 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!seoNoIndex}
                    onChange={(e) => setSeoNoIndex(!e.target.checked)}
                    className="rounded text-[#2563EB]"
                  />
                  <span className="font-medium text-[#0F172A]">Index in Search Engines (robots: index)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!seoNoFollow}
                    onChange={(e) => setSeoNoFollow(!e.target.checked)}
                    className="rounded text-[#2563EB]"
                  />
                  <span className="font-medium text-[#0F172A]">Follow Links (robots: follow)</span>
                </label>
              </div>

              {/* Live SERP Preview */}
              <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                  Google Search Result Preview
                </span>
                <div className="text-[11px] text-[#202124] truncate">
                  https://codementors.com &gt; categories &gt; {formSlug || "slug"}
                </div>
                <div className="text-sm font-semibold text-[#1a0dab] hover:underline truncate">
                  {seoTitle || `${formName || "Category"} Courses | CodeMentors`}
                </div>
                <div className="text-xs text-[#4d5156] line-clamp-2 leading-relaxed">
                  {seoDescription ||
                    formShortDesc ||
                    "Master verified programming and engineering skills with CodeMentors courses."}
                </div>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] rounded-lg border border-[#E2E8F0] hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{editingCategory ? "Update Category" : "Create Category"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE / REASSIGN MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={`Delete Category: ${categoryToDelete?.name}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          {categoryToDelete?.courseCount > 0 ? (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Category Has {categoryToDelete.courseCount} Active Courses</span>
                </div>
                <p>
                  To prevent orphaning published courses, please select a replacement category to reassign them to before deletion.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Reassign courses to:
                </label>
                <select
                  value={reassignTargetId}
                  onChange={(e) => setReassignTargetId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] bg-white focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="">Select Target Category...</option>
                  {categories
                    .filter((c) => c._id !== categoryToDelete?._id)
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#64748B]">
              Are you sure you want to permanently delete category{" "}
              <strong className="text-[#0F172A]">{categoryToDelete?.name}</strong>? This action cannot be undone.
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-3 py-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0] rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteDelete}
              disabled={deleting || (categoryToDelete?.courseCount > 0 && !reassignTargetId)}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#DC2626] hover:bg-rose-700 rounded-lg disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{categoryToDelete?.courseCount > 0 ? "Reassign & Delete" : "Confirm Delete"}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
