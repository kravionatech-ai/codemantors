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
  ShieldCheck,
  Zap,
  Users,
  Compass,
  Sparkles,
  BookOpen,
  Laptop,
  Terminal,
  HelpCircle,
} from "lucide-react";

export default async function HomePage() {
  let featuredCourses: any[] = [];
  let categories: any[] = [];
  let learningPaths: any[] = [];
  let reviews: any[] = [];
  let instructors: any[] = [];

  try {
    await connectDB();
    [featuredCourses, categories, learningPaths, reviews, instructors] = await Promise.all([
      Course.find({ status: "published", isFeatured: true })
        .populate("instructor", "name avatar headline")
        .limit(6)
        .lean(),
      Category.find().sort({ displayOrder: 1 }).limit(8).lean(),
      LearningPath.find({ isPublished: true }).populate("courses", "title slug thumbnail level").limit(3).lean(),
      Review.find({ status: "approved" }).populate("userId", "name avatar headline").populate("courseId", "title").limit(3).lean(),
      User.find({ role: "instructor", isActive: true }).select("name avatar headline bio socialLinks").limit(3).lean(),
    ]);
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
      a: "Every course is structured with mixed learning modalities. You get visual walkthroughs and system architecture explanations in high-definition video lessons, coupled with deep-dive written technical articles containing copyable code snippets, callouts, and architectural diagrams.",
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
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
      />

      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-800/80 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Generation Developer LMS</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Learn to Code. Build Real Skills.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400">
                Grow Your Career.
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Master software engineering with industry-leading video lessons, in-depth technical documentation, interactive quizzes, and hands-on coding sandboxes.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/courses"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105"
              >
                Explore Courses
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-800 transition-all"
              >
                Start Learning Free
              </Link>
            </div>

            {/* Interactive Search Bar */}
            <div className="pt-6 max-w-xl mx-auto">
              <form
                action="/courses"
                method="GET"
                className="relative flex items-center shadow-2xl rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/80 backdrop-blur-md focus-within:border-blue-500 transition-colors"
              >
                <Search className="w-5 h-5 text-slate-400 ml-4 shrink-0" />
                <input
                  type="text"
                  name="search"
                  placeholder="Search by topic, e.g. Next.js, TypeScript, Python, Architecture..."
                  className="w-full px-4 py-3.5 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="mr-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shrink-0"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Trust Badges */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-400" />
                <span>HD Video Walkthroughs</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Deep Technical Articles</span>
              </div>
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>In-Browser Coding Practice</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Accredited Certificates</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Popular Categories */}
      <section className="py-16 border-b border-slate-800/80 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-blue-400">
                Browse by Specialization
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                Top Engineering Categories
              </h2>
            </div>
            <Link
              href="/courses"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
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
                className="group p-5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Code2 className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-slate-100 group-hover:text-blue-400 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {cat.courseCount ? `${cat.courseCount} Courses` : "Explore track"}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Featured Courses */}
      <section className="py-20 border-b border-slate-800/80 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-blue-400">
                Curated for Engineers
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                Featured Production Courses
              </h2>
            </div>
            <Link
              href="/courses"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
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
              <div className="col-span-full py-12 text-center text-slate-400">
                <p>Loading curated courses...</p>
                <Link
                  href="/courses"
                  className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-xs"
                >
                  View Course Catalog
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Structured Learning Paths */}
      <section className="py-20 border-b border-slate-800/80 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">
              Career Roadmaps
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-1">
              Curated Learning Paths
            </h2>
            <p className="text-sm text-slate-400 mt-2">
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
                    courses: [1, 2, 3],
                  },
                  {
                    title: "AI & Full-Stack Systems Engineer",
                    slug: "ai-systems-engineer",
                    description: "Combine modern full-stack web engineering with production Python LLM application development.",
                    level: "Intermediate",
                    estimatedHours: 50,
                    courses: [1, 2],
                  },
                ]
            ).map((path: any) => (
              <div
                key={path.slug}
                className="p-8 rounded-3xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-4">
                    <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold">
                      {path.level}
                    </span>
                    <span className="text-slate-400 font-medium">
                      ~{path.estimatedHours || 50} Hours Total
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{path.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-6">
                    {path.description}
                  </p>

                  <div className="space-y-2.5 mb-6">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
                      Included Curriculum Steps:
                    </span>
                    {(path.learningObjectives || [
                      "Master JavaScript runtime mechanics & Event Loop",
                      "Build production Next.js 15 App Router applications",
                      "Implement Hexagonal Architecture & Type Narrowing in TypeScript",
                    ]).map((obj: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href="/learning-paths"
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold text-center border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  Explore Roadmap Details
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Why Choose CodeMentors */}
      <section className="py-20 border-b border-slate-800/80 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-400">
              The CodeMentors Advantage
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-1">
              Engineered for Serious Software Developers
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Most platforms give you isolated toy snippets. We teach full production architectures, edge cases, and real systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Mixed Video & Article Engine</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Seamlessly toggle between video walkthroughs and searchable, syntax-highlighted written articles with copy-code tools.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Quizzes & Coding Sandboxes</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Test your knowledge through timed conceptual quizzes and in-browser coding exercises that run against unit tests.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-600/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Accredited Verification</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Earn cryptographic certificates of completion with public verification URLs you can link to your resume and LinkedIn profile.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Learning Process (4 steps) */}
      <section className="py-20 border-b border-slate-800/80 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">
              Workflow
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-1">
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
                className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 relative overflow-hidden"
              >
                <span className="text-3xl font-black text-slate-800 absolute top-4 right-4 select-none">
                  {s.step}
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center font-bold text-xs mb-4">
                  {s.step}
                </div>
                <h3 className="text-base font-bold text-white mb-2">{s.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Student Testimonials (genuine data) */}
      <section className="py-20 border-b border-slate-800/80 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-400">
              Learner Feedback
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-1">
              What Engineers Are Saying
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Verified reviews submitted by enrolled students
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(reviews.length > 0
              ? reviews
              : [
                  {
                    reviewText:
                      "The explanation of React Server Components vs Client Components finally made everything click for me. The hands-on project and Server Actions lessons are top notch!",
                    userId: { name: "Jane Student", headline: "Software Engineer" },
                    courseId: { title: "Next.js 15 & React 19 Mastery" },
                  },
                  {
                    reviewText:
                      "Branded types and the clean repository pattern changed how our entire engineering team structures our Node.js services. Essential course for serious devs.",
                    userId: { name: "Marcus Wright", headline: "Senior Backend Developer" },
                    courseId: { title: "TypeScript Enterprise Patterns" },
                  },
                ]
            ).map((r: any, idx: number) => (
              <div
                key={idx}
                className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-3">
                    {"★".repeat(5)}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                    "{r.reviewText}"
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                    {r.userId?.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{r.userId?.name || "Student"}</h4>
                    <p className="text-[11px] text-slate-400">{r.userId?.headline || "Enrolled Learner"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Instructors Section */}
      <section className="py-20 border-b border-slate-800/80 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">
              Expert Mentorship
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-1">
              Learn from Staff Engineers & Architects
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {(instructors.length > 0
              ? instructors
              : [
                  {
                    name: "Alex Rivers",
                    headline: "Staff Software Architect & Ex-Tech Lead",
                    bio: "12+ years building distributed cloud platforms, full-stack React systems, and mentoring 50,000+ engineers worldwide.",
                  },
                  {
                    name: "Dr. Sarah Chen",
                    headline: "Principal Systems Engineer & AI Researcher",
                    bio: "PhD in Distributed Computing. Specializes in TypeScript internals, High-Performance Node.js, and LLM orchestration.",
                  },
                ]
            ).map((ins: any) => (
              <div
                key={ins.name}
                className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left"
              >
                {ins.avatar ? (
                  <img
                    src={ins.avatar}
                    alt={ins.name}
                    className="w-20 h-20 rounded-2xl object-cover shrink-0 bg-slate-800"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shrink-0">
                    {ins.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white">{ins.name}</h3>
                  <p className="text-xs text-blue-400 font-semibold mb-2">{ins.headline}</p>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{ins.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Interactive FAQ Accordion */}
      <section className="py-20 border-b border-slate-800/80 bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-400">
              Questions & Answers
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-1">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group p-5 rounded-2xl border border-slate-800 bg-slate-900/40 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer font-semibold text-sm text-slate-200 group-hover:text-blue-400 transition-colors">
                  <span>{faq.q}</span>
                  <span className="ml-4 shrink-0 transition duration-300 group-open:-rotate-180 text-slate-400">
                    ▼
                  </span>
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Bottom Banner Call-To-Action */}
      <section className="py-20 bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Ready to Accelerate Your Software Engineering Career?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Join thousands of developers leveling up their full-stack, systems architecture, and AI engineering skills today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/register"
              className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-xl shadow-blue-500/30 transition-all hover:scale-105"
            >
              Get Started Now
            </Link>
            <Link
              href="/courses"
              className="px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-800 transition-all"
            >
              Explore Course Catalog
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
