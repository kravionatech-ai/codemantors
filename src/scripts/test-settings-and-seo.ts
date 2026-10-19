import assert from "node:assert/strict";
import { connectDB } from "../lib/db";
import { PageSeo, SiteSettings, PaymentSettings, UserSession, User } from "../models";

const BASE_URL = process.env.BASE_URL || "http://localhost:3005";

async function runSettingsAndSeoTests() {
  console.log(`\n======================================================`);
  console.log(`  CodeMentors Settings, SEO & Razorpay Test Suite`);
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

  // 1. Authenticate users
  await test("Authenticate Admin & Student accounts", async () => {
    adminCookie = await login("admin@codementors.test");
    studentCookie = await login("student@codementors.test");
    assert.ok(adminCookie.includes("cm_token="), "Admin cookie should contain cm_token");
    assert.ok(studentCookie.includes("cm_token="), "Student cookie should contain cm_token");
  });

  // 2. Security: Student and Unauthenticated calls to Admin SEO are rejected
  await test("Security: Non-admin calls to /api/admin/seo/pages are rejected (401/403)", async () => {
    const unauthRes = await fetch(`${BASE_URL}/api/admin/seo/pages`);
    assert.ok([401, 403].includes(unauthRes.status), `Expected 401/403 unauthenticated, got ${unauthRes.status}`);

    const studentRes = await fetch(`${BASE_URL}/api/admin/seo/pages`, {
      headers: { Cookie: studentCookie },
    });
    assert.equal(studentRes.status, 403, `Expected 403 for student, got ${studentRes.status}`);
  });

  // 3. Security: Non-admin calls to /api/admin/settings/* are rejected
  await test("Security: Non-admin calls to /api/admin/settings/platform are rejected (401/403)", async () => {
    const unauthRes = await fetch(`${BASE_URL}/api/admin/settings/platform?category=all`);
    assert.ok([401, 403].includes(unauthRes.status), `Expected 401/403 unauthenticated, got ${unauthRes.status}`);

    const studentRes = await fetch(`${BASE_URL}/api/admin/settings/platform?category=all`, {
      headers: { Cookie: studentCookie },
    });
    assert.equal(studentRes.status, 403, `Expected 403 for student, got ${studentRes.status}`);
  });

  // 4. Admin SEO: List all platform pages, courses, categories
  await test("SEO: GET /api/admin/seo/pages returns catalog and static platform pages", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/seo/pages`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, true, "Response should succeed");
    assert.ok(Array.isArray(data.pages), "Response should return array of pages");
    assert.ok(data.pages.length >= 10, `Expected at least 10 discoverable pages, found ${data.pages.length}`);

    // Verify presence of static and course entries
    const paths = data.pages.map((p: any) => p.path);
    assert.ok(paths.includes("/"), "Must include Homepage (/)");
    assert.ok(paths.includes("/about"), "Must include About page (/about)");
    assert.ok(paths.includes("/courses"), "Must include Courses catalog (/courses)");
    assert.ok(paths.some((p: string) => p.startsWith("/courses/")), "Must include individual courses");
  });

  // 5. SEO: Validation API diagnostics
  await test("SEO: POST /api/admin/seo/validate evaluates title length, description & SERP", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/seo/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        title: "Short",
        description: "Too short",
        canonicalUrl: "invalid-url",
        jsonLdRaw: '{ "invalidJson": ',
      }),
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, true);
    const score = data.score ?? data.diagnostics?.score;
    const issues = data.issues ?? data.diagnostics?.issues;
    assert.ok(score < 90, "Score should reflect identified issues");
    assert.ok(issues.length >= 2, "Validation should flag short title and invalid URL");
  });

  // 6. SEO: Upsert page-specific override
  await test("SEO: POST /api/admin/seo/pages saves independent metadata override", async () => {
    const testPath = "/about";
    const overridePayload = {
      path: testPath,
      slug: "about",
      pageName: "About Kraviona & CodeMentors",
      entityType: "about",
      title: "About CodeMentors | Powered by Kraviona Tech Solutions",
      description: "Learn about CodeMentors online learning platform, engineered by Kraviona Tech Solutions with full-stack Next.js and AI automation.",
      canonicalUrl: "http://localhost:3005/about",
      noIndex: false,
      noFollow: false,
      ogTitle: "About CodeMentors & Kraviona",
      ogDescription: "World-class coding education platform engineered by Kraviona Tech Solutions.",
      twitterCard: "summary_large_image",
      structuredDataType: "Organization",
    };

    const res = await fetch(`${BASE_URL}/api/admin/seo/pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify(overridePayload),
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.page.title, overridePayload.title);

    // Verify persisted in DB
    const persisted = await PageSeo.findOne({ path: testPath }).lean();
    assert.ok(persisted, "PageSeo record should exist in database");
    assert.equal(persisted?.title, overridePayload.title);
  });

  // 7. Sitemap.xml: Dynamic indexing and XML structure
  await test("Technical SEO: GET /sitemap.xml returns valid XML with dynamic courses and paths", async () => {
    const res = await fetch(`${BASE_URL}/sitemap.xml`);
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const xml = await res.text();
    assert.ok(xml.includes("<urlset"), "Must be a valid urlset XML document");
    assert.ok(xml.includes("<loc>"), "Must include location tags");
    assert.ok(xml.includes("/courses"), "Must include /courses in sitemap");
    assert.ok(xml.includes("/about"), "Must include /about in sitemap");
  });

  // 8. Robots.txt: Directives and sitemap reference
  await test("Technical SEO: GET /robots.txt includes sitemap reference and proper disallow directives", async () => {
    const res = await fetch(`${BASE_URL}/robots.txt`);
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const text = await res.text();
    assert.ok(/user-agent:\s*\*/i.test(text), "Must specify wildcard user agent");
    assert.ok(/disallow:\s*\/admin/i.test(text), "Must disallow /admin");
    assert.ok(/sitemap:/i.test(text), "Must reference sitemap");
  });

  // 9. Account: GET & PUT Profile
  await test("Account: GET & PUT /api/admin/account/profile reads and persists profile details", async () => {
    const getRes = await fetch(`${BASE_URL}/api/admin/account/profile`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(getRes.status, 200, `Expected 200, got ${getRes.status}`);
    const getData = await getRes.json();
    assert.equal(getData.success, true);
    assert.equal(getData.user.email, "admin@codementors.test");

    const updateRes = await fetch(`${BASE_URL}/api/admin/account/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        name: "CodeMentors Lead Administrator",
        headline: "Principal Systems Engineer & Admin",
        bio: "Overseeing platform operations, multi-module courses, SEO, and Razorpay integrations.",
      }),
    });
    assert.equal(updateRes.status, 200, `Expected 200, got ${updateRes.status}`);
    const updateData = await updateRes.json();
    assert.equal(updateData.success, true);
    assert.equal(updateData.user.headline, "Principal Systems Engineer & Admin");
  });

  // 10. Account: Password validation and update protection
  await test("Account: Password change rejects invalid current password", async () => {
    const failRes = await fetch(`${BASE_URL}/api/admin/account/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        currentPassword: "WrongCurrentPassword123!",
        newPassword: "NewStrongPassword@2026",
      }),
    });
    assert.equal(failRes.status, 400, "Should reject incorrect current password with 400");
  });

  // 11. Account: Active Sessions retrieval & revocation
  await test("Account: GET /api/admin/account/sessions returns active sessions", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/account/sessions`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.sessions), "Should return array of sessions");
    assert.ok(data.sessions.length >= 1, "Should show at least current session");
  });

  // 12. Razorpay Settings: Masked keys security
  await test("Razorpay: Secrets are strictly masked and never returned in plaintext", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/settings/payments/razorpay`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.settings, "Should return payment settings object");

    // Verify secrets are masked or unconfigured, NOT raw plaintext secrets
    if (data.settings.testKeySecret) {
      assert.ok(
        data.settings.testKeySecret.includes("••••") || data.settings.testKeySecret.length <= 8,
        "testKeySecret must be masked"
      );
    }
    if (data.settings.liveKeySecret) {
      assert.ok(
        data.settings.liveKeySecret.includes("••••") || data.settings.liveKeySecret.length <= 8,
        "liveKeySecret must be masked"
      );
    }
    assert.ok(data.settings.webhookUrl.includes("/api/payments/razorpay/webhook"), "Webhook endpoint must be surfaced");
  });

  // 13. Razorpay Settings: Update config and connection test
  await test("Razorpay: Update settings and invoke credential verification test", async () => {
    const updateRes = await fetch(`${BASE_URL}/api/admin/settings/payments/razorpay`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        isEnabled: true,
        mode: "test",
        testKeyId: "rzp_test_codementors_2026",
        defaultCurrency: "INR",
        refundWindowDays: 14,
      }),
    });
    assert.equal(updateRes.status, 200, `Expected 200, got ${updateRes.status}`);
    const updateData = await updateRes.json();
    assert.equal(updateData.success, true);

    const testRes = await fetch(`${BASE_URL}/api/admin/settings/payments/razorpay/test`, {
      method: "POST",
      headers: { Cookie: adminCookie },
    });
    assert.equal(testRes.status, 200, `Expected 200, got ${testRes.status}`);
    const testData = await testRes.json();
    assert.equal(testData.success, true);
  });

  // 14. Platform Settings: Full persistence across categories
  await test("Platform Settings: General & Branding settings persist with Kraviona attribution", async () => {
    // Test Branding Settings
    const brandingRes = await fetch(`${BASE_URL}/api/admin/settings/platform`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        category: "branding",
        settings: {
          poweredByText: "Powered by Kraviona",
          companyName: "Kraviona Tech Solutions",
          companyUrl: "https://kraviona.com/",
          primaryColor: "#0284c7",
          accentColor: "#f59e0b",
        },
      }),
    });
    assert.equal(brandingRes.status, 200, `Expected 200, got ${brandingRes.status}`);
    const brandingData = await brandingRes.json();
    assert.equal(brandingData.success, true);
    assert.equal(brandingData.settings.companyBranding?.companyUrl, "https://kraviona.com/");

    // Test General Settings
    const generalRes = await fetch(`${BASE_URL}/api/admin/settings/platform`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        category: "general",
        settings: {
          siteName: "CodeMentors",
          siteTagline: "Production-Grade Engineering Learning Platform",
          supportEmail: "support@codementors.com",
        },
      }),
    });
    assert.equal(generalRes.status, 200, `Expected 200, got ${generalRes.status}`);

    // Verify DB persistence
    const siteSettings = await SiteSettings.findOne({ key: "global_config" }).lean();
    assert.ok(siteSettings, "SiteSettings document must exist");
    assert.equal(siteSettings.siteName, "CodeMentors");
    assert.equal(siteSettings.companyBranding?.companyUrl, "https://kraviona.com/");
  });

  // 15. Platform Settings: Email, Storage, Limits, Integrations
  await test("Platform Settings: Storage, Limits & Integrations settings persist", async () => {
    // Storage
    const storageRes = await fetch(`${BASE_URL}/api/admin/settings/platform`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        category: "storage",
        settings: {
          provider: "local",
          maxImageSizeMb: 5,
          maxVideoSizeMb: 500,
          maxPdfSizeMb: 25,
        },
      }),
    });
    assert.equal(storageRes.status, 200);

    // Limits
    const limitsRes = await fetch(`${BASE_URL}/api/admin/settings/platform`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        category: "limits",
        settings: {
          maxCoursesPerInstructor: 50,
          requireAdminCourseApproval: true,
          allowStudentDiscussions: true,
        },
      }),
    });
    assert.equal(limitsRes.status, 200);

    // Integrations
    const integrationsRes = await fetch(`${BASE_URL}/api/admin/settings/platform`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        category: "integrations",
        settings: {
          googleAnalyticsId: "G-CODEMENTORS123",
          metaPixelId: "1234567890",
        },
      }),
    });
    assert.equal(integrationsRes.status, 200);
  });

  console.log(`\n======================================================`);
  console.log(`  Tests Completed: ${passed + failed}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runSettingsAndSeoTests().catch((err) => {
  console.error("Fatal Test Suite Error:", err);
  process.exit(1);
});
