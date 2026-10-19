"use client";

import React, { useState } from "react";
import {
  FileText,
  Video,
  FileCode,
  AlertTriangle,
  Lightbulb,
  Info,
  CheckCircle,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Download,
  BookOpen,
} from "lucide-react";
import VideoPlayer from "./VideoPlayer";
import ModulePdfViewer from "./ModulePdfViewer";
import FormattedContentRenderer from "@/components/ui/FormattedContentRenderer";

interface ContentBlock {
  type: "text" | "video" | "pdf" | "code" | "quiz" | "callout";
  content?: string;
  videoUrl?: string;
  pdfUrl?: string;
  language?: string;
  calloutType?: "info" | "warning" | "success" | "tip";
  order: number;
}

interface MixedContentLessonProps {
  lesson: any;
  currentModule: any;
  isCompleted?: boolean;
  onToggleComplete?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
}

export default function MixedContentLesson({
  lesson,
  currentModule,
  isCompleted = false,
  onToggleComplete,
  hasPrev = false,
  hasNext = false,
  onPrev,
  onNext,
}: MixedContentLessonProps) {
  const [copiedBlock, setCopiedBlock] = useState<number | null>(null);

  const blocks: ContentBlock[] = Array.isArray(lesson?.contentBlocks) && lesson.contentBlocks.length > 0
    ? [...lesson.contentBlocks].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedBlock(idx);
    setTimeout(() => setCopiedBlock(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto w-full">
      {/* Lesson Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded border border-purple-500/20">
            Mixed Content Lesson
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-xs text-slate-400">
            {lesson.durationMinutes || 10} min estimated
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {lesson.title}
        </h1>
        {lesson.description && (
          <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
            {lesson.description}
          </p>
        )}
      </div>

      {/* If blocks are defined, render each sequentially */}
      {blocks.length > 0 ? (
        <div className="space-y-8">
          {blocks.map((block, idx) => {
            if (block.type === "video") {
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                    <Video className="w-4 h-4" />
                    <span>Video Segment</span>
                  </div>
                  <VideoPlayer
                    videoUrl={block.videoUrl || lesson.videoUrl || ""}
                    initialPosition={0}
                    isCompleted={isCompleted}
                  />
                  {block.content && (
                    <p className="text-xs text-slate-400 mt-1">{block.content}</p>
                  )}
                </div>
              );
            }

            if (block.type === "pdf") {
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-400">
                    <FileText className="w-4 h-4" />
                    <span>Document / Handbook Reference</span>
                  </div>
                  <ModulePdfViewer
                    pdfUrl={block.pdfUrl || lesson.pdfUrl || ""}
                    pdfTitle={lesson.pdfTitle || "Handbook Section.pdf"}
                    moduleTitle={currentModule?.title}
                  />
                </div>
              );
            }

            if (block.type === "code") {
              const lang = block.language || "typescript";
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-700/80 bg-slate-900 overflow-hidden shadow-xl"
                >
                  <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-mono font-bold text-slate-300 uppercase">
                        {lang}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyCode(block.content || "", idx)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedBlock === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 sm:p-5 bg-slate-950/90 overflow-x-auto text-xs sm:text-sm font-mono text-emerald-300/90 leading-relaxed">
                    <code>{block.content || ""}</code>
                  </pre>
                </div>
              );
            }

            if (block.type === "callout") {
              const cType = block.calloutType || "info";
              const calloutStyles = {
                info: "border-sky-500 bg-sky-500/10 text-sky-200",
                warning: "border-amber-500 bg-amber-500/10 text-amber-200",
                success: "border-emerald-500 bg-emerald-500/10 text-emerald-200",
                tip: "border-[#04AA6D] bg-[#04AA6D]/10 text-emerald-200",
              };
              const calloutIcons = {
                info: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
                warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
                success: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
                tip: <Lightbulb className="w-5 h-5 text-[#04AA6D] shrink-0" />,
              };

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border-l-4 leading-relaxed flex items-start gap-3 text-xs sm:text-sm ${
                    calloutStyles[cType] || calloutStyles.info
                  }`}
                >
                  {calloutIcons[cType] || calloutIcons.info}
                  <div>
                    <strong className="font-bold block mb-0.5 capitalize">
                      {cType}:
                    </strong>
                    <div className="whitespace-pre-line">{block.content}</div>
                  </div>
                </div>
              );
            }

            // Default Text block
            return (
              <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <FormattedContentRenderer content={block.content} />
              </div>
            );
          })}
        </div>
      ) : (
        /* Fallback if no content blocks: show lesson content */
        <div className="space-y-6">
          {lesson.content && (
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <FormattedContentRenderer content={lesson.content} />
            </div>
          )}
          {lesson.videoUrl && (
            <VideoPlayer videoUrl={lesson.videoUrl} initialPosition={0} isCompleted={isCompleted} />
          )}
          {lesson.pdfUrl && (
            <ModulePdfViewer
              pdfUrl={lesson.pdfUrl}
              pdfTitle={lesson.pdfTitle}
              moduleTitle={currentModule?.title}
            />
          )}
        </div>
      )}

      {/* Bottom Action / Completion Bar */}
      <div className="pt-8 border-t border-slate-800 flex items-center justify-between">
        {hasPrev && onPrev ? (
          <button
            onClick={onPrev}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-colors flex items-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
        ) : (
          <div />
        )}

        {onToggleComplete && (
          <button
            onClick={onToggleComplete}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              isCompleted
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isCompleted ? "Lesson Completed" : "Mark as Completed"}</span>
          </button>
        )}

        {hasNext && onNext ? (
          <button
            onClick={onNext}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
