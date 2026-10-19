import React from "react";
import Link from "next/link";
import { ShieldCheck, RotateCcw, Clock, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Refund Policy",
  description: "CodeMentors transparent 7-day course refund policy and cancellation guidelines.",
};

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 bg-[#F8FAFC] text-[#0F172A]">
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 sm:p-12 shadow-xs space-y-8 text-xs sm:text-sm leading-relaxed text-[#64748B]">
        <div className="space-y-2 pb-6 border-b border-[#E2E8F0]">
          <span className="text-xs uppercase font-bold tracking-wider text-[#2563EB]">
            Transparency & Trust
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172554] tracking-tight">
            CodeMentors Refund & Cancellation Policy
          </h1>
          <p className="text-xs text-[#94A3B8]">Last updated: October 2026</p>
        </div>

        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/60 flex items-start gap-3 text-[#172554]">
          <ShieldCheck className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
          <p>
            At CodeMentors, our curriculum is engineered to deliver actionable, enterprise-grade engineering competencies. If you are not satisfied with your purchase, we provide a transparent 7-day refund guarantee subject to the fair-use criteria outlined below.
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#0F172A]">1. Refund Eligibility Conditions</h2>
          <p>To qualify for a full refund of your course purchase:</p>
          <ul className="list-disc list-inside space-y-1.5 text-[#64748B]">
            <li>The refund request must be submitted within <strong>7 calendar days</strong> from the date of purchase.</li>
            <li>You must have completed <strong>less than 30%</strong> of the total course lessons and curriculum modules.</li>
            <li>No course certificate of completion has been claimed or issued for the course in question.</li>
            <li>The course was purchased directly through CodeMentors via our official Razorpay checkout.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#0F172A]">2. Refund Request Workflow</h2>
          <p>
            Students can initiate a refund request directly from their personal dashboard or by contacting support:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-[#64748B]">
            <li>Navigate to your <strong>Student Dashboard</strong> and locate the enrolled course.</li>
            <li>Click on <strong>Request Refund</strong> and select the reason for your request.</li>
            <li>Our administration team reviews your learning metrics and enrollment timestamps within 24-48 business hours.</li>
            <li>Upon approval, our server reconciles the financial ledger with Razorpay and initiates the payout back to your original payment method (UPI, card, or net banking).</li>
          </ol>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#0F172A]">3. Payout Processing Timelines</h2>
          <p>
            Once an administrator marks your refund request as <strong>Approved</strong>, Razorpay and bank banking networks typically credit the funds to your original payment account within <strong>5 to 7 business days</strong>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#0F172A]">4. Course Access Upon Refund</h2>
          <p>
            Once a refund has succeeded, active enrollment access to the course, private video streams, lesson notes, and community discussion channels is revoked. Your historical payment ledger and transaction records are preserved indefinitely for compliance and financial audit integrity.
          </p>
        </section>

        <div className="pt-6 border-t border-[#E2E8F0] text-[#64748B]">
          Have questions regarding a recent order? Contact our billing team at{" "}
          <a href="mailto:billing@codementors.com" className="text-[#2563EB] font-medium hover:underline">
            billing@codementors.com
          </a>{" "}
          or submit a ticket via our{" "}
          <Link href="/contact" className="text-[#2563EB] font-medium hover:underline">
            Contact Portal
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
