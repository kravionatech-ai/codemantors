import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service",
  description: "Terms and conditions governing use of the CodeMentors learning platform.",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8 text-slate-300 text-xs sm:text-sm leading-relaxed">
      <div className="space-y-3 pb-6 border-b border-slate-800">
        <h1 className="text-3xl font-black text-white">Terms and Conditions of Service</h1>
        <p className="text-slate-400">Effective Date: October 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">1. Agreement to Terms</h2>
        <p>
          By creating an account, accessing courses, or utilizing services on CodeMentors, you agree to be bound by these Terms of Service. If you do not agree to all terms, you must discontinue use immediately.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">2. User Accounts & Security</h2>
        <p>
          You are responsible for safeguarding your login credentials. You agree not to disclose your password to any third party and to notify us immediately of any unauthorized access. Account sharing or credential resale results in immediate account termination.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">3. Intellectual Property Rights</h2>
        <p>
          All video streams, technical tutorials, architectural diagrams, quiz questions, and software source code provided on CodeMentors remain the exclusive property of CodeMentors and its contributing authors. You are granted a personal, non-transferable license to access the course content for educational purposes.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">4. Fair Use of Sandbox Coding Environments</h2>
        <p>
          Coding exercises run within secure browser execution scopes. You may not use the platform to deploy malicious software, execute denial of service attacks, or attempt unauthorized access to platform infrastructure.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">5. Governing Law</h2>
        <p>
          These Terms are governed by and construed in accordance with the laws of India, without regard to conflict of law principles.
        </p>
      </section>
    </div>
  );
}
