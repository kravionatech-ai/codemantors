import React from "react";
import Link from "next/link";
import { HelpCircle, ArrowRight } from "lucide-react";

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center space-y-3">
        <span className="text-xs uppercase font-bold tracking-wider text-blue-400">
          Got Questions?
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Find clear answers to questions about our platform, video delivery, certificates, and learning methodology.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <details
            key={i}
            className="group p-6 rounded-2xl border border-slate-800 bg-slate-900/40 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex items-center justify-between cursor-pointer font-bold text-sm text-slate-200 group-hover:text-blue-400 transition-colors">
              <span>{faq.q}</span>
              <span className="ml-4 shrink-0 transition duration-300 group-open:-rotate-180 text-slate-500">
                ▼
              </span>
            </summary>
            <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/80 pt-3">
              {faq.a}
            </p>
          </details>
        ))}
      </div>

      <div className="text-center pt-8 border-t border-slate-800 text-xs text-slate-400">
        Still have questions? Check out our{" "}
        <Link href="/help" className="text-blue-400 font-semibold hover:underline">
          Help Center
        </Link>{" "}
        or{" "}
        <Link href="/contact" className="text-blue-400 font-semibold hover:underline">
          contact our support team
        </Link>
        .
      </div>
    </div>
  );
}
