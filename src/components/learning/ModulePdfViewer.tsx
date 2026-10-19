"use client";

import React, { useState } from "react";
import {
  FileText,
  Download,
  ExternalLink,
  Printer,
  Maximize2,
  Minimize2,
  AlertCircle,
  FileDown,
} from "lucide-react";

interface ModulePdfViewerProps {
  pdfUrl?: string;
  pdfTitle?: string;
  moduleTitle?: string;
}

export default function ModulePdfViewer({
  pdfUrl,
  pdfTitle = "Module Handbook & Cheatsheet.pdf",
  moduleTitle,
}: ModulePdfViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const effectiveTitle = pdfTitle || "Module Handbook & Cheatsheet.pdf";
  const effectiveUrl =
    pdfUrl ||
    "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

  const handlePrint = () => {
    window.open(effectiveUrl, "_blank")?.focus();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col transition-all duration-300 ${
        isFullscreen ? "fixed inset-4 z-50 rounded-xl" : "w-full"
      }`}
    >
      {/* 1. PDF Action Header Bar */}
      <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-2">
              <span>{effectiveTitle}</span>
              <span className="text-[10px] font-semibold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 uppercase tracking-wider">
                PDF
              </span>
            </h4>
            {moduleTitle && (
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                Module Resource • {moduleTitle}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrint}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700/60 transition-colors"
            title="Print PDF Document"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <a
            href={effectiveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700/60 transition-colors"
            title="Open in new browser tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open Tab</span>
          </a>

          <a
            href={effectiveUrl}
            download={effectiveTitle}
            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
            title="Download PDF to your device"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </a>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Viewer"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Embedded PDF Reader Viewport */}
      <div className="relative flex-1 bg-slate-950 flex flex-col min-h-[520px] lg:min-h-[640px]">
        {loadError ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-white">
                Inline PDF Preview Not Available
              </h5>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Your browser or network policy blocked the embedded PDF viewer.
                You can download the handbook directly or open it in a new tab.
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href={effectiveUrl}
                download={effectiveTitle}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2"
              >
                <FileDown className="w-4 h-4" />
                Download PDF Handbook
              </a>
              <a
                href={effectiveUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open External Viewer
              </a>
            </div>
          </div>
        ) : (
          <iframe
            src={`${effectiveUrl}#toolbar=1&navpanes=0`}
            title={effectiveTitle}
            className="w-full flex-1 min-h-[520px] lg:min-h-[640px] border-0"
            onError={() => setLoadError(true)}
          />
        )}
      </div>

      {/* 3. Footer info */}
      <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Official Course Material Verified
        </span>
        <span>Includes full cheatsheet, architectural diagrams & formulas</span>
      </div>
    </div>
  );
}
