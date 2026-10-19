import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Certificate } from "@/models/Certificate";
import CertificateCard from "@/components/learning/CertificateCard";
import { CheckCircle2, ArrowLeft, Award } from "lucide-react";

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
      <div className="max-w-xl mx-auto my-20 p-8 rounded-xl border border-[#E2E8F0] bg-white text-center space-y-4 shadow-xs">
        <Award className="w-12 h-12 text-[#94A3B8] mx-auto" />
        <h2 className="text-xl font-bold text-[#0F172A]">Certificate Not Found</h2>
        <p className="text-xs text-[#64748B]">
          No verified record matches code <strong className="text-[#D97706] font-mono">{code}</strong>. Please check the code or contact support.
        </p>
        <Link
          href="/certificates/verify"
          className="inline-block px-4 py-2 rounded-lg bg-[#172554] text-white text-xs font-semibold hover:bg-[#1E3A8A]"
        >
          Try Another Code
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 bg-[#F8FAFC]">
      {/* Verification Seal Banner */}
      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4 max-w-4xl mx-auto shadow-2xs">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-[#16A34A] shrink-0" />
          <div>
            <span className="text-xs font-bold text-[#16A34A] block">
              Cryptographically Verified Credential
            </span>
            <span className="text-[11px] text-[#64748B]">
              Issued by CodeMentors Accreditation Directorate on {new Date(certificate.issueDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        <Link
          href="/courses"
          className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A] flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Browse Courses
        </Link>
      </div>

      {/* Render Certificate Card */}
      <CertificateCard certificate={certificate as any} />
    </div>
  );
}
