"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import RichTextEditor from "@/components/ui/RichTextEditor";
import FormattedContentRenderer from "@/components/ui/FormattedContentRenderer";
import {
  MessageSquare,
  ArrowLeft,
  Megaphone,
  Plus,
  Send,
  Loader2,
  CheckCircle2,
  Clock,
  Pin,
  Trash2,
  BookOpen,
  User,
  AlertCircle,
  Search,
} from "lucide-react";

export default function InstructorQAPage() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"questions" | "announcements">("questions");
  const [courses, setCourses] = useState<{ _id: string; title: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [loading, setLoading] = useState(true);

  // Q&A State
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [resolveOnReply, setResolveOnReply] = useState(true);
  const [submittingReply, setSubmittingReply] = useState(false);

  // Announcements State
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [targetCourseId, setTargetCourseId] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementPinned, setAnnouncementPinned] = useState(false);
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "instructor" && user.role !== "admin" && user.role !== "super_admin"))) {
      router.push("/student/dashboard");
    }
  }, [user, authLoading, router]);

  const fetchQAData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCourse !== "all") params.append("courseId", selectedCourse);

      const res = await fetch(`/api/instructor/qa?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setQuestions(data.questions || []);
        setAnnouncements(data.announcements || []);
        setCourses(data.courses || []);
        if (data.courses && data.courses.length > 0 && !targetCourseId) {
          setTargetCourseId(data.courses[0]._id);
        }
      } else {
        toast.error(data.error || "Failed to load communication workspace");
      }
    } catch (err) {
      console.error("Error loading QA:", err);
      toast.error("Network error loading Q&A data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchQAData();
    }
  }, [user, selectedCourse]);

  const handleReplyQuestion = async (ticketId: string) => {
    if (!replyMessage.trim()) return;
    setSubmittingReply(true);

    try {
      const res = await fetch("/api/instructor/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reply_question",
          ticketId,
          message: replyMessage.trim(),
          resolve: resolveOnReply,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Response sent to student!");
        setReplyMessage("");
        setSelectedQuestion(null);
        fetchQAData();
      } else {
        toast.error(data.error || "Failed to submit response");
      }
    } catch {
      toast.error("Error submitting response");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCourseId || !announcementTitle.trim() || !announcementContent.trim()) {
      toast.error("Please fill in course, title, and content.");
      return;
    }

    setCreatingAnnouncement(true);
    try {
      const res = await fetch("/api/instructor/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_announcement",
          courseId: targetCourseId,
          title: announcementTitle.trim(),
          content: announcementContent.trim(),
          isPinned: announcementPinned,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Announcement broadcasted successfully to course learners!");
        setAnnouncementModalOpen(false);
        setAnnouncementTitle("");
        setAnnouncementContent("");
        setAnnouncementPinned(false);
        fetchQAData();
      } else {
        toast.error(data.error || "Failed to create announcement");
      }
    } catch {
      toast.error("Error creating announcement");
    } finally {
      setCreatingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
      const res = await fetch(`/api/instructor/qa/announcements/${announcementId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Announcement deleted successfully");
        fetchQAData();
      } else {
        toast.error(data.error || "Failed to delete announcement");
      }
    } catch {
      toast.error("Error deleting announcement");
    }
  };

  if (authLoading) {
    return (
      <div className="py-24 text-center text-[#64748B] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB]" />
        <p className="text-sm font-medium">Authenticating Instructor Session...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <Link
            href="/instructor/dashboard"
            className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-[#64748B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-[#172554] tracking-tight">Q&A & Course Announcements</h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Answer student technical inquiries and broadcast important curriculum announcements.
            </p>
          </div>
        </div>

        {activeTab === "announcements" && (
          <button
            onClick={() => setAnnouncementModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Announcement</span>
          </button>
        )}
      </div>

      {/* Workspace Tabs & Course Filter */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("questions")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "questions"
                ? "bg-[#172554] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Course Q&A ({questions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("announcements")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "announcements"
                ? "bg-[#172554] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Announcements ({announcements.length})</span>
          </button>
        </div>

        <div className="w-full sm:w-64">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] text-slate-900 bg-white focus:outline-none focus:border-[#2563EB]"
          >
            <option value="all">All Authored Courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#64748B] space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB]" />
          <p className="text-sm">Loading communication workspace...</p>
        </div>
      ) : activeTab === "questions" ? (
        /* Tab 1: Course Q&A */
        <div className="space-y-4">
          {questions.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center shadow-xs space-y-3">
              <MessageSquare className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-[#172554]">No Technical Questions Pending</h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                When learners post questions in your course curriculum or support channel, they will appear here.
              </p>
            </div>
          ) : (
            questions.map((q) => (
              <div
                key={q._id}
                className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#172554] text-[#06B6D4] flex items-center justify-center font-bold text-xs shrink-0">
                      {q.name?.charAt(0) || "S"}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#0F172A]">{q.subject}</h4>
                      <p className="text-[10px] text-slate-500">
                        By {q.name} ({q.email}) • {q.courseId?.title} • {new Date(q.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold self-start sm:self-auto ${
                      q.status === "resolved"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : q.status === "in_progress"
                        ? "bg-blue-50 text-[#172554] border border-blue-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {q.status}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {q.message}
                </p>

                {/* Responses Thread */}
                {q.responses && q.responses.length > 0 && (
                  <div className="space-y-2 pl-4 border-l-2 border-blue-200">
                    {q.responses.map((resp: any, i: number) => (
                      <div key={i} className="text-xs space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-[11px] text-slate-800">
                          <span className={resp.senderRole === "instructor" ? "text-[#2563EB]" : "text-slate-600"}>
                            {resp.senderName} ({resp.senderRole})
                          </span>
                          <span className="text-[10px] font-normal text-slate-400">
                            • {new Date(resp.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-600">{resp.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <textarea
                    rows={2}
                    value={selectedQuestion === q._id ? replyMessage : ""}
                    onChange={(e) => {
                      setSelectedQuestion(q._id);
                      setReplyMessage(e.target.value);
                    }}
                    placeholder="Write your explanation or code solution..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2563EB]"
                  />

                  {selectedQuestion === q._id && (
                    <div className="flex items-center justify-between text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={resolveOnReply}
                          onChange={(e) => setResolveOnReply(e.target.checked)}
                          className="rounded border-[#E2E8F0]"
                        />
                        <span>Mark inquiry as resolved after reply</span>
                      </label>

                      <button
                        onClick={() => handleReplyQuestion(q._id)}
                        disabled={submittingReply || !replyMessage.trim()}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" />
                        <span>{submittingReply ? "Sending..." : "Send Reply"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Tab 2: Course Announcements */
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center shadow-xs space-y-3">
              <Megaphone className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-[#172554]">No Announcements Broadcasted Yet</h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                Share curriculum updates, project release dates, or workshop schedules with enrolled learners.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {announcements.map((a) => (
                <div
                  key={a._id}
                  className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider">
                        {a.courseTitle}
                      </span>
                      {a.isPinned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                          <Pin className="w-2.5 h-2.5" />
                          Pinned
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-[#0F172A]">{a.title}</h3>
                    <FormattedContentRenderer
                      content={a.content}
                      className="text-xs text-slate-600 leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                    <span>Broadcasted {new Date(a.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={() => handleDeleteAnnouncement(a._id)}
                      className="p-1 rounded hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                      title="Delete announcement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Broadcast Announcement Modal */}
      <Modal
        isOpen={announcementModalOpen}
        onClose={() => setAnnouncementModalOpen(false)}
        title="Broadcast Course Announcement"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-800 block mb-1">Target Course</label>
            <select
              value={targetCourseId}
              onChange={(e) => setTargetCourseId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-slate-900 bg-white focus:outline-none focus:border-[#2563EB]"
            >
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-800 block mb-1">Announcement Title</label>
            <input
              type="text"
              required
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              placeholder="e.g. New Live Workshop on Microservices Deployment"
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-800 block mb-1">Message Content</label>
            <RichTextEditor
              value={announcementContent}
              onChange={(val) => setAnnouncementContent(val)}
              placeholder="Share the full details of this announcement with enrolled students..."
              minHeight="180px"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer text-slate-800">
              <input
                type="checkbox"
                checked={announcementPinned}
                onChange={(e) => setAnnouncementPinned(e.target.checked)}
                className="rounded border-[#E2E8F0]"
              />
              <span>Pin this announcement at the top of the course dashboard</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAnnouncementModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingAnnouncement}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-semibold shadow-xs disabled:opacity-50"
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>{creatingAnnouncement ? "Broadcasting..." : "Broadcast"}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
