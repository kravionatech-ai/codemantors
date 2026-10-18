"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Clock, Bookmark, CheckCircle2, ListTree, ArrowRight } from "lucide-react";

interface ArticleReaderProps {
  title: string;
  content: string; // Markdown / technical text
  isCompleted?: boolean;
  isBookmarked?: boolean;
  onToggleComplete?: () => void;
  onToggleBookmark?: () => void;
  onNext?: () => void;
  hasNext?: boolean;
}

export default function ArticleReader({
  title,
  content,
  isCompleted = false,
  isBookmarked = false,
  onToggleComplete,
  onToggleBookmark,
  onNext,
  hasNext,
}: ArticleReaderProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Estimate reading time based on 200 words per minute
  const readingTimeMinutes = useMemo(() => {
    const wordCount = (content || "").trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [content]);

  // Extract headings (## and ###) for the Table of Contents
  const headings = useMemo(() => {
    if (!content) return [];
    const lines = content.split("\n");
    const extracted: Array<{ id: string; text: string; level: number }> = [];

    lines.forEach((line) => {
      const match = line.match(/^(#{2,3})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        extracted.push({ id, text, level });
      }
    });

    return extracted;
  }, [content]);

  const copyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  // Render markdown blocks (headings, code blocks, callouts, lists, paragraphs)
  const renderFormattedContent = () => {
    if (!content) return null;

    const sections = content.split("```");
    const elements: React.ReactNode[] = [];

    sections.forEach((section, idx) => {
      if (idx % 2 === 1) {
        // Code Block
        const firstLineEnd = section.indexOf("\n");
        const language = firstLineEnd !== -1 ? section.slice(0, firstLineEnd).trim() : "javascript";
        const code = firstLineEnd !== -1 ? section.slice(firstLineEnd + 1) : section;

        elements.push(
          <div
            key={`code-${idx}`}
            className="my-6 rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden shadow-xl"
          >
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
              <span className="font-mono text-slate-400 uppercase font-semibold">{language || "CODE"}</span>
              <button
                onClick={() => copyCode(code, idx)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                {copiedIndex === idx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-xs sm:text-sm font-mono text-blue-200 overflow-x-auto leading-relaxed">
              <code>{code}</code>
            </pre>
          </div>
        );
      } else {
        // Regular Text & Headings
        const paragraphs = section.split("\n\n");
        paragraphs.forEach((p, pIdx) => {
          const trimmed = p.trim();
          if (!trimmed) return;

          // Headings
          if (trimmed.startsWith("### ")) {
            const headingText = trimmed.replace("### ", "");
            const id = headingText.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            elements.push(
              <h3 key={`h3-${idx}-${pIdx}`} id={id} className="text-lg font-bold text-slate-100 mt-8 mb-3">
                {headingText}
              </h3>
            );
          } else if (trimmed.startsWith("## ")) {
            const headingText = trimmed.replace("## ", "");
            const id = headingText.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            elements.push(
              <h2 key={`h2-${idx}-${pIdx}`} id={id} className="text-xl font-bold text-slate-50 mt-10 mb-4 pb-2 border-b border-slate-800">
                {headingText}
              </h2>
            );
          } else if (trimmed.startsWith("> ")) {
            // Callout
            elements.push(
              <div
                key={`callout-${idx}-${pIdx}`}
                className="my-5 p-4 rounded-xl border border-blue-500/30 bg-blue-950/20 text-slate-200 text-sm leading-relaxed"
              >
                {trimmed.replace(/^>\s*/gm, "")}
              </div>
            );
          } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            // Bullet List
            const listItems = trimmed.split("\n").map((item) => item.replace(/^[-*]\s*/, ""));
            elements.push(
              <ul key={`ul-${idx}-${pIdx}`} className="my-4 space-y-2 list-disc list-inside text-sm text-slate-300 leading-relaxed">
                {listItems.map((item, liIdx) => (
                  <li key={liIdx}>{item}</li>
                ))}
              </ul>
            );
          } else {
            // Normal paragraph
            elements.push(
              <p key={`p-${idx}-${pIdx}`} className="my-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                {trimmed}
              </p>
            );
          }
        });
      }
    });

    return elements;
  };

  return (
    <article className="max-w-4xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-10 shadow-2xl">
      {/* Top Metadata Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className="w-4 h-4 text-blue-400" />
            {readingTimeMinutes} min read
          </span>
          <span>•</span>
          <span className="text-slate-400">Technical Tutorial</span>
        </div>

        <div className="flex items-center gap-2">
          {onToggleBookmark && (
            <button
              onClick={onToggleBookmark}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                isBookmarked
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white"
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-current" : ""}`} />
              {isBookmarked ? "Bookmarked" : "Bookmark"}
            </button>
          )}

          {onToggleComplete && (
            <button
              onClick={onToggleComplete}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isCompleted
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isCompleted ? "Completed" : "Mark as Complete"}
            </button>
          )}
        </div>
      </div>

      {/* Main Title */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-6 mb-4">
        {title}
      </h1>

      {/* Table of Contents Accordion / Summary if multiple headings */}
      {headings.length > 1 && (
        <div className="my-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            <ListTree className="w-4 h-4 text-blue-400" />
            Table of Contents
          </div>
          <ul className="space-y-1.5 text-xs text-blue-400 font-medium">
            {headings.map((h, i) => (
              <li key={i} style={{ paddingLeft: `${(h.level - 2) * 12}px` }}>
                <a href={`#${h.id}`} className="hover:underline hover:text-blue-300">
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Formatted Article Content */}
      <div className="mt-8 text-slate-200">{renderFormattedContent()}</div>

      {/* Bottom Action Bar */}
      <div className="mt-12 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {onToggleComplete && (
          <button
            onClick={onToggleComplete}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
              isCompleted
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {isCompleted ? "Lesson Completed!" : "Complete Lesson"}
          </button>
        )}

        {hasNext && onNext && (
          <button
            onClick={onNext}
            className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all"
          >
            Next Lesson
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </article>
  );
}
