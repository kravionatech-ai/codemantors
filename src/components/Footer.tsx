"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Code2, Send, CheckCircle2, ShieldCheck, Globe } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [branding, setBranding] = useState<any>({
    enabled: true,
    companyName: "Kraviona Tech Solutions",
    companyUrl: "https://kraviona.com/",
    tagline: "Web Development | Backend Engineering | Technical SEO | AI Automation",
    shortDescription:
      "Kraviona Tech Solutions is a technology company focused on web development, full-stack application development, backend engineering, technical SEO, web performance, and AI automation.",
    services: [
      "MERN Stack Development",
      "React.js and Next.js Development",
      "Node.js Backend and API Development",
      "Technical SEO and Website Performance Optimization",
      "UI/UX and Web Application Development",
      "AI Automation and AI Chatbot Development",
      "E-commerce Development",
    ],
    contact: {
      website: "https://kraviona.com/contact",
      email: "contact@kraviona.com",
      phone: "+91 96085 53167",
    },
    displayPosition: "both",
    openInNewTab: true,
  });

  useEffect(() => {
    fetch("/api/cms/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings?.companyBranding) {
          setBranding(data.settings.companyBranding);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes("@")) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="w-full border-t border-[#1E293B] bg-[#0B1730] text-[#94A3B8] text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#14264F] flex items-center justify-center border border-[#1E293B]">
                <Code2 className="w-4.5 h-4.5 text-[#06B6D4]" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                CodeMentors
              </span>
            </Link>
            <p className="text-[#94A3B8] text-xs sm:text-sm leading-relaxed max-w-sm">
              Learn, build, & grow with expert mentors and project-based courses. Your journey to creative career starts here.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="mailto:support@codementors.test"
                className="w-8 h-8 rounded-lg bg-[#14264F] border border-[#1E293B] flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors"
                aria-label="Email"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-[#14264F] border border-[#1E293B] flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-[#14264F] border border-[#1E293B] flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-[#14264F] border border-[#1E293B] flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              </a>
            </div>
          </div>

          {/* Learn Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Learn
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/courses" className="hover:text-white transition-colors">
                  All Courses
                </Link>
              </li>
              <li>
                <Link href="/learning-paths" className="hover:text-white transition-colors">
                  Learning Paths
                </Link>
              </li>
              <li>
                <Link href="/#mentors" className="hover:text-white transition-colors">
                  Mentors
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Company
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-white transition-colors">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Subscribe to Updates Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Subscribe to Updates
            </h4>
            <p className="text-xs text-[#94A3B8]">
              Get latest courses, tips and updates.
            </p>
            {subscribed ? (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Thank you for subscribing!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="flex items-center rounded-lg bg-[#14264F] border border-[#1E293B] overflow-hidden focus-within:border-[#2563EB]">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 text-xs bg-transparent text-white placeholder-[#64748B] focus:outline-none"
                  />
                  <button
                    type="submit"
                    aria-label="Subscribe"
                    className="p-2.5 bg-[#2563EB] hover:bg-blue-600 text-white transition-colors shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
            <div className="pt-2 flex items-center gap-2 text-[11px] text-[#94A3B8]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>Zero spam. Unsubscribe anytime.</span>
            </div>
          </div>
        </div>

        {/* Technology Partner & Engineering Credit */}
        {branding?.enabled !== false && (
          <div className="mt-12 pt-8 border-t border-[#1E3A8A] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-[#94A3B8]">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-white">Powered by</span>
                <a
                  href={branding.companyUrl || "https://kraviona.com/"}
                  target={branding.openInNewTab ? "_blank" : undefined}
                  rel={branding.openInNewTab ? "noopener noreferrer" : undefined}
                  className="font-bold text-[#06B6D4] hover:text-white transition-colors underline decoration-[#06B6D4]/40 hover:decoration-white"
                >
                  Kraviona
                </a>
                <span className="text-[#94A3B8]">({branding.companyName || "Kraviona Tech Solutions"})</span>
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                {branding.tagline || "Web Development | Backend Engineering | Technical SEO | AI Automation"}
              </p>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <a
                href={branding.companyUrl || "https://kraviona.com/"}
                target={branding.openInNewTab ? "_blank" : undefined}
                rel={branding.openInNewTab ? "noopener noreferrer" : undefined}
                className="hover:text-white transition-colors inline-flex items-center gap-1"
              >
                Website: <span className="text-[#06B6D4]">{branding.companyUrl || "https://kraviona.com/"}</span>
              </a>
              <span className="text-[#1E3A8A]">•</span>
              <Link href="/company" className="hover:text-white transition-colors">
                About the Company
              </Link>
            </div>
          </div>
        )}

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#94A3B8]">
          <p>© {new Date().getFullYear()} CodeMentors. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/sitemap.xml" className="hover:text-white transition-colors">
              Sitemap
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Cookies
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Feedback
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
