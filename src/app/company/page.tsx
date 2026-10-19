import React from "react";
import Link from "next/link";
import {
  Code2,
  ExternalLink,
  Cpu,
  Layers,
  Search,
  Bot,
  ShoppingBag,
  Layout,
  Phone,
  Mail,
  Globe,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: "About Kraviona Tech Solutions — Technology Partner",
  description:
    "Kraviona Tech Solutions is the technology company behind CodeMentors LMS, specializing in web development, backend engineering, technical SEO, and AI automation.",
};

const coreServices = [
  {
    title: "MERN Stack Development",
    description:
      "Full-lifecycle engineering with MongoDB, Express.js, React, and Node.js for scalable, data-intensive web applications.",
    icon: Layers,
    color: "text-[#2563EB] bg-blue-50 border-blue-200",
  },
  {
    title: "React.js and Next.js Development",
    description:
      "Modern server-side rendering, App Router architectures, streaming SSR, and edge execution for enterprise React applications.",
    icon: Code2,
    color: "text-[#172554] bg-indigo-50 border-indigo-200",
  },
  {
    title: "Node.js Backend and API Development",
    description:
      "High-throughput microservices, RESTful and GraphQL APIs, event queues, and resilient distributed backend systems.",
    icon: Cpu,
    color: "text-[#16A34A] bg-emerald-50 border-emerald-200",
  },
  {
    title: "Technical SEO and Website Performance",
    description:
      "Core Web Vitals optimization, automated XML sitemaps, structured schema data, and crawl budget maximization.",
    icon: Search,
    color: "text-[#D97706] bg-amber-50 border-amber-200",
  },
  {
    title: "UI/UX and Web Application Development",
    description:
      "Accessible design systems, responsive client interfaces, interactive state modeling, and component libraries.",
    icon: Layout,
    color: "text-[#06B6D4] bg-cyan-50 border-cyan-200",
  },
  {
    title: "AI Automation and AI Chatbot Development",
    description:
      "Integration of Large Language Models, autonomous agent workflows, retrieval-augmented generation (RAG), and smart chatbots.",
    icon: Bot,
    color: "text-purple-600 bg-purple-50 border-purple-200",
  },
  {
    title: "E-commerce Development",
    description:
      "Secure payment gateway integrations, multi-item shopping carts, automated receipting, and order lifecycle management.",
    icon: ShoppingBag,
    color: "text-rose-600 bg-rose-50 border-rose-200",
  },
];

export default function CompanyPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16 bg-[#F8FAFC] text-[#0F172A]">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-[#2563EB]">
          <span>Technology Partner & Engineering Provider</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#172554] tracking-tight">
          Kraviona Tech Solutions
        </h1>
        <p className="text-base sm:text-lg text-[#64748B] max-w-3xl mx-auto leading-relaxed">
          Kraviona Tech Solutions is a technology company focused on web development, full-stack application development, backend engineering, technical SEO, web performance, and AI automation.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://kraviona.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Visit Official Website</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          <a
            href="https://kraviona.com/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A] text-xs font-semibold transition-colors"
          >
            <span>Get in Touch</span>
            <ArrowRight className="w-4 h-4 text-[#64748B]" />
          </a>
        </div>
      </div>

      {/* Role with CodeMentors */}
      <div className="p-8 rounded-2xl border border-[#E2E8F0] bg-white shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#06B6D4]">
          <ShieldCheck className="w-4 h-4" />
          <span>Technology Behind CodeMentors</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#172554]">
          Powering the CodeMentors Learning Management System
        </h2>
        <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
          Kraviona Tech Solutions serves as the technology company behind the CodeMentors LMS platform. From modern App Router architectures and dynamic CMS page builders to granular role-based access control (RBAC), Razorpay payment verification, and automated SEO diagnostic pipelines, Kraviona engineers the scalable software systems that empower developers worldwide.
        </p>
      </div>

      {/* Core Services Grid */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-[#172554]">
            Core Engineering Services
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-xl mx-auto">
            Comprehensive full-stack engineering and software solutions provided by Kraviona Tech Solutions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coreServices.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.title}
                className="p-6 rounded-xl border border-[#E2E8F0] bg-white space-y-3 shadow-xs hover:border-[#2563EB]/40 transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${service.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#0F172A]">{service.title}</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verified Contact Details Card */}
      <div className="p-8 rounded-2xl border border-[#1E3A8A] bg-[#172554] text-white shadow-xs space-y-6">
        <div className="space-y-2">
          <span className="text-xs uppercase font-bold tracking-wider text-[#06B6D4]">
            Official Company Contact
          </span>
          <h2 className="text-2xl font-extrabold text-white">
            Connect with Kraviona Tech Solutions
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] max-w-xl">
            For inquiries regarding web development, full-stack application development, backend architecture, and technical consulting.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <a
            href="https://kraviona.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors space-y-1 block"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[#06B6D4]">
              <Globe className="w-4 h-4" />
              <span>Official Website</span>
            </div>
            <p className="text-xs font-medium text-white break-all">https://kraviona.com/</p>
            <span className="text-[10px] text-[#94A3B8]">Opens in new tab</span>
          </a>

          <a
            href="https://kraviona.com/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors space-y-1 block"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[#06B6D4]">
              <Mail className="w-4 h-4" />
              <span>Contact Page & Inquiries</span>
            </div>
            <p className="text-xs font-medium text-white break-all">kraviona.com/contact</p>
            <span className="text-[10px] text-[#94A3B8]">contact@kraviona.com</span>
          </a>

          <a
            href="tel:+919608553167"
            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors space-y-1 block"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[#06B6D4]">
              <Phone className="w-4 h-4" />
              <span>Telephone Inquiries</span>
            </div>
            <p className="text-xs font-medium text-white">+91 96085 53167</p>
            <span className="text-[10px] text-[#94A3B8]">Direct line</span>
          </a>
        </div>
      </div>
    </div>
  );
}
