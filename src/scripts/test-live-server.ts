import assert from "node:assert/strict";
import { connectDB } from "../lib/db";
import { Certificate, Course } from "../models";

const BASE_URL = process.env.BASE_URL || "http://localhost:3005";

async function runLiveTests() {
  console.log(`\n=================================================`);
  console.log(`  CodeMentors Live HTTP Server Verification Tests`);
  console.log(`  Target: ${BASE_URL}`);
  console.log(`=================================================\n`);

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

  // 1. Home Page Branding & Hero
  await test("GET / returns 200 and renders CodeMentors branding", async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const html = await res.text();
    assert.ok(html.includes("CodeMentors"), "Home page should include 'CodeMentors'");
    assert.ok(
      html.includes("Learn to Code. Build Real Skills. Grow Your Career.") ||
      html.includes("Explore Courses"),
      "Home page should contain hero headline or CTA"
    );
  });

  // 2. Public Static & Content Pages
  const pages = [
    { path: "/courses", name: "Courses listing" },
    { path: "/courses/mastering-nextjs-15-enterprise-apps", name: "Course details page" },
    { path: "/learning-paths", name: "Learning paths" },
    { path: "/certificates/verify", name: "Certificate verification" },
    { path: "/login", name: "Login page" },
    { path: "/register", name: "Register page" },
    { path: "/about", name: "About page" },
    { path: "/contact", name: "Contact page" },
    { path: "/faq", name: "FAQ page" },
    { path: "/help", name: "Help Center" },
    { path: "/terms", name: "Terms of Service" },
    { path: "/privacy", name: "Privacy Policy" },
    { path: "/refund-policy", name: "Refund Policy" },
  ];

  for (const page of pages) {
    await test(`GET ${page.path} returns 200 (${page.name})`, async () => {
      const res = await fetch(`${BASE_URL}${page.path}`);
      assert.equal(res.status, 200, `Expected 200 for ${page.path}, got ${res.status}`);
    });
  }

  // 3. API Courses
  let testCourseId = "";
  await test("GET /api/courses returns JSON list of courses", async () => {
    const res = await fetch(`${BASE_URL}/api/courses`);
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.courses && Array.isArray(data.courses), "Expected courses array");
    assert.ok(data.courses.length > 0, "Expected at least 1 course");
    const paidCourse = data.courses.find((c: any) => !c.isFree && (c.discountPrice || c.price) > 0) || data.courses[0];
    assert.ok(paidCourse.title, "Course must have a title");
    assert.ok(paidCourse.slug, "Course must have a slug");
    testCourseId = paidCourse._id;
  });

  // 4. API Categories
  await test("GET /api/categories returns JSON list of categories", async () => {
    const res = await fetch(`${BASE_URL}/api/categories`);
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.categories && Array.isArray(data.categories), "Expected categories array");
    assert.ok(data.categories.length > 0, "Expected categories seeded");
  });

  // 5. Auth API - Invalid credentials rejection
  await test("POST /api/auth/login rejects wrong credentials (401)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "student@codemetors.com", password: "WrongPassword999!" }),
    });
    assert.equal(res.status, 401, `Expected 401 Unauthorized, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.error, "Expected error message");
  });

  // 6. Auth API - Student valid login & cookie issuance
  let studentCookie = "";
  await test("POST /api/auth/login authenticates student and sets HTTP-only cm_token", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "student@codemetors.com", password: "Password@12345" }),
    });
    assert.equal(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.user, "Expected user object");
    assert.equal(data.user.email, "student@codemetors.com");
    assert.equal(data.user.role, "student");

    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie, "Expected Set-Cookie header");
    assert.ok(setCookie.includes("cm_token="), "Expected cm_token cookie");
    studentCookie = setCookie.split(";")[0];
  });

  // 7. Auth Session Verification via /api/auth/me
  await test("GET /api/auth/me returns student session with cookie", async () => {
    assert.ok(studentCookie, "Student cookie must exist from previous step");
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: studentCookie },
    });
    assert.equal(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.user, "Expected user in me endpoint");
    assert.equal(data.user.email, "student@codemetors.com");
  });

  // 8. Student Dashboard API with authenticated session
  await test("GET /api/dashboard/student returns enrolled courses and progress", async () => {
    const res = await fetch(`${BASE_URL}/api/dashboard/student`, {
      headers: { Cookie: studentCookie },
    });
    assert.equal(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.enrollments, "Expected enrollments list");
    assert.ok(Array.isArray(data.enrollments), "Enrollments should be an array");
    assert.ok(data.stats, "Expected student stats");
  });

  // 9. Public Certificate Lookup API
  await test("GET /api/certificates/:code verifies issued certificate", async () => {
    await connectDB();
    const cert = await Certificate.findOne().lean();
    assert.ok(cert, "A seeded certificate should exist in the database");
    
    const res = await fetch(`${BASE_URL}/api/certificates/${cert.certificateCode}`);
    assert.equal(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.certificate, "Expected certificate object");
    assert.equal(data.certificate.certificateCode, cert.certificateCode);
  });

  // 10. Admin Auth & Admin Stats API
  let adminCookie = "";
  await test("POST /api/auth/login authenticates admin", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@codemetors.com", password: "Password@12345" }),
    });
    assert.equal(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.user.role, "admin");
    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie && setCookie.includes("cm_token="));
    adminCookie = setCookie.split(";")[0];
  });

  await test("GET /api/admin/stats returns real database metrics", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.metrics, "Expected metrics in admin response");
    assert.ok(typeof data.metrics.totalUsers === "number", "totalUsers should be number");
    assert.ok(typeof data.metrics.totalCourses === "number", "totalCourses should be number");
    assert.ok(typeof data.metrics.totalEnrollments === "number", "totalEnrollments should be number");
  });

  // 11. Instructor Auth & Instructor Stats API
  let instructorCookie = "";
  await test("POST /api/auth/login authenticates instructor", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alex@codemetors.com", password: "Password@12345" }),
    });
    assert.equal(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.user.role, "instructor");
    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie && setCookie.includes("cm_token="));
    instructorCookie = setCookie.split(";")[0];
  });

  await test("GET /api/instructor/stats returns instructor metrics", async () => {
    const res = await fetch(`${BASE_URL}/api/instructor/stats`, {
      headers: { Cookie: instructorCookie },
    });
    assert.equal(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.stats, "Expected stats in instructor response");
    assert.ok(typeof data.stats.totalCourses === "number", "totalCourses should be number");
    assert.ok(typeof data.stats.totalStudents === "number", "totalStudents should be number");
  });

  // 12. Validate Coupon API
  await test("POST /api/coupons/validate verifies WELCOME20 coupon", async () => {
    const res = await fetch(`${BASE_URL}/api/coupons/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: studentCookie },
      body: JSON.stringify({ code: "WELCOME20", courseId: testCourseId }),
    });
    assert.equal(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.success, "Coupon response should succeed");
    assert.ok(data.coupon, "Coupon details should be returned");
    assert.equal(data.coupon.code, "WELCOME20");
    assert.equal(data.coupon.discountType, "percentage");
    assert.equal(data.coupon.discountValue, 20);
    assert.ok(data.coupon.discountAmount > 0, "Discount amount should be positive");
  });

  console.log(`\n=================================================`);
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log(`=================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runLiveTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
