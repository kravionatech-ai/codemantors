"use client";

import React, { useState } from "react";
import { useToast } from "@/context/ToastContext";
import { Mail, MessageSquare, Phone, MapPin, Send, CheckCircle2, Loader2 } from "lucide-react";

export default function ContactClient() {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, category, message }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        toast.success("Message received! Our team will get back to you shortly.");
      } else {
        toast.error(data.error || "Failed to submit inquiry");
      }
    } catch {
      toast.error("An error occurred while sending your message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10 bg-[#F8FAFC] text-[#0F172A]">
      <div className="text-center space-y-2">
        <span className="text-xs uppercase font-bold tracking-wider text-[#2563EB]">
          Support & Inquiries
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#172554] tracking-tight">
          Contact CodeMentors
        </h1>
        <p className="text-sm text-[#64748B] max-w-lg mx-auto">
          Have questions regarding courses, certificates, billing, or curriculum? We're here to help.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contact Info Left */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-xl border border-[#E2E8F0] bg-white space-y-5 shadow-xs">
            <h3 className="text-sm font-bold text-[#0F172A]">Support Channels</h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-[#0F172A] block">Email Assistance</span>
                  <span className="text-[#64748B]">support@codementors.com</span>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">Response within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 text-[#06B6D4] flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-[#0F172A] block">Live Curriculum Q&A</span>
                  <span className="text-[#64748B]">In-lesson discussion forums</span>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">Monitored by course teaching staff</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-[#0F172A] block">Global Headquarters</span>
                  <span className="text-[#64748B]">CodeMentors EdTech Corp.</span>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">Bengaluru & San Francisco</p>
                </div>
              </div>
            </div>
          </div>

          {/* Technology Provider Inquiries Card */}
          <div className="p-6 rounded-xl border border-[#E2E8F0] bg-white space-y-4 shadow-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#06B6D4]">
                Technology Partner
              </span>
              <h3 className="text-sm font-bold text-[#0F172A] mt-0.5">
                Kraviona Tech Solutions
              </h3>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                For custom web application development, backend engineering, technical SEO, and enterprise software architecture.
              </p>
            </div>

            <div className="space-y-2.5 text-xs pt-1 border-t border-[#E2E8F0]">
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Website:</span>
                <a
                  href="https://kraviona.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#2563EB] hover:underline"
                >
                  kraviona.com
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Inquiries:</span>
                <a
                  href="https://kraviona.com/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#2563EB] hover:underline"
                >
                  kraviona.com/contact
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Telephone:</span>
                <a
                  href="tel:+919608553167"
                  className="font-medium text-[#0F172A] hover:text-[#2563EB]"
                >
                  +91 96085 53167
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form Right */}
        <div className="lg:col-span-7">
          <div className="p-6 sm:p-8 rounded-xl border border-[#E2E8F0] bg-white shadow-xs">
            {submitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#16A34A] border border-emerald-200 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">Message Received</h3>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
                  Thank you for reaching out. A curriculum or operations specialist will reply to your registered email shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-3 px-4 py-2 rounded-lg bg-[#172554] text-white text-xs font-semibold hover:bg-[#1E3A8A]"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-[#0F172A] block mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#0F172A] block mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@domain.com"
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-[#0F172A] block mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-[#E2E8F0] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="billing">Billing & Payments</option>
                      <option value="refund">Refund Request</option>
                      <option value="curriculum">Course Content / Quizzes</option>
                      <option value="certificate">Certificate Verification</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-[#0F172A] block mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="How can we help?"
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-[#0F172A] block mb-1">Detailed Message</label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide details about your question, account, or transaction ID..."
                    className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending inquiry...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
