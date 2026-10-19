"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Copy,
  Check,
  RotateCcw,
  Maximize2,
  Minimize2,
  Code2,
  Terminal,
  Bookmark,
  CheckCircle2,
  BookOpen,
  Sparkles,
  ExternalLink,
  Info,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import FormattedContentRenderer from "@/components/ui/FormattedContentRenderer";

interface W3SchoolsNotesReaderProps {
  title: string;
  moduleTitle?: string;
  content: string;
  hasPrev?: boolean;
  hasNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  isCompleted?: boolean;
  onToggleComplete?: () => void;
}

export default function W3SchoolsNotesReader({
  title,
  moduleTitle,
  content,
  hasPrev = false,
  hasNext = false,
  onPrev,
  onNext,
  isCompleted = false,
  onToggleComplete,
}: W3SchoolsNotesReaderProps) {
  // Playground state
  const [playgroundOpen, setPlaygroundOpen] = useState(false);
  const [playgroundCode, setPlaygroundCode] = useState("");
  const [playgroundLanguage, setPlaygroundLanguage] = useState("html");
  const [activeExampleTitle, setActiveExampleTitle] = useState("Interactive Example");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [playgroundOutput, setPlaygroundOutput] = useState("");
  const [playgroundFullscreen, setPlaygroundFullscreen] = useState(false);

  // Estimate reading time
  const readingTime = useMemo(() => {
    const words = (content || "").trim().split(/\s+/).length;
    return Math.max(2, Math.ceil(words / 180));
  }, [content]);

  // Open "Try it Yourself" playground with specific code
  const handleTryItYourself = (code: string, language: string = "html", titleLabel: string = "Example") => {
    let cleanCode = code.trim();

    // If pure HTML/JS snippet, wrap with boilerplate if needed for full preview
    if ((language === "html" || language === "javascript" || language === "jsx") && !cleanCode.includes("<html") && !cleanCode.includes("<!DOCTYPE")) {
      cleanCode = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; color: #1e293b; line-height: 1.6; }
    h1, h2, h3 { color: #0f172a; }
    .btn { background: #04AA6D; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; }
    .btn:hover { background: #059862; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 12px; }
  </style>
</head>
<body>

${cleanCode}

</body>
</html>`;
    }

    setPlaygroundCode(cleanCode);
    setPlaygroundLanguage(language);
    setActiveExampleTitle(titleLabel);
    setPlaygroundOutput(cleanCode);
    setPlaygroundOpen(true);
  };

  const handleRunPlayground = () => {
    setPlaygroundOutput(playgroundCode);
  };

  const handleCopyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2200);
  };

  // Parse structured blocks: Example boxes, Notes, Tips, Code blocks, and Headings
  const renderedSections = useMemo(() => {
    if (!content) return null;

    // If pure HTML content without legacy markdown code fences, render via FormattedContentRenderer
    if (!content.includes("```") && /^<(!DOCTYPE|html|p|div|h[1-6]|ul|ol|table|blockquote|pre)\b/i.test(content.trim())) {
      return (
        <div className="my-6">
          <FormattedContentRenderer content={content} />
        </div>
      );
    }

    // Split on code fences ```
    const chunks = content.split("```");
    const elements: React.ReactNode[] = [];

    chunks.forEach((chunk, idx) => {
      if (idx % 2 === 1) {
        // CODE FENCE: Iconic W3Schools "Example" Card
        const firstLineEnd = chunk.indexOf("\n");
        const language = firstLineEnd !== -1 ? chunk.slice(0, firstLineEnd).trim().toLowerCase() : "html";
        const code = firstLineEnd !== -1 ? chunk.slice(firstLineEnd + 1) : chunk;

        elements.push(
          <div
            key={`w3-example-${idx}`}
            className="my-7 rounded-xl border-2 border-slate-700/80 bg-slate-900 overflow-hidden shadow-xl"
          >
            {/* W3Schools Example Header */}
            <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#04AA6D]" />
                <h4 className="text-sm font-bold text-white tracking-wide">
                  Example
                </h4>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                  {language || "code"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyCode(code, idx)}
                  className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Copy code to clipboard"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {/* Iconic Green "Try it Yourself »" Button */}
                <button
                  onClick={() => handleTryItYourself(code, language, `Example: ${language.toUpperCase()}`)}
                  className="px-3 py-1.5 rounded-md bg-[#04AA6D] hover:bg-[#059862] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                >
                  <span>Try it Yourself »</span>
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="p-4 sm:p-5 bg-slate-950/90 overflow-x-auto text-xs sm:text-sm font-mono text-emerald-300/90 leading-relaxed border-l-4 border-[#04AA6D]">
              <pre className="whitespace-pre">
                <code>{code.trim()}</code>
              </pre>
            </div>

            {/* Example Box Bottom Action Bar */}
            <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">
                Click <strong className="text-white">"Try it Yourself »"</strong> to test, edit and run this example live in the browser.
              </span>
              <button
                onClick={() => handleTryItYourself(code, language)}
                className="text-[#04AA6D] hover:text-emerald-400 font-bold text-xs flex items-center gap-1"
              >
                Launch Live Runner »
              </button>
            </div>
          </div>
        );
      } else {
        // REGULAR TEXT / MARKDOWN PARAGRAPHS / CALLOUTS
        const lines = chunk.split("\n");
        let buffer: string[] = [];

        const flushBuffer = () => {
          if (buffer.length === 0) return;
          const text = buffer.join("\n").trim();
          buffer = [];
          if (!text) return;

          // Check for W3Schools Callouts
          if (text.startsWith("> **Note:**") || text.startsWith("> Note:")) {
            const clean = text.replace(/^>\s*(\*\*Note:\*\*|Note:)\s*/i, "");
            elements.push(
              <div
                key={`note-${elements.length}`}
                className="my-5 p-4 rounded-xl border-l-4 border-sky-500 bg-sky-500/10 text-sky-200 text-xs sm:text-sm leading-relaxed flex items-start gap-3"
              >
                <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-sky-300 font-bold block mb-1">
                    Note:
                  </strong>
                  <span>{clean}</span>
                </div>
              </div>
            );
            return;
          }

          if (text.startsWith("> **Tip:**") || text.startsWith("> Tip:")) {
            const clean = text.replace(/^>\s*(\*\*Tip:\*\*|Tip:)\s*/i, "");
            elements.push(
              <div
                key={`tip-${elements.length}`}
                className="my-5 p-4 rounded-xl border-l-4 border-[#04AA6D] bg-[#04AA6D]/10 text-emerald-200 text-xs sm:text-sm leading-relaxed flex items-start gap-3"
              >
                <Lightbulb className="w-5 h-5 text-[#04AA6D] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#04AA6D] font-bold block mb-1">
                    Tip:
                  </strong>
                  <span>{clean}</span>
                </div>
              </div>
            );
            return;
          }

          if (text.startsWith("> **Warning:**") || text.startsWith("> Warning:")) {
            const clean = text.replace(/^>\s*(\*\*Warning:\*\*|Warning:)\s*/i, "");
            elements.push(
              <div
                key={`warn-${elements.length}`}
                className="my-5 p-4 rounded-xl border-l-4 border-amber-500 bg-amber-500/10 text-amber-200 text-xs sm:text-sm leading-relaxed flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300 font-bold block mb-1">
                    Important:
                  </strong>
                  <span>{clean}</span>
                </div>
              </div>
            );
            return;
          }

          // Tables
          if (text.includes("|") && text.includes("---")) {
            const tableLines = text.split("\n").filter((l) => l.trim().startsWith("|"));
            if (tableLines.length >= 2) {
              const headers = tableLines[0]
                .split("|")
                .map((h) => h.trim())
                .filter(Boolean);
              const dataRows = tableLines.slice(2).map((r) =>
                r
                  .split("|")
                  .map((c) => c.trim())
                  .filter((_, i) => i > 0 && i <= headers.length)
              );

              elements.push(
                <div
                  key={`table-${elements.length}`}
                  className="my-6 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-md"
                >
                  <table className="w-full text-left text-xs sm:text-sm divide-y divide-slate-800">
                    <thead className="bg-slate-950 text-white font-bold">
                      <tr>
                        {headers.map((h, hIdx) => (
                          <th key={hIdx} className="p-3.5">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {dataRows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className={rIdx % 2 === 1 ? "bg-slate-950/40" : "bg-transparent"}
                        >
                          {row.map((col, cIdx) => (
                            <td key={cIdx} className="p-3.5">
                              {col}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
              return;
            }
          }

          // Regular paragraph / bullet list
          elements.push(
            <div key={`p-${elements.length}`} className="my-4">
              <FormattedContentRenderer content={text} />
            </div>
          );
        };

        lines.forEach((line) => {
          if (line.startsWith("# ")) {
            flushBuffer();
            elements.push(
              <h1
                key={`h1-${elements.length}`}
                className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-8 mb-4 border-b border-slate-800 pb-3"
              >
                {line.replace("# ", "")}
              </h1>
            );
          } else if (line.startsWith("## ")) {
            flushBuffer();
            elements.push(
              <h2
                key={`h2-${elements.length}`}
                className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-7 mb-3 flex items-center gap-2"
              >
                <span className="w-1.5 h-5 bg-[#04AA6D] rounded-full" />
                {line.replace("## ", "")}
              </h2>
            );
          } else if (line.startsWith("### ")) {
            flushBuffer();
            elements.push(
              <h3
                key={`h3-${elements.length}`}
                className="text-base sm:text-lg font-bold text-slate-200 mt-5 mb-2"
              >
                {line.replace("### ", "")}
              </h3>
            );
          } else {
            buffer.push(line);
          }
        });

        flushBuffer();
      }
    });

    return elements;
  }, [content, copiedIndex]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* 1. W3Schools Top Bar (Previous / Next Navigation & Title) */}
      <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {hasPrev && onPrev ? (
            <button
              onClick={onPrev}
              className="px-3 py-1.5 rounded-md bg-[#04AA6D] hover:bg-[#059862] text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>« Previous</span>
            </button>
          ) : (
            <div className="w-20" />
          )}

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <BookOpen className="w-4 h-4 text-[#04AA6D]" />
            <span className="font-semibold text-white">W3Schools Tutorial</span>
            <span>•</span>
            <span>{readingTime} min read</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Try-It-Yourself Button */}
          <button
            onClick={() => handleTryItYourself(content, "html", "Sandbox Playground")}
            className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Code2 className="w-3.5 h-3.5 text-[#04AA6D]" />
            <span>Interactive Sandbox</span>
          </button>

          {/* Next Button */}
          {hasNext && onNext && (
            <button
              onClick={onNext}
              className="px-3 py-1.5 rounded-md bg-[#04AA6D] hover:bg-[#059862] text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
            >
              <span>Next »</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Main W3Schools Reader Stage */}
      <div className="p-6 sm:p-10 max-w-4xl mx-auto w-full">
        {/* Module Header Badge */}
        {moduleTitle && (
          <div className="mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#04AA6D] bg-[#04AA6D]/10 px-2.5 py-1 rounded-md border border-[#04AA6D]/20">
              {moduleTitle}
            </span>
          </div>
        )}

        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2">
          {title}
        </h1>

        <p className="text-xs text-slate-400 mb-8 pb-4 border-b border-slate-800 flex items-center gap-2">
          <span>Complete Tutorial & Syntax Reference</span>
          <span>•</span>
          <span>Includes Interactive Examples and Exercises</span>
        </p>

        {/* Structured Tutorial Content */}
        <div className="space-y-2">
          {renderedSections}
        </div>

        {/* 3. W3Schools Bottom Navigation Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex items-center justify-between">
          {hasPrev && onPrev ? (
            <button
              onClick={onPrev}
              className="px-4 py-2 rounded-md bg-[#04AA6D] hover:bg-[#059862] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>« Previous Topic</span>
            </button>
          ) : (
            <div />
          )}

          {onToggleComplete && (
            <button
              onClick={onToggleComplete}
              className={`px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
                isCompleted
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCompleted ? "Notes Completed" : "Mark Notes as Read"}</span>
            </button>
          )}

          {hasNext && onNext ? (
            <button
              onClick={onNext}
              className="px-4 py-2 rounded-md bg-[#04AA6D] hover:bg-[#059862] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
            >
              <span>Next Topic »</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>

      {/* 4. Interactive "Try it Yourself »" Live Code Runner Modal */}
      {playgroundOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div
            className={`bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
              playgroundFullscreen
                ? "fixed inset-2 z-50"
                : "w-full max-w-5xl h-[85vh]"
            }`}
          >
            {/* Playground Header Bar */}
            <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-[#04AA6D] animate-ping" />
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>CodeMentors Try-it-Yourself Editor</span>
                    <span className="text-[10px] font-mono bg-emerald-500/20 text-[#04AA6D] px-2 py-0.5 rounded border border-emerald-500/30">
                      LIVE SANDBOX
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Edit code on the left/top, click "Run »" to see the live output on the right/bottom.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Green Run Button */}
                <button
                  onClick={handleRunPlayground}
                  className="px-4 py-2 rounded-lg bg-[#04AA6D] hover:bg-[#059862] text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-transform active:scale-95 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run »</span>
                </button>

                <button
                  onClick={() => setPlaygroundFullscreen(!playgroundFullscreen)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Toggle Fullscreen"
                >
                  {playgroundFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={() => setPlaygroundOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 text-xs font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Split Screen: Editor on Left, Result on Right */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 overflow-hidden bg-slate-950">
              {/* Left Pane: Code Editor */}
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-blue-400" />
                    Source Code
                  </span>
                  <span className="text-[11px] text-slate-500">Editable</span>
                </div>
                <textarea
                  value={playgroundCode}
                  onChange={(e) => setPlaygroundCode(e.target.value)}
                  className="flex-1 w-full p-4 bg-slate-950 text-slate-100 font-mono text-xs sm:text-sm resize-none focus:outline-none focus:ring-0 leading-relaxed"
                  spellCheck={false}
                />
              </div>

              {/* Right Pane: Live Result Preview Frame */}
              <div className="flex flex-col h-full overflow-hidden bg-white">
                <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-sans">
                  <span className="font-bold flex items-center gap-1.5 text-slate-800">
                    <Sparkles className="w-3.5 h-3.5 text-[#04AA6D]" />
                    Result / Live Preview
                  </span>
                  <span className="text-[11px] text-slate-500">Sandboxed Output</span>
                </div>
                <iframe
                  srcDoc={playgroundOutput}
                  title="Try-it-Yourself Output"
                  sandbox="allow-scripts allow-modals"
                  className="flex-1 w-full h-full border-0 bg-white"
                />
              </div>
            </div>

            {/* Playground Bottom Status */}
            <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Code changes run in a client sandbox without altering your course progress.</span>
              <button
                onClick={() => handleCopyCode(playgroundCode, 9999)}
                className="text-xs text-slate-300 hover:text-white flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                Copy Editor Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
