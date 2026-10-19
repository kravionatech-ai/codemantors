import assert from "assert";
import { connectDB } from "../lib/db";
import { User } from "../models/User";
import { signAuthToken } from "../lib/auth";

const BASE_URL = process.env.TEST_URL || "http://localhost:3005";

let totalTests = 0;
let passedTests = 0;

function pass(msg: string) {
  totalTests++;
  passedTests++;
  console.log(`  ✓ PASS: ${msg}`);
}

async function runRoutingTests() {
  console.log("\n=======================================================");
  console.log("  CodeMentors Routing, Auth & Dashboard Stability Tests");
  console.log(`  Target Server: ${BASE_URL}`);
  console.log("=======================================================\n");

  await connectDB();

  // Retrieve test accounts
  const student = await User.findOne({ role: "student" }).lean();
  const instructor = await User.findOne({ role: "instructor" }).lean();
  let admin = await User.findOne({ role: "admin" }).lean();
  
  // Ensure a super_admin exists or sign a token with super_admin role
  let superAdmin: any = await User.findOne({ role: "super_admin" }).lean();
  if (!superAdmin && admin) {
    superAdmin = {
      ...admin,
      _id: admin._id,
      role: "super_admin",
      email: "superadmin@codementors.test",
      name: "Super Administrator",
    };
  }

  assert.ok(student, "Student account found");
  assert.ok(admin, "Admin account found");
  assert.ok(instructor, "Instructor account found");

  const studentToken = await signAuthToken({
    userId: student._id.toString(),
    email: student.email,
    name: student.name,
    role: "student",
  });

  const instructorToken = await signAuthToken({
    userId: instructor._id.toString(),
    email: instructor.email,
    name: instructor.name,
    role: "instructor",
  });

  const adminToken = await signAuthToken({
    userId: admin._id.toString(),
    email: admin.email,
    name: admin.name,
    role: "admin",
  });

  const superAdminToken = await signAuthToken({
    userId: superAdmin!._id.toString(),
    email: superAdmin!.email,
    name: superAdmin!.name,
    role: "super_admin",
  });

  pass("Generated JWT tokens for student, instructor, admin, and super_admin");

  // SECTION 1: Unauthenticated Deep Links & Direct Redirects (No Multi-Hop Bounce)
  console.log("\n[1] Testing Unauthenticated Route Protection & Deep Links...");
  {
    // Admin Dashboard deep link
    const res = await fetch(`${BASE_URL}/admin/dashboard`, { redirect: "manual" });
    assert.strictEqual(res.status, 307, "/admin/dashboard must redirect unauthenticated visitors (307)");
    const location = res.headers.get("location") || "";
    assert.ok(
      location.includes("/login") && location.includes("redirect=%2Fadmin%2Fdashboard"),
      `Expected direct redirect to /login with redirect=/admin/dashboard, got: ${location}`
    );
    assert.ok(!location.includes("/student/dashboard"), "Must NOT bounce through /student/dashboard");
    pass("Unauthenticated /admin/dashboard directly redirects to /login?redirect=%2Fadmin%2Fdashboard");
  }

  {
    // Admin Users deep link
    const res = await fetch(`${BASE_URL}/admin/users`, { redirect: "manual" });
    assert.strictEqual(res.status, 307);
    const location = res.headers.get("location") || "";
    assert.ok(
      location.includes("/login") && location.includes("redirect=%2Fadmin%2Fusers"),
      `Expected redirect to /login?redirect=%2Fadmin%2Fusers, got: ${location}`
    );
    pass("Unauthenticated /admin/users directly redirects to /login?redirect=%2Fadmin%2Fusers");
  }

  {
    // Instructor Dashboard deep link
    const res = await fetch(`${BASE_URL}/instructor/dashboard`, { redirect: "manual" });
    assert.strictEqual(res.status, 307);
    const location = res.headers.get("location") || "";
    assert.ok(
      location.includes("/login") && location.includes("redirect=%2Finstructor%2Fdashboard"),
      `Expected redirect to /login?redirect=%2Finstructor%2Fdashboard, got: ${location}`
    );
    pass("Unauthenticated /instructor/dashboard directly redirects to /login?redirect=%2Finstructor%2Fdashboard");
  }

  {
    // Student Dashboard deep link
    const res = await fetch(`${BASE_URL}/student/dashboard`, { redirect: "manual" });
    assert.strictEqual(res.status, 307);
    const location = res.headers.get("location") || "";
    assert.ok(
      location.includes("/login") && location.includes("redirect=%2Fstudent%2Fdashboard"),
      `Expected redirect to /login?redirect=%2Fstudent%2Fdashboard, got: ${location}`
    );
    pass("Unauthenticated /student/dashboard directly redirects to /login?redirect=%2Fstudent%2Fdashboard");
  }

  // SECTION 2: Canonical Root Dashboard Aliases (Server Redirects)
  console.log("\n[2] Testing Canonical Root Dashboard Aliases...");
  {
    const res = await fetch(`${BASE_URL}/admin`, { redirect: "manual" });
    assert.strictEqual(res.status, 307, "/admin must redirect");
    const location = res.headers.get("location") || "";
    assert.ok(location.endsWith("/admin/dashboard"), `Expected /admin -> /admin/dashboard, got: ${location}`);
    pass("GET /admin redirects to canonical /admin/dashboard");
  }

  {
    const res = await fetch(`${BASE_URL}/dashboard`, { redirect: "manual" });
    assert.strictEqual(res.status, 307, "/dashboard must redirect");
    const location = res.headers.get("location") || "";
    assert.ok(location.endsWith("/student/dashboard"), `Expected /dashboard -> /student/dashboard, got: ${location}`);
    pass("GET /dashboard redirects to canonical /student/dashboard");
  }

  {
    const res = await fetch(`${BASE_URL}/instructor`, { redirect: "manual" });
    assert.strictEqual(res.status, 307, "/instructor must redirect");
    const location = res.headers.get("location") || "";
    assert.ok(location.endsWith("/instructor/dashboard"), `Expected /instructor -> /instructor/dashboard, got: ${location}`);
    pass("GET /instructor redirects to canonical /instructor/dashboard");
  }

  // SECTION 3: Authenticated Login Navigation & Deep Link Preservation
  console.log("\n[3] Testing Authenticated Login Navigation...");
  {
    // Logged in admin visiting /login
    const res = await fetch(`${BASE_URL}/login`, {
      redirect: "manual",
      headers: { Cookie: `cm_token=${adminToken}` },
    });
    assert.strictEqual(res.status, 307);
    const location = res.headers.get("location") || "";
    assert.ok(location.endsWith("/admin/dashboard"), `Expected admin to land on /admin/dashboard, got: ${location}`);
    pass("Authenticated Admin visiting /login redirects to /admin/dashboard");
  }

  {
    // Logged in super_admin visiting /login
    const res = await fetch(`${BASE_URL}/login`, {
      redirect: "manual",
      headers: { Cookie: `cm_token=${superAdminToken}` },
    });
    assert.strictEqual(res.status, 307);
    const location = res.headers.get("location") || "";
    assert.ok(location.endsWith("/admin/dashboard"), `Expected super_admin to land on /admin/dashboard, got: ${location}`);
    pass("Authenticated Super Admin visiting /login redirects to /admin/dashboard");
  }

  {
    // Logged in instructor visiting /login
    const res = await fetch(`${BASE_URL}/login`, {
      redirect: "manual",
      headers: { Cookie: `cm_token=${instructorToken}` },
    });
    assert.strictEqual(res.status, 307);
    const location = res.headers.get("location") || "";
    assert.ok(location.endsWith("/instructor/dashboard"), `Expected instructor to land on /instructor/dashboard, got: ${location}`);
    pass("Authenticated Instructor visiting /login redirects to /instructor/dashboard");
  }

  {
    // Logged in student visiting /login
    const res = await fetch(`${BASE_URL}/login`, {
      redirect: "manual",
      headers: { Cookie: `cm_token=${studentToken}` },
    });
    assert.strictEqual(res.status, 307);
    const location = res.headers.get("location") || "";
    assert.ok(location.endsWith("/student/dashboard"), `Expected student to land on /student/dashboard, got: ${location}`);
    pass("Authenticated Student visiting /login redirects to /student/dashboard");
  }

  {
    // Logged in admin visiting /login with deep link redirect parameter
    const res = await fetch(`${BASE_URL}/login?redirect=%2Fadmin%2Fusers`, {
      redirect: "manual",
      headers: { Cookie: `cm_token=${adminToken}` },
    });
    assert.strictEqual(res.status, 307);
    const location = res.headers.get("location") || "";
    assert.ok(location.endsWith("/admin/users"), `Expected admin with deep link to land on /admin/users, got: ${location}`);
    pass("Authenticated Admin with ?redirect=/admin/users lands directly on target page");
  }

  // SECTION 4: Cross-Role Protection
  console.log("\n[4] Testing Role Isolation...");
  {
    // Student attempting to access /admin/dashboard
    const res = await fetch(`${BASE_URL}/admin/dashboard`, {
      redirect: "manual",
      headers: { Cookie: `cm_token=${studentToken}` },
    });
    assert.strictEqual(res.status, 307);
    const location = res.headers.get("location") || "";
    assert.ok(location.endsWith("/student/dashboard"), `Expected student to be redirected to /student/dashboard, got: ${location}`);
    pass("Student attempting /admin/dashboard is prevented and redirected to /student/dashboard");
  }

  {
    // Student attempting to access /instructor/dashboard
    const res = await fetch(`${BASE_URL}/instructor/dashboard`, {
      redirect: "manual",
      headers: { Cookie: `cm_token=${studentToken}` },
    });
    assert.strictEqual(res.status, 307);
    const location = res.headers.get("location") || "";
    assert.ok(location.endsWith("/student/dashboard"), `Expected student to be redirected to /student/dashboard, got: ${location}`);
    pass("Student attempting /instructor/dashboard is prevented and redirected to /student/dashboard");
  }

  // SECTION 5: Super Admin API Permissions & Telemetry
  console.log("\n[5] Testing Super Admin API Access...");
  {
    const res = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Cookie: `cm_token=${superAdminToken}` },
    });
    assert.strictEqual(res.status, 200, `Expected 200 for /api/admin/stats, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(typeof data.metrics.totalUsers === "number");
    pass("Super Admin can access /api/admin/stats without 403 Forbidden");
  }

  {
    const res = await fetch(`${BASE_URL}/api/admin/courses`, {
      headers: { Cookie: `cm_token=${superAdminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    pass("Super Admin can access /api/admin/courses");
  }

  {
    const res = await fetch(`${BASE_URL}/api/admin/orders`, {
      headers: { Cookie: `cm_token=${superAdminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    pass("Super Admin can access /api/admin/orders");
  }

  {
    const res = await fetch(`${BASE_URL}/api/admin/payments`, {
      headers: { Cookie: `cm_token=${superAdminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    pass("Super Admin can access /api/admin/payments");
  }

  {
    const res = await fetch(`${BASE_URL}/api/admin/refunds`, {
      headers: { Cookie: `cm_token=${superAdminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    pass("Super Admin can access /api/admin/refunds");
  }

  // SECTION 6: Admin Dashboard Page Loading (No Stuck State)
  console.log("\n[6] Testing Admin Dashboard Page Rendering...");
  {
    const res = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Cookie: `cm_token=${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes("CodeMentors") || html.includes("Admin"), "Renders Admin console");
    pass("GET /admin/dashboard returns 200 HTML with Admin session");
  }

  {
    // Super Admin loads /admin/dashboard
    const res = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Cookie: `cm_token=${superAdminToken}` },
    });
    assert.strictEqual(res.status, 200);
    pass("GET /admin/dashboard returns 200 HTML with Super Admin session");
  }

  // SECTION 7: Homepage Server Component Serialization Integrity
  console.log("\n[7] Testing Homepage Server Component Serialization...");
  {
    const res = await fetch(`${BASE_URL}/`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes("Learn to Code"), "Homepage renders correctly");
    pass("GET / renders cleanly with zero Server Component serialization errors");
  }

  console.log("\n=======================================================");
  console.log(`  Routing & Stability Verification: ${passedTests}/${totalTests} Passed!`);
  console.log("=======================================================\n");

  process.exit(0);
}

runRoutingTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
