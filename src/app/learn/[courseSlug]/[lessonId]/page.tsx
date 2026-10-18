"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import VideoPlayer from "@/components/learning/VideoPlayer";
import ArticleReader from "@/components/learning/ArticleReader";
import QuizPlayer from "@/components/learning/QuizPlayer";
import CodingExercisePlayer from "@/components/learning/CodingExercisePlayer";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Bookmark,
  Menu,
  X,
  Play,
  FileText,
  HelpCircle,
  Terminal,
  Download,
  Share2,
  FileCode,
  Award,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  FileEdit,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function LearningRoomPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonId: string }>;
}) {
  const { courseSlug, lessonId } = use(params);
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [currentModule, setCurrentModule] = useState<any>(null);
  const [lesson, setLesson] = useState<any>(null);
  const [quizData, setQuizData] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [navigation, setNavigation] = useState<{ prevLessonId: string | null; nextLessonId: string | null }>({
    prevLessonId: null,
    nextLessonId: null,
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"notes" | "resources" | "discussion">("notes");
  const [studentNotes, setStudentNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchLessonData = async () => {
    try {
      const res = await fetch(`/api/learn/${courseSlug}/${lessonId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to load lesson");
        router.push(`/courses/${courseSlug}`);
        return;
      }

      setCourse(data.course);
      setCurrentModule(data.currentModule);
      setLesson(data.lesson);
      setQuizData(data.quiz);
      setProgress(data.progress);
      setEnrollment(data.enrollment);
      setNavigation(data.navigation);
      setStudentNotes(data.progress?.notes || "");
    } catch (err) {
      console.error("Error loading lesson:", err);
      toast.error("Failed to load lesson data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessonData();
  }, [courseSlug, lessonId]);

  // Toggle completion
  const handleToggleComplete = async () => {
    const newStatus = !progress?.isCompleted;
    try {
      const res = await fetch("/api/learn/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course._id,
          lessonId,
          isCompleted: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProgress((prev: any) => ({ ...prev, isCompleted: newStatus }));
        setEnrollment((prev: any) => ({
          ...prev,
          progressPercentage: data.progressPercentage,
          completedLessons: data.completedLessons,
        }));

        if (newStatus) {
          toast.success("Lesson marked as complete!");
          if (data.progressPercentage >= 100) {
            confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
            toast.success("Congratulations! You completed the course and earned a certificate!");
          }
        }
      }
    } catch {
      toast.error("Failed to update progress");
    }
  };

  // Toggle bookmark
  const handleToggleBookmark = async () => {
    const newBookmark = !progress?.isBookmarked;
    try {
      const res = await fetch("/api/learn/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course._id,
          lessonId,
          isBookmarked: newBookmark,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProgress((prev: any) => ({ ...prev, isBookmarked: newBookmark }));
        toast.success(newBookmark ? "Lesson bookmarked!" : "Bookmark removed");
      }
    } catch {
      toast.error("Failed to update bookmark");
    }
  };

  // Save notes
  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await fetch("/api/learn/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course._id,
          lessonId,
          notes: studentNotes,
        }),
      });
      toast.success("Notes saved!");
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  // Video progress save
  const handleVideoProgressUpdate = (seconds: number) => {
    fetch("/api/learn/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId: course._id,
        lessonId,
        lastPositionSeconds: seconds,
      }),
    }).catch(() => {});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Entering interactive learning room...</p>
      </div>
    );
  }

  if (!lesson || !course) return null;

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* 1. Dedicated Top Navigation Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-1.5 p-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Toggle Curriculum Sidebar"
          >
            <Menu className="w-4 h-4" />
            <span className="hidden md:inline">Curriculum</span>
          </button>
          <div className="hidden lg:flex items-center gap-2 text-xs">
            <span className="text-slate-400 max-w-[200px] truncate">{course.title}</span>
            <span className="text-slate-600">/</span>
            <span className="font-semibold text-white max-w-[250px] truncate">{lesson.title}</span>
          </div>
        </div>

        {/* Right Top Actions */}
        <div className="flex items-center gap-3">
          {/* Progress Indicator */}
          {enrollment && (
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-slate-400">Progress:</span>
              <div className="w-24 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    enrollment.progressPercentage >= 100 ? "bg-emerald-500" : "bg-blue-600"
                  }`}
                  style={{ width: `${enrollment.progressPercentage || 0}%` }}
                />
              </div>
              <span className="font-bold text-white">{enrollment.progressPercentage || 0}%</span>
            </div>
          )}

          {/* Bookmark Button */}
          <button
            onClick={handleToggleBookmark}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              progress?.isBookmarked
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            title={progress?.isBookmarked ? "Remove Bookmark" : "Bookmark Lesson"}
          >
            <Bookmark className={`w-4 h-4 ${progress?.isBookmarked ? "fill-current" : ""}`} />
          </button>

          {/* Mark Complete Button */}
          <button
            onClick={handleToggleComplete}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              progress?.isCompleted
                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">
              {progress?.isCompleted ? "Completed" : "Complete"}
            </span>
          </button>
        </div>
      </header>

      {/* 2. Workspace Layout: Sidebar + Lesson Viewer */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Curriculum Sidebar */}
        <aside
          className={`w-80 shrink-0 border-r border-slate-800 bg-slate-900/95 flex flex-col transition-all duration-300 absolute md:relative inset-y-0 left-0 z-20 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:hidden"
          }`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Curriculum Outline
            </h3>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modules & Lessons Scrollable Tree */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
            {course.modules?.map((mod: any, mIdx: number) => (
              <div key={mod._id} className="p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 px-2">
                  Module {mIdx + 1}: {mod.title}
                </span>

                <div className="space-y-1">
                  {mod.lessons?.map((les: any) => {
                    const isCurrent = les._id === lessonId;
                    const isDone = les.isCompleted;

                    return (
                      <Link
                        key={les._id}
                        href={`/learn/${courseSlug}/${les._id}`}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                          isCurrent
                            ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20"
                            : isDone
                            ? "text-slate-300 hover:bg-slate-800/60"
                            : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {les.type === "video" ? (
                            <Play className="w-3.5 h-3.5 shrink-0" />
                          ) : les.type === "quiz" ? (
                            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                          ) : les.type === "coding" ? (
                            <Terminal className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span className="truncate">{les.title}</span>
                        </div>

                        {isDone && (
                          <CheckCircle2
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isCurrent ? "text-white" : "text-emerald-400"
                            }`}
                          />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Center Main Stage Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col justify-between">
          <div className="max-w-5xl mx-auto w-full space-y-8">
            {/* Dynamic Lesson Type Renderer */}
            {lesson.type === "video" && (
              <div className="space-y-6">
                <VideoPlayer
                  videoUrl={lesson.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"}
                  initialPosition={progress?.lastPositionSeconds || 0}
                  onProgressUpdate={handleVideoProgressUpdate}
                  onComplete={() => {
                    if (!progress?.isCompleted) handleToggleComplete();
                  }}
                  isCompleted={progress?.isCompleted}
                />
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">{lesson.title}</h2>
                  {lesson.content && (
                    <div className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line p-4 rounded-xl bg-slate-900/40 border border-slate-800">
                      {lesson.content}
                    </div>
                  )}
                </div>
              </div>
            )}

            {lesson.type === "article" && (
              <ArticleReader
                title={lesson.title}
                content={lesson.content || ""}
                isCompleted={progress?.isCompleted}
                isBookmarked={progress?.isBookmarked}
                onToggleComplete={handleToggleComplete}
                onToggleBookmark={handleToggleBookmark}
                onNext={() => {
                  if (navigation.nextLessonId) {
                    router.push(`/learn/${courseSlug}/${navigation.nextLessonId}`);
                  }
                }}
                hasNext={Boolean(navigation.nextLessonId)}
              />
            )}

            {lesson.type === "quiz" && quizData && (
              <QuizPlayer
                quiz={quizData}
                onQuizComplete={() => {
                  setProgress((prev: any) => ({ ...prev, isCompleted: true }));
                }}
                onNextLesson={() => {
                  if (navigation.nextLessonId) {
                    router.push(`/learn/${courseSlug}/${navigation.nextLessonId}`);
                  }
                }}
              />
            )}

            {lesson.type === "coding" && lesson.codingExercise && (
              <CodingExercisePlayer
                exercise={lesson.codingExercise}
                isCompleted={progress?.isCompleted}
                onComplete={() => {
                  if (!progress?.isCompleted) handleToggleComplete();
                }}
              />
            )}

            {/* Bottom Panel Tabs: Notes, Attachments, Discussion */}
            <div className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-xl">
              <div className="flex border-b border-slate-800 bg-slate-950/60 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`px-5 py-3 flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === "notes"
                      ? "border-blue-500 text-white bg-slate-900"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  Personal Notes
                </button>
                <button
                  onClick={() => setActiveTab("resources")}
                  className={`px-5 py-3 flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === "resources"
                      ? "border-blue-500 text-white bg-slate-900"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  Resources & Downloads ({lesson.resources?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab("discussion")}
                  className={`px-5 py-3 flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === "discussion"
                      ? "border-blue-500 text-white bg-slate-900"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Lesson Discussion
                </button>
              </div>

              <div className="p-5">
                {activeTab === "notes" && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400">
                      Your personal scratchpad for this lesson. Notes are synced and saved to your account.
                    </p>
                    <textarea
                      rows={4}
                      value={studentNotes}
                      onChange={(e) => setStudentNotes(e.target.value)}
                      placeholder="Type your personal observations, syntax reminders, or timestamps..."
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none font-mono"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveNotes}
                        disabled={savingNotes}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
                      >
                        {savingNotes ? "Saving..." : "Save Notes"}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "resources" && (
                  <div className="space-y-2">
                    {lesson.resources?.length > 0 ? (
                      lesson.resources.map((res: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <FileCode className="w-4 h-4 text-blue-400" />
                            <div>
                              <span className="font-semibold text-white block">{res.title}</span>
                              <span className="text-[10px] text-slate-500 uppercase">{res.fileType} • {res.size || "1.0 MB"}</span>
                            </div>
                          </div>
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 py-3">
                        No external downloadable attachments for this lesson.
                      </p>
                    )}
                  </div>
                )}

                {activeTab === "discussion" && (
                  <div className="space-y-3 text-xs text-slate-300">
                    <p className="text-slate-400">
                      Have questions about this lesson? Ask mentors and fellow classmates in the community channel.
                    </p>
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <span className="text-blue-400 font-semibold block mb-1">
                        Mentor Support Active
                      </span>
                      <p className="text-slate-500 text-[11px]">
                        Post questions anytime. CodeMentors teaching assistants respond within 12 hours.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Lesson Navigation Controls (Prev / Next) */}
          <footer className="mt-12 pt-6 border-t border-slate-800/80 flex items-center justify-between max-w-5xl mx-auto w-full">
            {navigation.prevLessonId ? (
              <Link
                href={`/learn/${courseSlug}/${navigation.prevLessonId}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous Lesson
              </Link>
            ) : (
              <div />
            )}

            {navigation.nextLessonId ? (
              <Link
                href={`/learn/${courseSlug}/${navigation.nextLessonId}`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all"
              >
                Next Lesson
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all"
              >
                Complete Course & View Certificate
                <Award className="w-4 h-4" />
              </Link>
            )}
          </footer>
        </main>
      </div>
    </div>
  );
}
