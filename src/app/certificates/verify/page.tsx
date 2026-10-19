"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Award, Search, ShieldCheck } from "lucide-react";

export default function CertificateSearchPage() {
  const [code, setCode] = useState("");
  const router = useRouter();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    router.push(`/certificates/${code.trim().toUpperCase()}`);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6 bg-[#F8FAFC] text-[#0F172A]">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2563EB] border border-blue-200 flex items-center justify-center mx-auto shadow-xs">
        <Award className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172554]">
          Verify CodeMentors Certificate
        </h1>
        <p className="text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
          Enter the unique credential code displayed on the student's certificate to authenticate issuance.
        </p>
      </div>

      <form onSubmit={handleVerify} className="max-w-md mx-auto space-y-3">
        <div className="relative">
          <input
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. CM-2026-X89J21"
            className="w-full px-4 py-3 rounded-lg bg-white border border-[#E2E8F0] text-center font-mono uppercase text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] shadow-xs"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Search className="w-4 h-4" />
          Verify Credential
        </button>
      </form>

      <div className="pt-4 flex items-center justify-center gap-2 text-xs text-[#64748B]">
        <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
        <span>Cryptographically Verified Credential Ledger</span>
      </div>
    </div>
  );
}
