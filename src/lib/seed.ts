import mongoose from "mongoose";
import { connectDB } from "./db";
import {
  User,
  Category,
  Course,
  LearningPath,
  Coupon,
  Review,
  Enrollment,
  LessonProgress,
  Quiz,
  QuizAttempt,
  Certificate,
  Payment,
  Order,
  Refund,
  PopupCampaign,
  PageSeo,
  SiteSettings,
  PaymentSettings,
  InstructorLimit,
  AuditLog,
  IAuditLog,
  Notification,
  INotification,
  BlogPost,
  CmsPage,
} from "@/models";
import { hashPassword } from "./auth";
import crypto from "crypto";

export function deterministicObjectId(seedStr: string): mongoose.Types.ObjectId {
  const hash = crypto.createHash("md5").update(seedStr).digest("hex").slice(0, 24);
  return new mongoose.Types.ObjectId(hash);
}

export interface SeedOptions {
  reset?: boolean;
  forceDev?: boolean;
  dryRun?: boolean;
}

export interface SeedReport {
  success: boolean;
  isReset: boolean;
  dryRun: boolean;
  counts: {
    users: number;
    categories: number;
    courses: number;
    modules: number;
    lessons: number;
    quizzes: number;
    quizAttempts: number;
    enrollments: number;
    certificates: number;
    orders: number;
    payments: number;
    refunds: number;
    popups: number;
    seoPages: number;
    blogPosts: number;
    cmsPages: number;
    instructorLimits: number;
    auditLogs: number;
    notifications: number;
    reviews: number;
    coupons: number;
    learningPaths: number;
  };
  durationMs: number;
  timestamp: string;
}

export async function runDatabaseSeed(options: SeedOptions = {}): Promise<SeedReport> {
  const startTime = Date.now();
  await connectDB();

  const isReset = Boolean(options.reset);
  const isDryRun = Boolean(options.dryRun);
  const forceDev = Boolean(options.forceDev);

  // 1. Critical Production Safety Guard
  if (isReset) {
    const isProdEnv = process.env.NODE_ENV === "production";
    const mongoUri = process.env.MONGODB_URI || "";
    const isCloudCluster = mongoUri.includes(".mongodb.net") || mongoUri.includes("prod");

    if ((isProdEnv || isCloudCluster) && !forceDev) {
      throw new Error(
        "CRITICAL SAFETY ABORT: Destructive database reset is strictly forbidden on production or remote cloud database environments without --force-dev."
      );
    }

    console.log("⚠️  Safe Development Reset Requested: Clearing development collections...");
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Course.deleteMany({}),
      LearningPath.deleteMany({}),
      Coupon.deleteMany({}),
      Review.deleteMany({}),
      Enrollment.deleteMany({}),
      LessonProgress.deleteMany({}),
      Quiz.deleteMany({}),
      QuizAttempt.deleteMany({}),
      Certificate.deleteMany({}),
      Order.deleteMany({}),
      Payment.deleteMany({}),
      Refund.deleteMany({}),
      PopupCampaign.deleteMany({}),
      PageSeo.deleteMany({}),
      BlogPost.deleteMany({}),
      CmsPage.deleteMany({}),
      InstructorLimit.deleteMany({}),
      AuditLog.deleteMany({}),
      Notification.deleteMany({}),
    ]);
  }

  console.log("🌱 Executing CodeMentors Idempotent Development Seed System...");

  if (isDryRun) {
    console.log("ℹ️  Dry run mode enabled: validating schemas and plan without persistence.");
  }

  // 2. Pre-hash deterministic passwords
  const devTestPassword = process.env.DEV_TEST_PASSWORD || "DevOnly123!ChangeMe";
  const devPasswordHash = await hashPassword(devTestPassword);

  // 3. SEED USERS (Exactly Three Dedicated Test Accounts: Admin, Instructor, Student)
  const usersToSeed = [
    {
      _id: deterministicObjectId("admin@codementors.test"),
      name: "Platform Administrator",
      email: "admin@codementors.test",
      passwordHash: devPasswordHash,
      role: "admin",
      headline: "CodeMentors Operations & Governance Lead",
      bio: "Overseeing curriculum quality, infrastructure, and platform operations.",
      isActive: true,
      isVerified: true,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces",
    },
    {
      _id: deterministicObjectId("instructor@codementors.test"),
      name: "Senior Instructor",
      email: "instructor@codementors.test",
      passwordHash: devPasswordHash,
      role: "instructor",
      headline: "Staff Software Architect & Senior Instructor",
      bio: "12+ years building distributed cloud platforms, full-stack React systems, and mentoring engineers.",
      isActive: true,
      isVerified: true,
      instructorStatus: "approved",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=faces",
      socialLinks: {
        github: "https://github.com/codementors-instructor",
        linkedin: "https://linkedin.com/in/codementors-instructor",
      },
    },
    {
      _id: deterministicObjectId("student@codementors.test"),
      name: "Enrolled Student",
      email: "student@codementors.test",
      passwordHash: devPasswordHash,
      role: "student",
      headline: "Full-Stack Engineering Learner",
      bio: "Active learner mastering Next.js, Node.js, and modern distributed systems.",
      isActive: true,
      isVerified: true,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces",
    },
  ];

  const userMap = new Map<string, any>();
  for (const u of usersToSeed) {
    if (!isDryRun) {
      const doc = await User.findOneAndUpdate(
        { email: u.email },
        { $set: u },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
      userMap.set(u.email, doc);
    } else {
      userMap.set(u.email, { ...u, _id: u._id || new mongoose.Types.ObjectId() });
    }
  }

  // Remove any legacy demo accounts
  if (!isDryRun) {
    await User.deleteMany({
      email: { $nin: ["admin@codementors.test", "instructor@codementors.test", "student@codementors.test"] },
    });
  }

  const adminMarcus = userMap.get("admin@codementors.test");
  const superAdmin = adminMarcus;
  const instructorAlex = userMap.get("instructor@codementors.test");
  const instructorSarah = instructorAlex;
  const studentPriya = userMap.get("student@codementors.test");
  const studentDavid = studentPriya;
  const studentAmina = studentPriya;
  const studentLegacy = studentPriya;

  // 4. SEED CATEGORIES (10 Parent Categories + 4 Subcategories with independent SEO)
  const parentCategoriesData = [
    {
      name: "Web Development",
      slug: "web-development",
      icon: "Globe",
      displayOrder: 1,
      shortDescription: "Master modern full-stack web engineering, frameworks, and APIs.",
      detailedDescription: "Comprehensive web development curriculum covering foundational and advanced full-stack architectures.",
      isFeatured: true,
      status: "active",
      seo: {
        title: "Web Development Courses & Full-Stack Roadmaps | CodeMentors",
        description: "Learn modern full-stack web engineering with industry-grade practical projects and roadmaps.",
        keywords: ["web development", "full stack", "frontend", "backend", "web engineering"],
        canonicalUrl: "/categories/web-development",
        noIndex: false,
      },
    },
    {
      name: "Frontend Development",
      slug: "frontend-development",
      icon: "Layout",
      displayOrder: 2,
      shortDescription: "Interactive user interfaces, modern CSS, DOM mechanics, and state.",
      detailedDescription: "From foundational styling to high-performance client architectures and web accessibility.",
      isFeatured: true,
      status: "active",
      seo: {
        title: "Frontend Development Masterclasses | CodeMentors",
        description: "Design and build fast, responsive, and accessible web applications.",
        keywords: ["frontend", "ui", "css", "html", "web performance"],
        canonicalUrl: "/categories/frontend-development",
        noIndex: false,
      },
    },
    {
      name: "Backend Development",
      slug: "backend-development",
      icon: "Server",
      displayOrder: 3,
      shortDescription: "Server architectures, REST and gRPC APIs, distributed queues, and caching.",
      detailedDescription: "Production-grade backend engineering with Node.js, Go, Python, and scalable microservices.",
      isFeatured: true,
      status: "active",
      seo: {
        title: "Backend Engineering & API Design Courses | CodeMentors",
        description: "Build robust, scalable backend systems and secure microservices.",
        keywords: ["backend", "api", "node.js", "microservices", "databases"],
        canonicalUrl: "/categories/backend-development",
        noIndex: false,
      },
    },
    {
      name: "JavaScript",
      slug: "javascript",
      icon: "FileCode",
      displayOrder: 4,
      shortDescription: "V8 internals, closures, async event loops, and modern ECMAScript standards.",
      detailedDescription: "Deep dive into language mechanics, memory management, and high-performance design patterns.",
      isFeatured: true,
      status: "active",
      seo: {
        title: "Complete JavaScript Core & Advanced Internals | CodeMentors",
        description: "Master modern JavaScript mechanics from closures and prototypes to asynchronous engines.",
        keywords: ["javascript", "js", "es6", "event loop", "closures"],
        canonicalUrl: "/categories/javascript",
        noIndex: false,
      },
    },
    {
      name: "React.js",
      slug: "react-js",
      icon: "Atom",
      displayOrder: 5,
      shortDescription: "Component composition, React reconciliation, Hooks, and client state.",
      detailedDescription: "Master React from fundamentals to advanced patterns like render optimization and custom hooks.",
      isFeatured: true,
      status: "active",
      seo: {
        title: "React.js Mastery & Modern UI Engineering | CodeMentors",
        description: "Master React 19, hooks, virtual DOM reconciliation, and modern state management.",
        keywords: ["react", "react.js", "hooks", "jsx", "state management"],
        canonicalUrl: "/categories/react-js",
        noIndex: false,
      },
    },
    {
      name: "Next.js",
      slug: "next-js",
      icon: "Layers",
      displayOrder: 6,
      shortDescription: "App Router, React Server Components, server actions, and edge rendering.",
      detailedDescription: "Build production Next.js 15 applications with full-stack capabilities, caching, and SEO optimization.",
      isFeatured: true,
      status: "active",
      seo: {
        title: "Next.js 15 Full-Stack Masterclasses | CodeMentors",
        description: "Learn Next.js 15 App Router, React Server Components, Server Actions, and deployment.",
        keywords: ["next.js", "nextjs", "app router", "rsc", "server components"],
        canonicalUrl: "/categories/next-js",
        noIndex: false,
      },
    },
    {
      name: "Node.js",
      slug: "node-js",
      icon: "Cpu",
      displayOrder: 7,
      shortDescription: "libuv event loop, streams, buffers, clustering, and asynchronous I/O.",
      detailedDescription: "Build non-blocking server applications, CLI tools, and scalable REST services.",
      isFeatured: true,
      status: "active",
      seo: {
        title: "Node.js Server Architecture & Microservices | CodeMentors",
        description: "Master the Node.js runtime, event loop, worker threads, and enterprise servers.",
        keywords: ["node.js", "nodejs", "event loop", "express", "libuv"],
        canonicalUrl: "/categories/node-js",
        noIndex: false,
      },
    },
    {
      name: "Python",
      slug: "python",
      icon: "Terminal",
      displayOrder: 8,
      shortDescription: "Idiomatic Python 3, asynchronous programming, web frameworks, and scripting.",
      detailedDescription: "From core data structures and OOP to FastAPI, data engineering, and automation.",
      isFeatured: true,
      status: "active",
      seo: {
        title: "Python Programming & Backend Systems | CodeMentors",
        description: "Learn Python for backend APIs, data pipelines, and automation.",
        keywords: ["python", "fastapi", "django", "asyncio", "python 3"],
        canonicalUrl: "/categories/python",
        noIndex: false,
      },
    },
    {
      name: "Database Management",
      slug: "database-management",
      icon: "Database",
      displayOrder: 9,
      shortDescription: "Relational modeling, indexing strategies, document stores, and transactions.",
      detailedDescription: "Master PostgreSQL, MongoDB, Redis caching, and ACID transaction guarantees.",
      isFeatured: true,
      status: "active",
      seo: {
        title: "Database Engineering (SQL & NoSQL) | CodeMentors",
        description: "Design high-throughput database schemas with MongoDB, PostgreSQL, and Redis.",
        keywords: ["database", "mongodb", "postgresql", "sql", "nosql", "redis"],
        canonicalUrl: "/categories/database-management",
        noIndex: false,
      },
    },
    {
      name: "Software Engineering",
      slug: "software-engineering",
      icon: "Compass",
      displayOrder: 10,
      shortDescription: "System design, design patterns, clean code, Git workflows, and CI/CD.",
      detailedDescription: "Master professional engineering habits: code reviews, automated testing, and cloud infrastructure.",
      isFeatured: true,
      status: "active",
      seo: {
        title: "Software Engineering Principles & System Design | CodeMentors",
        description: "Learn software architecture, design patterns, clean code, and Git workflows.",
        keywords: ["software engineering", "system design", "git", "clean code", "patterns"],
        canonicalUrl: "/categories/software-engineering",
        noIndex: false,
      },
    },
  ];

  const categoryMap = new Map<string, any>();
  for (const c of parentCategoriesData) {
    if (!isDryRun) {
      const doc = await Category.findOneAndUpdate(
        { slug: c.slug },
        { $set: c },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
      categoryMap.set(c.slug, doc);
    } else {
      categoryMap.set(c.slug, { ...c, _id: new mongoose.Types.ObjectId() });
    }
  }

  // Subcategories referencing parents
  const subcategoriesData = [
    {
      name: "Next.js App Router & Server Actions",
      slug: "nextjs-app-router",
      parentCategory: categoryMap.get("next-js")?._id,
      icon: "Layers",
      displayOrder: 1,
      shortDescription: "Modern streaming, layouts, parallel routes, and mutations.",
      status: "active",
    },
    {
      name: "Microservices & Distributed Systems",
      slug: "microservices-architecture",
      parentCategory: categoryMap.get("backend-development")?._id,
      icon: "Server",
      displayOrder: 2,
      shortDescription: "Event sourcing, gRPC, Kafka, and distributed consensus.",
      status: "active",
    },
    {
      name: "FastAPI & Async Python",
      slug: "fastapi-async-python",
      parentCategory: categoryMap.get("python")?._id,
      icon: "Terminal",
      displayOrder: 3,
      shortDescription: "High performance async APIs with Pydantic and Starlette.",
      status: "active",
    },
    {
      name: "PostgreSQL & MongoDB Mastery",
      slug: "sql-nosql-databases",
      parentCategory: categoryMap.get("database-management")?._id,
      icon: "Database",
      displayOrder: 4,
      shortDescription: "Query optimization, indexing, and hybrid persistence.",
      status: "active",
    },
  ];

  for (const sub of subcategoriesData) {
    if (!isDryRun) {
      const doc = await Category.findOneAndUpdate(
        { slug: sub.slug },
        { $set: sub },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
      categoryMap.set(sub.slug, doc);
    }
  }

  // 5. SEED COURSES (12 Realistic Courses across multiple categories & instructors)
  const coursesData = [
    {
      title: "Complete JavaScript Fundamentals",
      slug: "complete-javascript-fundamentals",
      subtitle: "Master JavaScript from fundamental syntax to V8 engine internals and asynchronous programming.",
      description: "A comprehensive journey through JavaScript. Understand closures, prototypical inheritance, the event loop, Promises, Async/Await, and modern ECMAScript features.",
      thumbnail: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&h=450&fit=crop",
      instructor: instructorAlex._id,
      category: "JavaScript",
      subcategory: "Core Mechanics",
      format: "Mixed",
      level: "All Levels",
      language: "English",
      price: 1499,
      discountPrice: 999,
      isFree: false,
      status: "published",
      isFeatured: true,
      accessDurationDays: 365,
      ratingAverage: 4.8,
      ratingCount: 142,
      enrolledCount: 1250,
      whatYouWillLearn: [
        "Master variable scoping, hoisting, and closure mechanics",
        "Understand prototypal inheritance and object prototypes",
        "Write asynchronous code with Promises and async/await",
        "Debug memory leaks and optimize V8 garbage collection",
      ],
      requirements: ["A computer with a web browser", "Basic familiarity with HTML and CSS"],
      targetAudience: ["Beginning programmers", "Frontend developers wanting deeper JS mastery"],
      seo: {
        title: "Complete JavaScript Fundamentals Course | CodeMentors",
        description: "Master modern JavaScript mechanics from closures and prototypes to asynchronous engines.",
        keywords: ["javascript course", "js fundamentals", "event loop", "closures"],
        canonicalUrl: "/courses/complete-javascript-fundamentals",
        noIndex: false,
      },
    },
    {
      title: "React.js for Beginners",
      slug: "react-js-for-beginners",
      subtitle: "Learn modern component-driven development with React 19, Hooks, and state management.",
      description: "Step into frontend engineering with React. Build reusable components, handle complex user interactions, and master useState, useEffect, and custom hooks.",
      thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop",
      instructor: instructorAlex._id,
      category: "React.js",
      subcategory: "Frontend Engineering",
      format: "Video",
      level: "Beginner",
      language: "English",
      price: 0,
      isFree: true,
      status: "published",
      isFeatured: true,
      accessDurationDays: 0,
      ratingAverage: 4.9,
      ratingCount: 310,
      enrolledCount: 3400,
      whatYouWillLearn: [
        "Build declarative user interfaces with React JSX",
        "Manage state and effects with modern React Hooks",
        "Communicate between components using props and context",
        "Deploy production React SPAs to modern CDNs",
      ],
      requirements: ["Basic JavaScript fundamentals"],
      targetAudience: ["Aspiring frontend developers"],
      seo: {
        title: "Free React.js for Beginners Course | CodeMentors",
        description: "Free beginner-friendly React course covering components, hooks, and clean state design.",
        keywords: ["free react course", "react tutorial", "learn react", "react hooks"],
        canonicalUrl: "/courses/react-js-for-beginners",
        noIndex: false,
      },
    },
    {
      title: "Next.js Full-Stack Development",
      slug: "nextjs-15-react-19-mastery",
      subtitle: "Build production-grade full-stack web applications with Next.js 15 App Router, React Server Components, and Server Actions.",
      description: "The definitive full-stack Next.js guide. Architect applications leveraging server-side rendering, streaming, optimistic mutations, server actions, Razorpay payments, and MongoDB persistence.",
      thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=450&fit=crop",
      instructor: instructorAlex._id,
      category: "Next.js",
      subcategory: "Full-Stack Architecture",
      format: "Mixed",
      level: "Intermediate",
      language: "English",
      price: 2999,
      discountPrice: 2499,
      isFree: false,
      status: "published",
      isFeatured: true,
      accessDurationDays: 0,
      certificateEnabled: true,
      ratingAverage: 4.95,
      ratingCount: 220,
      enrolledCount: 1850,
      whatYouWillLearn: [
        "Architect scalable apps with Next.js 15 App Router",
        "Leverage React Server Components and Server Actions",
        "Implement robust JWT auth, RBAC permissions, and sessions",
        "Integrate Razorpay payment flows and webhook verification",
      ],
      requirements: ["Intermediate React and JavaScript experience"],
      targetAudience: ["Full-stack engineers and senior web developers"],
      seo: {
        title: "Next.js 15 Full-Stack Development Masterclass | CodeMentors",
        description: "Master full-stack Next.js 15 App Router, Server Actions, MongoDB, and payment security.",
        keywords: ["next.js 15 course", "nextjs fullstack", "server components", "server actions"],
        canonicalUrl: "/courses/nextjs-15-react-19-mastery",
        noIndex: false,
      },
    },
    {
      title: "Node.js and Express Backend Development",
      slug: "nodejs-express-backend",
      subtitle: "Design high-performance REST APIs, authentication services, and microservices with Node.js.",
      description: "Deep dive into enterprise backend engineering. Master middleware chaining, streaming responses, rate limiting, and JWT authentication with Express and Node.js.",
      thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=450&fit=crop",
      instructor: instructorSarah._id,
      category: "Node.js",
      subcategory: "Backend Systems",
      format: "Video",
      level: "Intermediate",
      language: "English",
      price: 2199,
      discountPrice: 1699,
      isFree: false,
      status: "published",
      isFeatured: false,
      accessDurationDays: 365,
      ratingAverage: 4.85,
      ratingCount: 110,
      enrolledCount: 920,
      whatYouWillLearn: [
        "Build secure RESTful APIs with Express",
        "Implement rate-limiting, CORS, and helmet security",
        "Handle file uploads and streaming data pipelines",
        "Write integration tests with Jest and Supertest",
      ],
      requirements: ["Basic JavaScript knowledge"],
      targetAudience: ["Backend developers and full-stack engineers"],
      seo: {
        title: "Node.js and Express Backend Course | CodeMentors",
        description: "Build robust, secure backend APIs and microservices with Node.js and Express.",
        keywords: ["node.js backend", "express api", "rest api node", "backend development"],
        canonicalUrl: "/courses/nodejs-express-backend",
        noIndex: false,
      },
    },
    {
      title: "MongoDB Database Mastery",
      slug: "mongodb-database-mastery",
      subtitle: "Schema design patterns, aggregation pipelines, replica sets, and query optimization.",
      description: "Master document databases for enterprise scale. Learn advanced aggregation framework operators, compound indexing, sharding principles, and Mongoose ODM optimization.",
      thumbnail: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&h=450&fit=crop",
      instructor: instructorSarah._id,
      category: "Database Management",
      subcategory: "NoSQL Engineering",
      format: "PDF/Document",
      level: "Intermediate",
      language: "English",
      price: 1799,
      discountPrice: 1299,
      isFree: false,
      status: "published",
      isFeatured: false,
      accessDurationDays: 365,
      ratingAverage: 4.75,
      ratingCount: 88,
      enrolledCount: 740,
      whatYouWillLearn: [
        "Design scalable, denormalized document schemas",
        "Master the MongoDB Aggregation Pipeline",
        "Analyze queries with explain plans and index compound fields",
        "Implement ACID multi-document transactions",
      ],
      requirements: ["Basic database concepts"],
      targetAudience: ["Backend and data engineers"],
      seo: {
        title: "MongoDB Database Mastery & Aggregations | CodeMentors",
        description: "Master MongoDB schema patterns, aggregation pipelines, and high-throughput queries.",
        keywords: ["mongodb course", "nosql mastery", "aggregation pipeline", "mongoose"],
        canonicalUrl: "/courses/mongodb-database-mastery",
        noIndex: false,
      },
    },
    {
      title: "TypeScript Essentials",
      slug: "typescript-essentials",
      subtitle: "Write reliable, bug-free applications with modern TypeScript type-level features.",
      description: "Elevate your JavaScript code with static typing. Learn generics, utility types, mapped types, conditional types, and declaration merging.",
      thumbnail: "https://images.unsplash.com/photo-1516116211227-bbc04d49d970?w=800&h=450&fit=crop",
      instructor: instructorAlex._id,
      category: "Frontend Development",
      subcategory: "Type Systems",
      format: "Text",
      level: "Intermediate",
      language: "English",
      price: 0,
      isFree: true,
      status: "published",
      isFeatured: true,
      accessDurationDays: 0,
      ratingAverage: 4.9,
      ratingCount: 195,
      enrolledCount: 2200,
      whatYouWillLearn: [
        "Type inference, union types, and type guards",
        "Master generic functions, interfaces, and constraints",
        "Build mapped types and conditional type utilities",
        "Configure strict tsconfig.json for production builds",
      ],
      requirements: ["Intermediate JavaScript proficiency"],
      targetAudience: ["JavaScript developers transitioning to TypeScript"],
      seo: {
        title: "Free TypeScript Essentials Tutorial Course | CodeMentors",
        description: "Master modern TypeScript type safety, generics, and enterprise configuration.",
        keywords: ["free typescript course", "typescript tutorial", "generics", "type safety"],
        canonicalUrl: "/courses/typescript-essentials",
        noIndex: false,
      },
    },
    {
      title: "Python Programming",
      slug: "python-programming",
      subtitle: "From syntax foundations to object-oriented programming, data structures, and automation.",
      description: "Learn clean, idiomatic Python 3. Build command-line utilities, manipulate datasets, interact with external APIs, and write testable object-oriented code.",
      thumbnail: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&h=450&fit=crop",
      instructor: instructorSarah._id,
      category: "Python",
      subcategory: "Core Language",
      format: "Video",
      level: "Beginner",
      language: "English",
      price: 1999,
      discountPrice: 1499,
      isFree: false,
      status: "published",
      isFeatured: false,
      accessDurationDays: 365,
      ratingAverage: 4.8,
      ratingCount: 160,
      enrolledCount: 1400,
      whatYouWillLearn: [
        "Master Python control structures, lists, dicts, and comprehensions",
        "Write clean Object-Oriented classes with dunder methods",
        "Work with file I/O, JSON serialization, and virtual environments",
        "Automate repetitive system workflows with Python scripts",
      ],
      requirements: ["No prior programming experience required"],
      targetAudience: ["Beginners and career switchers"],
      seo: {
        title: "Python Programming for Beginners | CodeMentors",
        description: "Learn idiomatic Python 3 from foundations to object-oriented architecture and automation.",
        keywords: ["python course", "learn python", "python 3", "python automation"],
        canonicalUrl: "/courses/python-programming",
        noIndex: false,
      },
    },
    {
      title: "REST API Development",
      slug: "rest-api-development",
      subtitle: "Design, secure, document, and deploy production-ready RESTful web services.",
      description: "Master REST architectural constraints, HTTP response codes, idempotency keys, OpenAPI/Swagger specifications, and token-based rate limiting.",
      thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=450&fit=crop",
      instructor: instructorSarah._id,
      category: "Backend Development",
      subcategory: "API Architecture",
      format: "Mixed",
      level: "Intermediate",
      language: "English",
      price: 2499,
      discountPrice: 1899,
      isFree: false,
      status: "published",
      isFeatured: false,
      accessDurationDays: 365,
      ratingAverage: 4.88,
      ratingCount: 95,
      enrolledCount: 810,
      whatYouWillLearn: [
        "Design clean, idempotent REST endpoints adhering to RFC specs",
        "Implement pagination, filtering, and sparse fieldsets",
        "Secure APIs with OAuth2 scopes and rate limit headers",
        "Document APIs with OpenAPI 3.0 and automated Swagger UIs",
      ],
      requirements: ["Basic backend experience with Node.js or Python"],
      targetAudience: ["Backend and integration engineers"],
      seo: {
        title: "REST API Development & Architecture Masterclass | CodeMentors",
        description: "Master REST architectural design, idempotency, rate limiting, and OpenAPI specs.",
        keywords: ["rest api course", "api design", "openapi", "swagger", "api architecture"],
        canonicalUrl: "/courses/rest-api-development",
        noIndex: false,
      },
    },
    {
      title: "Git and GitHub",
      slug: "git-and-github",
      subtitle: "Version control mastery: branching strategies, interactive rebasing, merge conflict resolution, and GitHub Actions.",
      description: "Master the tool every software engineer uses daily. Understand Git internals (blobs, trees, commits), interactive rebase, cherry-pick, bisect, and pull request workflows.",
      thumbnail: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800&h=450&fit=crop",
      instructor: instructorAlex._id,
      category: "Software Engineering",
      subcategory: "Developer Tooling",
      format: "Text",
      level: "Beginner",
      language: "English",
      price: 0,
      isFree: true,
      status: "published",
      isFeatured: false,
      accessDurationDays: 0,
      ratingAverage: 4.92,
      ratingCount: 240,
      enrolledCount: 2900,
      whatYouWillLearn: [
        "Understand the Git object model and reflog recovery",
        "Master branching strategies (GitHub Flow, Trunk-based)",
        "Resolve complex merge conflicts with confidence",
        "Automate tests and deployments with GitHub Actions",
      ],
      requirements: ["A computer with a command line terminal"],
      targetAudience: ["All software engineers"],
      seo: {
        title: "Free Git and GitHub Masterclass | CodeMentors",
        description: "Master Git version control, interactive rebase, and collaborative GitHub workflows.",
        keywords: ["free git course", "git and github", "git rebase", "version control"],
        canonicalUrl: "/courses/git-and-github",
        noIndex: false,
      },
    },
    {
      title: "Web Development Projects",
      slug: "web-development-projects",
      subtitle: "Build 5 real-world production projects: e-commerce storefront, SaaS dashboard, kanban board, real-time chat, and CMS.",
      description: "Portfolio-grade project experience. Step-by-step builds using modern stacks (Next.js, Tailwind CSS, TypeScript, MongoDB, WebSockets, and Stripe/Razorpay payments).",
      thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop",
      instructor: instructorAlex._id,
      category: "Web Development",
      subcategory: "Portfolio Projects",
      format: "Mixed",
      level: "Intermediate",
      language: "English",
      price: 2799,
      discountPrice: 1999,
      isFree: false,
      status: "published",
      isFeatured: true,
      accessDurationDays: 0,
      ratingAverage: 4.96,
      ratingCount: 180,
      enrolledCount: 1650,
      whatYouWillLearn: [
        "Build a full-scale e-commerce platform with cart and checkout",
        "Create an authenticated SaaS metrics dashboard with analytics",
        "Implement a real-time collaborative Kanban board with WebSockets",
        "Deploy and monitor applications on cloud infrastructure",
      ],
      requirements: ["Familiarity with React and Node.js"],
      targetAudience: ["Engineers preparing for job interviews"],
      seo: {
        title: "Full-Stack Web Development Projects Portfolio | CodeMentors",
        description: "Build 5 production-ready full-stack projects for your software engineering portfolio.",
        keywords: ["web dev projects", "portfolio projects", "full stack build", "react projects"],
        canonicalUrl: "/courses/web-development-projects",
        noIndex: false,
      },
    },
    {
      title: "Technical SEO Fundamentals",
      slug: "technical-seo-fundamentals",
      subtitle: "Core Web Vitals, structured data, canonicalization, and crawl budget optimization for developers.",
      description: "Bridge the gap between frontend engineering and search engine indexing. Learn dynamic rendering, JSON-LD schemas, sitemaps, robots.txt directives, and Next.js metadata APIs.",
      thumbnail: "https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=800&h=450&fit=crop",
      instructor: instructorAlex._id,
      category: "Web Development",
      subcategory: "Technical SEO",
      format: "Text",
      level: "Intermediate",
      language: "English",
      price: 1299,
      isFree: false,
      status: "draft", // Intentionally draft for testing admin workflow
      isFeatured: false,
      accessDurationDays: 365,
      whatYouWillLearn: [
        "Optimize Core Web Vitals (LCP, INP, CLS)",
        "Implement JSON-LD structured schemas for Google rich snippets",
        "Configure dynamic XML sitemaps and canonical headers",
      ],
      requirements: ["Web development basics"],
      targetAudience: ["Full-stack developers and technical marketers"],
      seo: {
        title: "Technical SEO Fundamentals for Developers | CodeMentors",
        description: "", // Intentionally empty description to test SEO audit warnings!
        keywords: ["technical seo", "core web vitals", "json ld", "canonicalization"],
        canonicalUrl: "/courses/technical-seo-fundamentals",
        noIndex: true,
      },
    },
    {
      title: "Advanced Full-Stack Engineering",
      slug: "advanced-fullstack-engineering",
      subtitle: "High-throughput architectures, distributed caching, circuit breakers, and zero-downtime deployments.",
      description: "An intensive masterclass for experienced developers. Architect distributed systems with CQRS, event sourcing, Redis pub/sub, Docker containers, and Kubernetes orchestration.",
      thumbnail: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&h=450&fit=crop",
      instructor: instructorSarah._id,
      category: "Software Engineering",
      subcategory: "Distributed Architecture",
      format: "Mixed",
      level: "Advanced",
      language: "English",
      price: 3499,
      discountPrice: 2999,
      isFree: false,
      status: "pending_review", // Intentionally pending review for admin governance testing
      isFeatured: false,
      accessDurationDays: 0,
      whatYouWillLearn: [
        "Implement CQRS and Event Sourcing patterns",
        "Deploy distributed caches and prevent thundering herds",
        "Build fault-tolerant systems with circuit breakers",
        "Configure automated blue-green deployment pipelines",
      ],
      requirements: ["Solid backend and frontend development experience"],
      targetAudience: ["Senior software engineers and tech leads"],
      seo: {
        title: "Advanced Full-Stack Engineering Masterclass | CodeMentors",
        description: "Architect resilient, high-throughput web applications with distributed patterns.",
        keywords: ["advanced fullstack", "system design", "distributed systems", "cqrs"],
        canonicalUrl: "/courses/advanced-fullstack-engineering",
        noIndex: false,
      },
    },
  ];

  // Helper function to build 3 modules with rich lessons for a course
  function buildCourseModules(courseSlug: string, courseTitle: string) {
    return [
      {
        _id: deterministicObjectId(`${courseSlug}-mod-1`),
        title: "Module 1: Foundations & Architecture",
        slug: "module-1-foundations",
        description: "Core architectural mechanics, mental models, and environment setup.",
        order: 1,
        status: "published",
        isRequired: true,
        estimatedDurationMinutes: 75,
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        videoDuration: 1200,
        pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        pdfTitle: `${courseSlug}_Architecture_Guide.pdf`,
        notes: `# ${courseTitle} — Architecture Handbook\n\nWelcome to Module 1.\n\n> **Note:** Master the foundational mental models before proceeding to deep implementations.\n\n### Example\n\`\`\`typescript\ninterface ArchitectureModel {\n  id: string;\n  version: number;\n  initialized: boolean;\n}\n\`\`\`\n\n> **Tip:** Click **"Try it Yourself »"** to test and run code live in your browser sandbox!`,
        learningObjectives: ["Understand fundamental architecture", "Configure developer toolchain"],
        lessons: [
          {
            _id: deterministicObjectId(`${courseSlug}-les-1`),
            title: "Course Overview & Learning Roadmap",
            slug: `${courseSlug}-lesson-1-overview`,
            type: "video",
            durationMinutes: 12,
            isPreview: true, // Free preview
            isRequired: true,
            status: "published",
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            videoDuration: 720,
            videoProvider: "youtube",
            content: "Welcome to the course. Here is the complete roadmap of what we will build and learn.",
            seo: {
              title: `Overview | ${courseTitle}`,
              description: `Get started with ${courseTitle} on CodeMentors.`,
              keywords: ["overview", courseTitle],
              canonicalUrl: `/learn/${courseSlug}/${courseSlug}-lesson-1-overview`,
              noIndex: false,
            },
          },
          {
            _id: deterministicObjectId(`${courseSlug}-les-2`),
            title: "Core Mechanics & Syntax Tutorial",
            slug: `${courseSlug}-lesson-2-mechanics`,
            type: "article",
            durationMinutes: 20,
            isPreview: false,
            isRequired: true,
            status: "published",
            content: `# Core Mechanics & Architecture\n\nA detailed breakdown of system behaviors and memory models.\n\n### Interactive Example\n\`\`\`javascript\nfunction executeWorkflow(payload) {\n  const timestamp = Date.now();\n  return { status: 'success', timestamp };\n}\n\`\`\`\n\n> **Tip:** Write clean, predictable functions without unintended side effects.`,
            readingTimeMinutes: 8,
            seo: {
              title: `Core Mechanics | ${courseTitle}`,
              description: `Deep dive into the core mechanics of ${courseTitle}.`,
              canonicalUrl: `/learn/${courseSlug}/${courseSlug}-lesson-2-mechanics`,
              noIndex: false,
            },
          },
          {
            _id: deterministicObjectId(`${courseSlug}-les-3`),
            title: "Official Architecture Cheatsheet (PDF)",
            slug: `${courseSlug}-lesson-3-cheatsheet`,
            type: "pdf",
            durationMinutes: 15,
            isPreview: false,
            isRequired: true,
            status: "published",
            pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            pdfTitle: `${courseSlug}_Cheatsheet.pdf`,
            fileSize: "1.8 MB",
            downloadAllowed: true,
            content: "Download and print this quick reference cheatsheet covering all core patterns.",
            seo: {
              title: `PDF Cheatsheet | ${courseTitle}`,
              description: `Download official PDF documentation for ${courseTitle}.`,
              canonicalUrl: `/learn/${courseSlug}/${courseSlug}-lesson-3-cheatsheet`,
              noIndex: false,
            },
          },
        ],
      },
      {
        _id: deterministicObjectId(`${courseSlug}-mod-2`),
        title: "Module 2: In-Depth Implementation",
        slug: "module-2-implementation",
        description: "Hands-on implementation of production patterns and real-world workflows.",
        order: 2,
        status: "published",
        isRequired: true,
        estimatedDurationMinutes: 90,
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        videoDuration: 1500,
        pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        pdfTitle: `${courseSlug}_Patterns_Handbook.pdf`,
        notes: `# Module 2 Tutorial\n\nPractical implementation strategies for enterprise applications.\n\n### Example\n\`\`\`typescript\nexport async function handleOperation() {\n  return { success: true };\n}\n\`\`\``,
        learningObjectives: ["Implement robust data flows", "Handle edge cases and network failures"],
        lessons: [
          {
            _id: deterministicObjectId(`${courseSlug}-les-4`),
            title: "Deep Dive Implementation Video",
            slug: `${courseSlug}-lesson-4-implementation`,
            type: "video",
            durationMinutes: 25,
            isPreview: false,
            isRequired: true,
            status: "published",
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            videoDuration: 1500,
            videoProvider: "youtube",
            content: "Follow along step-by-step as we construct the core module components.",
          },
          {
            _id: deterministicObjectId(`${courseSlug}-les-5`),
            title: "Multi-Media Sequential Lab (Mixed)",
            slug: `${courseSlug}-lesson-5-lab`,
            type: "mixed",
            durationMinutes: 30,
            isPreview: false,
            isRequired: true,
            status: "published",
            contentBlocks: [
              {
                type: "text",
                order: 1,
                content: "In this interactive lab, we combine architectural principles, runnable code, and visual verification.",
              },
              {
                type: "code",
                order: 2,
                language: "typescript",
                content: "export async function processTransaction(data: any) {\n  const result = await db.save(data);\n  return result;\n}",
              },
              {
                type: "callout",
                order: 3,
                calloutType: "tip",
                content: "Always ensure operations that alter database state are idempotent.",
              },
              {
                type: "video",
                order: 4,
                videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              },
            ],
          },
          {
            _id: deterministicObjectId(`${courseSlug}-les-6`),
            title: "Module Knowledge Check Quiz",
            slug: `${courseSlug}-lesson-6-quiz`,
            type: "quiz",
            durationMinutes: 15,
            isPreview: false,
            isRequired: true,
            status: "published",
            content: "Complete this 5-question assessment to verify your comprehension.",
          },
          {
            _id: deterministicObjectId(`${courseSlug}-les-coding`),
            title: "Interactive Coding Exercise: Server Action",
            slug: `${courseSlug}-lesson-coding`,
            type: "coding",
            durationMinutes: 15,
            isPreview: false,
            isRequired: true,
            status: "published",
            content: "Implement an asynchronous server action.",
            codingExercise: {
              language: "typescript",
              instructions: "Export an async server action named createUser.",
              starterCode: "export async function createUser(data: { name: string }) {\n  // TODO\n}",
              hints: ["Use 'use server' directive", "Validate payload"],
              testCases: [{ input: "{ name: 'Elena' }", expectedOutput: "{ status: 'created' }" }],
            },
          },
        ],
      },
      {
        _id: deterministicObjectId(`${courseSlug}-mod-3`),
        title: "Module 3: Production Deployment & Best Practices",
        slug: "module-3-production",
        description: "Hardening security, optimizing performance, and continuous deployment.",
        order: 3,
        status: "published",
        isRequired: true,
        estimatedDurationMinutes: 65,
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        videoDuration: 1100,
        pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        pdfTitle: `${courseSlug}_Production_Checklist.pdf`,
        notes: `# Production Checklist\n\n1. Security headers & CORS validation\n2. Database indexing verification\n3. Zero-downtime rollout readiness`,
        learningObjectives: ["Prepare for production launch", "Configure telemetry and monitoring"],
        lessons: [
          {
            _id: deterministicObjectId(`${courseSlug}-les-7`),
            title: "Production Hardening & Performance",
            slug: `${courseSlug}-lesson-7-production`,
            type: "article",
            durationMinutes: 18,
            isPreview: false,
            isRequired: true,
            status: "published",
            content: "Checklist of mission-critical production considerations before going live.",
          },
          {
            _id: deterministicObjectId(`${courseSlug}-les-8`),
            title: "Starter Kit & Deployment Assets (Download)",
            slug: `${courseSlug}-lesson-8-assets`,
            type: "resource",
            durationMinutes: 10,
            isPreview: false,
            isRequired: false,
            status: "published",
            pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            pdfTitle: `${courseSlug}_Starter_Kit.zip`,
            fileSize: "4.5 MB",
            downloadAllowed: true,
            content: "Download the complete starter kit, repository templates, and Docker compose files.",
          },
        ],
      },
    ];
  }

  const courseMap = new Map<string, any>();
  let totalModulesCount = 0;
  let totalLessonsCount = 0;

  for (const c of coursesData) {
    const modules = buildCourseModules(c.slug, c.title);
    totalModulesCount += modules.length;
    let lessonsInCourse = 0;
    let durationInCourse = 0;

    modules.forEach((m) => {
      lessonsInCourse += m.lessons.length;
      m.lessons.forEach((l: any) => {
        durationInCourse += Number(l.durationMinutes || 0);
      });
    });
    totalLessonsCount += lessonsInCourse;

    const coursePayload = {
      ...c,
      modules,
      totalLessonsCount: lessonsInCourse,
      totalDurationMinutes: durationInCourse,
    };

    if (!isDryRun) {
      const doc = await Course.findOneAndUpdate(
        { slug: c.slug },
        { $set: coursePayload },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
      courseMap.set(c.slug, doc);
    } else {
      courseMap.set(c.slug, { ...coursePayload, _id: new mongoose.Types.ObjectId() });
    }
  }

  // 6. SEED QUIZZES (At least 10 realistic quizzes linked to courses & lessons)
  const quizzesData = [
    {
      courseSlug: "complete-javascript-fundamentals",
      lessonSlug: "complete-javascript-fundamentals-lesson-6-quiz",
      title: "JavaScript Scope, Closures & Event Loop Assessment",
      description: "Test your understanding of lexical scope, execution contexts, and asynchronous microtasks.",
      timeLimitMinutes: 15,
      passingPercentage: 70,
      questions: [
        {
          questionText: "What will `typeof NaN` evaluate to in JavaScript?",
          type: "single_choice",
          options: [
            { text: "'number'", isCorrect: true },
            { text: "'nan'", isCorrect: false },
            { text: "'undefined'", isCorrect: false },
            { text: "'object'", isCorrect: false },
          ],
          explanation: "In JavaScript, NaN is a numeric value representing 'Not-a-Number', but its typeof is 'number'.",
          points: 2,
        },
        {
          questionText: "Which statement accurately describes a closure?",
          type: "single_choice",
          options: [
            { text: "A function bundled with its surrounding lexical environment", isCorrect: true },
            { text: "A function that has no return value", isCorrect: false },
            { text: "A recursive loop in the V8 engine", isCorrect: false },
          ],
          explanation: "A closure gives a function access to its outer scope even after the outer function has executed.",
          points: 2,
        },
        {
          questionText: "Promise callbacks (microtasks) execute before standard setTimeout callbacks (macrotasks).",
          type: "true_false",
          options: [
            { text: "True", isCorrect: true },
            { text: "False", isCorrect: false },
          ],
          explanation: "Microtasks (Promises, queueMicrotask) are drained at the end of the current task before any macrotasks.",
          points: 2,
        },
        {
          questionText: "What is logged by: `console.log(0.1 + 0.2 === 0.3)`?",
          type: "single_choice",
          options: [
            { text: "false (due to IEEE 754 floating point precision)", isCorrect: true },
            { text: "true", isCorrect: false },
            { text: "TypeError", isCorrect: false },
          ],
          explanation: "0.1 + 0.2 equals 0.30000000000000004 in binary floating-point representation.",
          points: 2,
        },
      ],
    },
    {
      courseSlug: "react-js-for-beginners",
      lessonSlug: "react-js-for-beginners-lesson-6-quiz",
      title: "React Components & State Management Quiz",
      description: "Assess your mastery of JSX, props, useState, and component lifecycles.",
      timeLimitMinutes: 15,
      passingPercentage: 70,
      questions: [
        {
          questionText: "Why must state updates never mutate the original state directly?",
          type: "single_choice",
          options: [
            { text: "React relies on shallow object equality to trigger re-renders", isCorrect: true },
            { text: "Direct mutation throws a JavaScript syntax error", isCorrect: false },
            { text: "State mutations modify localStorage automatically", isCorrect: false },
          ],
          explanation: "Immutability allows React's reconciliation engine to efficiently check if component trees changed.",
          points: 2,
        },
        {
          questionText: "The key prop on list items helps React identify which items have changed or been removed.",
          type: "true_false",
          options: [
            { text: "True", isCorrect: true },
            { text: "False", isCorrect: false },
          ],
          explanation: "Keys provide stable identities for virtual DOM elements across render passes.",
          points: 2,
        },
      ],
    },
    {
      courseSlug: "nextjs-15-react-19-mastery",
      lessonSlug: "nextjs-15-react-19-mastery-lesson-6-quiz",
      title: "Next.js 15 App Router & RSC Comprehensive Exam",
      description: "Test your architectural mastery of Server Components, Server Actions, and Caching.",
      timeLimitMinutes: 20,
      passingPercentage: 80,
      questions: [
        {
          questionText: "By default, all components inside the Next.js App Router are:",
          type: "single_choice",
          options: [
            { text: "React Server Components (RSC)", isCorrect: true },
            { text: "Client Components ('use client')", isCorrect: false },
            { text: "Edge Handlers", isCorrect: false },
          ],
          explanation: "Next.js App Router treats all components as React Server Components unless 'use client' is declared.",
          points: 2,
        },
        {
          questionText: "Which directive must be placed at the top of a file or function to create a Server Action?",
          type: "single_choice",
          options: [
            { text: "'use server'", isCorrect: true },
            { text: "'use server-action'", isCorrect: false },
            { text: "'use backend'", isCorrect: false },
          ],
          explanation: "'use server' designates asynchronous functions as executable server actions.",
          points: 2,
        },
        {
          questionText: "React Server Components reduce client bundle size because their dependencies stay on the server.",
          type: "true_false",
          options: [
            { text: "True", isCorrect: true },
            { text: "False", isCorrect: false },
          ],
          explanation: "RSC code and imported libraries do not ship JavaScript bytes to the browser.",
          points: 2,
        },
      ],
    },
    {
      courseSlug: "nodejs-express-backend",
      lessonSlug: "nodejs-express-backend-lesson-6-quiz",
      title: "Node.js Event Loop & Express Middleware Assessment",
      description: "Test your understanding of non-blocking I/O, middleware chaining, and HTTP status codes.",
      timeLimitMinutes: 15,
      passingPercentage: 70,
      questions: [
        {
          questionText: "Which HTTP status code indicates a resource was created successfully?",
          type: "single_choice",
          options: [
            { text: "201 Created", isCorrect: true },
            { text: "200 OK", isCorrect: false },
            { text: "204 No Content", isCorrect: false },
          ],
          explanation: "201 Created is the standard RFC response for a successful resource creation.",
          points: 2,
        },
      ],
    },
    {
      courseSlug: "mongodb-database-mastery",
      lessonSlug: "mongodb-database-mastery-lesson-6-quiz",
      title: "MongoDB Schema Patterns & Indexing Quiz",
      description: "Assess your indexing strategies, compound indexes, and aggregation stages.",
      timeLimitMinutes: 15,
      passingPercentage: 70,
      questions: [
        {
          questionText: "Which aggregation stage is used to filter documents in a pipeline?",
          type: "single_choice",
          options: [
            { text: "$match", isCorrect: true },
            { text: "$filter", isCorrect: false },
            { text: "$where", isCorrect: false },
          ],
          explanation: "$match filters documents in the aggregation pipeline similarly to find query predicates.",
          points: 2,
        },
      ],
    },
    {
      courseSlug: "typescript-essentials",
      lessonSlug: "typescript-essentials-lesson-6-quiz",
      title: "TypeScript Generics & Type Narrowing Assessment",
      description: "Test your type-level programming and generic constraint skills.",
      timeLimitMinutes: 15,
      passingPercentage: 70,
      questions: [
        {
          questionText: "What does the `never` type represent in TypeScript?",
          type: "single_choice",
          options: [
            { text: "Values that never occur or functions that throw/never return", isCorrect: true },
            { text: "Any unassigned variable", isCorrect: false },
            { text: "A nullable object", isCorrect: false },
          ],
          explanation: "never is the bottom type in TypeScript, representing an empty set of values.",
          points: 2,
        },
      ],
    },
    {
      courseSlug: "python-programming",
      lessonSlug: "python-programming-lesson-6-quiz",
      title: "Python Data Structures & OOP Quiz",
      description: "Test comprehension of Python lists, dicts, generators, and class structures.",
      timeLimitMinutes: 15,
      passingPercentage: 70,
      questions: [
        {
          questionText: "Python dictionaries preserve key insertion order in Python 3.7+.",
          type: "true_false",
          options: [
            { text: "True", isCorrect: true },
            { text: "False", isCorrect: false },
          ],
          explanation: "Since Python 3.7, dictionaries are guaranteed to maintain insertion order.",
          points: 2,
        },
      ],
    },
    {
      courseSlug: "rest-api-development",
      lessonSlug: "rest-api-development-lesson-6-quiz",
      title: "REST Architecture & Idempotency Quiz",
      description: "Evaluate your understanding of REST verbs, idempotency, and security headers.",
      timeLimitMinutes: 15,
      passingPercentage: 70,
      questions: [
        {
          questionText: "Which of the following HTTP methods is NOT idempotent?",
          type: "single_choice",
          options: [
            { text: "POST", isCorrect: true },
            { text: "GET", isCorrect: false },
            { text: "PUT", isCorrect: false },
            { text: "DELETE", isCorrect: false },
          ],
          explanation: "POST is not idempotent because repeating identical requests can create multiple resources.",
          points: 2,
        },
      ],
    },
    {
      courseSlug: "git-and-github",
      lessonSlug: "git-and-github-lesson-6-quiz",
      title: "Git Internals & Branching Strategy Quiz",
      description: "Assess your mastery of interactive rebase, fast-forwards, and conflict resolution.",
      timeLimitMinutes: 15,
      passingPercentage: 70,
      questions: [
        {
          questionText: "What command lets you recover commits that were accidentally reset or lost?",
          type: "single_choice",
          options: [
            { text: "git reflog", isCorrect: true },
            { text: "git revert", isCorrect: false },
            { text: "git undo", isCorrect: false },
          ],
          explanation: "git reflog records every update made to the tips of branches in your local repository.",
          points: 2,
        },
      ],
    },
    {
      courseSlug: "web-development-projects",
      lessonSlug: "web-development-projects-lesson-6-quiz",
      title: "Full-Stack Project Architecture Review",
      description: "Test your holistic application design skills across frontend, API, and database.",
      timeLimitMinutes: 15,
      passingPercentage: 75,
      questions: [
        {
          questionText: "What is the primary benefit of optimistic UI updates?",
          type: "single_choice",
          options: [
            { text: "Immediate perceived performance feedback for the user", isCorrect: true },
            { text: "Eliminating the need for backend validation", isCorrect: false },
            { text: "Guaranteed offline database replication", isCorrect: false },
          ],
          explanation: "Optimistic UI renders expected results immediately while the background request finishes.",
          points: 2,
        },
      ],
    },
  ];

  const quizMap = new Map<string, any>();
  for (const q of quizzesData) {
    const courseDoc = courseMap.get(q.courseSlug);
    if (!courseDoc) continue;

    // Locate lesson
    let matchedLessonId = "";
    for (const m of courseDoc.modules) {
      const l = m.lessons.find((les: any) => les.slug === q.lessonSlug);
      if (l) {
        matchedLessonId = l._id.toString();
        break;
      }
    }

    const quizPayload = {
      courseId: courseDoc._id,
      lessonId: matchedLessonId || q.lessonSlug,
      title: q.title,
      description: q.description,
      timeLimitMinutes: q.timeLimitMinutes,
      passingPercentage: q.passingPercentage,
      maxAttempts: 3,
      shuffleQuestions: false,
      showExplanationImmediately: true,
      questions: q.questions,
    };

    if (!isDryRun) {
      const doc = await Quiz.findOneAndUpdate(
        { courseId: courseDoc._id, title: q.title },
        { $set: quizPayload },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      );
      quizMap.set(q.courseSlug, doc);

      // Link quizId back into course lesson
      await Course.updateOne(
        { _id: courseDoc._id, "modules.lessons.slug": q.lessonSlug },
        { $set: { "modules.$[].lessons.$[les].quizId": doc._id } },
        { arrayFilters: [{ "les.slug": q.lessonSlug }] }
      );
    } else {
      quizMap.set(q.courseSlug, { ...quizPayload, _id: new mongoose.Types.ObjectId() });
    }
  }

  // 7. SEED ENROLLMENTS, PROGRESS & CERTIFICATES (Consistent Test Scenarios)
  const nextjsCourse = courseMap.get("nextjs-15-react-19-mastery");
  const jsCourse = courseMap.get("complete-javascript-fundamentals");
  const reactCourse = courseMap.get("react-js-for-beginners");
  const gitCourse = courseMap.get("git-and-github");

  // SCENARIO A: Student 1 (Priya) COMPLETED Next.js course (100%) + CERTIFICATE
  let certificateDoc: any = null;
  if (!isDryRun && nextjsCourse && studentPriya) {
    const allNextjsLessonIds: string[] = [];
    nextjsCourse.modules.forEach((m: any) => {
      m.lessons.forEach((l: any) => allNextjsLessonIds.push(l._id.toString()));
    });

    const certCode = "CM-CERT-NX-88219";
    certificateDoc = await Certificate.findOneAndUpdate(
      { certificateCode: certCode },
      {
        $set: {
          certificateCode: certCode,
          userId: studentPriya._id,
          courseId: nextjsCourse._id,
          issueDate: new Date("2026-03-15"),
          gradePercentage: 98,
          verificationUrl: `/certificates/${certCode}`,
          metadata: {
            studentName: studentPriya.name,
            courseTitle: nextjsCourse.title,
            instructorName: instructorAlex.name,
            instructorHeadline: instructorAlex.headline,
            completionDate: "March 15, 2026",
            durationHours: 18,
          },
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    await Enrollment.findOneAndUpdate(
      { userId: studentPriya._id, courseId: nextjsCourse._id },
      {
        $set: {
          status: "completed",
          progressPercentage: 100,
          completedLessons: allNextjsLessonIds,
          lastAccessedLessonId: allNextjsLessonIds[allNextjsLessonIds.length - 1],
          completedAt: new Date("2026-03-15"),
          certificateId: certificateDoc._id,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    // Seed LessonProgress for completed lessons
    for (const lId of allNextjsLessonIds) {
      await LessonProgress.findOneAndUpdate(
        { userId: studentPriya._id, courseId: nextjsCourse._id, lessonId: lId },
        {
          $set: {
            isCompleted: true,
            completedAt: new Date("2026-03-15"),
            lastPositionSeconds: 600,
            isBookmarked: false,
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    }

    // Seed QuizAttempt for Student 1
    const nextjsQuiz = quizMap.get("nextjs-15-react-19-mastery");
    if (nextjsQuiz) {
      await QuizAttempt.findOneAndUpdate(
        { userId: studentPriya._id, quizId: nextjsQuiz._id, attemptNumber: 1 },
        {
          $set: {
            courseId: nextjsCourse._id,
            lessonId: nextjsQuiz.lessonId,
            attemptNumber: 1,
            totalScore: 6,
            maxScore: 6,
            scorePercentage: 100,
            passed: true,
            timeSpentSeconds: 420,
            answers: [
              { questionIndex: 0, selectedOptionIndices: [0], isCorrect: true, pointsAwarded: 2 },
              { questionIndex: 1, selectedOptionIndices: [0], isCorrect: true, pointsAwarded: 2 },
              { questionIndex: 2, selectedOptionIndices: [0], isCorrect: true, pointsAwarded: 2 },
            ],
            completedAt: new Date("2026-03-14"),
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    }
  }

  // SCENARIO B: Student 2 (David) IN-PROGRESS JavaScript course (50%) + Bookmarks + Notes
  if (!isDryRun && jsCourse && studentDavid) {
    const allJsLessons: any[] = [];
    jsCourse.modules.forEach((m: any) => {
      m.lessons.forEach((l: any) => allJsLessons.push(l));
    });

    const halfCount = Math.floor(allJsLessons.length / 2);
    const completedJsLessonIds = allJsLessons.slice(0, halfCount).map((l) => l._id.toString());
    const activeLesson = allJsLessons[halfCount];

    await Enrollment.findOneAndUpdate(
      { userId: studentDavid._id, courseId: jsCourse._id },
      {
        $set: {
          status: "active",
          progressPercentage: 50,
          completedLessons: completedJsLessonIds,
          lastAccessedLessonId: activeLesson ? activeLesson._id.toString() : undefined,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    // Save lesson progress with bookmarks and personal notes
    for (const lId of completedJsLessonIds) {
      await LessonProgress.findOneAndUpdate(
        { userId: studentDavid._id, courseId: jsCourse._id, lessonId: lId },
        {
          $set: {
            isCompleted: true,
            completedAt: new Date(),
            lastPositionSeconds: 300,
            isBookmarked: false,
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    }

    if (activeLesson) {
      await LessonProgress.findOneAndUpdate(
        { userId: studentDavid._id, courseId: jsCourse._id, lessonId: activeLesson._id.toString() },
        {
          $set: {
            isCompleted: false,
            lastPositionSeconds: 180,
            notes: "Review closures and prototype inheritance memory structures.",
            isBookmarked: true,
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    }

    // Seed QuizAttempt (attempt 1 failed 50%, attempt 2 passed 80%)
    const jsQuiz = quizMap.get("complete-javascript-fundamentals");
    if (jsQuiz) {
      await QuizAttempt.findOneAndUpdate(
        { userId: studentDavid._id, quizId: jsQuiz._id, attemptNumber: 1 },
        {
          $set: {
            courseId: jsCourse._id,
            lessonId: jsQuiz.lessonId,
            attemptNumber: 1,
            totalScore: 4,
            maxScore: 8,
            scorePercentage: 50,
            passed: false,
            timeSpentSeconds: 510,
            answers: [
              { questionIndex: 0, selectedOptionIndices: [0], isCorrect: true, pointsAwarded: 2 },
              { questionIndex: 1, selectedOptionIndices: [1], isCorrect: false, pointsAwarded: 0 },
            ],
            completedAt: new Date("2026-03-20"),
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );

      await QuizAttempt.findOneAndUpdate(
        { userId: studentDavid._id, quizId: jsQuiz._id, attemptNumber: 2 },
        {
          $set: {
            courseId: jsCourse._id,
            lessonId: jsQuiz.lessonId,
            attemptNumber: 2,
            totalScore: 8,
            maxScore: 8,
            scorePercentage: 100,
            passed: true,
            timeSpentSeconds: 380,
            answers: [
              { questionIndex: 0, selectedOptionIndices: [0], isCorrect: true, pointsAwarded: 2 },
              { questionIndex: 1, selectedOptionIndices: [0], isCorrect: true, pointsAwarded: 2 },
              { questionIndex: 2, selectedOptionIndices: [0], isCorrect: true, pointsAwarded: 2 },
              { questionIndex: 3, selectedOptionIndices: [0], isCorrect: true, pointsAwarded: 2 },
            ],
            completedAt: new Date("2026-03-21"),
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    }
  }

  // SCENARIO C: Student 3 (Amina) FRESH ENROLLMENT in Free Courses (0% progress)
  if (!isDryRun && reactCourse && gitCourse && studentAmina) {
    await Enrollment.findOneAndUpdate(
      { userId: studentAmina._id, courseId: reactCourse._id },
      {
        $set: {
          status: "active",
          progressPercentage: 0,
          completedLessons: [],
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    await Enrollment.findOneAndUpdate(
      { userId: studentAmina._id, courseId: gitCourse._id },
      {
        $set: {
          status: "active",
          progressPercentage: 0,
          completedLessons: [],
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    if (studentLegacy) {
      const legacyCertCode = "CM-CERT-REACT-10024";
      const legacyCert = await Certificate.findOneAndUpdate(
        { certificateCode: legacyCertCode },
        {
          $set: {
            certificateCode: legacyCertCode,
            userId: studentLegacy._id,
            courseId: reactCourse._id,
            issueDate: new Date("2026-03-01"),
            gradePercentage: 95,
            verificationUrl: `/certificates/${legacyCertCode}`,
            metadata: {
              studentName: studentLegacy.name,
              courseTitle: reactCourse.title,
              instructorName: instructorAlex.name,
              instructorHeadline: instructorAlex.headline,
              completionDate: "March 1, 2026",
              durationHours: 12,
            },
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );

      await Enrollment.findOneAndUpdate(
        { userId: studentLegacy._id, courseId: reactCourse._id },
        {
          $set: {
            status: "completed",
            progressPercentage: 100,
            completedLessons: reactCourse.modules[0].lessons.map((l: any) => l._id.toString()),
            completedAt: new Date("2026-03-01"),
            certificateId: legacyCert._id,
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    }
  }

  // 8. SEED RAZORPAY & ORDER / PAYMENT TEST SCENARIOS
  const paymentScenarios = [
    {
      orderNumber: "ORD-TEST-PENDING-001",
      userId: studentDavid._id,
      courseId: jsCourse?._id,
      courseTitle: "Complete JavaScript Fundamentals",
      amount: 999,
      orderStatus: "pending",
      paymentStatus: "pending",
      razorpayOrderId: "order_test_pending_9812",
      metadata: { isTestFixture: true, scenario: "pending_checkout" },
    },
    {
      orderNumber: "ORD-TEST-COMPLETED-002",
      userId: studentPriya._id,
      courseId: nextjsCourse?._id,
      courseTitle: "Next.js Full-Stack Development",
      amount: 2499,
      orderStatus: "paid",
      paymentStatus: "completed",
      razorpayOrderId: "order_test_paid_4412",
      razorpayPaymentId: "pay_test_succ_1001",
      paidAt: new Date("2026-03-01"),
      metadata: { isTestFixture: true, scenario: "verified_success" },
    },
    {
      orderNumber: "ORD-TEST-FAILED-003",
      userId: studentDavid._id,
      courseId: jsCourse?._id,
      courseTitle: "Complete JavaScript Fundamentals",
      amount: 999,
      orderStatus: "failed",
      paymentStatus: "failed",
      razorpayOrderId: "order_test_fail_7712",
      errorDetails: "Customer bank declined transaction",
      metadata: { isTestFixture: true, scenario: "card_declined" },
    },
    {
      orderNumber: "ORD-TEST-CANCELLED-004",
      userId: studentDavid._id,
      courseId: jsCourse?._id,
      courseTitle: "Complete JavaScript Fundamentals",
      amount: 999,
      orderStatus: "cancelled",
      paymentStatus: "pending",
      razorpayOrderId: "order_test_cancel_5512",
      metadata: { isTestFixture: true, scenario: "user_cancelled_modal" },
    },
    {
      orderNumber: "ORD-TEST-REFUND-REQ-005",
      userId: studentPriya._id,
      courseId: nextjsCourse?._id,
      courseTitle: "Next.js Full-Stack Development",
      amount: 2499,
      orderStatus: "paid",
      paymentStatus: "completed",
      razorpayOrderId: "order_test_rfnd_req_1122",
      razorpayPaymentId: "pay_test_rfnd_1122",
      refundStatus: "requested",
      refundReason: "Accidentally bought duplicate license for corporate team",
      metadata: { isTestFixture: true, scenario: "refund_requested" },
    },
    {
      orderNumber: "ORD-TEST-REFUND-PROC-006",
      userId: studentPriya._id,
      courseId: nextjsCourse?._id,
      courseTitle: "Next.js Full-Stack Development",
      amount: 2499,
      orderStatus: "paid",
      paymentStatus: "completed",
      razorpayOrderId: "order_test_rfnd_proc_3344",
      razorpayPaymentId: "pay_test_rfnd_3344",
      refundStatus: "processing",
      refundReason: "Incompatible hardware specifications",
      metadata: { isTestFixture: true, scenario: "refund_in_progress" },
    },
    {
      orderNumber: "ORD-TEST-REFUND-DONE-007",
      userId: studentPriya._id,
      courseId: nextjsCourse?._id,
      courseTitle: "Next.js Full-Stack Development",
      amount: 2499,
      orderStatus: "refunded",
      paymentStatus: "refunded",
      razorpayOrderId: "order_test_rfnd_done_5566",
      razorpayPaymentId: "pay_test_rfnd_5566",
      providerRefundId: "rfnd_test_conf_9876",
      refundStatus: "succeeded",
      refundReason: "Customer dissatisfaction within 7 days window",
      metadata: { isTestFixture: true, scenario: "refund_settled" },
    },
  ];

  if (!isDryRun) {
    for (const p of paymentScenarios) {
      if (!p.courseId || !p.userId) continue;

      const orderDoc = await Order.findOneAndUpdate(
        { orderNumber: p.orderNumber },
        {
          $set: {
            orderNumber: p.orderNumber,
            userId: p.userId,
            items: [
              {
                courseId: p.courseId,
                title: p.courseTitle,
                price: p.amount,
                finalPrice: p.amount,
              },
            ],
            subtotal: p.amount,
            totalAmount: p.amount,
            currency: "INR",
            status: p.orderStatus as any,
            razorpayOrderId: p.razorpayOrderId,
            razorpayPaymentId: p.razorpayPaymentId,
            receipt: `rcpt_${p.orderNumber}`,
            paidAt: p.paidAt,
            metadata: p.metadata,
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );

      const paymentDoc = await Payment.findOneAndUpdate(
        { orderId: p.razorpayOrderId },
        {
          $set: {
            userId: p.userId,
            courseId: p.courseId,
            orderId: p.razorpayOrderId,
            paymentId: p.razorpayPaymentId,
            amount: p.amount,
            originalPrice: p.amount,
            discountAmount: 0,
            currency: "INR",
            status: p.paymentStatus as any,
            provider: "razorpay",
            receipt: `rcpt_${p.orderNumber}`,
            errorDescription: p.errorDetails,
            metadata: p.metadata,
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );

      // If refund scenario, create Refund document
      if (p.refundStatus) {
        const refundDoc = await Refund.findOneAndUpdate(
          { paymentId: paymentDoc._id },
          {
            $set: {
              paymentId: paymentDoc._id,
              enrollmentId: new mongoose.Types.ObjectId(),
              userId: p.userId,
              courseId: p.courseId,
              amount: p.amount,
              reason: p.refundReason,
              status: p.refundStatus as any,
              providerRefundId: p.providerRefundId,
              adminNotes: "Automated test scenario for refund lifecycle validation.",
            },
          },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );

        paymentDoc.refundId = refundDoc._id;
        await paymentDoc.save();
      }
    }
  }

  // 9. SEED POPUP CAMPAIGNS (All 7 Lifecycle Scenarios)
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const nextMonthEnd = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const lastYear = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  const lastYearEnd = new Date(now.getTime() - 335 * 24 * 60 * 60 * 1000);

  const popupsData = [
    {
      campaignName: "Winter Flash Sale Draft",
      slug: "popup-winter-draft",
      title: "Winter Engineering Flash Sale",
      description: "Draft promotional offer being prepped by the marketing team.",
      badgeText: "DRAFT CAMPAIGN",
      campaignType: "offer",
      publicationStatus: "draft",
      isEnabled: false,
      priority: 1,
      triggerType: "time_delay",
      delaySeconds: 5,
      targetAudience: "all",
      ctaText: "Explore Courses",
      ctaUrl: "/courses",
      imageDesktop: { url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600", alt: "Draft" },
      createdBy: adminMarcus?._id,
    },
    {
      campaignName: "Spring Hackathon Announcement",
      slug: "popup-hackathon-disabled",
      title: "Annual CodeMentors Hackathon 2027",
      description: "Published campaign that is temporarily disabled by admin toggle.",
      badgeText: "HACKATHON",
      campaignType: "event",
      publicationStatus: "published",
      isEnabled: false,
      priority: 2,
      triggerType: "exit_intent",
      targetAudience: "all",
      ctaText: "Learn More",
      ctaUrl: "/courses",
      imageDesktop: { url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600", alt: "Hackathon" },
      createdBy: adminMarcus?._id,
    },
    {
      campaignName: "Summer Cloud Bootcamp",
      slug: "popup-summer-scheduled",
      title: "Summer Distributed Cloud Bootcamp",
      description: "Scheduled future campaign set to go live next month automatically.",
      badgeText: "COMING SOON",
      campaignType: "event",
      publicationStatus: "scheduled",
      isEnabled: true,
      priority: 3,
      schedule: {
        startDate: nextMonth,
        endDate: nextMonthEnd,
      },
      targetAudience: "all",
      ctaText: "Pre-Register",
      ctaUrl: "/courses",
      imageDesktop: { url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600", alt: "Bootcamp" },
      createdBy: adminMarcus?._id,
    },
    {
      campaignName: "Cyber Monday 2024",
      slug: "popup-blackfriday-expired",
      title: "Cyber Monday 50% Off Lifetime Access",
      description: "Expired campaign whose schedule has passed.",
      badgeText: "EXPIRED",
      campaignType: "offer",
      publicationStatus: "expired",
      isEnabled: true,
      priority: 4,
      schedule: {
        startDate: lastYear,
        endDate: lastYearEnd,
      },
      targetAudience: "all",
      ctaText: "View Deals",
      ctaUrl: "/courses",
      imageDesktop: { url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600", alt: "Expired" },
      createdBy: adminMarcus?._id,
    },
    {
      campaignName: "Full-Stack Masterclass 40% Off",
      slug: "popup-masterclass-active",
      title: "Spring Software Engineering Masterclass",
      description: "Level up with our flagship Next.js & Distributed Systems curriculum. Use code WELCOME20 at checkout for an extra 20% off!",
      badgeText: "ACTIVE SPECIAL OFFER",
      campaignType: "offer",
      publicationStatus: "published",
      isEnabled: true,
      priority: 10,
      triggerType: "time_delay",
      delaySeconds: 4,
      targetAudience: "all",
      ctaText: "Claim 40% Off Today",
      ctaUrl: "/courses/nextjs-15-react-19-mastery",
      imageDesktop: { url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600", alt: "Active Offer" },
      createdBy: adminMarcus?._id,
    },
    {
      campaignName: "New Student Orientation",
      slug: "popup-guest-welcome",
      title: "Welcome to CodeMentors! Start with Free Courses",
      description: "Create your free account today and start learning React and Git immediately.",
      badgeText: "GUEST EXCLUSIVE",
      campaignType: "announcement",
      publicationStatus: "published",
      isEnabled: true,
      priority: 8,
      triggerType: "time_delay",
      delaySeconds: 6,
      targetAudience: "guests",
      ctaText: "Explore Free Catalog",
      ctaUrl: "/courses",
      imageDesktop: { url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600", alt: "Guest Welcome" },
      createdBy: adminMarcus?._id,
    },
    {
      campaignName: "Alumni Mentorship Office Hours",
      slug: "popup-student-perk",
      title: "Exclusive Pro Perk: Weekly Architecture Office Hours",
      description: "Join Alex Rivers and Dr. Sarah Chen every Thursday for live code reviews and career Q&A.",
      badgeText: "STUDENT BENEFIT",
      campaignType: "event",
      publicationStatus: "published",
      isEnabled: true,
      priority: 9,
      triggerType: "time_delay",
      delaySeconds: 8,
      targetAudience: "students",
      ctaText: "Join Live Stream",
      ctaUrl: "/student/dashboard",
      imageDesktop: { url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600", alt: "Student Perk" },
      createdBy: adminMarcus?._id,
    },
  ];

  if (!isDryRun) {
    for (const pop of popupsData) {
      await PopupCampaign.findOneAndUpdate(
        { slug: pop.slug },
        { $set: pop },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    }
  }

  // 10. SEED INDEPENDENT PAGE SEO DATA (PageSeo)
  const seoPagesData = [
    {
      path: "/",
      slug: "home",
      entityType: "homepage",
      pageName: "Homepage",
      title: "CodeMentors — Production-Grade Developer Education & Masterclasses",
      description: "Master full-stack software engineering, Next.js, distributed systems, and modern cloud architecture with industry-grade mentorship.",
      canonicalUrl: "/",
      noIndex: false,
      noFollow: false,
      structuredDataType: "Organization",
      status: "published",
      seoScore: 95,
    },
    {
      path: "/about",
      slug: "about",
      entityType: "about",
      pageName: "About Us & Kraviona",
      title: "About CodeMentors & Kraviona Tech Solutions | Engineering Mission",
      description: "Learn about CodeMentors educational standards, curriculum philosophy, and Kraviona Tech Solutions technical foundation.",
      canonicalUrl: "/about",
      noIndex: false,
      noFollow: false,
      structuredDataType: "WebSite",
      status: "published",
      seoScore: 92,
    },
    {
      path: "/contact",
      slug: "contact",
      entityType: "contact",
      pageName: "Contact & Support",
      title: "Contact CodeMentors Engineering Mentors & Support",
      description: "Get in touch with CodeMentors instructors, enterprise licensing team, and student advisors.",
      canonicalUrl: "/contact",
      noIndex: false,
      noFollow: false,
      structuredDataType: "None",
      status: "published",
      seoScore: 90,
    },
    {
      path: "/courses",
      slug: "course-catalog",
      entityType: "course_catalog",
      pageName: "Course Catalog",
      title: "Browse All Software Engineering & Web Development Courses | CodeMentors",
      description: "Explore industry-accredited courses covering Next.js, React, Node.js, Python, MongoDB, and System Design.",
      canonicalUrl: "/courses",
      noIndex: false,
      noFollow: false,
      status: "published",
      seoScore: 94,
    },
    {
      path: "/categories/web-development",
      slug: "web-development",
      entityType: "category",
      pageName: "Web Development Category",
      title: "Web Development Roadmaps & Certification Courses | CodeMentors",
      description: "Comprehensive curriculum covering modern web engineering, responsive architectures, and server APIs.",
      canonicalUrl: "/categories/web-development",
      noIndex: false,
      noFollow: false,
      status: "published",
      seoScore: 91,
    },
    {
      path: "/categories/next-js",
      slug: "next-js",
      entityType: "category",
      pageName: "Next.js Category",
      title: "Next.js 15 Masterclasses, App Router & Server Actions | CodeMentors",
      description: "Master Next.js 15 App Router, React Server Components, streaming, and server actions.",
      canonicalUrl: "/categories/next-js",
      noIndex: false,
      noFollow: false,
      status: "published",
      seoScore: 96,
    },
    {
      path: "/courses/nextjs-15-react-19-mastery",
      slug: "nextjs-15-react-19-mastery",
      entityType: "course",
      pageName: "Next.js Full-Stack Masterclass",
      title: "Next.js 15 Full-Stack Development Masterclass | CodeMentors Pro",
      description: "The definitive full-stack Next.js guide. Build production applications with Server Components, Server Actions, and MongoDB.",
      canonicalUrl: "/courses/nextjs-15-react-19-mastery",
      noIndex: false,
      noFollow: false,
      structuredDataType: "Course",
      status: "published",
      seoScore: 98,
    },
    // Intentionally incomplete SEO records to test admin SEO audit warning detection
    {
      path: "/pages/draft-terms",
      slug: "draft-terms",
      entityType: "cms_page",
      pageName: "Draft Terms Page",
      title: "", // Missing title
      description: "Draft terms of service awaiting legal compliance review.",
      canonicalUrl: "/pages/draft-terms",
      noIndex: true,
      noFollow: true,
      status: "draft",
      seoScore: 40,
      issues: ["Missing meta title", "Page is set to noindex"],
    },
    {
      path: "/courses/technical-seo-fundamentals",
      slug: "technical-seo-fundamentals",
      entityType: "course",
      pageName: "Technical SEO Fundamentals",
      title: "Technical SEO Fundamentals for Developers | CodeMentors",
      description: "", // Missing description
      canonicalUrl: "/courses/technical-seo-fundamentals",
      noIndex: true,
      noFollow: false,
      status: "draft",
      seoScore: 50,
      issues: ["Missing meta description"],
    },
  ];

  if (!isDryRun) {
    for (const seo of seoPagesData) {
      await PageSeo.findOneAndUpdate(
        { path: seo.path },
        { $set: seo },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    }
  }

  // 11. SEED CMS PAGES & BLOG POSTS
  const cmsPagesData = [
    {
      title: "Home",
      slug: "home",
      status: "published",
      sections: [
        {
          id: "hero-1",
          type: "hero",
          title: "Master Software Engineering with Production-Grade Rigor",
          subtitle: "Interactive lessons, real-world code sandboxes, and expert mentorship from Kraviona and CodeMentors engineers.",
          order: 1,
          isVisible: true,
        },
        {
          id: "features-1",
          type: "features",
          title: "Engineered for Serious Developers",
          subtitle: "Why 50,000+ engineers choose CodeMentors to accelerate their careers.",
          order: 2,
          isVisible: true,
        },
        {
          id: "testimonials-1",
          type: "testimonials",
          title: "What Developers Say",
          content: "Demo Testimonial: 'CodeMentors elevated our engineering team's architectural confidence and delivery velocity.'",
          order: 3,
          isVisible: true,
        },
      ],
    },
    {
      title: "About Kraviona & CodeMentors",
      slug: "about",
      status: "published",
      sections: [
        {
          id: "about-hero",
          type: "text_block",
          title: "Powered by Kraviona Tech Solutions",
          content: "Kraviona Tech Solutions is a technology company focused on web development, full-stack application development, backend engineering, technical SEO, and AI automation. CodeMentors is Kraviona's flagship learning management platform.",
          order: 1,
          isVisible: true,
        },
      ],
    },
    {
      title: "Contact Engineering Support",
      slug: "contact",
      status: "published",
      sections: [
        {
          id: "contact-info",
          type: "text_block",
          title: "Get in Touch",
          content: "Reach our curriculum and technical support teams 24/7 at support@codementors.com or https://kraviona.com/.",
          order: 1,
          isVisible: true,
        },
      ],
    },
  ];

  if (!isDryRun) {
    for (const cms of cmsPagesData) {
      await CmsPage.findOneAndUpdate(
        { slug: cms.slug },
        { $set: cms },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    }
  }

  // 5 Blog Posts
  const blogPostsData = [
    {
      title: "Mastering Next.js 15 App Router and React Server Components",
      slug: "mastering-nextjs-15-app-router",
      excerpt: "An architectural guide to React Server Components, server actions, optimistic UI, and cache revalidation.",
      content: `# Mastering Next.js 15 App Router\n\nNext.js 15 represents the biggest paradigm shift in modern web architecture.\n\n## 1. Server Components vs Client Components\n\nBy default, all components are executed exclusively on the server.\n\n\`\`\`typescript\nexport async function ProductList() {\n  const products = await db.products.findMany();\n  return <div>{products.map(p => <div key={p.id}>{p.name}</div>)}</div>;\n}\n\`\`\`\n\n## 2. Server Actions\n\nServer actions provide seamless RPC without manual API routes.`,
      authorId: instructorAlex._id,
      category: "Engineering",
      tags: ["Next.js", "React", "Server Components", "Full-Stack"],
      readingTimeMinutes: 8,
      status: "published",
      publishedAt: new Date("2026-03-10"),
      viewsCount: 3420,
    },
    {
      title: "Deep Dive: The Node.js Event Loop and libuv Execution Model",
      slug: "understanding-nodejs-event-loop",
      excerpt: "Demystifying timers, pending callbacks, poll, check, and close phases in high-throughput Node.js microservices.",
      content: `# The Node.js Event Loop Explained\n\nUnderstanding how libuv orchestrates asynchronous tasks is vital for scaling Node.js servers.\n\n## Phases of the Loop\n1. Timers (setTimeout, setInterval)\n2. Pending Callbacks (I/O callbacks deferred to the next loop iteration)\n3. Poll (retrieve new I/O events)\n4. Check (setImmediate)\n5. Close Callbacks`,
      authorId: instructorSarah._id,
      category: "Backend",
      tags: ["Node.js", "libuv", "Event Loop", "Performance"],
      readingTimeMinutes: 10,
      status: "published",
      publishedAt: new Date("2026-03-08"),
      viewsCount: 2890,
    },
    {
      title: "Production Guide: High-Performance MongoDB Aggregation Pipelines",
      slug: "mongodb-aggregation-pipeline-guide",
      excerpt: "Optimize memory limits, compound indexes, and multi-stage transformations for large document collections.",
      content: `# High-Performance MongoDB Pipelines\n\nAvoid in-memory sorting limits and optimize pipeline stage ordering for maximum database throughput.`,
      authorId: instructorSarah._id,
      category: "Databases",
      tags: ["MongoDB", "NoSQL", "Indexing", "Performance"],
      readingTimeMinutes: 7,
      status: "published",
      publishedAt: new Date("2026-03-05"),
      viewsCount: 1950,
    },
    {
      title: "Type-Level Programming in TypeScript 5.x: Tips and Patterns",
      slug: "typescript-5-type-level-magic",
      excerpt: "Conditional types, template literal types, mapped types, and recursion limits in enterprise codebases.",
      content: `# Type-Level Programming in TypeScript 5.x\n\nTransform types into compile-time logic engines to catch edge-case bugs before runtime.`,
      authorId: instructorAlex._id,
      category: "Frontend",
      tags: ["TypeScript", "Type Systems", "Clean Code"],
      readingTimeMinutes: 6,
      status: "published",
      publishedAt: new Date("2026-03-01"),
      viewsCount: 2210,
    },
    {
      title: "Building Resilient Microservices with Distributed Sagas and Kafka",
      slug: "building-resilient-microservices-sagas",
      excerpt: "Coordinating distributed transactions across independent services without 2-phase locking protocols.",
      content: `# Distributed Sagas with Apache Kafka\n\nImplement choreography and orchestration sagas with automatic compensating transactions.`,
      authorId: instructorSarah._id,
      category: "Architecture",
      tags: ["Microservices", "Kafka", "Distributed Systems", "Sagas"],
      readingTimeMinutes: 11,
      status: "published",
      publishedAt: new Date("2026-02-25"),
      viewsCount: 3100,
    },
  ];

  if (!isDryRun) {
    for (const blog of blogPostsData) {
      await BlogPost.findOneAndUpdate(
        { slug: blog.slug },
        { $set: blog },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    }
  }

  // 12. SEED SETTINGS & INSTRUCTOR LIMITS
  if (!isDryRun) {
    // Global Site Settings
    await SiteSettings.findOneAndUpdate(
      { key: "global_config" },
      {
        $set: {
          key: "global_config",
          siteName: "CodeMentors",
          tagline: "Production-Grade Developer Education & Masterclasses",
          logoUrl: "/logo.png",
          heroBanner: {
            title: "Master Software Engineering with Production-Grade Rigor",
            subtitle: "Interactive lessons, real-world code sandboxes, and expert mentorship from Kraviona and CodeMentors engineers.",
            primaryCtaText: "Explore Courses",
            primaryCtaLink: "/courses",
            secondaryCtaText: "Learning Paths",
            secondaryCtaLink: "/learning-paths",
            badgeText: "PRO PLATFORM",
          },
          announcementBanner: {
            enabled: true,
            message: "🚀 CodeMentors 2.0 Live — Try our new interactive W3Schools-style Sandbox and PDF Handbooks!",
            linkText: "Explore Curriculum »",
            linkUrl: "/courses",
            bannerType: "info",
          },
          navigation: {
            headerLinks: [
              { label: "Courses", href: "/courses", order: 1, isVisible: true },
              { label: "Learning Paths", href: "/learning-paths", order: 2, isVisible: true },
              { label: "Blog", href: "/blog", order: 3, isVisible: true },
              { label: "About Kraviona", href: "/about", order: 4, isVisible: true },
              { label: "Contact", href: "/contact", order: 5, isVisible: true },
            ],
            footerColumns: [
              {
                title: "Platform",
                links: [
                  { label: "Browse Courses", href: "/courses" },
                  { label: "Learning Paths", href: "/learning-paths" },
                  { label: "Interactive Sandbox", href: "/courses" },
                  { label: "Certificate Verification", href: "/certificates/verify" },
                ],
              },
              {
                title: "Company",
                links: [
                  { label: "About CodeMentors", href: "/about" },
                  { label: "Powered by Kraviona", href: "https://kraviona.com/" },
                  { label: "Engineering Blog", href: "/blog" },
                  { label: "Support & FAQs", href: "/faq" },
                ],
              },
              {
                title: "Legal & Trust",
                links: [
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                  { label: "Refund Policy", href: "/refund-policy" },
                ],
              },
            ],
            socialLinks: {
              github: "https://github.com/codementors",
              twitter: "https://twitter.com/codementors",
              linkedin: "https://linkedin.com/company/codementors",
            },
          },
          seoDefaults: {
            defaultTitle: "CodeMentors — Production-Grade Developer Education & Masterclasses",
            titleTemplate: "%s | CodeMentors",
            defaultDescription: "Master software engineering, Next.js, and distributed systems with practical projects.",
            defaultOgImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
            canonicalDomain: "https://codementors.com",
            sitemapEnabled: true,
          },
          companyBranding: {
            enabled: true,
            companyName: "Kraviona Tech Solutions",
            companyUrl: "https://kraviona.com/",
            tagline: "Innovative Technology Solutions & Software Development",
            shortDescription: "Custom Web & Mobile Development, AI Integration, Cloud Architecture, and Enterprise Digital Transformation.",
            services: ["Web Development", "Mobile Apps", "AI & Machine Learning", "Cloud Solutions", "Custom Software"],
            contact: {
              website: "https://kraviona.com/",
              email: "contact@kraviona.com",
              phone: "+91 96085 53167",
            },
            displayPosition: "both",
            openInNewTab: true,
          },
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    // Razorpay Payment Settings
    await PaymentSettings.findOneAndUpdate(
      { key: "razorpay_config" },
      {
        $set: {
          key: "razorpay_config",
          isEnabled: true,
          mode: "test",
          testKeyId: "rzp_test_placeholder_key",
          testKeySecret: "rzp_test_placeholder_secret",
          merchantName: "CodeMentors",
          merchantDescription: "Production-Grade Developer Education & Masterclasses",
          defaultCurrency: "INR",
          supportedCurrencies: ["INR", "USD"],
          connectionStatus: "connected",
          refundWindowDays: 7,
          autoRefundApproval: false,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    // Global Instructor Limit Defaults
    await InstructorLimit.findOneAndUpdate(
      { isGlobalDefault: true },
      {
        $set: {
          isGlobalDefault: true,
          maxActiveCourses: 5,
          maxDraftCourses: 10,
          maxModulesPerCourse: 20,
          maxLessonsPerCourse: 100,
          canCreatePaidCourses: true,
          minCoursePrice: 0,
          maxCoursePrice: 50000,
          requireCourseApproval: false,
          canEditSeo: true,
          canPublishBlog: true,
          customNotes: "Standard global development limits.",
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    // Instructor 1 Custom Quota (Alex Rivers - Senior Trusted Instructor)
    if (instructorAlex) {
      await InstructorLimit.findOneAndUpdate(
        { instructorId: instructorAlex._id },
        {
          $set: {
            instructorId: instructorAlex._id,
            isGlobalDefault: false,
            maxActiveCourses: 20,
            maxDraftCourses: 25,
            requireCourseApproval: false,
            canCreateCoupons: true,
            canEditSeo: true,
            canPublishBlog: true,
            customNotes: "Senior Staff Instructor: VIP unlimited course quota.",
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    }

    // Instructor 2 Custom Quota (Dr. Sarah Chen - Systems Instructor)
    if (instructorSarah) {
      await InstructorLimit.findOneAndUpdate(
        { instructorId: instructorSarah._id },
        {
          $set: {
            instructorId: instructorSarah._id,
            isGlobalDefault: false,
            maxActiveCourses: 10,
            maxDraftCourses: 15,
            requireCourseApproval: false,
            canCreateCoupons: true,
            canEditSeo: true,
            canPublishBlog: true,
            customNotes: "Principal Systems Instructor.",
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    }
  }

  // 13. SEED AUDIT LOGS & NOTIFICATIONS
  if (!isDryRun) {
    const auditLogsData: Array<Partial<IAuditLog>> = [
      {
        action: "course_create",
        category: "course",
        actorId: instructorAlex._id.toString(),
        actorRole: "instructor",
        resourceId: nextjsCourse?._id.toString(),
        details: "Created course 'Next.js Full-Stack Development'",
        status: "success",
      },
      {
        action: "course_publish",
        category: "course",
        actorId: adminMarcus?._id.toString(),
        actorRole: "admin",
        resourceId: nextjsCourse?._id.toString(),
        details: "Published course 'Next.js Full-Stack Development'",
        status: "success",
      },
      {
        action: "category_create",
        category: "course",
        actorId: superAdmin?._id.toString(),
        actorRole: "super_admin",
        details: "Created category 'Next.js'",
        status: "success",
      },
      {
        action: "popup_create",
        category: "cms",
        actorId: adminMarcus?._id.toString(),
        actorRole: "admin",
        details: "Created popup campaign 'Full-Stack Masterclass 40% Off'",
        status: "success",
      },
      {
        action: "seo_page_update",
        category: "seo",
        actorId: adminMarcus?._id.toString(),
        actorRole: "admin",
        details: "Updated SEO metadata for path '/'",
        status: "success",
      },
      {
        action: "refund_request",
        category: "refund",
        actorId: studentPriya._id.toString(),
        actorRole: "student",
        details: "Requested refund for order ORD-TEST-REFUND-REQ-005",
        status: "success",
      },
    ];

    for (const log of auditLogsData) {
      await AuditLog.create(log);
    }

    // In-app Notifications
    const notificationsData: Array<Partial<INotification>> = [
      {
        userId: studentPriya._id,
        title: "Course Completed & Certificate Issued! 🎉",
        message: "Congratulations! You completed 'Next.js Full-Stack Development' and earned your official certificate.",
        type: "certificate",
        link: "/student/certificates",
        isRead: false,
      },
      {
        userId: studentDavid._id,
        title: "Continue Your Learning Journey",
        message: "You're 50% through 'Complete JavaScript Fundamentals'. Resume your bookmarked lessons now.",
        type: "course_update",
        link: "/student/dashboard",
        isRead: false,
      },
      {
        userId: studentAmina._id,
        title: "Welcome to CodeMentors!",
        message: "Your account is active. Dive into your enrolled courses and join our engineering community.",
        type: "system",
        link: "/student/dashboard",
        isRead: true,
      },
      {
        userId: instructorAlex._id,
        title: "New Student Enrollment Milestone",
        message: "Your course 'Next.js Full-Stack Development' reached 1,850 enrolled engineers!",
        type: "enrollment",
        link: "/instructor/dashboard",
        isRead: false,
      },
      {
        userId: adminMarcus._id,
        title: "Pending Course Review",
        message: "Dr. Sarah Chen submitted 'Advanced Full-Stack Engineering' for publication approval.",
        type: "system",
        link: "/admin/courses",
        isRead: false,
      },
    ];

    for (const notif of notificationsData) {
      await Notification.create(notif);
    }
  }

  // 14. SEED COUPONS & LEARNING PATHS & REVIEWS
  if (!isDryRun) {
    await Coupon.findOneAndUpdate(
      { code: "WELCOME20" },
      {
        $set: {
          code: "WELCOME20",
          discountType: "percentage",
          discountValue: 20,
          maxUses: 1000,
          currentUses: 142,
          validFrom: new Date("2026-01-01"),
          validUntil: new Date("2027-12-31"),
          isActive: true,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    await Coupon.findOneAndUpdate(
      { code: "DEVPRO50" },
      {
        $set: {
          code: "DEVPRO50",
          discountType: "percentage",
          discountValue: 50,
          maxUses: 500,
          currentUses: 88,
          validFrom: new Date("2026-01-01"),
          validUntil: new Date("2027-12-31"),
          isActive: true,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    // Learning Paths
    await LearningPath.findOneAndUpdate(
      { slug: "full-stack-nextjs-architect" },
      {
        $set: {
          title: "Full-Stack Next.js Architect Roadmap",
          slug: "full-stack-nextjs-architect",
          description: "From modern JavaScript core mechanics to React 19, TypeScript, and full-stack Next.js production deployments.",
          icon: "Layers",
          level: "Intermediate",
          estimatedHours: 65,
          courses: [jsCourse?._id, reactCourse?._id, nextjsCourse?._id].filter(Boolean),
          learningObjectives: [
            "Master modern asynchronous JavaScript",
            "Build reactive component architectures",
            "Deploy production Next.js apps with MongoDB",
          ],
          isPublished: true,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    // Reviews (clearly designated test feedback)
    if (nextjsCourse && studentPriya) {
      await Review.findOneAndUpdate(
        { courseId: nextjsCourse._id, userId: studentPriya._id },
        {
          $set: {
            courseId: nextjsCourse._id,
            userId: studentPriya._id,
            rating: 5,
            reviewText: "Demo Review: The interactive W3Schools-style sandbox and server action architectures were incredible. Helped me ace my full-stack interview!",
            status: "approved",
            instructorReply: {
              text: "Congratulations on completing the curriculum and earning your certificate, Priya!",
              repliedAt: new Date(),
            },
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    }
  }

  const durationMs = Date.now() - startTime;

  const report: SeedReport = {
    success: true,
    isReset,
    dryRun: isDryRun,
    counts: {
      users: usersToSeed.length,
      categories: parentCategoriesData.length + subcategoriesData.length,
      courses: coursesData.length,
      modules: totalModulesCount,
      lessons: totalLessonsCount,
      quizzes: quizzesData.length,
      quizAttempts: isDryRun ? 0 : 3,
      enrollments: isDryRun ? 0 : 5,
      certificates: isDryRun ? 0 : 2,
      orders: paymentScenarios.length,
      payments: paymentScenarios.length,
      refunds: 3,
      popups: popupsData.length,
      seoPages: seoPagesData.length,
      blogPosts: blogPostsData.length,
      cmsPages: cmsPagesData.length,
      instructorLimits: 3,
      auditLogs: isDryRun ? 0 : 6,
      notifications: isDryRun ? 0 : 5,
      reviews: isDryRun ? 0 : 1,
      coupons: 2,
      learningPaths: 1,
    },
    durationMs,
    timestamp: new Date().toISOString(),
  };

  console.log(`✅ Seed Execution Finished Successfully in ${durationMs}ms`);
  console.log(`   Users: ${report.counts.users} | Categories: ${report.counts.categories} | Courses: ${report.counts.courses}`);
  console.log(`   Modules: ${report.counts.modules} | Lessons: ${report.counts.lessons} | Quizzes: ${report.counts.quizzes}`);
  console.log(`   Popups: ${report.counts.popups} | SEO Pages: ${report.counts.seoPages} | Blog Posts: ${report.counts.blogPosts}`);

  return report;
}


