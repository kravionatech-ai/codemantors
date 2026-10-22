import React from "react";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Course, Category, LearningPath, Review, User } from "@/models";
import CourseCard from "@/components/ui/CourseCard";
import {
  RevealSection,
  StaggerContainer,
  StaggerItem,
  Card3DTilt,
} from "@/components/ui/MotionComponents";
import Hero3DExperience from "@/components/home/Hero3DExperience";
import FaqAccordion from "@/components/ui/FaqAccordion";
import {
  Code2,
  Award,
  CheckCircle2,
  Search,
  ArrowRight,
  Sparkles,
  Terminal,
  Star,
  Users,
  Clock,
  Layers,
  FileCode,
  Cloud,
  Smartphone,
  Palette,
  Briefcase,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Metadata } from "next";
import { resolvePageSeo } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return await resolvePageSeo("/", {
    title: "CodeMentors — Learn to Code. Build Real Projects. With Expert Mentors.",
    description:
      "Master in-demand programming and design skills with structured courses, hands-on projects, and 1:1 mentorship from industry professionals.",
    canonicalPath: "/",
  });
}

export default async function HomePage() {
  let featuredCourses: any[] = [];
  let categories: any[] = [];
  let learningPaths: any[] = [];
  let reviews: any[] = [];
  let dbInstructors: any[] = [];

  try {
    await connectDB();
    const [rawCourses, rawCategories, rawPaths, rawReviews, rawInstructors] =
      await Promise.all([
        Course.find({ status: "published" })
          .populate("instructor", "name avatar headline")
          .sort({ isFeatured: -1, ratingAverage: -1 })
          .limit(8)
          .lean(),
        Category.find().sort({ displayOrder: 1 }).limit(12).lean(),
        LearningPath.find({ isPublished: true })
          .populate("courses", "title slug thumbnail level")
          .limit(3)
          .lean(),
        Review.find({ status: "approved" })
          .populate("userId", "name avatar headline")
          .populate("courseId", "title")
          .limit(6)
          .lean(),
        User.find({ role: "instructor", isActive: true })
          .select("name avatar headline bio socialLinks")
          .limit(4)
          .lean(),
      ]);

    featuredCourses = JSON.parse(JSON.stringify(rawCourses || []));
    categories = JSON.parse(JSON.stringify(rawCategories || []));
    learningPaths = JSON.parse(JSON.stringify(rawPaths || []));
    reviews = JSON.parse(JSON.stringify(rawReviews || []));
    dbInstructors = JSON.parse(JSON.stringify(rawInstructors || []));
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
      target: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/courses?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  // Popular Categories matching the reference design
  const popularCategories = [
    {
      name: "Web Development",
      slug: "web-development",
      coursesCount: "25+ Courses",
      icon: Code2,
      bgColor: "bg-blue-50 text-[#2563EB]",
    },
    {
      name: "React & Next",
      slug: "react-js",
      coursesCount: "18+ Courses",
      icon: Layers,
      bgColor: "bg-cyan-50 text-[#06B6D4]",
    },
    {
      name: "Backend Development",
      slug: "backend-development",
      coursesCount: "15+ Courses",
      icon: Terminal,
      bgColor: "bg-teal-50 text-[#0D9488]",
    },
    {
      name: "Python",
      slug: "python",
      coursesCount: "20+ Courses",
      icon: FileCode,
      bgColor: "bg-amber-50 text-[#D97706]",
    },
    {
      name: "DevOps & Cloud",
      slug: "devops-cloud",
      coursesCount: "12+ Courses",
      icon: Cloud,
      bgColor: "bg-sky-50 text-[#0284C7]",
    },
    {
      name: "Mobile Development",
      slug: "mobile-development",
      coursesCount: "10+ Courses",
      icon: Smartphone,
      bgColor: "bg-purple-50 text-[#9333EA]",
    },
    {
      name: "Data & AI",
      slug: "data-ai",
      coursesCount: "14+ Courses",
      icon: Sparkles,
      bgColor: "bg-indigo-50 text-[#4F46E5]",
    },
    {
      name: "UI/UX Design",
      slug: "ui-ux",
      coursesCount: "8+ Courses",
      icon: Palette,
      bgColor: "bg-rose-50 text-[#E11D48]",
    },
  ];

  // 4 Featured Courses mapping directly to reference composition
  // Using database records if available, otherwise high-fidelity authentic records
  const referenceCourses = [
    {
      _id: featuredCourses.find((c: any) => c.slug === "react-js-for-beginners")?._id || "ref-course-1",
      title: "React.js for Beginners",
      slug: "react-js-for-beginners",
      subtitle: "Learn modern React with Hooks, routing, API integration and build real projects.",
      thumbnail: "/images/course-react.svg",
      category: "Frontend",
      level: "Beginner",
      badge: "Best Seller",
      actionLabel: "Add to Cart",
      ratingAverage: 4.9,
      ratingCount: 1250,
      enrolledCount: 3420,
      totalDurationMinutes: 720,
      price: 1499,
      isFree: false,
      instructor: {
        name: "Priya Patel",
        avatar: "/images/mentor-priya.jpg",
        headline: "Software Engineer",
      },
    },
    {
      _id: featuredCourses.find((c: any) => c.slug === "nextjs-15-react-19-mastery")?._id || "ref-course-2",
      title: "Next.js Full-Stack Development",
      slug: "nextjs-15-react-19-mastery",
      subtitle: "Build complete full-stack applications with Next.js, MongoDB and deployment.",
      thumbnail: "/images/course-nextjs.svg",
      category: "Full Stack",
      level: "Intermediate",
      badge: "Hot",
      actionLabel: "Enroll Now",
      ratingAverage: 4.9,
      ratingCount: 850,
      enrolledCount: 2150,
      totalDurationMinutes: 1080,
      price: 2499,
      isFree: false,
      instructor: {
        name: "Neha Singh",
        avatar: "/images/mentor-neha.jpg",
        headline: "Full Stack Developer",
      },
    },
    {
      _id: featuredCourses.find((c: any) => c.slug === "python-programming")?._id || "ref-course-3",
      title: "Python for Data Analysis",
      slug: "python-programming",
      subtitle: "Learn data analysis, visualization and real-world data projects using Python.",
      thumbnail: "/images/course-python.svg",
      category: "Data Science",
      level: "Beginner",
      badge: "New",
      actionLabel: "Add to Cart",
      ratingAverage: 4.8,
      ratingCount: 640,
      enrolledCount: 1820,
      totalDurationMinutes: 840,
      price: 1999,
      isFree: false,
      instructor: {
        name: "Rohit Sharma",
        avatar: "/images/mentor-rohit.jpg",
        headline: "Data Engineer",
      },
    },
    {
      _id: featuredCourses.find((c: any) => c.slug === "nodejs-express-backend" || c.slug === "rest-api-development")?._id || "ref-course-4",
      title: "Node.js & Express API Development",
      slug: featuredCourses.find((c: any) => c.slug === "nodejs-express-backend") ? "nodejs-express-backend" : "rest-api-development",
      subtitle: "Build scalable REST APIs, authentication and deployment with Node.js.",
      thumbnail: "/images/course-node.svg",
      category: "Backend",
      level: "Intermediate",
      actionLabel: "Enroll Now",
      ratingAverage: 4.8,
      ratingCount: 920,
      enrolledCount: 2640,
      totalDurationMinutes: 960,
      price: 1999,
      isFree: false,
      instructor: {
        name: "Aman Verma",
        avatar: "/images/mentor-aman.jpg",
        headline: "Backend Developer",
      },
    },
  ];

  // 3 Curated Career Roadmaps matching the reference design
  const curatedPaths = [
    {
      title: "Full-Stack Next.js Architect",
      slug: "full-stack-nextjs-architect",
      level: "Intermediate",
      estimatedHours: 45,
      coursesCount: 3,
      description: "From basics to advanced Next.js, databases and deployment.",
      thumbnail: "/images/path-fullstack.jpg",
      highlights: ["3+ courses", "Hands-on projects", "Industry best practices"],
    },
    {
      title: "Backend Systems & APIs",
      slug: "backend-engineering-rest-apis",
      level: "Intermediate",
      estimatedHours: 50,
      coursesCount: 3,
      description: "Learn to build scalable backend systems with Node.js, Express and MongoDB.",
      thumbnail: "/images/path-backend.jpg",
      highlights: ["3+ courses", "Scalable API projects", "Authentication & security"],
    },
    {
      title: "Modern Web Engineering",
      slug: "frontend-modern-web-foundation",
      level: "Beginner",
      estimatedHours: 40,
      coursesCount: 4,
      description: "Build a strong foundation in modern web development.",
      thumbnail: "/images/path-web.jpg",
      highlights: ["4+ courses", "Frontend & backend basics", "Portfolio projects"],
    },
  ];

  // Mentors list matching the reference image photography and credentials
  const mentors = [
    {
      name: "Aman Verma",
      role: "Full Stack Engineer",
      skills: "React, Node.js, Next.js",
      rating: 4.9,
      studentsCount: 520,
      avatar: "/images/mentor-aman.jpg",
      linkedin: "https://linkedin.com",
    },
    {
      name: "Neha Singh",
      role: "Lead Frontend Developer",
      skills: "React, TypeScript, UI/UX",
      rating: 4.9,
      studentsCount: 680,
      avatar: "/images/mentor-neha.jpg",
      linkedin: "https://linkedin.com",
    },
    {
      name: "Rohit Sharma",
      role: "Data Engineer",
      skills: "Python, Data Analysis",
      rating: 4.8,
      studentsCount: 310,
      avatar: "/images/mentor-rohit.jpg",
      linkedin: "https://linkedin.com",
    },
    {
      name: "Priya Patel",
      role: "Backend Developer",
      skills: "Node.js, MongoDB",
      rating: 4.8,
      studentsCount: 390,
      avatar: "/images/mentor-priya.jpg",
      linkedin: "https://linkedin.com",
    },
  ];

  // Testimonials matching reference layout
  const testimonials = [
    {
      name: "Karan Mehta",
      role: "Frontend Developer",
      rating: 5,
      avatar: "/images/mentor-aman.jpg",
      reviewText:
        "The courses are well-structured and the projects helped me build a strong portfolio. Highly recommended!",
    },
    {
      name: "Sneha Raut",
      role: "Software Developer",
      rating: 5,
      avatar: "/images/mentor-neha.jpg",
      reviewText:
        "Mentors are very supportive and explain concepts in a simple way. This platform is worth it!",
    },
    {
      name: "Arjun Patel",
      role: "Full Stack Developer",
      rating: 5,
      avatar: "/images/mentor-rohit.jpg",
      reviewText:
        "I learned Next.js and got a job as a junior developer. The practical approach really makes a difference.",
    },
  ];

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
    <div className="flex flex-col min-h-screen bg-white text-[#14213D]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
      />

      {/* 1. Hero Section (Image-Rich Two-Column Layout) */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-22 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              <RevealSection yOffset={20} threshold={0.05}>
                {/* Pill Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 mb-4">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Practice-Oriented Online Learning</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black tracking-tight text-[#14213D] leading-[1.14]">
                  Learn to Code.<br />
                  Build Real Projects.<br />
                  <span className="text-[#2563EB]">With Expert Mentors.</span>
                </h1>

                {/* Subtitle Paragraph */}
                <p className="text-base sm:text-lg text-[#64748B] leading-relaxed max-w-xl mt-4">
                  Master in-demand programming and design skills with structured courses, hands-on projects, and 1:1 mentorship from industry professionals.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
                  <Link
                    href="/courses"
                    className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-sm shadow-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Explore Courses</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/learning-paths"
                    className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-white hover:bg-slate-50 text-[#14213D] font-semibold text-sm border border-[#E2E8F0] shadow-xs flex items-center justify-center transition-colors"
                  >
                    View Learning Paths
                  </Link>
                </div>

                {/* Trust Badges Row */}
                <div className="pt-6 flex flex-wrap items-center gap-6 sm:gap-7 text-xs font-medium text-[#64748B]">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[#2563EB]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span>Practical Projects</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[#2563EB]">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <span>Expert Mentors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[#2563EB]">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <span>Lifetime Access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[#2563EB]">
                      <Award className="w-3.5 h-3.5" />
                    </div>
                    <span>Certificates</span>
                  </div>
                </div>
              </RevealSection>
            </div>

            {/* Right Hero Column: Premium 3D Developer Workstation */}
            <div className="lg:col-span-5 relative flex justify-center">
              <RevealSection yOffset={20} threshold={0.05} className="w-full max-w-lg lg:max-w-none relative">
                <Hero3DExperience />
              </RevealSection>
            </div>
          </div>
        </div>
      </section>

      {/* Prominent Course Search Bar Section (Floating between Hero & Categories) */}
      <div className="max-w-4xl mx-auto px-4 -mt-8 sm:-mt-10 relative z-30 w-full">
        <RevealSection threshold={0.05} yOffset={12}>
          <form
            action="/courses"
            method="GET"
            className="bg-white rounded-2xl border border-[#E2E8F0] shadow-md p-2 sm:p-2.5 flex flex-col sm:flex-row items-center gap-2"
          >
            <div className="flex items-center gap-2.5 w-full px-3 py-1.5">
              <Search className="w-5 h-5 text-[#94A3B8] shrink-0" />
              <input
                type="text"
                name="search"
                placeholder="Search for courses, skills, or mentors (e.g. React, Python, Full Stack, DevOps...)"
                className="w-full text-sm text-[#14213D] placeholder-[#94A3B8] bg-transparent outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-colors shrink-0 cursor-pointer shadow-xs"
            >
              Search
            </button>
          </form>

          {/* Popular Search Tags */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 text-xs text-[#64748B]">
            <span className="font-semibold text-[#14213D]">Popular:</span>
            {["React", "Next.js", "Node.js", "Python", "MongoDB", "JavaScript", "UI/UX"].map((tag) => (
              <Link
                key={tag}
                href={`/courses?search=${encodeURIComponent(tag)}`}
                className="px-2.5 py-1 rounded-full bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#2563EB] hover:border-[#2563EB] shadow-2xs transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </RevealSection>
      </div>

      {/* 2. Explore Popular Categories (Browse by Skills) */}
      <section className="pt-20 pb-16 bg-white border-b border-[#E2E8F0]">
        <RevealSection threshold={0.15} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-[#2563EB]">
                Browse by Skills
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#14213D] mt-1">
                Explore Popular Categories
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                Start learning with the most in-demand technologies.
              </p>
            </div>
            <Link
              href="/courses"
              className="text-xs font-semibold text-[#2563EB] hover:text-blue-700 flex items-center gap-1 shrink-0"
            >
              View all categories <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
            {popularCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <StaggerItem key={cat.slug}>
                  <Link
                    href={`/courses?category=${encodeURIComponent(cat.name)}`}
                    className="p-3 sm:p-3.5 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#2563EB] hover:shadow-md hover:-translate-y-1 transition-all flex flex-col items-center text-center h-full group"
                  >
                    <div className={`w-11 h-11 rounded-xl ${cat.bgColor} flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-[12px] sm:text-[13px] text-[#14213D] group-hover:text-[#2563EB] transition-colors leading-tight">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] text-[#64748B] mt-1">
                      {cat.coursesCount}
                    </p>
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </RevealSection>
      </section>

      {/* 3. Featured Courses (Curated for You) */}
      <section className="py-20 bg-[#F6F8FC] border-b border-[#E2E8F0]">
        <RevealSection threshold={0.15} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-[#2563EB]">
                Curated for You
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#14213D] mt-1">
                Featured Courses
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                Learn from industry experts with practical, project-based courses.
              </p>
            </div>
            <Link
              href="/courses"
              className="text-xs font-semibold text-[#2563EB] hover:text-blue-700 flex items-center gap-1 shrink-0"
            >
              View all courses <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {referenceCourses.map((c) => (
              <StaggerItem key={c.slug}>
                <CourseCard course={c as any} variant="reference" />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </RevealSection>
      </section>

      {/* 4. Curated Learning Paths (Career Roadmaps) */}
      <section className="py-20 bg-white border-b border-[#E2E8F0]">
        <RevealSection threshold={0.15} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-[#2563EB]">
                Career Roadmaps
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#14213D] mt-1">
                Curated Learning Paths
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                Follow structured paths designed by experts to take you from beginner to job-ready.
              </p>
            </div>
            <Link
              href="/learning-paths"
              className="text-xs font-semibold text-[#2563EB] hover:text-blue-700 flex items-center gap-1 shrink-0"
            >
              View all paths <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 3D Visual Roadmap Progression Header on Desktop */}
          <div className="hidden md:flex items-center justify-between max-w-3xl mx-auto mb-10 relative">
            <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-gradient-to-r from-blue-300 via-blue-600 to-teal-400 -translate-y-1/2 z-0" />
            {[
              { step: "01", label: "Full-Stack Foundation" },
              { step: "02", label: "Backend Systems & Cloud" },
              { step: "03", label: "Production Engineering" },
            ].map((node, i) => (
              <div key={i} className="relative z-10 flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-[#E2E8F0] shadow-xs">
                <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center">
                  {node.step}
                </span>
                <span className="text-xs font-semibold text-[#14213D]">{node.label}</span>
              </div>
            ))}
          </div>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {curatedPaths.map((path, idx) => (
              <StaggerItem key={path.slug}>
                <Card3DTilt
                  className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden shadow-xs hover:border-[#CBD5E1] hover:shadow-lg transition-all flex flex-col justify-between h-full group"
                  maxTilt={3.5}
                >
                  <div>
                    {/* Path Cover Thumbnail */}
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                      <img
                        src={path.thumbnail}
                        alt={path.title}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-white/95 text-[#2563EB] border border-[#E2E8F0] shadow-2xs">
                          {path.level}
                        </span>
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-medium bg-black/60 text-white backdrop-blur-xs">
                          ~{path.estimatedHours} Hours
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#14264F] text-white shadow-2xs">
                        Stage 0{idx + 1}
                      </div>
                    </div>

                    {/* Path Content */}
                    <div className="p-5 sm:p-6 space-y-3">
                      <h3 className="text-lg font-bold text-[#14213D] group-hover:text-[#2563EB] transition-colors">
                        {path.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                        {path.description}
                      </p>

                      {/* Highlights */}
                      <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                        {path.highlights.map((h, hIdx) => (
                          <div key={hIdx} className="flex items-center gap-2 text-xs text-[#14213D]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 pt-0">
                    <Link
                      href="/learning-paths"
                      className="w-full py-2.5 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 text-[#14213D] text-xs font-semibold text-center border border-[#E2E8F0] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Explore Learning Path</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </Card3DTilt>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </RevealSection>
      </section>

      {/* 5. Platform Benefits (Why CodeMentors / More Than Just Courses) */}
      <section className="py-20 bg-[#F6F8FC] border-b border-[#E2E8F0]">
        <RevealSection threshold={0.15} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column */}
            <div className="lg:col-span-4 space-y-5">
              <span className="text-xs uppercase font-bold tracking-wider text-[#2563EB]">
                Why CodeMentors
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#14213D] leading-tight">
                More Than Just Courses
              </h2>
              <p className="text-sm text-[#64748B] leading-relaxed">
                We combine structured learning, real-world projects and expert mentorship to help you build the skills that actually get you hired.
              </p>
              <div className="pt-2">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-sm shadow-xs transition-colors"
                >
                  <span>About CodeMentors</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right Column: 6 Feature Cards */}
            <div className="lg:col-span-8">
              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  {
                    title: "Project-Based Learning",
                    desc: "Build real projects, not just theory.",
                    icon: Code2,
                    color: "bg-blue-50 text-[#2563EB]",
                  },
                  {
                    title: "Expert Mentors",
                    desc: "Learn from industry professionals.",
                    icon: Users,
                    color: "bg-purple-50 text-[#9333EA]",
                  },
                  {
                    title: "Interactive Learning",
                    desc: "Quizzes, coding exercises and more.",
                    icon: Terminal,
                    color: "bg-emerald-50 text-[#16A34A]",
                  },
                  {
                    title: "Certificates",
                    desc: "Showcase your achievements.",
                    icon: Award,
                    color: "bg-amber-50 text-[#D97706]",
                  },
                  {
                    title: "Career Guidance",
                    desc: "Get mock viva and job support.",
                    icon: Briefcase,
                    color: "bg-rose-50 text-[#E11D48]",
                  },
                  {
                    title: "Lifetime Access",
                    desc: "Learn at your own pace.",
                    icon: Clock,
                    color: "bg-sky-50 text-[#0284C7]",
                  },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <StaggerItem key={idx}>
                      <Card3DTilt
                        className="p-5 rounded-xl border border-[#E2E8F0] bg-white shadow-xs space-y-3 h-full hover:border-[#CBD5E1] transition-all"
                        maxTilt={3.5}
                      >
                        <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-sm text-[#14213D]">{item.title}</h3>
                        <p className="text-xs text-[#64748B] leading-relaxed">{item.desc}</p>
                      </Card3DTilt>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>
            </div>
          </div>
        </RevealSection>
      </section>

      {/* 6. Meet Our Mentors (Learn from Industry Experts) */}
      <section id="mentors" className="py-20 bg-white border-b border-[#E2E8F0]">
        <RevealSection threshold={0.15} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-[#2563EB]">
                Meet Our Mentors
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#14213D] mt-1">
                Learn from Industry Experts
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                Get guidance from experienced developers and engineers working at top companies.
              </p>
            </div>
            <Link
              href="/about"
              className="text-xs font-semibold text-[#2563EB] hover:text-blue-700 flex items-center gap-1 shrink-0"
            >
              View all Mentors <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {mentors.map((m, idx) => (
              <StaggerItem key={idx}>
                <Card3DTilt
                  className="p-5 rounded-xl border border-[#E2E8F0] bg-white shadow-xs flex flex-col justify-between hover:border-[#CBD5E1] transition-all h-full"
                  maxTilt={4}
                >
                  <div>
                    {/* Mentor Photo */}
                    <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-100 mb-4 border border-[#E2E8F0]">
                      <img
                        src={m.avatar}
                        alt={m.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <h3 className="font-bold text-base text-[#14213D]">{m.name}</h3>
                    <p className="text-xs font-semibold text-[#2563EB] mt-0.5">{m.role}</p>
                    <p className="text-xs text-[#64748B] mt-1.5">{m.skills}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-amber-500 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{m.rating}</span>
                      <span className="text-[#64748B] font-normal">({m.studentsCount} students)</span>
                    </div>
                    <a
                      href={m.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2563EB] hover:opacity-80 transition-opacity"
                      aria-label={`${m.name} LinkedIn`}
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                    </a>
                  </div>
                </Card3DTilt>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </RevealSection>
      </section>

      {/* 7. Student Testimonials (Learner Reviews) */}
      <section className="py-20 bg-[#F6F8FC] border-b border-[#E2E8F0]">
        <RevealSection threshold={0.15} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-[#2563EB]">
                Learner Reviews
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#14213D] mt-1">
                What Students Are Saying
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                Real feedback from learners who have improved their skills with CodeMentors.
              </p>
            </div>
            {/* Carousel navigation indicators matching reference */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="w-8 h-8 rounded-full border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#14213D] flex items-center justify-center shadow-2xs cursor-pointer transition-colors"
                aria-label="Previous review"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="w-8 h-8 rounded-full border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#14213D] flex items-center justify-center shadow-2xs cursor-pointer transition-colors"
                aria-label="Next review"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <StaggerItem key={idx}>
                <Card3DTilt
                  className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-xs flex flex-col justify-between h-full hover:border-[#CBD5E1] transition-all"
                  maxTilt={3.5}
                >
                  <div>
                    {/* Stars */}
                    <div className="flex items-center gap-1 text-amber-500 mb-3 text-sm">
                      {"★".repeat(t.rating)}
                    </div>
                    {/* Quote */}
                    <p className="text-xs sm:text-sm text-[#14213D] leading-relaxed italic">
                      "{t.reviewText}"
                    </p>
                  </div>

                  {/* Student Info */}
                  <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex items-center gap-3">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-9 h-9 rounded-full object-cover border border-[#E2E8F0]"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-[#14213D]">{t.name}</h4>
                      <p className="text-[11px] text-[#64748B]">{t.role}</p>
                    </div>
                  </div>
                </Card3DTilt>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </RevealSection>
      </section>

      {/* 8. Frequently Asked Questions (Dual Column Accordion) */}
      <section className="py-20 bg-white border-b border-[#E2E8F0]">
        <RevealSection threshold={0.15} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Title Column */}
            <div className="lg:col-span-4 space-y-3">
              <span className="text-xs uppercase font-bold tracking-wider text-[#2563EB]">
                Questions & Answers
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#14213D]">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Find answers to common questions about our courses, mentorship and platform.
              </p>
            </div>

            {/* Right Accordion Column */}
            <div className="lg:col-span-8">
              <FaqAccordion items={faqs} />
            </div>
          </div>
        </RevealSection>
      </section>

      {/* 9. Image-Based Bottom Call-To-Action Banner */}
      <section className="relative overflow-hidden bg-[#14264F] py-16 lg:py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <RevealSection threshold={0.15} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-white tracking-tight leading-tight">
                Ready to Accelerate Your<br className="hidden sm:inline" /> Software Engineering Career?
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Join thousands of learners who are building real skills and real projects with CodeMentors.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white font-semibold text-sm shadow-sm transition-colors text-center"
                >
                  Get Started Now →
                </Link>
                <Link
                  href="/courses"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/20 transition-colors text-center"
                >
                  Explore Courses
                </Link>
              </div>
            </div>

            {/* Right Developer Visual Column */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <Card3DTilt
                className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/15 max-w-md w-full aspect-[4/3] bg-slate-900"
                maxTilt={3}
              >
                <img
                  src="/images/cta-developer.jpg"
                  alt="Developer working on laptop"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#14264F]/50 via-transparent to-transparent pointer-events-none" />
              </Card3DTilt>
            </div>
          </RevealSection>
        </div>
      </section>
    </div>
  );
}
