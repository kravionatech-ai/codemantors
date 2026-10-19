import React from "react";

export const metadata = {
  title: "Terms of Service",
  description: "Terms and conditions governing use of the CodeMentors learning platform.",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 bg-[#F8FAFC] text-[#0F172A]">
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 sm:p-12 shadow-xs space-y-8 text-xs sm:text-sm leading-relaxed text-[#64748B]">
        <div className="space-y-2 pb-6 border-b border-[#E2E8F0]">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172554]">
            Terms and Conditions of Service
          </h1>
          <p className="text-xs text-[#94A3B8]">Effective Date: October 2026</p>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#0F172A]">1. Agreement to Terms</h2>
          <p>
            By creating an account, accessing courses, or utilizing services on CodeMentors, you agree to be bound by these Terms of Service. If you do not agree to all terms, you must discontinue use immediately.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#0F172A]">2. User Accounts & Security</h2>
          <p>
            You are responsible for safeguarding your login credentials. You agree not to disclose your password to any third party and to notify us immediately of any unauthorized access. Account sharing or credential resale results in immediate account termination.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#0F172A]">3. Intellectual Property Rights</h2>
          <p>
            All video streams, technical tutorials, architectural diagrams, quiz questions, and software source code provided on CodeMentors remain the exclusive property of CodeMentors and its contributing authors. You are granted a personal, non-transferable license to access the course content for educational purposes.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#0F172A]">4. Fair Use of Sandbox Coding Environments</h2>
          <p>
            Coding exercises run within secure browser execution scopes. You may not use the platform to deploy malicious software, execute denial of service attacks, or attempt unauthorized access to platform infrastructure.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#0F172A]">5. Governing Law</h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of India, without regard to conflict of law principles.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#0F172A]">6. Technology Provider & Platform Infrastructure</h2>
          <p>
            The CodeMentors LMS software architecture, web application engineering, and dynamic curriculum infrastructure are engineered and powered by{" "}
            <a
              href="https://kraviona.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2563EB] hover:underline font-semibold"
            >
              Kraviona Tech Solutions
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
