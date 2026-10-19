"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import CertificateCard from "@/components/learning/CertificateCard";
import { Award, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export default function StudentCertificatesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/student/certificates");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/dashboard/student");
        const data = await res.json();
        if (data.success) {
          setCertificates(data.certificates || []);
        }
      } catch (err) {
        console.error("Error loading certificates:", err);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading && user) loadData();
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <div className="py-20 text-center text-[#64748B] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB]" />
        <p className="text-sm font-medium">Authenticating Student Session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-20 text-center text-[#64748B] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB]" />
        <p className="text-sm font-medium">Redirecting to sign in...</p>
        <Link
          href="/login?redirect=/student/certificates"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] rounded-lg hover:bg-blue-700 transition-colors"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-[#64748B]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-3" />
        <p className="text-sm">Loading your certificates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-black text-[#172554] tracking-tight">Earned Certificates</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Official verifiable credentials issued upon successfully completing courses.
          </p>
        </div>
        <Link
          href="/certificates/verify"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline self-start sm:self-auto"
        >
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          Verify Any Certificate
        </Link>
      </div>

      {certificates.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center shadow-xs">
          <Award className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
          <h3 className="text-base font-bold text-[#172554]">No Certificates Earned Yet</h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto mt-1 mb-6">
            Complete 100% of curriculum lessons and pass required assessments in eligible courses to earn your official verifiable credential.
          </p>
          <Link
            href="/student/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Continue In-Progress Courses
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert: any) => (
            <CertificateCard key={cert._id} certificate={cert} />
          ))}
        </div>
      )}
    </div>
  );
}
