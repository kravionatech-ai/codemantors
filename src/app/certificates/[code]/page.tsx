import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Certificate } from "@/models/Certificate";
import CertificateCard from "@/components/learning/CertificateCard";
import { CheckCircle2, ShieldCheck, ArrowLeft, Award } from "lucide-react";

export default async function CertificateVerificationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  await connectDB();

  const certificate = await Certificate.findOne({
    certificateCode: code.toUpperCase().trim(),
  }).lean();

  if (!certificate) {
    return (
      <div className="max-w-xl mx-auto my-24 p-8 rounded-3xl border border-slate-800 bg-slate-900/60 text-center space-y-4">
        <Award className="w-12 h-12 text-slate-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Certificate Not Found</h2>
        <p className="text-xs text-slate-400">
          No verified record matches code <strong className="text-amber-400 font-mono">{code}</strong>. Please verify the code or contact support.
        </p>
        <Link
          href="/certificates/verify"
          className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold"
        >
          Try Another Code
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      {/* Verification Seal Banner */}
      <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between gap-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          <div>
            <span className="text-xs font-bold text-emerald-400 block">
              Cryptographically Verified Credential
            </span>
            <span className="text-[11px] text-slate-300">
              Issued by CodeMentors Accreditation Directorate on {new Date(certificate.issueDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        <Link
          href="/courses"
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Courses
        </Link>
      </div>

      {/* Render High-Res Certificate Card */}
      <CertificateCard certificate={certificate as any} />
    </div>
  );
}
