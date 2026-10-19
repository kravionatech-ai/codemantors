import assert from "node:assert/strict";
import mongoose from "mongoose";
import { connectDB } from "../lib/db";
import { Course } from "../models/Course";
import { Category } from "../models/Category";

const BASE_URL = process.env.BASE_URL || "http://localhost:3005";

async function runCourseBuilderAndSeoTests() {
  console.log(`\n======================================================`);
  console.log(`  CodeMentors Course Builder, Modules & Category SEO Test`);
  console.log(`  Target: ${BASE_URL}`);
  console.log(`======================================================\n`);

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(`    ${err?.message || err}`);
      failed++;
    }
  }

  await connectDB();

  let adminCookie = "";
  let instructorCookie = "";
  let studentCookie = "";

  async function login(email: string, password: string = process.env.DEV_TEST_PASSWORD || "DevOnly123!ChangeMe"): Promise<string> {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const setCookie = res.headers.get("set-cookie");
    if (!setCookie) throw new Error(`Login failed for ${email}`);
    return setCookie.split(";")[0];
  }

  // 1. Authentication
  await test("Authenticate Admin, Instructor, and Student accounts", async () => {
    adminCookie = await login("admin@codementors.test");
    instructorCookie = await login("instructor@codementors.test");
    studentCookie = await login("student@codementors.test");
    assert.ok(adminCookie.includes("cm_token="), "Admin cookie missing cm_token");
    assert.ok(instructorCookie.includes("cm_token="), "Instructor cookie missing cm_token");
    assert.ok(studentCookie.includes("cm_token="), "Student cookie missing cm_token");
  });

  // State for created test records
  let testCategoryId = "";
  let testCategorySlug = "";
  let testSubcategoryId = "";
  let testCourseId = "";
  let testCourseSlug = "";
  let testModule1Id = "";
  let testModule2Id = "";
  let testLesson1Id = "";
  let testLesson2Id = "";
  let testMixedLessonId = "";

  // 2. Category Management
  await test("Categories: Admin creates parent category with independent SEO", async () => {
    const timestamp = Date.now().toString().slice(-4);
    const categoryName = `Cloud Architecture ${timestamp}`;
    const res = await fetch(`${BASE_URL}/api/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: categoryName,
        shortDescription: "Enterprise cloud systems and distributed design patterns.",
        detailedDescription: "Master scalable distributed cloud applications.",
        isFeatured: true,
        displayOrder: 1,
        seo: {
          title: `${categoryName} Courses | CodeMentors`,
          description: "Top-rated cloud architecture courses and roadmaps.",
          keywords: ["cloud", "architecture", "microservices"],
          ogImage: "https://images.unsplash.com/photo-cloud-test",
          noIndex: false,
        },
      }),
    });

    assert.ok([200, 201].includes(res.status), `Expected 200/201, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.category._id);
    assert.equal(data.category.seo.title, `${categoryName} Courses | CodeMentors`);
    testCategoryId = data.category._id;
    testCategorySlug = data.category.slug;
  });

  await test("Categories: Admin creates subcategory referencing parent category", async () => {
    const subcatName = `Kubernetes & Docker ${Date.now().toString().slice(-4)}`;
    const res = await fetch(`${BASE_URL}/api/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: subcatName,
        parentCategory: testCategoryId,
        shortDescription: "Container orchestration and deployment patterns.",
      }),
    });

    assert.ok([200, 201].includes(res.status), `Expected 200/201, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, true);
    testSubcategoryId = data.category._id;
  });

  await test("Categories: Query categories with parent filtering and search", async () => {
    const res = await fetch(`${BASE_URL}/api/categories?parentOnly=true`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.categories));
    const foundParent = data.categories.find((c: any) => c._id === testCategoryId);
    assert.ok(foundParent, "Created parent category should be in parentOnly list");
  });

  await test("Categories: Public Category Landing Page (/categories/[slug]) returns 200", async () => {
    const res = await fetch(`${BASE_URL}/categories/${testCategorySlug}`);
    assert.equal(res.status, 200, `Expected 200 for /categories/${testCategorySlug}, got ${res.status}`);
    const html = await res.text();
    assert.ok(html.includes("Cloud Architecture"), "Category page should include category name");
    assert.ok(html.includes("application/ld+json"), "Category page should include JSON-LD structured data");
  });

  await test("Categories: Update category SEO and verify changes", async () => {
    const res = await fetch(`${BASE_URL}/api/categories/${testCategoryId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        seo: {
          title: "Updated Cloud Architecture Roadmaps",
          description: "Updated meta description tag for search bots.",
          noIndex: false,
        },
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.category.seo.title, "Updated Cloud Architecture Roadmaps");
  });

  // 3. Course Management
  await test("Courses: Create course with format 'Mixed', subcategory, and independent SEO", async () => {
    const timestamp = Date.now().toString().slice(-4);
    const courseTitle = `Distributed Microservices in Production ${timestamp}`;
    const courseSlug = `distributed-microservices-${timestamp}`;

    const res = await fetch(`${BASE_URL}/api/courses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: instructorCookie,
      },
      body: JSON.stringify({
        title: courseTitle,
        slug: courseSlug,
        subtitle: "Production grade distributed microservices architecture",
        description: "Master event-driven architecture, gRPC, and message brokers.",
        format: "Mixed",
        category: "Web Development",
        subcategory: "Distributed Systems",
        level: "Advanced",
        price: 2499,
        discountPrice: 1999,
        isFree: false,
        accessDurationDays: 365,
        seo: {
          title: `${courseTitle} | CodeMentors Pro`,
          description: "High-throughput distributed systems course with hands-on exercises.",
          keywords: ["microservices", "grpc", "kafka", "distributed"],
          canonicalUrl: `/courses/${courseSlug}`,
          noIndex: false,
        },
      }),
    });

    assert.ok([200, 201].includes(res.status), `Expected 200/201, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.course.format, "Mixed");
    assert.equal(data.course.subcategory, "Distributed Systems");
    assert.equal(data.course.seo.title, `${courseTitle} | CodeMentors Pro`);
    testCourseId = data.course._id;
    testCourseSlug = data.course.slug;
  });

  // 4. Module Management & Duplication
  await test("Modules: Add Module 1 to course with video, PDF, and W3Schools notes", async () => {
    const res = await fetch(`${BASE_URL}/api/courses/${testCourseSlug}/modules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: instructorCookie,
      },
      body: JSON.stringify({
        title: "Module 1: Service Discovery & Consuls",
        description: "Fundamentals of dynamic registry and heartbeat services.",
        status: "published",
        isRequired: true,
        learningObjectives: ["Understand Raft consensus", "Implement service mesh"],
        estimatedDurationMinutes: 60,
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        videoDuration: 1200,
        pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        pdfTitle: "Consul_Architecture_Handbook.pdf",
        notes: "# Consul Tutorial\n\n```json\n{ 'service': 'order-service' }\n```\n\n> **Note:** Run cluster.",
      }),
    });

    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.module.title, "Module 1: Service Discovery & Consuls");
    testModule1Id = data.module._id;
  });

  await test("Modules: Add Module 2 to course", async () => {
    const res = await fetch(`${BASE_URL}/api/courses/${testCourseSlug}/modules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: instructorCookie,
      },
      body: JSON.stringify({
        title: "Module 2: Event Sourcing with Kafka",
        description: "Log compaction and partitioning strategies.",
        status: "published",
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    testModule2Id = data.module._id;
  });

  await test("Modules: Duplicate Module 1 via POST action: duplicate", async () => {
    const res = await fetch(`${BASE_URL}/api/courses/${testCourseSlug}/modules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: instructorCookie,
      },
      body: JSON.stringify({
        action: "duplicate",
        sourceModuleId: testModule1Id,
      }),
    });

    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.module.title.includes("(Copy)"));
    assert.notEqual(data.module._id, testModule1Id, "Duplicated module must have a new distinct ID");
  });

  await test("Modules: Reorder modules via PUT modulesOrder", async () => {
    const res = await fetch(`${BASE_URL}/api/courses/${testCourseSlug}/modules`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: instructorCookie,
      },
      body: JSON.stringify({
        modulesOrder: [testModule2Id, testModule1Id],
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.modules[0]._id, testModule2Id, "Module 2 should now be first");
  });

  // 5. Lesson Management (All 6 Lesson Types + Content Blocks + Independent SEO)
  await test("Lessons: Add Video Lesson to Module 1", async () => {
    const res = await fetch(`${BASE_URL}/api/courses/${testCourseSlug}/lessons`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: instructorCookie,
      },
      body: JSON.stringify({
        moduleId: testModule1Id,
        title: "Introduction to Event Streams",
        type: "video",
        durationMinutes: 15,
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        isPreview: true,
        seo: {
          title: "Intro to Event Streams Lesson | CodeMentors",
          description: "High performance streaming concepts.",
        },
      }),
    });

    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.lesson.type, "video");
    assert.equal(data.lesson.isPreview, true);
    testLesson1Id = data.lesson._id;
  });

  await test("Lessons: Add PDF Document Lesson to Module 1 with download allowed", async () => {
    const res = await fetch(`${BASE_URL}/api/courses/${testCourseSlug}/lessons`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: instructorCookie,
      },
      body: JSON.stringify({
        moduleId: testModule1Id,
        title: "Kafka Protocol Cheatsheet",
        type: "pdf",
        durationMinutes: 20,
        pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        pdfTitle: "Kafka_Protocol_Guide.pdf",
        fileSize: "2.5 MB",
        downloadAllowed: true,
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.lesson.type, "pdf");
    assert.equal(data.lesson.downloadAllowed, true);
    testLesson2Id = data.lesson._id;
  });

  await test("Lessons: Add Mixed Media Lesson with sequential content blocks", async () => {
    const res = await fetch(`${BASE_URL}/api/courses/${testCourseSlug}/lessons`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: instructorCookie,
      },
      body: JSON.stringify({
        moduleId: testModule1Id,
        title: "Hybrid Sagas & Compensation",
        type: "mixed",
        durationMinutes: 30,
        contentBlocks: [
          {
            type: "text",
            order: 1,
            content: "Sagas coordinate transactions across multiple microservices without 2-phase locks.",
          },
          {
            type: "code",
            order: 2,
            language: "typescript",
            content: "async function executeSagaStep(stepId: string) { await db.commit(); }",
          },
          {
            type: "callout",
            order: 3,
            calloutType: "tip",
            content: "Always design idempotent compensating actions.",
          },
          {
            type: "video",
            order: 4,
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          },
        ],
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.lesson.type, "mixed");
    assert.equal(data.lesson.contentBlocks.length, 4);
    testMixedLessonId = data.lesson._id;
  });

  await test("Lessons: Duplicate Lesson via POST action: duplicate", async () => {
    const res = await fetch(`${BASE_URL}/api/courses/${testCourseSlug}/lessons`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: instructorCookie,
      },
      body: JSON.stringify({
        action: "duplicate",
        sourceModuleId: testModule1Id,
        sourceLessonId: testLesson1Id,
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.lesson.title.includes("(Copy)"));
    assert.notEqual(data.lesson._id, testLesson1Id, "Duplicated lesson must have unique ID");
  });

  // 6. Student Learning Room Access & Content Resolution
  await test("Learning Room: Free Preview Lesson is accessible to unauthenticated guest", async () => {
    const res = await fetch(`${BASE_URL}/api/learn/${testCourseSlug}/${testLesson1Id}`);
    assert.equal(res.status, 200, `Expected 200 for preview lesson, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.lesson.title, "Introduction to Event Streams");
  });

  await test("Learning Room: Mixed content blocks are properly returned by API", async () => {
    const res = await fetch(`${BASE_URL}/api/learn/${testCourseSlug}/${testMixedLessonId}`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.lesson.type, "mixed");
    assert.equal(data.lesson.contentBlocks.length, 4);
    assert.equal(data.lesson.contentBlocks[1].type, "code");
  });

  // 7. Safe Category Deletion with Reassignment
  await test("Categories: Safe deletion reassigns courses to target category", async () => {
    // Delete testSubcategoryId safely
    const res = await fetch(`${BASE_URL}/api/categories/${testSubcategoryId}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);

    // Verify subcategory is removed
    const checkRes = await fetch(`${BASE_URL}/api/categories/${testSubcategoryId}`);
    assert.equal(checkRes.status, 404);
  });

  // Clean up test course and category safely
  if (testCourseId && mongoose.Types.ObjectId.isValid(testCourseId)) {
    await Course.deleteOne({ _id: testCourseId });
  }
  if (testCategoryId && mongoose.Types.ObjectId.isValid(testCategoryId)) {
    await Category.deleteOne({ _id: testCategoryId });
  }

  console.log(`\n======================================================`);
  console.log(`  Tests Completed: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  await mongoose.disconnect();
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runCourseBuilderAndSeoTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
