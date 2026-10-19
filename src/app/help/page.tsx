import React from "react";
import Link from "next/link";
import { HelpCircle, BookOpen, CreditCard, Award, Terminal, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Help Center",
  description: "CodeMentors Help Center guides, FAQs, and platform tutorials.",
};

export default function HelpCenterPage() {
  const guideSections = [
    {
      title: "Getting Started & Account",
      icon: BookOpen,
      desc: "Account creation, password resets, role switching, and profile settings.",
      links: [
        { label: "How to register and access your courses", href: "/register" },
        { label: "Managing your student learning dashboard", href: "/student/dashboard" },
        { label: "Resetting your password securely", href: "/forgot-password" },
      ],
    },
    {
      title: "Payments, Pricing & Refunds",
      icon: CreditCard,
      desc: "Razorpay billing, test mode, coupons, and 7-day refund guarantee rules.",
      links: [
        { label: "Our 7-Day Refund Policy & Request Workflow", href: "/refund-policy" },
        { label: "Using discount coupons at checkout", href: "/courses" },
        { label: "Payment security & GST invoicing", href: "/contact" },
      ],
    },
    {
      title: "Learning Engine & Practice",
      icon: Terminal,
      desc: "Video playback speeds, text tutorials, copy-code blocks, and quizzes.",
      links: [
        { label: "How course completion percentages are calculated", href: "/faq" },
        { label: "Submitting coding exercises and quizzes", href: "/courses" },
        { label: "Bookmarking lessons and tracking progress", href: "/student/dashboard" },
      ],
    },
    {
      title: "Certificates & Verification",
      icon: Award,
      desc: "Earning, downloading, and verifying cryptographically signed credentials.",
      links: [
        { label: "Verify a student certificate by code", href: "/certificates/verify" },
        { label: "Sharing certificates to LinkedIn and resumes", href: "/student/dashboard" },
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10 bg-[#F8FAFC] text-[#0F172A]">
      <div className="text-center space-y-2">
        <span className="text-xs uppercase font-bold tracking-wider text-[#2563EB]">
          Knowledge Base & Guides
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#172554] tracking-tight">
          CodeMentors Help Center
        </h1>
        <p className="text-sm text-[#64748B] max-w-lg mx-auto">
          Guides, best practices, and answers to assist your learning journey.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {guideSections.map((sec) => {
          const Icon = sec.icon;
          return (
            <div
              key={sec.title}
              className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-xs space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#0F172A]">{sec.title}</h2>
                  <p className="text-xs text-[#64748B]">{sec.desc}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                {sec.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="flex items-center justify-between text-xs text-[#64748B] hover:text-[#2563EB] py-1 transition-colors"
                  >
                    <span>{link.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
