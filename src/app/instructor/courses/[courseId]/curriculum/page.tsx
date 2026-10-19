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
  Plus,
  Video,
  FileText,
  FolderTree,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Eye,
  Save,
  Loader2,
  CheckCircle2,
  Layers,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Lock,
  Unlock,
  BookOpen,
  Code2,
  Copy,
  HelpCircle,
  Download,
  Globe,
  Check,
  AlertTriangle,
  Info,
  Lightbulb,
} from "lucide-react";

interface ContentBlock {
  type: "text" | "video" | "pdf" | "code" | "callout";
  content?: string;
  videoUrl?: string;
  pdfUrl?: string;
  language?: string;
  calloutType?: "info" | "warning" | "success" | "tip";
  order: number;
}

export default function CurriculumBuilderPage({
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
  const [modules, setModules] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // Module Modal State
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [editingModuleIdx, setEditingModuleIdx] = useState<number | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDesc, setModuleDesc] = useState("");
  const [moduleStatus, setModuleStatus] = useState<"published" | "draft">("published");
  const [moduleIsRequired, setModuleIsRequired] = useState(true);
  const [moduleVideoUrl, setModuleVideoUrl] = useState("");
  const [moduleVideoDuration, setModuleVideoDuration] = useState("10");
  const [modulePdfUrl, setModulePdfUrl] = useState("");
  const [modulePdfTitle, setModulePdfTitle] = useState("");
  const [moduleNotes, setModuleNotes] = useState("");
  const [moduleObjectives, setModuleObjectives] = useState("");

  // Lesson Modal State
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [targetModuleIdx, setTargetModuleIdx] = useState<number | null>(null);
  const [editingLessonIdx, setEditingLessonIdx] = useState<number | null>(null);

  // Lesson form state
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonType, setLessonType] = useState<
    "video" | "article" | "text" | "pdf" | "mixed" | "quiz" | "resource"
  >("video");
  const [lessonDuration, setLessonDuration] = useState("10");
  const [lessonIsPreview, setLessonIsPreview] = useState(false);
  const [lessonIsRequired, setLessonIsRequired] = useState(true);
  const [lessonStatus, setLessonStatus] = useState<"published" | "draft">("published");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonPdfUrl, setLessonPdfUrl] = useState("");
  const [lessonPdfTitle, setLessonPdfTitle] = useState("");
  const [lessonFileSize, setLessonFileSize] = useState("");
  const [lessonDownloadAllowed, setLessonDownloadAllowed] = useState(true);
  const [lessonReadingTime, setLessonReadingTime] = useState("5");

  // Content blocks for mixed lessons
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);

  // Lesson SEO
  const [lessonSeoTitle, setLessonSeoTitle] = useState("");
  const [lessonSeoDesc, setLessonSeoDesc] = useState("");
  const [lessonSeoNoIndex, setLessonSeoNoIndex] = useState(false);

  // Active tab in lesson modal: 'content' | 'blocks' | 'seo'
  const [lessonModalTab, setLessonModalTab] = useState<"content" | "blocks" | "seo">("content");

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "instructor" && user.role !== "admin" && user.role !== "super_admin"))) {
      router.push("/student/dashboard");
    }
  }, [user, authLoading, router]);

  const fetchCourseData = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}`);
      const data = await res.json();
      if (data.success && data.course) {
        setCourse(data.course);
        setModules(data.course.modules || []);
      } else {
        toast.error(data.error || "Failed to load course");
        router.push("/instructor/courses");
      }
    } catch (err) {
      console.error("Error loading curriculum:", err);
      toast.error("Failed to load curriculum");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) fetchCourseData();
  }, [courseId]);

  // Persist modules to DB
  const persistModules = async (updatedModules: any[]) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modules: updatedModules }),
      });

      const data = await res.json();
      if (data.success) {
        setModules(data.course.modules);
        setCourse(data.course);
        toast.success("Curriculum saved to database!");
      } else {
        toast.error(data.error || "Failed to save curriculum changes");
      }
    } catch {
      toast.error("Network error while saving curriculum");
    } finally {
      setSaving(false);
    }
  };

  // Module Actions
  const handleOpenNewModule = () => {
    setEditingModuleIdx(null);
    setModuleTitle("");
    setModuleDesc("");
    setModuleStatus("published");
    setModuleIsRequired(true);
    setModuleVideoUrl("");
    setModuleVideoDuration("10");
    setModulePdfUrl("");
    setModulePdfTitle("");
    setModuleNotes("");
    setModuleObjectives("");
    setModuleModalOpen(true);
  };

  const handleEditModule = (mIdx: number) => {
    const mod = modules[mIdx];
    setEditingModuleIdx(mIdx);
    setModuleTitle(mod.title || "");
    setModuleDesc(mod.description || "");
    setModuleStatus(mod.status || "published");
    setModuleIsRequired(mod.isRequired !== false);
    setModuleVideoUrl(mod.videoUrl || "");
    setModuleVideoDuration(String(Math.round((mod.videoDuration || 600) / 60)));
    setModulePdfUrl(mod.pdfUrl || "");
    setModulePdfTitle(mod.pdfTitle || "");
    setModuleNotes(mod.notes || "");
    setModuleObjectives((mod.learningObjectives || []).join("\n"));
    setModuleModalOpen(true);
  };

  const handleDuplicateModule = async (mIdx: number) => {
    const mod = modules[mIdx];
    if (!mod?._id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "duplicate",
          sourceModuleId: mod._id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `Module "${mod.title}" duplicated!`);
        setModules(data.modules);
      } else {
        toast.error(data.error || "Failed to duplicate module");
      }
    } catch {
      toast.error("Network error while duplicating module");
    } finally {
      setSaving(false);
    }
  };

  const handleInsertW3SchoolsTemplate = () => {
    setModuleNotes(`# ${moduleTitle.trim() || "Module Topic"} Handbook

A comprehensive W3Schools-style tutorial and reference guide.

> **Note:** Master the core concepts through practical syntax and runnable examples.

## Key Concept & Mechanics

Components and server functions serve as the fundamental building blocks of modern applications.

### Example
Practical live example demonstrating the concept:
\`\`\`html
<div style="padding: 16px; background: #f8fafc; border: 2px solid #04AA6D; border-radius: 8px;">
  <h3 style="color: #172554; margin-top: 0;">Interactive Demo</h3>
  <p style="color: #475569;">This code can be edited and executed inside the CodeMentors sandbox.</p>
</div>
\`\`\`

> **Tip:** Click **"Try it Yourself »"** to modify and run this code live in the interactive browser sandbox!

## Best Practices & Standards

| Standard | Recommendation | Impact |
| :--- | :--- | :--- |
| **Purity** | Pure deterministic functions | Predictable execution |
| **Performance** | Minimal client payload | Faster Core Web Vitals |
`);
  };

  const handleSaveModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle.trim()) return;

    let updated = [...modules];
    const modData = {
      title: moduleTitle.trim(),
      description: moduleDesc.trim(),
      status: moduleStatus,
      isRequired: moduleIsRequired,
      learningObjectives: moduleObjectives
        .split("\n")
        .map((o) => o.trim())
        .filter(Boolean),
      videoUrl: moduleVideoUrl.trim(),
      videoDuration: Number(moduleVideoDuration || 10) * 60,
      pdfUrl: modulePdfUrl.trim(),
      pdfTitle: modulePdfTitle.trim() || `${moduleTitle.trim()}_Handbook.pdf`,
      notes: moduleNotes.trim(),
    };

    if (editingModuleIdx !== null) {
      updated[editingModuleIdx] = {
        ...updated[editingModuleIdx],
        ...modData,
      };
    } else {
      updated.push({
        ...modData,
        order: updated.length + 1,
        lessons: [],
      });
    }

    setModuleModalOpen(false);
    persistModules(updated);
  };

  const handleDeleteModule = (mIdx: number) => {
    if (confirm(`Delete Module: "${modules[mIdx].title}" and all its lessons?`)) {
      const updated = modules.filter((_, idx) => idx !== mIdx);
      persistModules(updated);
    }
  };

  const handleMoveModule = (mIdx: number, direction: "up" | "down") => {
    if (direction === "up" && mIdx === 0) return;
    if (direction === "down" && mIdx === modules.length - 1) return;

    const targetIdx = direction === "up" ? mIdx - 1 : mIdx + 1;
    const updated = [...modules];
    const temp = updated[mIdx];
    updated[mIdx] = updated[targetIdx];
    updated[targetIdx] = temp;

    persistModules(updated);
  };

  // Lesson Actions
  const handleOpenNewLesson = (mIdx: number) => {
    setTargetModuleIdx(mIdx);
    setEditingLessonIdx(null);
    setLessonTitle("");
    setLessonType("video");
    setLessonDuration("10");
    setLessonIsPreview(false);
    setLessonIsRequired(true);
    setLessonStatus("published");
    setLessonVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    setLessonContent("");
    setLessonPdfUrl("");
    setLessonPdfTitle("");
    setLessonFileSize("");
    setLessonDownloadAllowed(true);
    setLessonReadingTime("5");
    setContentBlocks([]);
    setLessonSeoTitle("");
    setLessonSeoDesc("");
    setLessonSeoNoIndex(false);
    setLessonModalTab("content");
    setLessonModalOpen(true);
  };

  const handleEditLesson = (mIdx: number, lIdx: number) => {
    const les = modules[mIdx].lessons[lIdx];
    setTargetModuleIdx(mIdx);
    setEditingLessonIdx(lIdx);
    setLessonTitle(les.title || "");
    setLessonType(les.type || "video");
    setLessonDuration(String(les.durationMinutes || 10));
    setLessonIsPreview(Boolean(les.isPreview));
    setLessonIsRequired(les.isRequired !== false);
    setLessonStatus(les.status || "published");
    setLessonVideoUrl(les.videoUrl || "");
    setLessonContent(les.content || "");
    setLessonPdfUrl(les.pdfUrl || "");
    setLessonPdfTitle(les.pdfTitle || "");
    setLessonFileSize(les.fileSize || "");
    setLessonDownloadAllowed(les.downloadAllowed !== false);
    setLessonReadingTime(String(les.readingTimeMinutes || 5));
    setContentBlocks(Array.isArray(les.contentBlocks) ? JSON.parse(JSON.stringify(les.contentBlocks)) : []);
    setLessonSeoTitle(les.seo?.title || "");
    setLessonSeoDesc(les.seo?.description || "");
    setLessonSeoNoIndex(Boolean(les.seo?.noIndex));
    setLessonModalTab("content");
    setLessonModalOpen(true);
  };

  const handleDuplicateLesson = async (mIdx: number, lIdx: number) => {
    const mod = modules[mIdx];
    const les = mod.lessons[lIdx];
    if (!mod?._id || !les?._id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "duplicate",
          sourceModuleId: mod._id,
          sourceLessonId: les._id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `Lesson "${les.title}" duplicated!`);
        setModules(data.modules);
      } else {
        toast.error(data.error || "Failed to duplicate lesson");
      }
    } catch {
      toast.error("Network error while duplicating lesson");
    } finally {
      setSaving(false);
    }
  };

  // Content Blocks Builder Helpers
  const handleAddBlock = (type: "text" | "video" | "pdf" | "code" | "callout") => {
    const newBlock: ContentBlock = {
      type,
      order: contentBlocks.length + 1,
      content:
        type === "text"
          ? "Write formatted paragraph or instructions here..."
          : type === "code"
          ? "const greeting = 'Hello CodeMentors';\nconsole.log(greeting);"
          : type === "callout"
          ? "Important key takeaway for this section."
          : "",
      videoUrl: type === "video" ? "https://www.youtube.com/watch?v=dQw4w9WgXcQ" : undefined,
      pdfUrl: type === "pdf" ? "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" : undefined,
      language: type === "code" ? "typescript" : undefined,
      calloutType: type === "callout" ? "info" : undefined,
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

  const handleUpdateBlock = (idx: number, updates: Partial<ContentBlock>) => {
    const updated = [...contentBlocks];
    updated[idx] = { ...updated[idx], ...updates };
    setContentBlocks(updated);
  };

  const handleRemoveBlock = (idx: number) => {
    const updated = contentBlocks.filter((_, i) => i !== idx);
    setContentBlocks(updated);
  };

  const handleMoveBlock = (idx: number, direction: "up" | "down") => {
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === contentBlocks.length - 1) return;
    const target = direction === "up" ? idx - 1 : idx + 1;
    const updated = [...contentBlocks];
    const temp = updated[idx];
    updated[idx] = updated[target];
    updated[target] = temp;
    setContentBlocks(updated);
  };

  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetModuleIdx === null || !lessonTitle.trim()) return;

    const updated = [...modules];
    const moduleToUpdate = { ...updated[targetModuleIdx] };
    const lessonsList = [...(moduleToUpdate.lessons || [])];

    const slug = lessonTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const lessonData = {
      title: lessonTitle.trim(),
      slug: slug || `lesson-${Date.now()}`,
      type: lessonType,
      durationMinutes: Number(lessonDuration || 5),
      isPreview: lessonIsPreview,
      isRequired: lessonIsRequired,
      status: lessonStatus,
      videoUrl: lessonType === "video" ? lessonVideoUrl.trim() : "",
      content:
        lessonType === "article" || lessonType === "text" || lessonType === "resource"
          ? lessonContent.trim()
          : "",
      pdfUrl: lessonType === "pdf" || lessonType === "resource" ? lessonPdfUrl.trim() : "",
      pdfTitle: lessonType === "pdf" || lessonType === "resource" ? (lessonPdfTitle.trim() || `${lessonTitle.trim()}.pdf`) : "",
      fileSize: lessonFileSize.trim(),
      downloadAllowed: lessonDownloadAllowed,
      readingTimeMinutes: Number(lessonReadingTime || 5),
      contentBlocks: lessonType === "mixed" ? contentBlocks : [],
      seo: {
        title: lessonSeoTitle.trim() || `${lessonTitle.trim()} | ${course?.title}`,
        description: lessonSeoDesc.trim() || `Learn ${lessonTitle.trim()} on CodeMentors.`,
        keywords: [lessonTitle.trim(), course?.title || ""],
        canonicalUrl: `/learn/${course?.slug}/${slug || "lesson"}`,
        noIndex: lessonSeoNoIndex,
        noFollow: false,
      },
      order: editingLessonIdx !== null ? lessonsList[editingLessonIdx].order : lessonsList.length + 1,
    };

    if (editingLessonIdx !== null) {
      lessonsList[editingLessonIdx] = { ...lessonsList[editingLessonIdx], ...lessonData };
    } else {
      lessonsList.push(lessonData);
    }

    moduleToUpdate.lessons = lessonsList;
    updated[targetModuleIdx] = moduleToUpdate;

    setLessonModalOpen(false);
    persistModules(updated);
  };

  const handleDeleteLesson = (mIdx: number, lIdx: number) => {
    if (confirm(`Remove lesson "${modules[mIdx].lessons[lIdx].title}"?`)) {
      const updated = [...modules];
      updated[mIdx].lessons = updated[mIdx].lessons.filter((_: any, idx: number) => idx !== lIdx);
      persistModules(updated);
    }
  };

  const handleMoveLesson = (mIdx: number, lIdx: number, direction: "up" | "down") => {
    const list = modules[mIdx].lessons;
    if (direction === "up" && lIdx === 0) return;
    if (direction === "down" && lIdx === list.length - 1) return;

    const targetIdx = direction === "up" ? lIdx - 1 : lIdx + 1;
    const updated = [...modules];
    const updatedLessons = [...list];
    const temp = updatedLessons[lIdx];
    updatedLessons[lIdx] = updatedLessons[targetIdx];
    updatedLessons[targetIdx] = temp;

    updated[mIdx].lessons = updatedLessons;
    persistModules(updated);
  };

  if (authLoading || loading) {
    return (
      <div className="py-20 text-center text-[#64748B]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-3" />
        <p className="text-sm">Loading curriculum modules...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <Link
            href="/instructor/courses"
            className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-[#64748B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-[#172554] tracking-tight">Curriculum Builder</h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Course: <strong className="text-[#0F172A]">{course?.title}</strong> • Format:{" "}
              <span className="font-semibold text-[#2563EB]">{course?.format || "Video"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleOpenNewModule}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Module
          </button>
          <Link
            href={`/instructor/courses/${courseId}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] hover:bg-slate-50 transition-colors"
          >
            Settings & SEO
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

      {saving && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-[#2563EB] flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Synchronizing curriculum changes to database...
        </div>
      )}

      {modules.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center shadow-xs">
          <FolderTree className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
          <h3 className="text-base font-bold text-[#172554]">Curriculum is Empty</h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto mt-1 mb-6">
            Begin structuring your course by adding your first module (e.g. "Module 1: Foundations").
          </p>
          <button
            onClick={handleOpenNewModule}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create First Module
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {modules.map((mod: any, mIdx: number) => (
            <div
              key={mod._id || mIdx}
              className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs"
            >
              {/* Module Header Bar */}
              <div className="p-4 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="w-7 h-7 rounded bg-[#172554] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {mIdx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-[#0F172A] leading-tight line-clamp-1">
                        {mod.title}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                          mod.status === "draft"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {mod.status || "published"}
                      </span>
                      {mod.isRequired === false && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          Optional
                        </span>
                      )}
                    </div>
                    {mod.description && (
                      <p className="text-[11px] text-[#64748B] line-clamp-1 mt-0.5">{mod.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleMoveModule(mIdx, "up")}
                    disabled={mIdx === 0}
                    className="p-1 rounded text-[#64748B] hover:text-[#0F172A] disabled:opacity-30 cursor-pointer"
                    title="Move Module Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveModule(mIdx, "down")}
                    disabled={mIdx === modules.length - 1}
                    className="p-1 rounded text-[#64748B] hover:text-[#0F172A] disabled:opacity-30 cursor-pointer"
                    title="Move Module Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDuplicateModule(mIdx)}
                    className="p-1 rounded text-[#64748B] hover:text-purple-600 cursor-pointer"
                    title="Duplicate Module"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleEditModule(mIdx)}
                    className="p-1 rounded text-[#64748B] hover:text-[#2563EB] cursor-pointer"
                    title="Edit Module Details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteModule(mIdx)}
                    className="p-1 rounded text-[#64748B] hover:text-[#DC2626] cursor-pointer"
                    title="Delete Module"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Module Asset Indicators (Video, Notes, PDF) */}
              <div className="px-4 py-2.5 bg-slate-100/70 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <span className="flex items-center gap-1 font-semibold text-[#0F172A]">
                    <Video className={`w-3.5 h-3.5 ${mod.videoUrl ? "text-[#2563EB]" : "text-[#94A3B8]"}`} />
                    <span>Video: {mod.videoUrl ? `${Math.round((mod.videoDuration || 600) / 60)} min` : "Not set"}</span>
                  </span>

                  <span className="flex items-center gap-1 font-semibold text-[#0F172A]">
                    <BookOpen className={`w-3.5 h-3.5 ${mod.notes ? "text-[#04AA6D]" : "text-[#94A3B8]"}`} />
                    <span>Notes: {mod.notes ? "W3Schools Tutorial" : "Not set"}</span>
                  </span>

                  <span className="flex items-center gap-1 font-semibold text-[#0F172A]">
                    <FileText className={`w-3.5 h-3.5 ${mod.pdfUrl ? "text-[#DC2626]" : "text-[#94A3B8]"}`} />
                    <span>PDF: {mod.pdfUrl ? (mod.pdfTitle || "Handbook Attached") : "Not set"}</span>
                  </span>
                </div>

                <button
                  onClick={() => handleEditModule(mIdx)}
                  className="text-[#2563EB] hover:text-blue-800 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Configure Assets</span>
                </button>
              </div>

              {/* Module Lessons List */}
              <div className="p-4 space-y-2">
                {(!mod.lessons || mod.lessons.length === 0) ? (
                  <div className="py-4 text-center border border-dashed border-[#E2E8F0] rounded-lg">
                    <p className="text-xs text-[#94A3B8]">No lessons in this module yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mod.lessons.map((les: any, lIdx: number) => {
                      const typeBadge = {
                        video: { label: "Video", bg: "bg-blue-100 text-[#2563EB]", icon: <Video className="w-3.5 h-3.5" /> },
                        article: { label: "Article", bg: "bg-emerald-100 text-[#16A34A]", icon: <FileText className="w-3.5 h-3.5" /> },
                        text: { label: "Text", bg: "bg-emerald-100 text-[#16A34A]", icon: <FileText className="w-3.5 h-3.5" /> },
                        pdf: { label: "PDF Document", bg: "bg-red-100 text-[#DC2626]", icon: <FileText className="w-3.5 h-3.5" /> },
                        mixed: { label: "Mixed Media", bg: "bg-purple-100 text-purple-700", icon: <Layers className="w-3.5 h-3.5" /> },
                        quiz: { label: "Quiz", bg: "bg-amber-100 text-amber-700", icon: <HelpCircle className="w-3.5 h-3.5" /> },
                        resource: { label: "Resource", bg: "bg-sky-100 text-sky-700", icon: <Download className="w-3.5 h-3.5" /> },
                      }[les.type as string] || { label: "Lesson", bg: "bg-slate-100 text-slate-700", icon: <FileText className="w-3.5 h-3.5" /> };

                      return (
                        <div
                          key={les._id || lIdx}
                          className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${typeBadge.bg}`}>
                              {typeBadge.icon}
                            </div>

                            <div>
                              <div className="font-semibold text-[#0F172A] line-clamp-1 flex items-center gap-2">
                                <span>{les.title}</span>
                                {les.isPreview ? (
                                  <span className="text-[10px] font-bold text-[#16A34A] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                    Previewable
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-[#94A3B8] flex items-center gap-0.5">
                                    <Lock className="w-2.5 h-2.5" /> Restricted
                                  </span>
                                )}
                                {les.status === "draft" && (
                                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 uppercase">
                                    Draft
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#64748B]">
                                {typeBadge.label} • {les.durationMinutes || 5} mins
                                {les.contentBlocks?.length > 0 && ` • ${les.contentBlocks.length} content blocks`}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleMoveLesson(mIdx, lIdx, "up")}
                              disabled={lIdx === 0}
                              className="p-1 rounded text-[#64748B] hover:text-[#0F172A] disabled:opacity-30 cursor-pointer"
                              title="Move Lesson Up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleMoveLesson(mIdx, lIdx, "down")}
                              disabled={lIdx === mod.lessons.length - 1}
                              className="p-1 rounded text-[#64748B] hover:text-[#0F172A] disabled:opacity-30 cursor-pointer"
                              title="Move Lesson Down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDuplicateLesson(mIdx, lIdx)}
                              className="p-1 rounded text-[#64748B] hover:text-purple-600 cursor-pointer"
                              title="Duplicate Lesson"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleEditLesson(mIdx, lIdx)}
                              className="p-1 rounded text-[#64748B] hover:text-[#2563EB] cursor-pointer"
                              title="Edit Lesson Content"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteLesson(mIdx, lIdx)}
                              className="p-1 rounded text-[#64748B] hover:text-[#DC2626] cursor-pointer"
                              title="Delete Lesson"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => handleOpenNewLesson(mIdx)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:text-blue-700 py-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Lesson to Module {mIdx + 1}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Module Modal */}
      <Modal
        isOpen={moduleModalOpen}
        onClose={() => setModuleModalOpen(false)}
        title={editingModuleIdx !== null ? "Edit Module Details" : "Add New Curriculum Module"}
      >
        <form onSubmit={handleSaveModule} className="space-y-4 max-h-[78vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Module Title <span className="text-[#DC2626]">*</span>
            </label>
            <input
              type="text"
              required
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              placeholder="e.g. Module 1: System Architecture & Routing"
              className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Module Status
              </label>
              <select
                value={moduleStatus}
                onChange={(e) => setModuleStatus(e.target.value as any)}
                className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
              >
                <option value="published">Published</option>
                <option value="draft">Draft (Hidden)</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={moduleIsRequired}
                  onChange={(e) => setModuleIsRequired(e.target.checked)}
                  className="w-4 h-4 text-[#2563EB] rounded border-[#E2E8F0]"
                />
                <span>Required for course completion</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Module Objective / Description
            </label>
            <RichTextEditor
              value={moduleDesc}
              onChange={(val) => setModuleDesc(val)}
              placeholder="Module overview, competencies, and scope..."
              minHeight="160px"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Key Learning Objectives (One per line)
            </label>
            <textarea
              rows={2}
              value={moduleObjectives}
              onChange={(e) => setModuleObjectives(e.target.value)}
              placeholder="Understand server actions&#10;Implement optimistic updates"
              className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
            />
          </div>

          {/* Module Dedicated Video Lecture */}
          <div className="p-3.5 bg-blue-50/60 border border-blue-200/60 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-[#172554] flex items-center gap-1.5">
              <Video className="w-4 h-4 text-[#2563EB]" />
              <span>Module Video Lecture</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                  Video Stream / Embed URL (YouTube, Vimeo, MP4)
                </label>
                <input
                  type="text"
                  value={moduleVideoUrl}
                  onChange={(e) => setModuleVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or .mp4"
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                  Duration (mins)
                </label>
                <input
                  type="number"
                  min="1"
                  value={moduleVideoDuration}
                  onChange={(e) => setModuleVideoDuration(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                />
              </div>
            </div>
          </div>

          {/* Module Dedicated PDF Handbook */}
          <div className="p-3.5 bg-red-50/60 border border-red-200/60 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-[#172554] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#DC2626]" />
              <span>Module PDF Cheatsheet & Handbook</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                  PDF Document Title
                </label>
                <input
                  type="text"
                  value={modulePdfTitle}
                  onChange={(e) => setModulePdfTitle(e.target.value)}
                  placeholder="e.g. NextJS_Architecture_Cheatsheet.pdf"
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                  PDF Download / Direct URL
                </label>
                <input
                  type="text"
                  value={modulePdfUrl}
                  onChange={(e) => setModulePdfUrl(e.target.value)}
                  placeholder="https://.../handbook.pdf"
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                />
              </div>
            </div>
          </div>

          {/* Module Notes (W3Schools Style) */}
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/60 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#172554] flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#04AA6D]" />
                <span>W3Schools Style Module Notes & Tutorial</span>
              </h4>
              <button
                type="button"
                onClick={handleInsertW3SchoolsTemplate}
                className="px-2.5 py-1 rounded bg-[#04AA6D] hover:bg-[#059862] text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
              >
                <Code2 className="w-3 h-3" />
                <span>Insert W3Schools Template</span>
              </button>
            </div>
            <p className="text-[11px] text-[#64748B]">
              Supports Markdown, Example code blocks with green <strong>"Try it Yourself »"</strong> buttons, and <code>&gt; **Note:**</code> / <code>&gt; **Tip:**</code> callouts.
            </p>
            <textarea
              rows={6}
              value={moduleNotes}
              onChange={(e) => setModuleNotes(e.target.value)}
              placeholder="# Module Tutorial\n\nExplain key mechanics...\n\n### Example\n```html\n<h1>Hello CodeMentors</h1>\n```\n\n> **Tip:** Write clear examples."
              className="w-full text-xs font-mono px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setModuleModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#64748B] hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              Save Module
            </button>
          </div>
        </form>
      </Modal>

      {/* Lesson Modal (All 6 Lesson Types + Content Blocks + Independent SEO) */}
      <Modal
        isOpen={lessonModalOpen}
        onClose={() => setLessonModalOpen(false)}
        title={editingLessonIdx !== null ? "Edit Lesson Content & Format" : "Create New Lesson"}
      >
        <form onSubmit={handleSaveLesson} className="space-y-4 max-h-[78vh] overflow-y-auto pr-1">
          {/* Modal Tab Switcher */}
          <div className="flex border-b border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLessonModalTab("content")}
              className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer ${
                lessonModalTab === "content"
                  ? "border-[#2563EB] text-[#2563EB]"
                  : "border-transparent text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              1. Lesson Format & Media
            </button>

            {lessonType === "mixed" && (
              <button
                type="button"
                onClick={() => setLessonModalTab("blocks")}
                className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  lessonModalTab === "blocks"
                    ? "border-purple-600 text-purple-700"
                    : "border-transparent text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>2. Content Blocks ({contentBlocks.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setLessonModalTab("seo")}
              className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                lessonModalTab === "seo"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Independent SEO</span>
            </button>
          </div>

          {/* TAB 1: CONTENT & FORMAT */}
          {lessonModalTab === "content" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Lesson Title <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="e.g. Understanding React Server Components"
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Lesson Format <span className="text-[#DC2626]">*</span>
                  </label>
                  <select
                    value={lessonType}
                    onChange={(e) => setLessonType(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg font-semibold text-[#172554]"
                  >
                    <option value="video">Video Lesson</option>
                    <option value="article">Technical Article / Text</option>
                    <option value="pdf">PDF / Document Lesson</option>
                    <option value="mixed">Mixed Media Blocks</option>
                    <option value="quiz">Interactive Quiz</option>
                    <option value="resource">Resource / Download</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={lessonDuration}
                    onChange={(e) => setLessonDuration(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Publication Status
                  </label>
                  <select
                    value={lessonStatus}
                    onChange={(e) => setLessonStatus(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lessonIsPreview}
                    onChange={(e) => setLessonIsPreview(e.target.checked)}
                    className="w-4 h-4 text-[#2563EB] rounded border-[#E2E8F0]"
                  />
                  <span>Free Preview (Guests can sample without purchase)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lessonIsRequired}
                    onChange={(e) => setLessonIsRequired(e.target.checked)}
                    className="w-4 h-4 text-[#2563EB] rounded border-[#E2E8F0]"
                  />
                  <span>Required for completion</span>
                </label>
              </div>

              {/* Type-Specific Fields */}
              {lessonType === "video" && (
                <div className="space-y-3 p-3.5 bg-blue-50/60 border border-blue-200/60 rounded-xl">
                  <h4 className="text-xs font-bold text-[#172554] flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-[#2563EB]" />
                    Video Delivery Settings
                  </h4>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                      Video URL (YouTube, Vimeo, or Direct MP4 stream)
                    </label>
                    <input
                      type="text"
                      value={lessonVideoUrl}
                      onChange={(e) => setLessonVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                      Supplementary Lesson Notes (Optional)
                    </label>
                    <RichTextEditor
                      value={lessonContent}
                      onChange={(val) => setLessonContent(val)}
                      placeholder="Summary notes, explanations, or code snippets accompanying this video..."
                      minHeight="180px"
                    />
                  </div>
                </div>
              )}

              {(lessonType === "article" || lessonType === "text") && (
                <div className="space-y-3 p-3.5 bg-emerald-50/60 border border-emerald-200/60 rounded-xl">
                  <h4 className="text-xs font-bold text-[#172554] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#16A34A]" />
                    Article Content & Technical Notes
                  </h4>
                  <RichTextEditor
                    value={lessonContent}
                    onChange={(val) => setLessonContent(val)}
                    placeholder="Write detailed lesson documentation, explanations, code blocks, or import markdown..."
                    minHeight="280px"
                  />
                </div>
              )}

              {lessonType === "pdf" && (
                <div className="space-y-3 p-3.5 bg-red-50/60 border border-red-200/60 rounded-xl">
                  <h4 className="text-xs font-bold text-[#172554] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#DC2626]" />
                    PDF / Document Settings
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                        PDF Title
                      </label>
                      <input
                        type="text"
                        value={lessonPdfTitle}
                        onChange={(e) => setLessonPdfTitle(e.target.value)}
                        placeholder="e.g. NextJS_Architecture_Doc.pdf"
                        className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                        PDF Direct URL
                      </label>
                      <input
                        type="text"
                        value={lessonPdfUrl}
                        onChange={(e) => setLessonPdfUrl(e.target.value)}
                        placeholder="https://.../document.pdf"
                        className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lessonDownloadAllowed}
                        onChange={(e) => setLessonDownloadAllowed(e.target.checked)}
                        className="w-4 h-4 text-[#2563EB] rounded border-[#E2E8F0]"
                      />
                      <span>Allow students to download PDF locally</span>
                    </label>
                  </div>
                </div>
              )}

              {lessonType === "resource" && (
                <div className="space-y-3 p-3.5 bg-sky-50/60 border border-sky-200/60 rounded-xl">
                  <h4 className="text-xs font-bold text-[#172554] flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-sky-600" />
                    Downloadable Resource Settings
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                        Resource File / Link URL
                      </label>
                      <input
                        type="text"
                        value={lessonPdfUrl}
                        onChange={(e) => setLessonPdfUrl(e.target.value)}
                        placeholder="https://.../starter-kit.zip or .pdf"
                        className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                        File Size Label
                      </label>
                      <input
                        type="text"
                        value={lessonFileSize}
                        onChange={(e) => setLessonFileSize(e.target.value)}
                        placeholder="e.g. 4.2 MB, 12 pages"
                        className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                      Resource Description & Installation Instructions
                    </label>
                    <RichTextEditor
                      value={lessonContent}
                      onChange={(val) => setLessonContent(val)}
                      placeholder="Explain how to extract and use this downloadable asset..."
                      minHeight="160px"
                    />
                  </div>
                </div>
              )}

              {lessonType === "mixed" && (
                <div className="p-3.5 bg-purple-50/60 border border-purple-200/60 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-purple-600" />
                      Mixed Media Lesson Mode Active
                    </span>
                    <button
                      type="button"
                      onClick={() => setLessonModalTab("blocks")}
                      className="text-purple-700 font-bold underline cursor-pointer"
                    >
                      Open Content Block Builder →
                    </button>
                  </div>
                  <p className="text-[#64748B]">
                    This lesson combines multiple formats (text, video, code, callouts, and PDF) in a sequential learning flow.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONTENT BLOCKS (FOR MIXED LESSONS) */}
          {lessonModalTab === "blocks" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#172554]">Sequential Content Blocks</h4>
                  <p className="text-[11px] text-[#64748B]">
                    Students will experience these blocks in sequential order on the learning room stage.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAddBlock("text")}
                    className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-[11px] font-semibold cursor-pointer"
                  >
                    + Text
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBlock("code")}
                    className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold cursor-pointer"
                  >
                    + Code
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBlock("video")}
                    className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-[#2563EB] text-[11px] font-semibold cursor-pointer"
                  >
                    + Video
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBlock("callout")}
                    className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold cursor-pointer"
                  >
                    + Callout
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBlock("pdf")}
                    className="px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-800 text-[11px] font-semibold cursor-pointer"
                  >
                    + PDF
                  </button>
                </div>
              </div>

              {contentBlocks.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-[#E2E8F0] rounded-xl text-xs text-[#94A3B8]">
                  No content blocks added yet. Click "+ Text", "+ Code", or "+ Video" above to construct your lesson.
                </div>
              ) : (
                <div className="space-y-3">
                  {contentBlocks.map((block, bIdx) => (
                    <div
                      key={bIdx}
                      className="p-3 bg-white border border-[#E2E8F0] rounded-xl space-y-2 shadow-xs"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#172554] uppercase tracking-wide flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-purple-100 text-purple-700 flex items-center justify-center text-[10px]">
                            {bIdx + 1}
                          </span>
                          <span>Block: {block.type}</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveBlock(bIdx, "up")}
                            disabled={bIdx === 0}
                            className="p-1 text-[#64748B] hover:text-[#0F172A] disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveBlock(bIdx, "down")}
                            disabled={bIdx === contentBlocks.length - 1}
                            className="p-1 text-[#64748B] hover:text-[#0F172A] disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveBlock(bIdx)}
                            className="p-1 text-[#DC2626] hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {block.type === "text" && (
                        <div className="pt-1">
                          <RichTextEditor
                            value={block.content || ""}
                            onChange={(val) => handleUpdateBlock(bIdx, { content: val })}
                            placeholder="Write formatted lesson content or import markdown..."
                            minHeight="180px"
                          />
                        </div>
                      )}

                      {block.type === "code" && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#64748B] font-semibold">Language:</span>
                            <input
                              type="text"
                              value={block.language || "typescript"}
                              onChange={(e) => handleUpdateBlock(bIdx, { language: e.target.value })}
                              className="text-xs px-2 py-0.5 border border-[#E2E8F0] rounded w-28 font-mono"
                            />
                          </div>
                          <textarea
                            rows={4}
                            value={block.content || ""}
                            onChange={(e) => handleUpdateBlock(bIdx, { content: e.target.value })}
                            placeholder="Code snippet..."
                            className="w-full text-xs font-mono px-2.5 py-1.5 border border-[#E2E8F0] rounded-lg"
                          />
                        </div>
                      )}

                      {block.type === "video" && (
                        <input
                          type="text"
                          value={block.videoUrl || ""}
                          onChange={(e) => handleUpdateBlock(bIdx, { videoUrl: e.target.value })}
                          placeholder="Video URL (YouTube or MP4)..."
                          className="w-full text-xs px-2.5 py-1.5 border border-[#E2E8F0] rounded-lg"
                        />
                      )}

                      {block.type === "pdf" && (
                        <input
                          type="text"
                          value={block.pdfUrl || ""}
                          onChange={(e) => handleUpdateBlock(bIdx, { pdfUrl: e.target.value })}
                          placeholder="PDF document URL..."
                          className="w-full text-xs px-2.5 py-1.5 border border-[#E2E8F0] rounded-lg"
                        />
                      )}

                      {block.type === "callout" && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#64748B] font-semibold">Type:</span>
                            <select
                              value={block.calloutType || "info"}
                              onChange={(e) => handleUpdateBlock(bIdx, { calloutType: e.target.value as any })}
                              className="text-xs px-2 py-0.5 border border-[#E2E8F0] rounded"
                            >
                              <option value="info">Info (Blue)</option>
                              <option value="warning">Warning (Amber)</option>
                              <option value="success">Success (Emerald)</option>
                              <option value="tip">Tip (W3Schools Green)</option>
                            </select>
                          </div>
                          <textarea
                            rows={2}
                            value={block.content || ""}
                            onChange={(e) => handleUpdateBlock(bIdx, { content: e.target.value })}
                            placeholder="Callout text..."
                            className="w-full text-xs px-2.5 py-1.5 border border-[#E2E8F0] rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INDEPENDENT SEO */}
          {lessonModalTab === "seo" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Lesson SEO Title Tag
                </label>
                <input
                  type="text"
                  value={lessonSeoTitle}
                  onChange={(e) => setLessonSeoTitle(e.target.value)}
                  placeholder={lessonTitle ? `${lessonTitle} | ${course?.title}` : "High CTR Title..."}
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Lesson Meta Description
                </label>
                <textarea
                  rows={3}
                  value={lessonSeoDesc}
                  onChange={(e) => setLessonSeoDesc(e.target.value)}
                  placeholder="Concise search summary..."
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lessonSeoNoIndex}
                    onChange={(e) => setLessonSeoNoIndex(e.target.checked)}
                    className="w-4 h-4 text-[#2563EB] rounded border-[#E2E8F0]"
                  />
                  <span>noindex (Hide this individual lesson from Google search results)</span>
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setLessonModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#64748B] hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              Save Lesson
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
