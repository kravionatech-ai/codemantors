import { connectDB } from "../lib/db";
import { User, Course, Enrollment, Review } from "../models";
import assert from "assert";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3005";
const DEV_PASSWORD = process.env.DEV_TEST_PASSWORD || "DevOnly123!ChangeMe";

async function verifySuite() {
  console.log("\n=======================================================");
  console.log("  CODEMENTORS LMS — 3 TEST ACCOUNTS VERIFICATION SUITE ");
  console.log(`  Target Server: ${BASE_URL}`);
  console.log("=======================================================\n");

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

  // 1. Strict Database User Count Verification
  await check("Database contains strictly the three designated test accounts", async () => {
    const totalUsers = await User.countDocuments();
    assert.equal(totalUsers, 3, `Expected exactly 3 users in database, but found ${totalUsers}`);

    const users = await User.find({}, "email role isActive instructorStatus").lean();
    const emails = users.map((u: any) => u.email).sort();
    assert.deepEqual(emails, [
      "admin@codementors.test",
      "instructor@codementors.test",
      "student@codementors.test",
    ]);

    const admin = users.find((u: any) => u.email === "admin@codementors.test");
    const instructor = users.find((u: any) => u.email === "instructor@codementors.test");
    const student = users.find((u: any) => u.email === "student@codementors.test");

    assert.equal(admin?.role, "admin", "Admin role must be 'admin'");
    assert.equal(instructor?.role, "instructor", "Instructor role must be 'instructor'");
    assert.equal(instructor?.instructorStatus, "approved", "Instructor status must be 'approved'");
    assert.equal(student?.role, "student", "Student role must be 'student'");
  });

  // 2. Authentication Verification for All 3 Accounts
  let adminCookie = "";
  let instructorCookie = "";
  let studentCookie = "";

  await check("Admin sign-in with dev password succeeds and returns role 'admin'", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@codementors.test", password: DEV_PASSWORD }),
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.user.email, "admin@codementors.test");
    assert.equal(data.user.role, "admin");

    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie && setCookie.includes("cm_token="), "Must set cm_token cookie");
    adminCookie = setCookie.split(";")[0];
  });

  await check("Instructor sign-in with dev password succeeds and returns role 'instructor'", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "instructor@codementors.test", password: DEV_PASSWORD }),
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.user.email, "instructor@codementors.test");
    assert.equal(data.user.role, "instructor");

    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie && setCookie.includes("cm_token="), "Must set cm_token cookie");
    instructorCookie = setCookie.split(";")[0];
  });

  await check("Student sign-in with dev password succeeds and returns role 'student'", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "student@codementors.test", password: DEV_PASSWORD }),
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.user.email, "student@codementors.test");
    assert.equal(data.user.role, "student");

    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie && setCookie.includes("cm_token="), "Must set cm_token cookie");
    studentCookie = setCookie.split(";")[0];
  });

  // 3. Authorized Dashboard Access
  await check("Admin access to /admin/dashboard and /api/admin/stats is authorized", async () => {
    const pageRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Cookie: adminCookie },
      redirect: "manual",
    });
    assert.equal(pageRes.status, 200, `Expected 200 for admin dashboard, got ${pageRes.status}`);

    const statsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(statsRes.status, 200);
    const statsData = await statsRes.json();
    assert.equal(statsData.metrics.totalUsers, 3, "Admin stats correctly reports exactly 3 users");
  });

  await check("Instructor access to /instructor/dashboard and /api/instructor/stats is authorized", async () => {
    const pageRes = await fetch(`${BASE_URL}/instructor/dashboard`, {
      headers: { Cookie: instructorCookie },
      redirect: "manual",
    });
    assert.equal(pageRes.status, 200, `Expected 200 for instructor dashboard, got ${pageRes.status}`);

    const statsRes = await fetch(`${BASE_URL}/api/instructor/stats`, {
      headers: { Cookie: instructorCookie },
    });
    assert.equal(statsRes.status, 200);
    const statsData = await statsRes.json();
    assert.equal(statsData.success, true);
    assert.ok(typeof statsData.stats?.totalCourses === "number", "Instructor stats returns numeric totalCourses");
  });

  await check("Student access to /student/dashboard and /api/dashboard/student is authorized", async () => {
    const pageRes = await fetch(`${BASE_URL}/student/dashboard`, {
      headers: { Cookie: studentCookie },
      redirect: "manual",
    });
    assert.equal(pageRes.status, 200, `Expected 200 for student dashboard, got ${pageRes.status}`);

    const dashRes = await fetch(`${BASE_URL}/api/dashboard/student`, {
      headers: { Cookie: studentCookie },
    });
    assert.equal(dashRes.status, 200);
    const dashData = await dashRes.json();
    assert.ok(Array.isArray(dashData.enrollments));
  });

  // 4. Role Isolation & Protection
  await check("Student cannot access Admin or Instructor dashboards", async () => {
    const adminRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Cookie: studentCookie },
      redirect: "manual",
    });
    assert.ok(
      [302, 307, 308, 403].includes(adminRes.status),
      `Student must be rejected/redirected from admin dashboard, got ${adminRes.status}`
    );

    const instructorRes = await fetch(`${BASE_URL}/instructor/dashboard`, {
      headers: { Cookie: studentCookie },
      redirect: "manual",
    });
    assert.ok(
      [302, 307, 308, 403].includes(instructorRes.status),
      `Student must be rejected/redirected from instructor dashboard, got ${instructorRes.status}`
    );
  });

  // 5. Audit UI Content: No Hardcoded Dummy Data or Exposed Passwords
  await check("Login page does not contain hardcoded demo password buttons", async () => {
    const res = await fetch(`${BASE_URL}/login`);
    const html = await res.text();
    assert.ok(!html.includes("1-Click Demo Accounts"), "Login page must not contain 1-Click Demo Accounts");
    assert.ok(!html.includes("Password@12345"), "Login page must not expose credentials in UI");
  });

  await check("Homepage does not render hardcoded mock reviews or instructors", async () => {
    const res = await fetch(`${BASE_URL}/`);
    const html = await res.text();
    assert.ok(!html.includes("Jane Student"), "Homepage must not contain hardcoded fallback student Jane Student");
    assert.ok(!html.includes("Marcus Wright"), "Homepage must not contain hardcoded fallback reviewer Marcus Wright");
    assert.ok(!html.includes("Alex Rivers"), "Homepage must not contain hardcoded fallback instructor Alex Rivers");
    assert.ok(!html.includes("Dr. Sarah Chen"), "Homepage must not contain hardcoded fallback instructor Dr. Sarah Chen");
  });

  await check("Student dashboard announcements tab does not contain mock announcements", async () => {
    const res = await fetch(`${BASE_URL}/student/dashboard?tab=announcements`, {
      headers: { Cookie: studentCookie },
    });
    const html = await res.text();
    assert.ok(!html.includes("Alex Rivers • Senior Instructor"), "Student announcements must not contain hardcoded Alex Rivers");
  });

  // 6. Automatic Dummy User Creation Guard
  await check("Normal navigation, logins, and profile fetches do NOT generate dummy users", async () => {
    const countBefore = await User.countDocuments();
    assert.equal(countBefore, 3);

    // Hit public pages
    await fetch(`${BASE_URL}/`);
    await fetch(`${BASE_URL}/courses`);
    await fetch(`${BASE_URL}/about`);
    await fetch(`${BASE_URL}/contact`);
    await fetch(`${BASE_URL}/api/categories`);

    // Hit auth endpoints
    await fetch(`${BASE_URL}/api/auth/me`, { headers: { Cookie: studentCookie } });
    await fetch(`${BASE_URL}/api/auth/me`, { headers: { Cookie: adminCookie } });

    const countAfter = await User.countDocuments();
    assert.equal(countAfter, 3, `User count changed from ${countBefore} to ${countAfter} during normal operations!`);
  });

  console.log("\n=======================================================");
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

verifySuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Verification suite fatal error:", err);
    process.exit(1);
  });
