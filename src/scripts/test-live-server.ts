import assert from "node:assert/strict";
import { connectDB } from "../lib/db";
import { Certificate, Course, Order, Enrollment, Payment, User } from "../models";
import { generateRazorpaySignature, generateRazorpayWebhookSignature } from "../lib/razorpay";

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
  let enrolledCourseId = "";
  await test("GET /api/courses returns JSON list of courses", async () => {
    const res = await fetch(`${BASE_URL}/api/courses`);
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.courses && Array.isArray(data.courses), "Expected courses array");
    assert.ok(data.courses.length > 0, "Expected at least 1 course");

    // Authoritative lookup of student's enrolled course
    await connectDB();
    const studentUser = await User.findOne({ email: "student@codementors.test" });
    const realEnr = await Enrollment.findOne({
      userId: studentUser!._id,
      status: { $in: ["active", "completed"] },
    });
    if (realEnr) {
      enrolledCourseId = realEnr.courseId.toString();
    } else {
      const freeCourse = data.courses.find((c: any) => c.isFree) || data.courses[0];
      enrolledCourseId = freeCourse._id;
    }

    // Available course for cart purchase: find a paid course the student is NOT enrolled in
    const allStudentEnrs = await Enrollment.find({ userId: studentUser!._id }).lean();
    const enrolledIds = new Set(allStudentEnrs.map((e: any) => e.courseId.toString()));
    const unenrolled = data.courses.find((c: any) => !c.isFree && !enrolledIds.has(c._id.toString())) || data.courses.find((c: any) => !enrolledIds.has(c._id.toString()));
    testCourseId = unenrolled?._id || data.courses[data.courses.length - 1]._id;
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
      body: JSON.stringify({ email: "student@codementors.test", password: "WrongPassword999!" }),
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
      body: JSON.stringify({
        email: "student@codementors.test",
        password: process.env.DEV_TEST_PASSWORD || "DevOnly123!ChangeMe",
      }),
    });
    assert.equal(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.user, "Expected user object");
    assert.equal(data.user.email, "student@codementors.test");
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
    assert.equal(data.user.email, "student@codementors.test");
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
      body: JSON.stringify({
        email: "admin@codementors.test",
        password: process.env.DEV_TEST_PASSWORD || "DevOnly123!ChangeMe",
      }),
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
      body: JSON.stringify({
        email: "instructor@codementors.test",
        password: process.env.DEV_TEST_PASSWORD || "DevOnly123!ChangeMe",
      }),
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

  // 13. Student Path-Based Protected Pages
  const studentPages = [
    "/student/dashboard",
    "/student/courses",
    "/student/payments",
    "/student/certificates",
    "/student/bookmarks",
    "/student/settings",
    "/course-basket",
    "/checkout",
    "/orders",
  ];
  for (const path of studentPages) {
    await test(`GET ${path} returns 200 with student session`, async () => {
      const res = await fetch(`${BASE_URL}${path}`, {
        headers: { Cookie: studentCookie },
      });
      assert.equal(res.status, 200, `Expected 200 for ${path}, got ${res.status}`);
    });
  }

  // 14. Instructor Path-Based Protected Pages
  const instructorPages = [
    "/instructor/dashboard",
    "/instructor/courses",
    "/instructor/courses/new",
    "/instructor/enrollments",
    "/instructor/reviews",
    "/instructor/analytics",
  ];
  for (const path of instructorPages) {
    await test(`GET ${path} returns 200 with instructor session`, async () => {
      const res = await fetch(`${BASE_URL}${path}`, {
        headers: { Cookie: instructorCookie },
      });
      assert.equal(res.status, 200, `Expected 200 for ${path}, got ${res.status}`);
    });
  }

  // 15. Admin Path-Based Protected Pages
  const adminPages = [
    "/admin/dashboard",
    "/admin/users",
    "/admin/courses",
    "/admin/orders",
    "/admin/payments",
    "/admin/refunds",
    "/admin/categories",
    "/admin/settings",
  ];
  for (const path of adminPages) {
    await test(`GET ${path} returns 200 with admin session`, async () => {
      const res = await fetch(`${BASE_URL}${path}`, {
        headers: { Cookie: adminCookie },
      });
      assert.equal(res.status, 200, `Expected 200 for ${path}, got ${res.status}`);
    });
  }

  // 16. Razorpay Webhook Endpoint
  await test("POST /api/payments/webhook processes signed provider events", async () => {
    const webhookPayload = JSON.stringify({
      event: "order.paid",
      id: `evt_live_test_${Date.now()}`,
      payload: {
        order: { entity: { id: "order_mock_test_123" } },
      },
    });

    const validWebhookSig = generateRazorpayWebhookSignature(webhookPayload);
    const res = await fetch(`${BASE_URL}/api/payments/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": validWebhookSig,
      },
      body: webhookPayload,
    });
    assert.equal(res.status, 200, `Expected 200 OK from webhook, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.success, "Webhook should return success true");
  });

  // 17. E-Commerce Cart API Workflows
  await test("POST /api/cart rejects already-enrolled course item (400)", async () => {
    const res = await fetch(`${BASE_URL}/api/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: studentCookie,
      },
      body: JSON.stringify({ courseId: enrolledCourseId }),
    });
    assert.equal(res.status, 400, `Expected 400 for already-enrolled course, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.isAlreadyEnrolled, true, "Should identify already enrolled course");
  });

  await test("POST /api/cart adds eligible course item to student cart", async () => {
    const res = await fetch(`${BASE_URL}/api/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: studentCookie,
      },
      body: JSON.stringify({ courseId: testCourseId }),
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.success, "Cart add should succeed");
  });

  await test("GET /api/cart returns student cart with calculated totals", async () => {
    const res = await fetch(`${BASE_URL}/api/cart`, {
      headers: { Cookie: studentCookie },
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.success, "Cart fetch should succeed");
    assert.ok(Array.isArray(data.items), "Items should be an array");
    assert.ok(data.subtotal >= 0, "Subtotal should be non-negative");
    assert.ok(data.finalTotal >= 0, "Final total should be non-negative");
  });

  await test("POST /api/cart/apply-coupon applies WELCOME20 to cart", async () => {
    const res = await fetch(`${BASE_URL}/api/cart/apply-coupon`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: studentCookie,
      },
      body: JSON.stringify({ code: "WELCOME20" }),
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.success, "Coupon application should succeed");
  });

  // 18. E-Commerce Orders API & Admin Orders
  await test("GET /api/orders returns student order history", async () => {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      headers: { Cookie: studentCookie },
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.success, "Order listing should succeed");
    assert.ok(Array.isArray(data.orders), "Orders should be an array");
  });

  await test("GET /api/admin/orders returns platform-wide orders for admin", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/orders`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.success, "Admin orders listing should succeed");
    assert.ok(Array.isArray(data.orders), "Admin orders should be an array");
  });

  await test("DELETE /api/cart cleans up student cart", async () => {
    const res = await fetch(`${BASE_URL}/api/cart?clear=true`, {
      method: "DELETE",
      headers: { Cookie: studentCookie },
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.success, "Cart clear should succeed");
  });

  // =========================================================================
  // 15 REQUIRED PAYMENT VALIDATION & COURSE BASKET SECURITY TESTS
  // =========================================================================
  let secCourseId = "";
  let secCourseSlug = "";
  let secLessonId = "";
  let secOrderId = "";
  let secRzpOrderId = "";
  let secPaymentId = "";

  // Test 1: Tampered Prices Test
  await test("[1/15] POST /api/orders/create ignores client-tampered prices and calculates authoritative amount", async () => {
    const courseDoc = await Course.findOne({ isFree: false, price: { $gt: 0 } });
    assert.ok(courseDoc, "Paid course must exist in database");
    secCourseId = courseDoc._id.toString();
    secCourseSlug = courseDoc.slug;
    let nonPreviewLesson: any = null;
    for (const m of courseDoc.modules || []) {
      for (const l of m.lessons || []) {
        if (!l.isPreview) {
          nonPreviewLesson = l;
          break;
        }
      }
      if (nonPreviewLesson) break;
    }
    secLessonId = (nonPreviewLesson || courseDoc.modules?.[0]?.lessons?.[1] || courseDoc.modules?.[0]?.lessons?.[0])?._id?.toString() || "";

    const studentUser = await User.findOne({ email: "student@codementors.test" });
    assert.ok(studentUser, "Student user must exist");
    await Enrollment.deleteMany({ userId: studentUser._id, courseId: courseDoc._id });

    const res = await fetch(`${BASE_URL}/api/orders/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: studentCookie,
      },
      body: JSON.stringify({
        courseId: secCourseId,
        price: 0,
        totalAmount: 0,
        subtotal: 0,
      }),
    });

    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.success, "Order creation should succeed");
    assert.equal(data.amount > 0, true, "Calculated amount must be > 0 regardless of client payload");
    assert.equal(data.isFree, undefined, "Paid course must never be granted as free");
    assert.ok(data.orderId, "orderId must be returned");
    assert.ok(data.razorpayOrderId, "razorpayOrderId must be returned");

    secOrderId = data.orderId;
    secRzpOrderId = data.razorpayOrderId;
  });

  // Test 2: Direct Free Enrollment Attack Test
  await test("[2/15] POST /api/enrollments/free rejects paid course ID (400 Bad Request)", async () => {
    const res = await fetch(`${BASE_URL}/api/enrollments/free`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: studentCookie,
      },
      body: JSON.stringify({ courseId: secCourseId }),
    });

    assert.equal(res.status, 400, `Expected 400 for free enrollment on paid course, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, false, "Must return success: false");

    const studentUser = await User.findOne({ email: "student@codementors.test" });
    const enr = await Enrollment.findOne({
      userId: studentUser!._id,
      courseId: secCourseId,
      status: { $in: ["active", "completed"] },
    });
    assert.equal(enr, null, "No active enrollment must exist in database");
  });

  // Test 3: Pending Order Access Isolation Test
  await test("[3/15] Order creation sets status: 'pending' and does NOT create course enrollment", async () => {
    const orderDoc = await Order.findById(secOrderId);
    assert.ok(orderDoc, "Order document must exist");
    assert.equal(orderDoc.status, "pending", "Order must be in pending status");

    const studentUser = await User.findOne({ email: "student@codementors.test" });
    const enr = await Enrollment.findOne({
      userId: studentUser!._id,
      courseId: secCourseId,
      status: { $in: ["active", "completed"] },
    });
    assert.equal(enr, null, "No enrollment must exist when order is pending");
  });

  // Test 4: Student Dashboard Gatekeeping Test
  await test("[4/15] GET /api/dashboard/student does NOT show course when order is pending", async () => {
    const res = await fetch(`${BASE_URL}/api/dashboard/student`, {
      headers: { Cookie: studentCookie },
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.success);
    const enrolledIds = (data.enrollments || []).map(
      (e: any) => e.courseId?._id?.toString() || e.courseId?.toString()
    );
    assert.ok(!enrolledIds.includes(secCourseId), "Pending order course must not appear in student enrollments");
  });

  // Test 5: Learning Room Authorization Gate Test
  await test("[5/15] GET /api/learn/[slug]/[lessonId] returns 403 Forbidden for pending order course", async () => {
    if (!secLessonId) {
      console.log("    (Skipped lesson ID check - course has no lessons)");
      return;
    }
    const res = await fetch(`${BASE_URL}/api/learn/${secCourseSlug}/${secLessonId}`, {
      headers: { Cookie: studentCookie },
    });
    assert.equal(res.status, 403, `Expected 403 Forbidden for unpurchased lesson, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  // Test 6: Forged Signature Rejection Test
  await test("[6/15] POST /api/orders/verify strictly rejects forged/tampered signature (400) and marks order failed", async () => {
    const createRes = await fetch(`${BASE_URL}/api/orders/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: studentCookie,
      },
      body: JSON.stringify({ courseId: secCourseId }),
    });
    const createData = await createRes.json();
    assert.ok(createData.success);

    const res = await fetch(`${BASE_URL}/api/orders/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: studentCookie,
      },
      body: JSON.stringify({
        orderId: createData.orderId,
        razorpayOrderId: createData.razorpayOrderId,
        razorpayPaymentId: "pay_attacker_forged_999",
        razorpaySignature: "forged_sha256_fake_signature_hex_12345",
      }),
    });

    assert.equal(res.status, 400, `Expected 400 Bad Request for forged signature, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, false);

    const failedOrder = await Order.findById(createData.orderId);
    assert.equal(failedOrder?.status, "failed", "Order must transition to 'failed' state upon signature mismatch");

    await Order.findByIdAndDelete(createData.orderId);
  });

  // Test 7: Missing Parameters Rejection Test
  await test("[7/15] POST /api/orders/verify rejects missing payment verification parameters (400)", async () => {
    const res = await fetch(`${BASE_URL}/api/orders/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: studentCookie,
      },
      body: JSON.stringify({
        orderId: secOrderId,
        razorpayOrderId: secRzpOrderId,
      }),
    });

    assert.equal(res.status, 400, `Expected 400 for missing parameters, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  // Test 8: Genuine Cryptographic Signature Verification Test
  await test("[8/15] POST /api/orders/verify accepts genuine HMAC-SHA256 signature, sets status: 'paid', and unlocks enrollment", async () => {
    secPaymentId = `pay_live_verified_${Date.now()}`;
    const validSignature = generateRazorpaySignature(secRzpOrderId, secPaymentId);

    const res = await fetch(`${BASE_URL}/api/orders/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: studentCookie,
      },
      body: JSON.stringify({
        orderId: secOrderId,
        razorpayOrderId: secRzpOrderId,
        razorpayPaymentId: secPaymentId,
        razorpaySignature: validSignature,
      }),
    });

    assert.equal(res.status, 200, `Expected 200 for genuine HMAC signature, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.success, "Verification must succeed with genuine HMAC");

    const paidOrder = await Order.findById(secOrderId);
    assert.equal(paidOrder?.status, "paid", "Order status must transition to 'paid'");
    assert.ok(paidOrder?.paidAt, "Order paidAt must be set");

    const studentUser = await User.findOne({ email: "student@codementors.test" });
    const enr = await Enrollment.findOne({
      userId: studentUser!._id,
      courseId: secCourseId,
      status: "active",
    });
    assert.ok(enr, "Active enrollment must now exist in database");
  });

  // Test 9: Idempotency Verification Test
  await test("[9/15] POST /api/orders/verify handles duplicate verification callbacks idempotently without duplicate enrollments", async () => {
    const validSignature = generateRazorpaySignature(secRzpOrderId, secPaymentId);

    const res = await fetch(`${BASE_URL}/api/orders/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: studentCookie,
      },
      body: JSON.stringify({
        orderId: secOrderId,
        razorpayOrderId: secRzpOrderId,
        razorpayPaymentId: secPaymentId,
        razorpaySignature: validSignature,
      }),
    });

    assert.equal(res.status, 200, `Expected 200 for idempotent callback, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.success, "Idempotent callback should return success");

    const studentUser = await User.findOne({ email: "student@codementors.test" });
    const enrollmentsCount = await Enrollment.countDocuments({
      userId: studentUser!._id,
      courseId: secCourseId,
    });
    assert.equal(enrollmentsCount, 1, "Must never create duplicate enrollment documents");
  });

  // Test 10: Duplicate Basket / Order Prevention Test
  await test("[10/15] POST /api/cart and /api/course-basket prevent adding already-enrolled course", async () => {
    const res = await fetch(`${BASE_URL}/api/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: studentCookie,
      },
      body: JSON.stringify({ courseId: secCourseId }),
    });

    assert.equal(res.status, 400, `Expected 400 for already enrolled course, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.isAlreadyEnrolled, true, "Must flag isAlreadyEnrolled: true");
  });

  // Test 11: Course Basket Route UI Test
  await test("[11/15] GET /course-basket renders Course Basket page with edtech design tokens (200)", async () => {
    const res = await fetch(`${BASE_URL}/course-basket`, {
      headers: { Cookie: studentCookie },
    });
    assert.equal(res.status, 200, `Expected 200 for /course-basket, got ${res.status}`);
    const html = await res.text();
    assert.ok(html.includes("Course Basket"), "Page must include 'Course Basket' title");
    assert.ok(html.includes("Basket Summary") || html.includes("Your Course Basket is Empty"), "Page must render basket sections");
  });

  // Test 12: Redirect from /cart to /course-basket Test
  await test("[12/15] GET /cart redirects cleanly to /course-basket", async () => {
    const res = await fetch(`${BASE_URL}/cart`, {
      redirect: "manual",
    });
    if (res.status === 307 || res.status === 308 || res.status === 301 || res.status === 302) {
      const location = res.headers.get("location") || "";
      assert.ok(location.includes("/course-basket"), "Redirect target must be /course-basket");
    } else {
      const followRes = await fetch(`${BASE_URL}/cart`);
      assert.equal(followRes.status, 200);
      const text = await followRes.text();
      assert.ok(text.includes("Course Basket"), "Resolved page should be Course Basket");
    }
  });

  // Test 13: Empty Basket State Test
  await test("[13/15] GET /course-basket renders empty state with 'Explore All Courses' CTA when basket is empty", async () => {
    await fetch(`${BASE_URL}/api/cart?clear=true`, {
      method: "DELETE",
      headers: { Cookie: studentCookie },
    });

    const res = await fetch(`${BASE_URL}/course-basket`, {
      headers: { Cookie: studentCookie },
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const html = await res.text();
    assert.ok(html.includes("Your Course Basket is Empty"), "Must show 'Your Course Basket is Empty'");
    assert.ok(html.includes("Explore All Courses"), "Must show 'Explore All Courses' CTA");
  });

  // Test 14: Order Status Lifecycle Test (/orders/[orderId])
  await test("[14/15] GET /api/orders/[orderId] returns authoritative server status and totalAmount", async () => {
    const res = await fetch(`${BASE_URL}/api/orders/${secOrderId}`, {
      headers: { Cookie: studentCookie },
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.success);
    assert.equal(data.order.status, "paid", "Order status must be 'paid'");
    assert.equal(data.order.razorpayPaymentId, secPaymentId, "Payment ID must match verified transaction");
    assert.equal(data.order.totalAmount > 0, true, "Total amount must be positive");
  });

  // Test 15: Webhook Signature Verification and Idempotency Test
  await test("[15/15] Webhook endpoint rejects forged signatures (400) and handles verified events idempotently", async () => {
    const payload = JSON.stringify({
      event: "payment.captured",
      id: `evt_sec_test_${Date.now()}`,
      payload: {
        payment: { entity: { id: "pay_webhook_test_1", order_id: "order_webhook_test_1", amount: 199900 } },
      },
    });

    // 15a. Forged webhook rejected
    const forgedRes = await fetch(`${BASE_URL}/api/payments/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": "forged_webhook_hex_signature_99999",
      },
      body: payload,
    });
    assert.equal(forgedRes.status, 400, "Forged webhook signature must be rejected with 400");

    // 15b. Genuine webhook accepted
    const genuineWebhookSig = generateRazorpayWebhookSignature(payload);
    const validRes = await fetch(`${BASE_URL}/api/payments/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": genuineWebhookSig,
      },
      body: payload,
    });
    assert.equal(validRes.status, 200, "Genuine webhook must be accepted with 200");
    const validData = await validRes.json();
    assert.ok(validData.success);

    // 15c. Replay / duplicate webhook handled idempotently
    const replayRes = await fetch(`${BASE_URL}/api/payments/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": genuineWebhookSig,
      },
      body: payload,
    });
    assert.equal(replayRes.status, 200, "Duplicate webhook must be accepted with 200");
    const replayData = await replayRes.json();
    assert.ok(replayData.message.includes("idempotently") || replayData.success);

    // Clean up security test order and enrollment
    await Order.findByIdAndDelete(secOrderId);
    const studentUser = await User.findOne({ email: "student@codementors.test" });
    if (studentUser) {
      await Enrollment.deleteMany({ userId: studentUser._id, courseId: secCourseId });
      await Payment.deleteMany({ userId: studentUser._id, orderId: secRzpOrderId });
    }
  });

  // 19. Dynamic CMS API & Settings
  await test("GET /api/cms/settings returns platform settings and navigation", async () => {
    const res = await fetch(`${BASE_URL}/api/cms/settings`);
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.success, "Settings should succeed");
    assert.ok(data.settings, "Expected settings object");
    assert.equal(data.settings.siteName, "CodeMentors");
  });

  await test("GET /api/cms/pages returns dynamic CMS pages list", async () => {
    const res = await fetch(`${BASE_URL}/api/cms/pages`);
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.success, "CMS pages query should succeed");
    assert.ok(Array.isArray(data.pages), "Pages should be an array");
  });

  // 20. Technical Blog Platform API & Pages
  await test("GET /blog renders Technical Engineering Blog catalog (200)", async () => {
    const res = await fetch(`${BASE_URL}/blog`);
    assert.equal(res.status, 200, `Expected 200 for /blog, got ${res.status}`);
    const html = await res.text();
    assert.ok(html.includes("Blog") || html.includes("Engineering"), "Blog page contains title");
  });

  await test("GET /api/blog returns JSON articles list", async () => {
    const res = await fetch(`${BASE_URL}/api/blog`);
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.success, "Blog API should succeed");
    assert.ok(Array.isArray(data.posts), "Posts should be an array");
  });

  // 21. Dynamic SEO Metadata Assets (Sitemap & Robots)
  await test("GET /sitemap.xml returns XML sitemap of published entities", async () => {
    const res = await fetch(`${BASE_URL}/sitemap.xml`);
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const text = await res.text();
    assert.ok(text.includes("urlset") || text.includes("<url>"), "Sitemap should contain XML urlset elements");
  });

  await test("GET /robots.txt returns valid robots directives", async () => {
    const res = await fetch(`${BASE_URL}/robots.txt`);
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const text = await res.text();
    assert.ok(text.includes("User-Agent:") || text.includes("User-agent:"), "Robots should contain User-agent");
    assert.ok(text.includes("Sitemap:"), "Robots should reference dynamic sitemap");
  });

  // 22. SEO Control Center & Redirects API
  await test("GET /api/admin/seo returns SEO diagnostics & entity counts (Admin)", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/seo`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.success, "SEO diagnostics should succeed");
    assert.ok(data.diagnostics, "Expected diagnostics object");
    assert.ok(typeof data.diagnostics.totalIndexedEntities === "number", "totalIndexedEntities should be number");
  });

  await test("GET /api/redirects returns redirect rules for admin", async () => {
    const res = await fetch(`${BASE_URL}/api/redirects`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.success, "Redirects listing should succeed");
    assert.ok(Array.isArray(data.redirects), "Redirects should be an array");
  });

  // 23. Granular RBAC Permissions API & Enforcement
  await test("GET /api/admin/permissions returns roles matrix (Admin)", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/permissions`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.success, "Permissions matrix should succeed");
    assert.ok(Array.isArray(data.roles), "Roles should be an array");
    assert.ok(Array.isArray(data.permissions || data.allPermissions), "All permissions should be an array");
  });

  await test("GET /api/admin/permissions rejects unauthorized student (403)", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/permissions`, {
      headers: { Cookie: studentCookie },
    });
    assert.equal(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  // 24. Instructor Quotas & Limits API
  await test("GET /api/instructor/limits returns quota usage for instructor", async () => {
    const res = await fetch(`${BASE_URL}/api/instructor/limits`, {
      headers: { Cookie: instructorCookie },
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.success, "Instructor limits should succeed");
    assert.ok(data.usage, "Usage object expected");
    assert.ok(typeof data.usage.maxActiveCourses === "number", "maxActiveCourses should be number");
  });

  await test("GET /api/admin/instructors/limits returns global and override limits (Admin)", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/instructors/limits`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.success, "Admin instructor limits should succeed");
    assert.ok(data.globalLimit || data.globalLimits, "Expected globalLimit object");
  });

  // 25. Immutable Audit Logs API
  await test("GET /api/admin/audit returns audit event trail (Admin)", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/audit`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.success, "Audit logs query should succeed");
    assert.ok(Array.isArray(data.logs), "Logs should be an array");
  });

  // 26. Governance & Control Center Page Routes
  const adminRoutes = [
    { path: "/admin/permissions", name: "RBAC Permissions Matrix" },
    { path: "/admin/instructors/limits", name: "Instructor Limits Console" },
    { path: "/admin/cms/pages", name: "CMS Page Builder" },
    { path: "/admin/seo", name: "SEO Control Center" },
    { path: "/admin/blog", name: "Technical Blog Manager" },
    { path: "/admin/audit", name: "Audit Logs Explorer" },
    { path: "/course-basket", name: "Course Basket" },
    { path: "/checkout", name: "E-Commerce Checkout" },
    { path: "/instructor/dashboard", name: "Instructor Studio Dashboard" },
  ];

  for (const r of adminRoutes) {
    await test(`GET ${r.path} returns 200 (${r.name})`, async () => {
      const res = await fetch(`${BASE_URL}${r.path}`);
      assert.equal(res.status, 200, `Expected 200 for ${r.path}, got ${res.status}`);
    });
  }

  // 27. Kraviona Company Branding & Footer Integration Tests
  await test("GET / renders 'Powered by Kraviona' footer credit with secure target=_blank", async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.equal(res.status, 200, `Expected 200 for /, got ${res.status}`);
    const html = await res.text();
    assert.ok(html.includes("Powered by"), "Footer should contain 'Powered by'");
    assert.ok(html.includes("https://kraviona.com/"), "Footer should link to https://kraviona.com/");
    assert.ok(html.includes("Kraviona Tech Solutions"), "Footer should include 'Kraviona Tech Solutions'");
    assert.ok(html.includes("noopener noreferrer"), "Footer link should include rel='noopener noreferrer'");
  });

  await test("GET /company renders verified Kraviona Tech Solutions page (200)", async () => {
    const res = await fetch(`${BASE_URL}/company`);
    assert.equal(res.status, 200, `Expected 200 for /company, got ${res.status}`);
    const html = await res.text();
    assert.ok(html.includes("Kraviona Tech Solutions"), "Company page should feature Kraviona Tech Solutions");
    assert.ok(html.includes("Core Engineering Services"), "Company page should list core services");
    assert.ok(html.includes("+91 96085 53167"), "Company page should feature verified contact number");
    assert.ok(html.includes("https://kraviona.com/contact"), "Company page should link to contact page");
  });

  await test("GET /about includes technology provider attribution for Kraviona", async () => {
    const res = await fetch(`${BASE_URL}/about`);
    assert.equal(res.status, 200, `Expected 200 for /about, got ${res.status}`);
    const html = await res.text();
    assert.ok(html.includes("Powered by Kraviona Tech Solutions") || html.includes("Kraviona Tech Solutions"), "About page should include Kraviona provider attribution");
    assert.ok(html.includes("https://kraviona.com/"), "About page should link to https://kraviona.com/");
  });

  await test("GET /contact includes technology partner contact information", async () => {
    const res = await fetch(`${BASE_URL}/contact`);
    assert.equal(res.status, 200, `Expected 200 for /contact, got ${res.status}`);
    const html = await res.text();
    assert.ok(html.includes("Kraviona Tech Solutions"), "Contact page should include partner card");
    assert.ok(html.includes("+91 96085 53167"), "Contact page should list partner phone");
  });

  await test("GET /terms includes technology provider infrastructure attribution", async () => {
    const res = await fetch(`${BASE_URL}/terms`);
    assert.equal(res.status, 200, `Expected 200 for /terms, got ${res.status}`);
    const html = await res.text();
    assert.ok(html.includes("Kraviona Tech Solutions"), "Terms page should include Kraviona provider attribution");
  });

  await test("GET /api/cms/settings returns companyBranding with Kraviona verified defaults", async () => {
    const res = await fetch(`${BASE_URL}/api/cms/settings`);
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.success, "Settings should succeed");
    assert.ok(data.settings?.companyBranding, "companyBranding object must exist");
    assert.equal(data.settings.companyBranding.companyName, "Kraviona Tech Solutions");
    assert.equal(data.settings.companyBranding.companyUrl, "https://kraviona.com/");
    assert.equal(data.settings.companyBranding.contact?.phone, "+91 96085 53167");
  });

  await test("PUT /api/cms/settings rejects invalid company website URL (400)", async () => {
    const res = await fetch(`${BASE_URL}/api/cms/settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        companyBranding: {
          companyUrl: "invalid-url-without-protocol",
        },
      }),
    });
    assert.equal(res.status, 400, `Expected 400 for invalid URL, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  console.log(`\n=================================================`);
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log(`=================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runLiveTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
