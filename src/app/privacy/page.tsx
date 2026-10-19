import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
  description: "CodeMentors privacy policy detailing data handling, cookies, and protection standards.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 bg-[#F8FAFC] text-[#0F172A]">
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 sm:p-12 shadow-xs space-y-8 text-xs sm:text-sm leading-relaxed text-[#64748B]">
        <div className="space-y-2 pb-6 border-b border-[#E2E8F0]">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172554]">
            Privacy Policy
          </h1>
          <p className="text-xs text-[#94A3B8]">Effective Date: October 2026</p>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#0F172A]">1. Information We Collect</h2>
          <p>
            We collect personal information necessary to deliver educational content and administer accounts:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-[#64748B]">
            <li>Account credentials: Name, email address, password hash, and optional profile bio.</li>
            <li>Learning telemetry: Video resume timestamps, lesson completions, quiz attempts, and notes.</li>
            <li>Payment information: Razorpay transaction IDs and order receipts. We do not store raw credit card numbers or UPI PINs on our servers.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#0F172A]">2. How We Protect Your Data</h2>
          <p>
            We employ industry-standard cryptographic practices including salted bcrypt password hashing, HTTP-only secure session cookies, SSL/TLS transport encryption, and parameterized database queries to protect against NoSQL injection and XSS.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#0F172A]">3. Third-Party Integrations</h2>
          <p>
            We share data strictly with verified infrastructure partners to deliver platform features, including Razorpay for payment processing and trusted video delivery networks. We never sell student data to third-party advertisers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#0F172A]">4. Your Rights</h2>
          <p>
            You have the right to request access to your personal data, rectify inaccuracies, or delete your account by contacting{" "}
            <a href="mailto:privacy@codementors.com" className="text-[#2563EB] font-medium hover:underline">
              privacy@codementors.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
