"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { Award, CheckCircle, Printer, Share2, ExternalLink } from "lucide-react";

export interface CertificateData {
  certificateCode: string;
  issueDate: string | Date;
  gradePercentage: number;
  verificationUrl: string;
  metadata: {
    studentName: string;
    courseTitle: string;
    instructorName: string;
    instructorHeadline?: string;
    completionDate: string;
    durationHours?: number;
  };
}

export default function CertificateCard({ certificate }: { certificate: CertificateData }) {
  const certRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `CodeMentors Certificate: ${certificate.metadata.courseTitle}`,
        text: `I just completed ${certificate.metadata.courseTitle} on CodeMentors!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Certificate URL copied to clipboard!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Controls for printing and sharing */}
      <div className="flex items-center justify-end gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <Printer className="w-4 h-4 text-slate-400" />
          Print / Save PDF
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
        >
          <Share2 className="w-4 h-4" />
          Share Certificate
        </button>
      </div>

      {/* Printable Certificate Frame */}
      <div
        ref={certRef}
        className="relative mx-auto aspect-[1.414/1] w-full max-w-4xl rounded-3xl border-8 border-slate-800/90 bg-gradient-to-br from-slate-950 via-[#0B1120] to-slate-950 p-8 sm:p-14 shadow-2xl flex flex-col justify-between overflow-hidden print:border-4 print:shadow-none print:aspect-auto"
      >
        {/* Subtle Decorative Golden/Electric Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Certificate Header */}
        <div className="relative flex items-center justify-between border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Award className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                CodeMentors
              </h2>
              <span className="text-[11px] font-medium tracking-widest text-blue-400 uppercase">
                Verified Certificate of Achievement
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Certificate ID</span>
            <span className="text-xs sm:text-sm font-mono font-bold text-amber-400 tracking-wider">
              {certificate.certificateCode}
            </span>
          </div>
        </div>

        {/* Main Certificate Body */}
        <div className="relative my-8 sm:my-10 text-center space-y-4">
          <p className="text-xs sm:text-sm uppercase tracking-widest text-slate-400 font-medium">
            This is proudly conferred upon
          </p>

          <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-blue-300 tracking-tight font-serif">
            {certificate.metadata.studentName}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed pt-2">
            for successfully satisfying all curriculum requirements, quizzes, practical coding exercises, and mastering:
          </p>

          <h3 className="text-xl sm:text-2xl font-extrabold text-blue-400 max-w-xl mx-auto pt-1">
            {certificate.metadata.courseTitle}
          </h3>

          <div className="pt-2 flex items-center justify-center gap-6 text-xs text-slate-400">
            <span>Completed on: <strong className="text-slate-200">{certificate.metadata.completionDate}</strong></span>
            <span>•</span>
            <span>Grade Achieved: <strong className="text-emerald-400 font-semibold">{certificate.gradePercentage}%</strong></span>
          </div>
        </div>

        {/* Footer: Signatures & Gold Seal */}
        <div className="relative pt-6 border-t border-slate-800/80 flex items-end justify-between">
          {/* Instructor Signature */}
          <div className="text-left">
            <p className="font-serif italic text-lg sm:text-xl text-blue-300">
              {certificate.metadata.instructorName}
            </p>
            <div className="w-40 h-px bg-slate-700 my-1" />
            <span className="text-xs font-semibold text-slate-200 block">
              {certificate.metadata.instructorName}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {certificate.metadata.instructorHeadline || "Senior Staff Architect"}
            </span>
          </div>

          {/* Golden Seal */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 p-0.5 shadow-xl shadow-amber-500/20 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center p-2 text-center border-2 border-amber-400/40">
                <CheckCircle className="w-5 h-5 text-amber-400 mb-0.5" />
                <span className="text-[8px] font-black uppercase text-amber-300 tracking-tighter">
                  VERIFIED
                </span>
              </div>
            </div>
          </div>

          {/* Operations Director Signature */}
          <div className="text-right">
            <p className="font-serif italic text-lg sm:text-xl text-blue-300">
              Platform Director
            </p>
            <div className="w-40 h-px bg-slate-700 my-1 ml-auto" />
            <span className="text-xs font-semibold text-slate-200 block">
              CodeMentors Directorate
            </span>
            <span className="text-[10px] text-slate-400 block">
              Curriculum & Accreditation Board
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
