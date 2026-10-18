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
    <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto">
        <Award className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-black text-white">Verify CodeMentors Certificate</h1>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Enter the unique credential code displayed at the top right of the student's certificate to authenticate issuance.
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
            className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-center font-mono uppercase text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 shadow-xl"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          Verify Credential
        </button>
      </form>

      <div className="pt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>SHA-256 Ledger Verified Verification Engine</span>
      </div>
    </div>
  );
}
