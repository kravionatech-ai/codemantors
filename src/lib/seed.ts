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
  Quiz,
  Certificate,
} from "@/models";
import { hashPassword } from "./auth";

const FENCE = "```";

export async function runDatabaseSeed() {
  await connectDB();

  console.log("Starting CodeMentors database seed...");

  // Clear existing collections safely
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Course.deleteMany({}),
    LearningPath.deleteMany({}),
    Coupon.deleteMany({}),
    Review.deleteMany({}),
    Enrollment.deleteMany({}),
    Quiz.deleteMany({}),
    Certificate.deleteMany({}),
  ]);

  // 1. Create Users
  const defaultPasswordHash = await hashPassword("Password@12345");

  const adminUser = await User.create({
    name: "Platform Administrator",
    email: "admin@codemetors.com",
    passwordHash: defaultPasswordHash,
    role: "admin",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces",
    headline: "CodeMentors Operations & Curriculum Director",
    bio: "Overseeing curriculum quality, infrastructure, instructor accreditations, and community standards at CodeMentors.",
    isActive: true,
    isVerified: true,
  });

  const instructorAlex = await User.create({
    name: "Alex Rivers",
    email: "alex@codemetors.com",
    passwordHash: defaultPasswordHash,
    role: "instructor",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=faces",
    headline: "Staff Software Architect & Ex-Tech Lead",
    bio: "12+ years building distributed cloud platforms, full-stack React systems, and mentoring 50,000+ engineers worldwide.",
    socialLinks: {
      github: "https://github.com/alexrivers",
      twitter: "https://twitter.com/alexrivers_dev",
      linkedin: "https://linkedin.com/in/alexrivers",
    },
    isActive: true,
    isVerified: true,
  });

  const instructorSarah = await User.create({
    name: "Dr. Sarah Chen",
    email: "sarah@codemetors.com",
    passwordHash: defaultPasswordHash,
    role: "instructor",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=faces",
    headline: "Principal Systems Engineer & AI Researcher",
    bio: "PhD in Distributed Computing. Specializes in TypeScript internals, High-Performance Node.js, and LLM orchestration.",
    socialLinks: {
      github: "https://github.com/sarahchen",
      linkedin: "https://linkedin.com/in/drsarahchen",
    },
    isActive: true,
    isVerified: true,
  });

  const studentUser = await User.create({
    name: "Jane Student",
    email: "student@codemetors.com",
    passwordHash: defaultPasswordHash,
    role: "student",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces",
    headline: "Aspiring Full-Stack Software Engineer",
    bio: "Passionate about building modern web apps with TypeScript, React, and server-side architectures.",
    isActive: true,
    isVerified: true,
  });

  // 2. Categories
  const categoriesData = [
    { name: "Web Development", slug: "web-development", icon: "Globe", displayOrder: 1, description: "Master modern full-stack web engineering, frameworks, and APIs." },
    { name: "Next.js & React", slug: "nextjs-react", icon: "Atom", displayOrder: 2, description: "Build scalable web applications with Next.js App Router and React Server Components." },
    { name: "JavaScript & TypeScript", slug: "javascript-typescript", icon: "FileCode", displayOrder: 3, description: "From core mechanics to type-level programming and enterprise design patterns." },
    { name: "Backend & Node.js", slug: "backend-nodejs", icon: "Server", displayOrder: 4, description: "APIs, microservices, database design, caching, and server-side architectures." },
    { name: "Python & AI", slug: "python-ai", icon: "Brain", displayOrder: 5, description: "Applied machine learning, generative AI, LLMs, and Python automation." },
    { name: "DevOps & Cloud", slug: "devops-cloud", icon: "Cloud", displayOrder: 6, description: "Docker, Kubernetes, CI/CD pipelines, and cloud native infrastructure." },
    { name: "Databases & System Design", slug: "databases-system-design", icon: "Database", displayOrder: 7, description: "SQL, MongoDB, Redis, architectural trade-offs, and scalable design." },
  ];

  await Category.insertMany(categoriesData);

  // 3. Create Courses with mixed format (Videos, Articles, Quizzes, Coding Exercises)
  const course1 = await Course.create({
    title: "Next.js 15 & React 19 Mastery: Full-Stack Production Architecture",
    slug: "nextjs-15-react-19-mastery",
    subtitle: "Master Server Components, Server Actions, Caching, Auth, Streaming, and Turbopack by building real-world enterprise apps.",
    description: `Welcome to the definitive guide to Next.js 15 and React 19. This course bridges the gap between basic tutorials and production-ready applications. 

You will learn:
- Deep architectural understanding of React Server Components (RSC) vs Client Components.
- Advanced Server Actions with optimistic updates and form validations.
- Fine-grained data caching, tag revalidation, and streaming with Suspense.
- Production authentication, role-based access control, and secure session management.
- Deploying to production with high availability and automated CI/CD.`,
    category: "Next.js & React",
    level: "Intermediate",
    language: "English",
    price: 3499,
    discountPrice: 2499,
    isFree: false,
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=450&fit=crop",
    previewVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    instructor: instructorAlex._id,
    requirements: [
      "Comfortable with JavaScript ES6+ features (promises, async/await, closures)",
      "Basic understanding of React hooks and JSX syntax",
      "Node.js installed on your computer",
    ],
    whatYouWillLearn: [
      "Architect end-to-end full stack web applications with Next.js 15 App Router",
      "Master React 19 Server Components, Actions, and useActionState",
      "Implement bulletproof auth with JWT, cookies, and middleware",
      "Optimize web performance, Core Web Vitals, and SEO structured data",
      "Deploy scalable applications to Vercel and standalone Node servers",
    ],
    targetAudience: [
      "Frontend developers looking to become full-stack software engineers",
      "React developers upgrading from Pages Router to App Router",
      "Engineering leads setting up production standards for modern web applications",
    ],
    status: "published",
    isFeatured: true,
    ratingAverage: 4.9,
    ratingCount: 148,
    enrolledCount: 620,
    totalDurationMinutes: 380,
    totalLessonsCount: 4,
    certificateEnabled: true,
    passingScore: 70,
    modules: [
      {
        title: "Module 1: Mental Model of App Router & React Server Components",
        description: "Understanding the paradigm shift from client-side SPAs to server-first architecture.",
        order: 1,
        lessons: [
          {
            title: "Welcome & Course Overview",
            slug: "welcome-and-course-overview",
            type: "video",
            order: 1,
            durationMinutes: 8,
            isPreview: true,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            videoDuration: 480,
            content: "Welcome to CodeMentors! In this introductory lesson, we will preview the real-world application we will build and discuss our design and architecture decisions.",
            resources: [
              { title: "Course Syllabus PDF", url: "https://example.com/syllabus.pdf", fileType: "pdf", size: "1.2 MB" },
              { title: "GitHub Starter Template", url: "https://github.com/codementors/nextjs-starter", fileType: "zip", size: "3.4 MB" },
            ],
          },
          {
            title: "RSC vs Client Components: Under The Hood Deep Dive",
            slug: "rsc-vs-client-components-deep-dive",
            type: "article",
            order: 2,
            durationMinutes: 15,
            isPreview: true,
            content: `## The Paradigm Shift in React 19 & Next.js

React Server Components represent the most significant evolution in React's component model since Hooks. Instead of rendering everything in the browser and sending megabytes of JavaScript, Server Components execute strictly on the server and stream a lightweight JSON-like representation of the UI directly to the client.

### Key Architectural Differences

| Feature | Server Components (RSC) | Client Components ('use client') |
| :--- | :--- | :--- |
| **Execution Environment** | Server only | Server (prerender) & Browser (hydration) |
| **Direct DB Access** | Yes (Mongoose, Prisma, pg) | No (must use API or Server Action) |
| **Bundle Size Impact** | Zero KB on client bundle | Added to client bundle |
| **Hooks (useState, useEffect)** | Not permitted | Supported |
| **DOM Event Handlers** | Not permitted (onClick, etc.) | Supported |

### Code Example: Fetching Directly in an Async Server Component

${FENCE}typescript
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";

export default async function CoursesListPage() {
  await connectDB();
  const featuredCourses = await Course.find({ isFeatured: true }).lean();

  return (
    <section className="py-12 px-6">
      <h1 className="text-3xl font-bold tracking-tight text-white mb-6">
        Featured Architectures
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featuredCourses.map((course) => (
          <article key={course._id.toString()} className="border border-slate-800 rounded-xl p-5 bg-slate-900/60">
            <h3 className="font-semibold text-lg text-blue-400">{course.title}</h3>
            <p className="text-sm text-slate-400 mt-2">{course.subtitle}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
${FENCE}

> **Architectural Tip:** Default to Server Components for 90% of your component tree. Introduce 'use client' only at leaf nodes requiring interactivity such as modals, buttons with click handlers, and form inputs.
`,
          },
        ],
      },
      {
        title: "Module 2: Server Actions, Validations & State",
        description: "Executing server mutations safely with Zod, optimistic UI updates, and session verification.",
        order: 2,
        lessons: [
          {
            title: "Securing Server Actions with Zod & Session Guards",
            slug: "securing-server-actions-with-zod",
            type: "article",
            order: 1,
            durationMinutes: 12,
            isPreview: false,
            content: `## Validating Mutations on the Server

Server Actions look like regular async JavaScript functions, but remember: **they are public HTTP POST endpoints under the hood**. You must treat every incoming parameter with zero trust.

### Safe Action Pattern with Zod

${FENCE}typescript
"use server";

import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { Course } from "@/models/Course";
import { revalidatePath } from "next/cache";

const CourseUpdateSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  price: z.number().nonnegative("Price cannot be negative"),
});

export async function updateCourseAction(formData: FormData) {
  const session = await getSessionUser();
  if (!session || (session.role !== "instructor" && session.role !== "admin")) {
    return { success: false, error: "Unauthorized access" };
  }

  const rawData = {
    courseId: formData.get("courseId"),
    title: formData.get("title"),
    price: Number(formData.get("price")),
  };

  const validation = CourseUpdateSchema.safeParse(rawData);
  if (!validation.success) {
    return { 
      success: false, 
      error: validation.error.flatten().fieldErrors 
    };
  }

  await Course.findByIdAndUpdate(validation.data.courseId, {
    title: validation.data.title,
    price: validation.data.price,
  });

  revalidatePath("/instructor/courses");
  return { success: true };
}
${FENCE}
`,
          },
          {
            title: "Knowledge Check: Server Components & Actions Quiz",
            slug: "quiz-server-components-actions",
            type: "quiz",
            order: 2,
            durationMinutes: 15,
            isPreview: false,
          },
          {
            title: "Coding Practice: Build a Secure Cache-Wrapped Fetcher",
            slug: "coding-practice-cache-fetcher",
            type: "coding",
            order: 3,
            durationMinutes: 20,
            isPreview: false,
            codingExercise: {
              language: "javascript",
              instructions: `Write a utility function createCacheKey(endpoint, params) that formats a consistent URL cache string.
The function should accept:
1. endpoint (string): e.g. "/api/courses"
2. params (object): e.g. { category: "web", sort: "popular" }

It must return the endpoint with query parameters sorted alphabetically by key so identical queries with different key order always produce identical cache keys. E.g.:
/api/courses?category=web&sort=popular
If params is empty or undefined, return just the endpoint.`,
              starterCode: `function createCacheKey(endpoint, params = {}) {
  const keys = Object.keys(params).sort();
  if (keys.length === 0) return endpoint;
  const queryString = keys.map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
  return endpoint + '?' + queryString;
}`,
              solutionCode: `function createCacheKey(endpoint, params = {}) {
  const keys = Object.keys(params).sort();
  if (keys.length === 0) return endpoint;
  const queryString = keys.map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
  return endpoint + '?' + queryString;
}`,
              hints: [
                "Use Object.keys(params).sort() to sort keys alphabetically.",
                "Use encodeURIComponent for query values.",
                "Check for empty parameters before appending '?'",
              ],
              testCases: [
                {
                  input: `createCacheKey('/api/courses', { sort: 'asc', page: '1' })`,
                  expectedOutput: `/api/courses?page=1&sort=asc`,
                  description: "Sorts query keys alphabetically",
                },
                {
                  input: `createCacheKey('/api/users')`,
                  expectedOutput: `/api/users`,
                  description: "Handles empty params",
                },
              ],
            },
          },
        ],
      },
    ],
  });

  // Attach Quiz for Lesson
  const quiz1 = await Quiz.create({
    courseId: course1._id,
    lessonId: course1.modules[1].lessons[1]._id.toString(),
    title: "Server Components & Server Actions Architecture Quiz",
    description: "Verify your understanding of React 19 and Next.js 15 server boundary rules.",
    timeLimitMinutes: 10,
    passingPercentage: 70,
    maxAttempts: 3,
    shuffleQuestions: false,
    showExplanationImmediately: true,
    questions: [
      {
        questionText: "Which of the following operations CANNOT be performed directly inside a React Server Component (RSC)?",
        type: "single_choice",
        options: [
          { text: "Querying MongoDB via Mongoose directly", isCorrect: false },
          { text: "Reading environment variables using process.env", isCorrect: false },
          { text: "Attaching an onClick event listener to a button", isCorrect: true },
          { text: "Awaiting asynchronous data fetching promises", isCorrect: false },
        ],
        explanation: "Event listeners such as onClick require browser JavaScript runtime and are only allowed in Client Components marked with 'use client'.",
        points: 1,
      },
      {
        questionText: "What does Next.js send over the network to the browser for a pure Server Component?",
        type: "single_choice",
        options: [
          { text: "The entire raw JavaScript source code of the component", isCorrect: false },
          { text: "A compact RSC payload stream describing the virtual DOM tree", isCorrect: true },
          { text: "Only a static PNG screenshot of the rendered UI", isCorrect: false },
          { text: "The Webpack compilation bundle with Babel transforms", isCorrect: false },
        ],
        explanation: "Next.js streams a specialized serialized format called the React Server Component payload (RSC payload), omitting the component's JavaScript code from the client bundle.",
        points: 1,
      },
      {
        questionText: "Are Server Actions automatically private and hidden from the public internet without authentication checks?",
        type: "true_false",
        options: [
          { text: "True", isCorrect: false },
          { text: "False", isCorrect: true },
        ],
        explanation: "False! Server Actions compile to publicly addressable POST endpoints. You must ALWAYS verify user session and permissions inside each Server Action.",
        points: 1,
      },
    ],
  });

  course1.modules[1].lessons[1].quizId = quiz1._id;
  await course1.save();

  // Course 2: TypeScript & Clean Architecture
  const course2 = await Course.create({
    title: "TypeScript Enterprise Patterns & Clean Architecture",
    slug: "typescript-enterprise-clean-architecture",
    subtitle: "From advanced type gymnastics to Domain-Driven Design, Hexagonal Architecture, and type-safe systems.",
    description: `Designed for mid-level and senior engineers wanting to master TypeScript at scale. Dive deep into conditional types, template literals, variance, branded types, and Clean Architecture patterns for large codebases.`,
    category: "JavaScript & TypeScript",
    level: "Advanced",
    language: "English",
    price: 2999,
    discountPrice: 1999,
    isFree: false,
    thumbnail: "https://images.unsplash.com/photo-1516116211227-bbc03a2fc033?w=800&h=450&fit=crop",
    previewVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    instructor: instructorSarah._id,
    requirements: [
      "2+ years experience writing TypeScript or JavaScript",
      "Familiarity with Object-Oriented and Functional programming paradigms",
    ],
    whatYouWillLearn: [
      "Master conditional types, infer keyword, mapped types, and branded nominal types",
      "Implement Hexagonal Architecture and Repository Patterns in Node.js",
      "Enforce compile-time business invariants to eliminate runtime bugs",
    ],
    targetAudience: ["Senior engineers", "Tech leads", "Full stack developers"],
    status: "published",
    isFeatured: true,
    ratingAverage: 5.0,
    ratingCount: 89,
    enrolledCount: 410,
    totalDurationMinutes: 320,
    totalLessonsCount: 2,
    certificateEnabled: true,
    passingScore: 75,
    modules: [
      {
        title: "Module 1: Type-Level Programming Essentials",
        description: "Unlocking TypeScript's full compile-time computing capabilities.",
        order: 1,
        lessons: [
          {
            title: "Branded Types & Nominal Invariants",
            slug: "branded-types-and-nominal-invariants",
            type: "article",
            order: 1,
            durationMinutes: 14,
            isPreview: true,
            content: `## Why Structural Typing Can Be Dangerous

TypeScript's structural type system means two types with identical shapes are mutually assignable.

### Solution: Branded (Nominal) Types

By intersecting with an uninstantiable brand symbol, we force TypeScript to treat identical primitive values as distinct types:

${FENCE}typescript
declare const __brand: unique symbol;
type Brand<T, B> = T & { readonly [__brand]: B };

export type UserId = Brand<string, "UserId">;
export type OrderId = Brand<string, "OrderId">;

export function makeUserId(id: string): UserId {
  if (!id.startsWith("usr_")) throw new Error("Invalid UserId format");
  return id as UserId;
}

export function makeOrderId(id: string): OrderId {
  if (!id.startsWith("ord_")) throw new Error("Invalid OrderId format");
  return id as OrderId;
}
${FENCE}
`,
          },
          {
            title: "Video: Building an Enterprise Repository Layer",
            slug: "video-enterprise-repository-layer",
            type: "video",
            order: 2,
            durationMinutes: 18,
            isPreview: false,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            videoDuration: 1080,
            content: "In this session, Dr. Sarah Chen demonstrates writing abstract repository interfaces and decouples domain models from Mongoose database adapters.",
          },
        ],
      },
    ],
  });

  // Course 3: Python & AI Engineering
  const course3 = await Course.create({
    title: "Python & AI Engineering: Production LLM Applications",
    slug: "python-ai-production-llm-apps",
    subtitle: "RAG architectures, vector embeddings, fine-tuning, function calling, and automated agent workflows.",
    description: `Build robust, production-ready AI applications using Python, LangChain, LlamaIndex, Vector databases (Pinecone / ChromaDB), and modern inference APIs.`,
    category: "Python & AI",
    level: "Intermediate",
    language: "English",
    price: 3999,
    discountPrice: 2799,
    isFree: false,
    thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=450&fit=crop",
    previewVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    instructor: instructorSarah._id,
    requirements: ["Intermediate Python proficiency", "Basic knowledge of APIs and HTTP"],
    whatYouWillLearn: [
      "Implement Retrieval-Augmented Generation (RAG) with hybrid vector search",
      "Design multi-turn autonomous agents with function calling and tool execution",
      "Deploy scalable FastAPI inference endpoints with rate-limiting and streaming",
    ],
    targetAudience: ["Python developers", "Data scientists", "Software architects entering AI"],
    status: "published",
    isFeatured: true,
    ratingAverage: 4.8,
    ratingCount: 64,
    enrolledCount: 320,
    totalDurationMinutes: 410,
    totalLessonsCount: 1,
    certificateEnabled: true,
    passingScore: 70,
    modules: [
      {
        title: "Module 1: Vector Search & Chunking Strategies",
        description: "Optimal document parsing and semantic retrieval pipelines.",
        order: 1,
        lessons: [
          {
            title: "Evaluating Semantic Chunking vs Fixed Windowing",
            slug: "semantic-chunking-vs-fixed-windowing",
            type: "article",
            order: 1,
            durationMinutes: 11,
            isPreview: true,
            content: `## The Chunking Bottleneck in RAG

When building Retrieval-Augmented Generation systems, chunking strategy directly determines context quality.

${FENCE}python
from typing import List

def fixed_size_chunker(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
        i += (chunk_size - overlap)
    return chunks
${FENCE}
`,
          },
        ],
      },
    ],
  });

  // Course 4: Modern JavaScript & Async Fundamentals (FREE COURSE)
  const course4 = await Course.create({
    title: "Modern JavaScript Foundations: Async, Event Loop & Beyond",
    slug: "modern-javascript-foundations",
    subtitle: "A completely free, foundational course on the JavaScript engine, Event Loop, closures, and async patterns.",
    description: `Understand the core JavaScript engine, microtask queues, macrotasks, prototypical inheritance, and memory management. Completely free for all learners!`,
    category: "Web Development",
    level: "Beginner",
    language: "English",
    price: 0,
    isFree: true,
    thumbnail: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&h=450&fit=crop",
    previewVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    instructor: instructorAlex._id,
    requirements: ["A web browser and curiosity to learn!"],
    whatYouWillLearn: [
      "Master the JavaScript Event Loop, Call Stack, and Task Queues",
      "Write clean asynchronous code with Promises and async/await",
      "Debug memory leaks and closures effectively",
    ],
    targetAudience: ["Beginners", "Frontend career starters"],
    status: "published",
    isFeatured: true,
    ratingAverage: 4.9,
    ratingCount: 310,
    enrolledCount: 1420,
    totalDurationMinutes: 180,
    totalLessonsCount: 1,
    certificateEnabled: true,
    passingScore: 60,
    modules: [
      {
        title: "Module 1: The JavaScript Execution Context",
        description: "How V8 parses, compiles, and executes your code.",
        order: 1,
        lessons: [
          {
            title: "Call Stack, Microtasks & The Event Loop",
            slug: "event-loop-deep-dive",
            type: "article",
            order: 1,
            durationMinutes: 10,
            isPreview: true,
            content: `## How JavaScript Executes Asynchronous Code

Even though JavaScript is single-threaded, it handles asynchronous I/O with high concurrency via the Event Loop.

### Microtask Queue vs Macrotask Queue

${FENCE}javascript
console.log("1: Synchronous");

setTimeout(() => {
  console.log("2: Macrotask (setTimeout)");
}, 0);

Promise.resolve().then(() => {
  console.log("3: Microtask (Promise)");
});

console.log("4: Synchronous End");
${FENCE}
`,
          },
        ],
      },
    ],
  });

  // 4. Learning Paths
  await LearningPath.create([
    {
      title: "Full-Stack Web Architect Path",
      slug: "full-stack-web-architect",
      description: "A comprehensive journey from JavaScript foundations to enterprise Next.js and React architecture.",
      icon: "Layers",
      level: "All Levels",
      estimatedHours: 60,
      courses: [course4._id, course1._id, course2._id],
      learningObjectives: [
        "Master JavaScript runtime mechanics and modern ESNext features",
        "Build full-stack web applications with Next.js 15 App Router",
        "Enforce clean enterprise architectural boundaries with TypeScript",
      ],
      isPublished: true,
    },
    {
      title: "AI & Full-Stack Systems Engineer",
      slug: "ai-systems-engineer",
      description: "Combine modern full-stack web engineering with production Python LLM application development.",
      icon: "Cpu",
      level: "Intermediate",
      estimatedHours: 50,
      courses: [course1._id, course3._id],
      learningObjectives: [
        "Deploy Next.js user interfaces with real-time streaming LLM responses",
        "Implement production vector search, hybrid RAG, and autonomous agent loops",
      ],
      isPublished: true,
    },
  ]);

  // 5. Active Discount Coupons
  await Coupon.create([
    {
      code: "WELCOME20",
      discountType: "percentage",
      discountValue: 20,
      maxUses: 1000,
      currentUses: 42,
      validFrom: new Date(Date.now() - 86400000),
      validUntil: new Date(Date.now() + 30 * 86400000),
      isActive: true,
    },
    {
      code: "CODEMENTOR500",
      discountType: "fixed",
      discountValue: 500,
      maxUses: 500,
      currentUses: 18,
      validFrom: new Date(Date.now() - 86400000),
      validUntil: new Date(Date.now() + 60 * 86400000),
      isActive: true,
    },
  ]);

  // 6. Genuine Reviews
  await Review.create([
    {
      courseId: course1._id,
      userId: studentUser._id,
      rating: 5,
      reviewText: "The explanation of React Server Components vs Client Components finally made everything click for me. The hands-on project and Server Actions lessons are top notch!",
      status: "approved",
      instructorReply: {
        text: "Thank you Jane! Glad the mental model of RSC helped simplify your architecture.",
        repliedAt: new Date(),
      },
    },
    {
      courseId: course2._id,
      userId: studentUser._id,
      rating: 5,
      reviewText: "Branded types and the clean repository pattern changed how our entire engineering team structures our Node.js services. Essential course for serious devs.",
      status: "approved",
    },
  ]);

  // 7. Enroll Student in Course 1 and Course 4
  const enrollment1 = await Enrollment.create({
    userId: studentUser._id,
    courseId: course1._id,
    enrolledAt: new Date(Date.now() - 3 * 86400000),
    status: "active",
    progressPercentage: 50,
    completedLessons: [
      course1.modules[0].lessons[0]._id.toString(),
      course1.modules[0].lessons[1]._id.toString(),
    ],
    lastAccessedLessonId: course1.modules[0].lessons[1]._id.toString(),
  });

  const enrollmentFree = await Enrollment.create({
    userId: studentUser._id,
    courseId: course4._id,
    enrolledAt: new Date(Date.now() - 7 * 86400000),
    status: "completed",
    progressPercentage: 100,
    completedLessons: [course4.modules[0].lessons[0]._id.toString()],
    completedAt: new Date(),
  });

  // Certificate for completed free course
  const certificateCode = `CM-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const certificate = await Certificate.create({
    certificateCode,
    userId: studentUser._id,
    courseId: course4._id,
    gradePercentage: 95,
    verificationUrl: `/certificates/${certificateCode}`,
    metadata: {
      studentName: studentUser.name,
      courseTitle: course4.title,
      instructorName: instructorAlex.name,
      instructorHeadline: instructorAlex.headline,
      completionDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      durationHours: 3,
    },
  });

  enrollmentFree.certificateId = certificate._id;
  await enrollmentFree.save();

  console.log("Database seeded successfully!");

  return {
    success: true,
    message: "CodeMentors database seeded successfully!",
    users: {
      admin: "admin@codemetors.com / Password@12345",
      instructor: "alex@codemetors.com / Password@12345",
      student: "student@codemetors.com / Password@12345",
    },
  };
}
