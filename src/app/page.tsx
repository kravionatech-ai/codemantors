import React from "react";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Course, Category, LearningPath, Review, User } from "@/models";
import CourseCard from "@/components/ui/CourseCard";
import {
  Code2,
  Video,
  FileText,
  Award,
  CheckCircle2,
  Search,
  ArrowRight,
  Sparkles,
  Terminal,
  Star,
  Users,
  Compass,
} from "lucide-react";
import { Metadata } from "next";
import { resolvePageSeo } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return await resolvePageSeo("/", {
    title: "CodeMentors — Learn to Code. Build Real Skills. Grow Your Career.",
    description:
      "Enterprise online learning platform for software developers. Master modern stacks with structured video lessons, interactive coding exercises, and accredited certificates.",
    canonicalPath: "/",
  });
}

export default async function HomePage() {
  let featuredCourses: any[] = [];
  let categories: any[] = [];
  let learningPaths: any[] = [];
  let reviews: any[] = [];
  let instructors: any[] = [];

  try {
    await connectDB();
    const [rawCourses, rawCategories, rawPaths, rawReviews, rawInstructors] = await Promise.all([
      Course.find({ status: "published", isFeatured: true })
        .populate("instructor", "name avatar headline")
        .limit(6)
        .lean(),
      Category.find().sort({ displayOrder: 1 }).limit(8).lean(),
      LearningPath.find({ isPublished: true }).populate("courses", "title slug thumbnail level").limit(3).lean(),
      Review.find({ status: "approved" }).populate("userId", "name avatar headline").populate("courseId", "title").limit(3).lean(),
      User.find({ role: "instructor", isActive: true }).select("name avatar headline bio socialLinks").limit(3).lean(),
    ]);

    featuredCourses = JSON.parse(JSON.stringify(rawCourses || []));
    categories = JSON.parse(JSON.stringify(rawCategories || []));
    learningPaths = JSON.parse(JSON.stringify(rawPaths || []));
    reviews = JSON.parse(JSON.stringify(rawReviews || []));
    instructors = JSON.parse(JSON.stringify(rawInstructors || []));
  } catch (err) {
    console.warn("Database query during home render (DB may be seeding):", err);
  }

  const jsonLdWebSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "CodeMentors",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    potentialAction: {
      "@type": "SearchAction",
      target: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/courses?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const faqs = [
    {
      q: "How does CodeMentors combine video and text-based learning?",
      a: "Every course is structured with dual learning modalities. You get visual walkthroughs and system architecture explanations in high-definition video lessons, coupled with deep-dive written technical articles containing copyable code snippets, callouts, and architectural diagrams.",
    },
    {
      q: "Are the certificates verified and shareable?",
      a: "Yes! Every student who successfully finishes all module lessons and passes the required quizzes earns an authenticated Certificate of Achievement with a unique cryptographic verification code and public URL.",
    },
    {
      q: "Can I try courses for free before purchasing?",
      a: "Absolutely. We offer complete free foundational courses (such as Modern JavaScript Foundations) and free preview lessons for all paid courses so you can inspect lesson quality before enrolling.",
    },
    {
      q: "What payment methods are supported?",
      a: "We support UPI, Net Banking, Credit/Debit cards, and major wallets powered by our secure Razorpay integration with test mode support.",
    },
    {
      q: "What is your refund policy?",
      a: "We offer a transparent 7-day money-back guarantee if you have completed less than 30% of course content and are unsatisfied with the curriculum.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
      />

      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-24 border-b border-[#E2E8F0] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-[#2563EB]">
              <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>Next-Generation Developer Learning Management System</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#172554] leading-tight">
              Learn to Code. Build Real Skills.{" "}
              <span className="text-[#2563EB]">Grow Your Career.</span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-[#64748B] leading-relaxed max-w-2xl mx-auto">
              Master software engineering with industry-grade video lessons, structured text tutorials, interactive quizzes, and hands-on coding practice.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/courses"
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white font-semibold text-sm shadow-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>Explore Courses</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register"
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white hover:bg-slate-50 text-[#0F172A] font-semibold text-sm border border-[#E2E8F0] shadow-xs transition-colors"
              >
                Start Learning Free
              </Link>
            </div>

            {/* Interactive Search Bar */}
            <div className="pt-4 max-w-xl mx-auto">
              <form
                action="/courses"
                method="GET"
                className="relative flex items-center rounded-xl overflow-hidden border border-[#E2E8F0] bg-[#F8FAFC] focus-within:border-[#2563EB] focus-within:bg-white shadow-2xs transition-all"
              >
                <Search className="w-5 h-5 text-[#94A3B8] ml-4 shrink-0" />
                <input
                  type="text"
                  name="search"
                  placeholder="Search by topic, e.g. Next.js, TypeScript, Python, Architecture..."
                  className="w-full px-4 py-3 bg-transparent text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none"
                />
                <button
                  type="submit"
                  className="mr-2 px-4 py-2 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Trust Badges */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-[#64748B]">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-[#2563EB]" />
                <span>HD Video Walkthroughs</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#172554]" />
                <span>Deep Technical Articles</span>
              </div>
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#16A34A]" />
                <span>In-Browser Coding Practice</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#06B6D4]" />
                <span>Verifiable Certificates</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Popular Categories */}
      <section className="py-16 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-[#2563EB]">
                Browse by Specialization
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] mt-1">
                Top Engineering Categories
              </h2>
            </div>
            <Link
              href="/courses"
              className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1"
            >
              View all categories <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {(categories.length > 0
              ? categories
              : [
                  { name: "Web Development", slug: "web-development", courseCount: 4 },
                  { name: "Next.js & React", slug: "nextjs-react", courseCount: 3 },
                  { name: "JavaScript & TypeScript", slug: "javascript-typescript", courseCount: 5 },
                  { name: "Backend & Node.js", slug: "backend-nodejs", courseCount: 2 },
                  { name: "Python & AI", slug: "python-ai", courseCount: 3 },
                  { name: "DevOps & Cloud", slug: "devops-cloud", courseCount: 2 },
                  { name: "Databases & System Design", slug: "databases-system-design", courseCount: 2 },
                  { name: "Java & Microservices", slug: "java-microservices", courseCount: 1 },
                ]
            ).map((cat: any) => (
              <Link
                key={cat.slug}
                href={`/courses?category=${encodeURIComponent(cat.name)}`}
                className="group p-5 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:shadow-xs transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center mb-3 group-hover:bg-[#172554] group-hover:text-white transition-colors">
                  <Code2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-[#64748B] mt-1">
                  {cat.courseCount ? `${cat.courseCount} Courses` : "Explore curriculum"}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Featured Courses */}
      <section className="py-20 border-b border-[#E2E8F0] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-[#2563EB]">
                Curated for Engineers
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] mt-1">
                Featured Production Courses
              </h2>
            </div>
            <Link
              href="/courses"
              className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1"
            >
              Explore all courses <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {featuredCourses.length > 0 ? (
              featuredCourses.map((c: any) => (
                <CourseCard key={c._id.toString()} course={c} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-[#64748B]">
                <p>Loading curated courses...</p>
                <Link
                  href="/courses"
                  className="mt-3 inline-block px-4 py-2 bg-[#172554] text-white rounded-lg text-xs"
                >
                  View Course Catalog
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Structured Learning Paths */}
      <section className="py-20 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase font-bold tracking-wider text-[#2563EB]">
              Career Roadmaps
            </span>
            <h2 className="text-3xl font-extrabold text-[#0F172A] mt-1">
              Curated Learning Paths
            </h2>
            <p className="text-sm text-[#64748B] mt-2">
              Follow step-by-step sequences designed to take you from foundational understanding to production competence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {(learningPaths.length > 0
              ? learningPaths
              : [
                  {
                    title: "Full-Stack Web Architect Path",
                    slug: "full-stack-web-architect",
                    description: "From JavaScript core execution mechanics to enterprise Next.js App Router and clean TypeScript architecture.",
                    level: "All Levels",
                    estimatedHours: 60,
                  },
                  {
                    title: "AI & Full-Stack Systems Engineer",
                    slug: "ai-systems-engineer",
                    description: "Combine modern full-stack web engineering with production Python LLM application development.",
                    level: "Intermediate",
                    estimatedHours: 50,
                  },
                ]
            ).map((path: any) => (
              <div
                key={path.slug}
                className="p-8 rounded-xl border border-[#E2E8F0] bg-white shadow-xs flex flex-col justify-between hover:border-[#CBD5E1] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-4">
                    <span className="px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-[#2563EB] font-semibold">
                      {path.level}
                    </span>
                    <span className="text-[#64748B] font-medium">
                      ~{path.estimatedHours || 50} Hours Total
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#0F172A] mb-2">{path.title}</h3>
                  <p className="text-sm text-[#64748B] leading-relaxed mb-6">
                    {path.description}
                  </p>

                  <div className="space-y-2.5 mb-6">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#0F172A] block">
                      Curriculum Highlights:
                    </span>
                    {(path.learningObjectives || [
                      "Master JavaScript runtime mechanics & Event Loop",
                      "Build production Next.js 15 App Router applications",
                      "Implement Hexagonal Architecture & Type Narrowing in TypeScript",
                    ]).map((obj: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-[#64748B]">
                        <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href="/learning-paths"
                  className="w-full py-2.5 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 text-[#0F172A] text-xs font-semibold text-center border border-[#E2E8F0] transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Explore Roadmap Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Why Choose CodeMentors */}
      <section className="py-20 border-b border-[#E2E8F0] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-bold tracking-wider text-[#2563EB]">
              The CodeMentors Advantage
            </span>
            <h2 className="text-3xl font-extrabold text-[#0F172A] mt-1">
              Engineered for Serious Developers
            </h2>
            <p className="text-sm text-[#64748B] mt-2">
              Most platforms provide toy snippets. We teach full production architectures, edge cases, and real systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#0F172A]">Dual Video & Article Engine</h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Seamlessly toggle between video walkthroughs and searchable, syntax-highlighted written articles with copy-code tools.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#0F172A]">Quizzes & Practice Labs</h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Validate comprehension through conceptual quizzes and in-browser coding exercises that execute against test cases.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-50 text-[#06B6D4] flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#0F172A]">Verifiable Credentials</h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Earn cryptographic certificates of completion with public verification URLs you can link to your resume and LinkedIn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Learning Process (4 steps) */}
      <section className="py-20 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-bold tracking-wider text-[#2563EB]">
              Structured Workflow
            </span>
            <h2 className="text-3xl font-extrabold text-[#0F172A] mt-1">
              How You Master Skills on CodeMentors
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Discover & Enroll",
                desc: "Choose a course or follow a career roadmap with instant access.",
              },
              {
                step: "02",
                title: "Watch & Read",
                desc: "Switch between visual demonstrations and deep technical article tutorials.",
              },
              {
                step: "03",
                title: "Practice & Test",
                desc: "Solve coding challenges and pass conceptual knowledge assessments.",
              },
              {
                step: "04",
                title: "Earn Certificate",
                desc: "Receive an accredited verifiable certificate to showcase your skills.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-xs relative overflow-hidden"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-xs mb-4">
                  {s.step}
                </div>
                <h3 className="text-base font-bold text-[#0F172A] mb-2">{s.title}</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Student Testimonials (genuine data) */}
      <section className="py-20 border-b border-[#E2E8F0] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-bold tracking-wider text-[#2563EB]">
              Learner Feedback
            </span>
            <h2 className="text-3xl font-extrabold text-[#0F172A] mt-1">
              What Engineers Are Saying
            </h2>
            <p className="text-xs text-[#64748B] mt-1">
              Verified reviews submitted by enrolled students
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.length > 0 ? (
              reviews.map((r: any, idx: number) => (
                <div
                  key={idx}
                  className="p-6 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col justify-between shadow-2xs"
                >
                  <div>
                    <div className="flex items-center gap-1 text-[#D97706] mb-3 text-sm">
                      {"★".repeat(5)}
                    </div>
                    <p className="text-xs sm:text-sm text-[#0F172A] leading-relaxed italic">
                      "{r.reviewText}"
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#172554] text-[#06B6D4] flex items-center justify-center font-bold text-xs">
                      {r.userId?.name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#0F172A]">{r.userId?.name || "Student"}</h4>
                      <p className="text-[11px] text-[#64748B]">{r.userId?.headline || "Enrolled Learner"}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 px-6 rounded-xl border border-dashed border-[#CBD5E1] text-center bg-white">
                <p className="text-sm font-semibold text-[#64748B]">No student reviews published yet.</p>
                <p className="text-xs text-[#94A3B8] mt-1">Verified reviews will appear here as enrolled students complete courses.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 8. Instructors Section */}
      <section className="py-20 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-bold tracking-wider text-[#2563EB]">
              Expert Mentorship
            </span>
            <h2 className="text-3xl font-extrabold text-[#0F172A] mt-1">
              Learn from Staff Engineers & Architects
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {instructors.length > 0 ? (
              instructors.map((ins: any) => (
                <div
                  key={ins._id || ins.name}
                  className="p-6 rounded-xl border border-[#E2E8F0] bg-white flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left shadow-xs"
                >
                  {ins.avatar ? (
                    <img
                      src={ins.avatar}
                      alt={ins.name}
                      className="w-18 h-18 rounded-xl object-cover shrink-0 bg-slate-100"
                    />
                  ) : (
                    <div className="w-18 h-18 rounded-xl bg-[#172554] text-[#06B6D4] flex items-center justify-center font-bold text-xl shrink-0">
                      {ins.name ? ins.name.charAt(0) : "I"}
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-bold text-[#0F172A]">{ins.name}</h3>
                    {ins.headline && (
                      <p className="text-xs text-[#2563EB] font-semibold mb-1.5">{ins.headline}</p>
                    )}
                    {ins.bio && (
                      <p className="text-xs text-[#64748B] leading-relaxed line-clamp-3">{ins.bio}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 px-6 rounded-xl border border-dashed border-[#CBD5E1] text-center bg-white">
                <p className="text-sm font-semibold text-[#64748B]">No instructors listed currently.</p>
                <p className="text-xs text-[#94A3B8] mt-1">Accredited course instructors will be listed here once assigned.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 9. Interactive FAQ Accordion */}
      <section className="py-20 border-b border-[#E2E8F0] bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs uppercase font-bold tracking-wider text-[#2563EB]">
              Questions & Answers
            </span>
            <h2 className="text-3xl font-extrabold text-[#0F172A] mt-1">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group p-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer font-bold text-sm text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                  <span>{faq.q}</span>
                  <span className="ml-4 shrink-0 transition duration-300 group-open:-rotate-180 text-[#64748B]">
                    ▼
                  </span>
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-[#64748B] leading-relaxed border-t border-[#E2E8F0] pt-3">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Bottom Banner Call-To-Action */}
      <section className="py-20 bg-[#172554] text-center text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Ready to Accelerate Your Software Engineering Career?
          </h2>
          <p className="text-sm sm:text-base text-[#94A3B8] max-w-xl mx-auto leading-relaxed">
            Join thousands of developers leveling up their full-stack, systems architecture, and AI engineering skills today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/register"
              className="px-6 py-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm shadow-xs transition-colors"
            >
              Get Started Now
            </Link>
            <Link
              href="/courses"
              className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/20 transition-colors"
            >
              Explore Course Catalog
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
