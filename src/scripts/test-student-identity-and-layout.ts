import { connectDB } from "../lib/db";
import { User } from "../models";
import assert from "assert";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3005";
const DEV_PASSWORD = process.env.DEV_TEST_PASSWORD || "DevOnly123!ChangeMe";

async function runTests() {
  console.log("\n=================================================================");
  console.log("  CODEMENTORS LMS — STUDENT IDENTITY & HEADER REGRESSION SUITE  ");
  console.log(`  Target Server: ${BASE_URL}`);
  console.log("=================================================================\n");

  await connectDB();

  let passed = 0;
  let failed = 0;

  async function check(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(`    -> ${err.message}`);
      failed++;
    }
  }

  // --- 1. Database Accounts Isolation ---
  await check("Database contains strictly 3 dedicated accounts with distinct roles and IDs", async () => {
    const users = await User.find({}, "email role name").lean();
    assert.equal(users.length, 3, `Expected 3 users in DB, found ${users.length}`);

    const admin = users.find((u: any) => u.email === "admin@codementors.test");
    const instructor = users.find((u: any) => u.email === "instructor@codementors.test");
    const student = users.find((u: any) => u.email === "student@codementors.test");

    assert.ok(admin, "Admin account must exist");
    assert.ok(instructor, "Instructor account must exist");
    assert.ok(student, "Student account must exist");

    assert.equal(admin.role, "admin");
    assert.equal(instructor.role, "instructor");
    assert.equal(student.role, "student");

    assert.equal(admin.name, "Platform Administrator");
    assert.equal(instructor.name, "Senior Instructor");
    assert.equal(student.name, "Enrolled Student");

    const ids = new Set([admin._id.toString(), instructor._id.toString(), student._id.toString()]);
    assert.equal(ids.size, 3, "All 3 test accounts must have strictly distinct user IDs");
  });

  // --- 2. Authentication Identity Verification ---
  let studentCookie = "";
  let instructorCookie = "";
  let adminCookie = "";

  await check("Student sign-in resolves strictly Student profile (Enrolled Student)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "student@codementors.test", password: DEV_PASSWORD }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.user.name, "Enrolled Student");
    assert.equal(data.user.email, "student@codementors.test");
    assert.equal(data.user.role, "student");

    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie && setCookie.includes("cm_token="));
    studentCookie = setCookie.split(";")[0];
  });

  await check("Instructor sign-in resolves strictly Instructor profile (Senior Instructor)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "instructor@codementors.test", password: DEV_PASSWORD }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.user.name, "Senior Instructor");
    assert.equal(data.user.email, "instructor@codementors.test");
    assert.equal(data.user.role, "instructor");

    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie && setCookie.includes("cm_token="));
    instructorCookie = setCookie.split(";")[0];
  });

  await check("Admin sign-in resolves strictly Admin profile (Platform Administrator)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@codementors.test", password: DEV_PASSWORD }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.user.name, "Platform Administrator");
    assert.equal(data.user.email, "admin@codementors.test");
    assert.equal(data.user.role, "admin");

    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie && setCookie.includes("cm_token="));
    adminCookie = setCookie.split(";")[0];
  });

  // --- 3. Server-Side Route Authorization & Gating ---
  await check("Student session is authorized for /student/dashboard (200 OK)", async () => {
    const res = await fetch(`${BASE_URL}/student/dashboard`, {
      headers: { Cookie: studentCookie },
      redirect: "manual",
    });
    assert.equal(res.status, 200);
  });

  await check("Instructor session is strictly redirected from /student/dashboard to /instructor/dashboard", async () => {
    const res = await fetch(`${BASE_URL}/student/dashboard`, {
      headers: { Cookie: instructorCookie },
      redirect: "manual",
    });
    assert.equal(res.status, 307, `Expected 307 redirect, got ${res.status}`);
    const location = res.headers.get("location");
    assert.ok(
      location && location.includes("/instructor/dashboard"),
      `Expected redirect to /instructor/dashboard, got ${location}`
    );
  });

  await check("Admin session is strictly redirected from /student/dashboard to /admin/dashboard", async () => {
    const res = await fetch(`${BASE_URL}/student/dashboard`, {
      headers: { Cookie: adminCookie },
      redirect: "manual",
    });
    assert.equal(res.status, 307, `Expected 307 redirect, got ${res.status}`);
    const location = res.headers.get("location");
    assert.ok(
      location && location.includes("/admin/dashboard"),
      `Expected redirect to /admin/dashboard, got ${location}`
    );
  });

  await check("Student session is strictly redirected from /instructor/dashboard to /student/dashboard", async () => {
    const res = await fetch(`${BASE_URL}/instructor/dashboard`, {
      headers: { Cookie: studentCookie },
      redirect: "manual",
    });
    assert.equal(res.status, 307);
    const location = res.headers.get("location");
    assert.ok(
      location && location.includes("/student/dashboard"),
      `Expected redirect to /student/dashboard, got ${location}`
    );
  });

  await check("Student session is strictly redirected from /admin/dashboard to /student/dashboard", async () => {
    const res = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Cookie: studentCookie },
      redirect: "manual",
    });
    assert.equal(res.status, 307);
    const location = res.headers.get("location");
    assert.ok(
      location && location.includes("/student/dashboard"),
      `Expected redirect to /student/dashboard, got ${location}`
    );
  });

  await check("Unauthenticated request to /student/dashboard redirects to /login", async () => {
    const res = await fetch(`${BASE_URL}/student/dashboard`, {
      redirect: "manual",
    });
    assert.equal(res.status, 307);
    const location = res.headers.get("location");
    assert.ok(location && location.includes("/login"), `Expected redirect to /login, got ${location}`);
  });

  // --- 4. Server-Side API Authorization ---
  await check("Student session calling /api/dashboard/student is authorized (200 OK)", async () => {
    const res = await fetch(`${BASE_URL}/api/dashboard/student`, {
      headers: { Cookie: studentCookie },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.enrollments));
    assert.ok(Array.isArray(data.bookmarkedLessons));
  });

  await check("Instructor session calling /api/dashboard/student is rejected (403 Forbidden)", async () => {
    const res = await fetch(`${BASE_URL}/api/dashboard/student`, {
      headers: { Cookie: instructorCookie },
    });
    assert.equal(res.status, 403, `Expected 403, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error.includes("Student account required"));
  });

  await check("Admin session calling /api/dashboard/student is rejected (403 Forbidden)", async () => {
    const res = await fetch(`${BASE_URL}/api/dashboard/student`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(res.status, 403, `Expected 403, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error.includes("Student account required"));
  });

  await check("Unauthenticated call to /api/dashboard/student is rejected (401 Unauthorized)", async () => {
    const res = await fetch(`${BASE_URL}/api/dashboard/student`);
    assert.equal(res.status, 401);
  });

  // --- 5. Account Switching Cache Isolation ---
  await check("Switching from Instructor to Student purges all Instructor data and displays Student identity", async () => {
    // 1. Sign in as Instructor
    const loginInstRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "instructor@codementors.test", password: DEV_PASSWORD }),
    });
    const instCookie = loginInstRes.headers.get("set-cookie")!.split(";")[0];

    const meInstRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: instCookie },
    });
    const meInstData = await meInstRes.json();
    assert.equal(meInstData.user.name, "Senior Instructor");
    assert.equal(meInstData.user.email, "instructor@codementors.test");

    // 2. Logout
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: instCookie },
    });
    assert.equal(logoutRes.status, 200);

    // 3. Sign in as Student
    const loginStudRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "student@codementors.test", password: DEV_PASSWORD }),
    });
    const newStudentCookie = loginStudRes.headers.get("set-cookie")!.split(";")[0];

    // 4. Fetch session
    const meStudRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: newStudentCookie },
    });
    const meStudData = await meStudRes.json();
    assert.equal(meStudData.user.name, "Enrolled Student");
    assert.equal(meStudData.user.email, "student@codementors.test");
    assert.equal(meStudData.user.role, "student");
    assert.notEqual(meStudData.user.name, "Senior Instructor");
    assert.notEqual(meStudData.user.email, "instructor@codementors.test");
  });

  // --- 6. Absence of Duplicate Bookmarks Header ---
  await check("Student dashboard HTML contains clean single header and no duplicate public Navbar", async () => {
    const res = await fetch(`${BASE_URL}/student/dashboard`, {
      headers: { Cookie: studentCookie },
    });
    const html = await res.text();

    // Check that Student Portal header is rendered
    assert.ok(html.includes("Student Portal"), "Must contain Student Portal shell header");

    // Check that public Navbar links (Explore Courses, Verify Certificate) are NOT rendered in dashboard
    assert.ok(!html.includes("Verify Certificate"), "Dashboard must not render duplicate public Navbar");
    assert.ok(!html.includes("All Bookmarks"), "Must not contain duplicate 'All Bookmarks' bar");
  });

  // --- 7. Student Bookmarks Page Accessibility and Integrity ---
  await check("Student bookmarks page /student/bookmarks is accessible and functional", async () => {
    const res = await fetch(`${BASE_URL}/student/bookmarks`, {
      headers: { Cookie: studentCookie },
    });
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes("Saved Bookmarks"), "Must contain Saved Bookmarks title");
    assert.ok(html.includes("Student Portal"), "Must be rendered within Student Portal shell");
  });

  // --- 8. Student Profile Persistence ---
  await check("Student profile updates persist to database via PUT /api/dashboard/student", async () => {
    const newHeadline = `Aspiring Full-Stack Architect ${Date.now()}`;
    const updateRes = await fetch(`${BASE_URL}/api/dashboard/student`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: studentCookie,
      },
      body: JSON.stringify({
        headline: newHeadline,
        bio: "Updated student biography for testing persistence.",
      }),
    });
    assert.equal(updateRes.status, 200);
    const updateData = await updateRes.json();
    assert.equal(updateData.success, true);
    assert.equal(updateData.user.headline, newHeadline);

    // Verify in database
    const dbUser = await User.findOne({ email: "student@codementors.test" }).lean();
    assert.equal(dbUser?.headline, newHeadline);
  });

  console.log("\n-----------------------------------------------------------------");
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("-----------------------------------------------------------------\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((e) => {
  console.error("Test execution fatal error:", e);
  process.exit(1);
});
