import React from "react";
import Link from "next/link";
import { HelpCircle, ArrowRight } from "lucide-react";
import FaqAccordion from "@/components/ui/FaqAccordion";

export const metadata = {
  title: "Frequently Asked Questions",
  description: "Answers to common questions regarding learning, certificates, payments, and curriculum on CodeMentors.",
};

export default function FAQPage() {
  const faqs = [
    {
      q: "How does CodeMentors differ from generic tutorial sites?",
      a: "Generic platforms focus on syntax basics without showing how software behaves in production. CodeMentors teaches architectural mental models, concurrency, server state management, and edge cases, pairing high-definition video walkthroughs with copyable, production-ready written technical articles and coding challenges.",
    },
    {
      q: "Can I learn on both desktop and mobile devices?",
      a: "Yes! The entire CodeMentors learning interface is fully responsive. You can watch videos, read tutorials, and take conceptual quizzes on phones, tablets, or laptops.",
    },
    {
      q: "How is course completion and progress calculated?",
      a: "Progress is tracked across every lesson in each course module. For video lessons, watching at least 90% automatically marks the lesson as complete. For articles, quizzes, and coding exercises, completion is validated and saved on the server. When 100% of required lessons are completed, your certificate is instantly generated.",
    },
    {
      q: "How do I verify a certificate?",
      a: "Every certificate issued contains a unique cryptographic code (e.g., CM-2026-X89J21). Employers and recruiters can verify this code at /certificates/[code] or using our public verification search at /certificates/verify.",
    },
    {
      q: "What is your refund policy?",
      a: "We offer a 7-day money-back guarantee for all paid courses, provided you have completed less than 30% of the course curriculum. You can submit a refund request directly through your student dashboard.",
    },
    {
      q: "What payment gateways are supported?",
      a: "We integrate directly with Razorpay, supporting UPI (Google Pay, PhonePe, Paytm), Net Banking from all major Indian banks, and Visa/Mastercard/RuPay credit and debit cards.",
    },
    {
      q: "Can I become an instructor on CodeMentors?",
      a: "Yes! Experienced software architects and senior engineers can register as instructors and create course drafts via the Instructor Studio portal.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10 bg-[#F8FAFC] text-[#0F172A]">
      <div className="text-center space-y-2">
        <span className="text-xs uppercase font-bold tracking-wider text-[#2563EB]">
          Got Questions?
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#172554] tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-[#64748B] max-w-lg mx-auto">
          Find clear answers to questions about our platform, video delivery, certificates, and learning methodology.
        </p>
      </div>

      <FaqAccordion items={faqs} />

      <div className="p-6 rounded-xl bg-white border border-[#E2E8F0] text-center space-y-3 shadow-xs">
        <h3 className="text-base font-bold text-[#0F172A]">Still have questions?</h3>
        <p className="text-xs text-[#64748B]">Our support team is ready to assist you with any enrollment or account questions.</p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#172554] text-white text-xs font-semibold hover:bg-[#1E3A8A]"
        >
          <span>Contact Support</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
