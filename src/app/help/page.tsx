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
        { label: "How to register and verify your account", href: "/register" },
        { label: "Managing your student dashboard", href: "/dashboard" },
        { label: "Resetting your password", href: "/forgot-password" },
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
        { label: "Bookmarking lessons and taking personal notes", href: "/dashboard" },
      ],
    },
    {
      title: "Certificates & Verification",
      icon: Award,
      desc: "Earning, downloading, and verifying cryptographically signed credentials.",
      links: [
        { label: "Verify a student certificate by code", href: "/certificates/verify" },
        { label: "Sharing certificates to LinkedIn and resumes", href: "/dashboard" },
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center space-y-3">
        <span className="text-xs uppercase font-bold tracking-wider text-blue-400">
          Knowledge Base
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          CodeMentors Help Center
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Explore comprehensive guides and answers to frequently asked technical and billing questions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {guideSections.map((sec, i) => {
          const Icon = sec.icon;
          return (
            <div
              key={i}
              className="p-8 rounded-3xl border border-slate-800 bg-slate-900/40 space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">{sec.title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{sec.desc}</p>

                <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                  {sec.links.map((link, lIdx) => (
                    <Link
                      key={lIdx}
                      href={link.href}
                      className="flex items-center justify-between text-xs text-blue-400 hover:text-blue-300 font-medium py-1 transition-colors"
                    >
                      <span>{link.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Still need help CTA */}
      <div className="p-8 rounded-3xl border border-blue-500/30 bg-blue-950/20 text-center space-y-4">
        <h3 className="text-xl font-bold text-white">Can't find what you're looking for?</h3>
        <p className="text-xs text-slate-300 max-w-md mx-auto">
          Our engineering support team and curriculum mentors are available to help you with technical or billing questions.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all"
        >
          Contact Support Team
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
