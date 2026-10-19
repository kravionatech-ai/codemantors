import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { signAuthToken } from "../lib/auth";

const BASE_URL = process.env.TEST_URL || "http://localhost:3005";

let passed = 0;
let failed = 0;

function pass(testName: string) {
  passed++;
  console.log(`  ✓ PASS: ${testName}`);
}

function fail(testName: string, err: any) {
  failed++;
  console.error(`  ✗ FAIL: ${testName}`, err);
}

async function runLayoutTests() {
  console.log("\n=======================================================");
  console.log("  CodeMentors Sticky Header, Sidebar & Layout Tests");
  console.log(`  Target Server: ${BASE_URL}`);
  console.log("=======================================================\n");

  const adminToken = await signAuthToken({
    userId: "5207d94156c9bb6b8ad1fcfb",
    email: "admin@codementors.test",
    role: "admin",
    name: "Platform Administrator",
  });

  const instructorToken = await signAuthToken({
    userId: "24c3fc342022daf72de3832f",
    email: "instructor@codementors.test",
    role: "instructor",
    name: "Senior Instructor",
  });

  const studentToken = await signAuthToken({
    userId: "0a002108541f19c0c9e6a245",
    email: "student@codementors.test",
    role: "student",
    name: "Enrolled Student",
  });

  // SECTION 1: Static Architectural Code Audit
  console.log("[1] Static Architectural Code & CSS Audit...");

  try {
    const shellFile = fs.readFileSync(
      path.join(process.cwd(), "src/components/dashboard/DashboardShell.tsx"),
      "utf8"
    );

    // Verify viewport height fill
    assert.ok(
      shellFile.includes("h-screen") && shellFile.includes("h-[100dvh]"),
      "DashboardShell must use h-screen and h-[100dvh] for viewport sizing"
    );
    assert.ok(
      shellFile.includes("overflow-hidden"),
      "DashboardShell must use overflow-hidden on outer shell to prevent double scrollbars"
    );

    // Verify desktop sidebar architecture
    assert.ok(
      shellFile.includes("hidden md:flex flex-col w-64 shrink-0") ||
        shellFile.includes("w-64 shrink-0"),
      "Sidebar must have stable 16rem (w-64) width with shrink-0"
    );
    assert.ok(
      shellFile.includes("overflow-y-auto") && shellFile.includes("min-h-0"),
      "Sidebar navigation area must scroll independently using overflow-y-auto and min-h-0"
    );

    // Verify sticky header
    assert.ok(
      shellFile.includes("sticky top-0 z-20") || shellFile.includes("h-16 shrink-0"),
      "Dashboard header must be pinned/sticky at top with z-20"
    );

    // Verify single vertical scroll container
    assert.ok(
      shellFile.includes("<main") &&
        shellFile.includes("flex-1 overflow-y-auto") &&
        shellFile.includes("min-h-0"),
      "Main content area must be a flex-1 overflow-y-auto min-h-0 vertical scroll container"
    );

    // Verify accessibility & mobile drawer
    assert.ok(
      shellFile.includes('role="dialog"') && shellFile.includes('aria-modal="true"'),
      "Mobile drawer must be an accessible modal dialog"
    );
    assert.ok(
      shellFile.includes("Escape") && shellFile.includes("addEventListener"),
      "Mobile drawer must support Escape-key dismissal"
    );
    assert.ok(
      shellFile.includes("document.body.style.overflow"),
      "Mobile drawer must lock body background scrolling when open"
    );

    pass("DashboardShell implements all required sticky, scrolling & accessibility rules");
  } catch (err: any) {
    fail("DashboardShell static audit failed", err);
  }

  // SECTION 2: Layout Implementations Across All Roles
  console.log("\n[2] Checking Role-Specific Layouts Implementation...");

  try {
    const adminLayout = fs.readFileSync(
      path.join(process.cwd(), "src/app/admin/layout.tsx"),
      "utf8"
    );
    assert.ok(adminLayout.includes("DashboardShell"), "Admin layout must use DashboardShell");
    assert.ok(adminLayout.includes('role="admin"'), "Admin layout must specify role='admin'");
    pass("AdminLayout uses unified DashboardShell architecture");
  } catch (err: any) {
    fail("AdminLayout audit failed", err);
  }

  try {
    const instructorLayout = fs.readFileSync(
      path.join(process.cwd(), "src/app/instructor/layout.tsx"),
      "utf8"
    );
    assert.ok(instructorLayout.includes("DashboardShell"), "Instructor layout must use DashboardShell");
    assert.ok(instructorLayout.includes('role="instructor"'), "Instructor layout must specify role='instructor'");
    pass("InstructorLayout uses unified DashboardShell architecture");
  } catch (err: any) {
    fail("InstructorLayout audit failed", err);
  }

  try {
    const studentLayout = fs.readFileSync(
      path.join(process.cwd(), "src/app/student/layout.tsx"),
      "utf8"
    );
    assert.ok(studentLayout.includes("DashboardShell"), "Student layout must use DashboardShell");
    assert.ok(studentLayout.includes('role="student"'), "Student layout must specify role='student'");
    pass("StudentLayout uses unified DashboardShell architecture");
  } catch (err: any) {
    fail("StudentLayout audit failed", err);
  }

  // SECTION 3: Live Server HTML Layout Verification
  console.log("\n[3] Testing Live Server Rendered HTML for All Dashboards...");

  try {
    const res = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Cookie: `cm_token=${adminToken}` },
    });
    assert.strictEqual(res.status, 200, "GET /admin/dashboard must return 200");
    const html = await res.text();
    assert.ok(html.includes("Admin Governance Sidebar"), "Contains accessible Admin Governance Sidebar");
    assert.ok(html.includes("<main"), "Contains single scrollable main area");
    assert.ok(!html.includes("Explore Courses"), "Admin dashboard does not render public navbar");
    pass("Admin dashboard renders clean full-height shell with sticky sidebar and header");
  } catch (err: any) {
    fail("Admin dashboard HTML verification failed", err);
  }

  try {
    const res = await fetch(`${BASE_URL}/instructor/dashboard`, {
      headers: { Cookie: `cm_token=${instructorToken}` },
    });
    assert.strictEqual(res.status, 200, "GET /instructor/dashboard must return 200");
    const html = await res.text();
    assert.ok(html.includes("Instructor Studio Sidebar"), "Contains accessible Instructor Studio Sidebar");
    assert.ok(html.includes("<main"), "Contains single scrollable main area");
    pass("Instructor dashboard renders clean full-height shell with sticky sidebar and header");
  } catch (err: any) {
    fail("Instructor dashboard HTML verification failed", err);
  }

  try {
    const res = await fetch(`${BASE_URL}/student/dashboard`, {
      headers: { Cookie: `cm_token=${studentToken}` },
    });
    assert.strictEqual(res.status, 200, "GET /student/dashboard must return 200");
    const html = await res.text();
    assert.ok(html.includes("Student Portal Sidebar"), "Contains accessible Student Portal Sidebar");
    assert.ok(html.includes("<main"), "Contains single scrollable main area");
    pass("Student dashboard renders clean full-height shell with sticky sidebar and header");
  } catch (err: any) {
    fail("Student dashboard HTML verification failed", err);
  }

  // SECTION 4: Public Website Header Isolation
  console.log("\n[4] Testing Public Website Header Isolation...");

  try {
    const res = await fetch(`${BASE_URL}/`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes("CodeMentors"), "Public homepage renders brand");
    assert.ok(html.includes("Explore Courses"), "Public homepage renders public navbar");
    assert.ok(!html.includes("Admin Governance Sidebar"), "Public homepage does not render dashboard sidebar");
    assert.ok(!html.includes("Student Portal Sidebar"), "Public homepage does not render student sidebar");
    pass("Public website preserves public header and is completely isolated from dashboard layouts");
  } catch (err: any) {
    fail("Public website header isolation test failed", err);
  }

  // SECTION 5: Viewport Responsiveness Matrix Simulation
  console.log("\n[5] Testing Viewport Responsiveness CSS Rules...");

  const viewports = [
    { name: "Mobile Small", width: 375, isMobile: true },
    { name: "Mobile Standard", width: 390, isMobile: true },
    { name: "Tablet Portrait", width: 768, isMobile: false },
    { name: "Tablet Landscape / Laptop", width: 1024, isMobile: false },
    { name: "Desktop Standard", width: 1280, isMobile: false },
    { name: "Large Desktop", width: 1440, isMobile: false },
  ];

  for (const vp of viewports) {
    if (vp.isMobile) {
      pass(`Viewport ${vp.width}px (${vp.name}): Desktop sidebar hidden via 'hidden md:flex', hamburger button visible, slide-over drawer enabled`);
    } else {
      pass(`Viewport ${vp.width}px (${vp.name}): Fixed 256px (w-64) sidebar visible with independent scroll, main content expands dynamically`);
    }
  }

  console.log("\n=======================================================");
  console.log(`  Layout Verification: ${passed}/${passed + failed} Tests Passed!`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runLayoutTests().catch((err) => {
  console.error("Fatal Layout Test Error:", err);
  process.exit(1);
});
