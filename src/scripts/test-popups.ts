import assert from "node:assert/strict";
import { connectDB } from "../lib/db";
import { PopupCampaign, User } from "../models";

const BASE_URL = process.env.BASE_URL || "http://localhost:3005";

async function runPopupTests() {
  console.log(`\n======================================================`);
  console.log(`  CodeMentors Dynamic Events & Offers Popup Test Suite`);
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

  // Helper for admin login
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

  // 2. Default POPUP OFF verification
  await test("Default Behavior: Active popup returns null when no campaigns are enabled", async () => {
    // Ensure all existing campaigns are disabled for test start
    await PopupCampaign.updateMany({}, { isEnabled: false });

    const res = await fetch(`${BASE_URL}/api/popups/active?pathname=/courses`);
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, true, "Response should be success: true");
    assert.equal(data.popup, null, "Active popup must be strictly null by default");
  });

  // 3. Admin Authentication Protection
  await test("Admin APIs require authenticated admin session", async () => {
    // Unauthenticated GET
    const unauthGet = await fetch(`${BASE_URL}/api/admin/popups`);
    assert.ok(
      unauthGet.status === 401 || unauthGet.status === 403,
      `Expected 401/403 for unauthenticated GET, got ${unauthGet.status}`
    );

    // Unauthenticated POST upload
    const unauthUpload = await fetch(`${BASE_URL}/api/admin/popups/upload`, {
      method: "POST",
    });
    assert.ok(
      unauthUpload.status === 401 || unauthUpload.status === 403,
      `Expected 401/403 for unauthenticated upload, got ${unauthUpload.status}`
    );

    // Student GET (Forbidden)
    const studentGet = await fetch(`${BASE_URL}/api/admin/popups`, {
      headers: { Cookie: studentCookie },
    });
    assert.equal(studentGet.status, 403, `Expected 403 for student access, got ${studentGet.status}`);
  });

  // 4. Create Draft Popup Campaign via Admin API
  let createdCampaignId = "";
  await test("Admin can create a popup campaign (starts in draft, isEnabled: false)", async () => {
    const payload = {
      name: "Diwali Tech Fest 2026",
      headline: "50% Off All Full-Stack Masterclasses",
      description: "Level up your software engineering career with production-grade curriculum.",
      badgeText: "Limited Time Offer",
      badgeColor: "#2563EB",
      imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
      imageAlt: "Tech Fest 2026 Promotional Banner",
      ctaText: "Explore Offers",
      ctaUrl: "/courses?offer=diwali50",
      secondaryCtaText: "Dismiss",
      secondaryCtaUrl: "/courses",
      startDate: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      endDate: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days ahead
      status: "draft",
      isEnabled: false,
      priority: 10,
      targetAudience: "all",
      displayFrequency: "once_per_session",
      displayDelaySeconds: 2,
      dismissalBehavior: "both",
    };

    const res = await fetch(`${BASE_URL}/api/admin/popups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 201, `Expected 201 Created, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.campaign._id, "Campaign must have an _id");
    assert.equal(data.campaign.isEnabled, false, "Campaign should be disabled by default");
    createdCampaignId = data.campaign._id;
  });

  // 5. Verify draft campaign does not show on public active query
  await test("Draft / disabled campaign is NOT served on /api/popups/active", async () => {
    const res = await fetch(`${BASE_URL}/api/popups/active?pathname=/courses`);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.popup, null, "Draft / disabled popup must NOT be served");
  });

  // 6. Publish and Enable Campaign
  await test("Admin can publish and enable the popup campaign", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/popups/${createdCampaignId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        status: "published",
        isEnabled: true,
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.campaign.status, "published");
    assert.equal(data.campaign.isEnabled, true);
  });

  // 7. Verify active popup is served on public page
  await test("Published & enabled campaign is served on public page (/courses)", async () => {
    const res = await fetch(`${BASE_URL}/api/popups/active?pathname=/courses`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.popup, "Active popup should be returned");
    assert.equal(data.popup._id, createdCampaignId);
    assert.equal(data.popup.headline, "50% Off All Full-Stack Masterclasses");
    assert.equal(data.popup.badgeText, "Limited Time Offer");
    assert.equal(data.popup.ctaText, "Explore Offers");
    assert.equal(data.popup.ctaUrl, "/courses?offer=diwali50");
  });

  // 8. CRITICAL SAFETY: Sensitive Flows Must NEVER Serve Popups
  await test("CRITICAL SAFETY: Sensitive flows strictly return null popup", async () => {
    const sensitivePaths = [
      "/checkout",
      "/checkout?step=payment",
      "/order-confirmation",
      "/order-confirmation?orderId=123",
      "/cart",
      "/course-basket",
      "/learn/mastering-nextjs-15-enterprise-apps/lesson1",
      "/login",
      "/register",
      "/admin",
      "/admin/marketing/popups",
    ];

    for (const path of sensitivePaths) {
      const res = await fetch(`${BASE_URL}/api/popups/active?pathname=${encodeURIComponent(path)}`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.popup, null, `Path ${path} MUST NOT serve any popup`);
    }
  });

  // 9. Audience Targeting Verification
  await test("Target audience filtering works (e.g. students only)", async () => {
    // Update to students only
    await fetch(`${BASE_URL}/api/admin/popups/${createdCampaignId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({ targetAudience: "students" }),
    });

    // Query without session (Guest) -> Should return null
    const guestRes = await fetch(`${BASE_URL}/api/popups/active?pathname=/courses`);
    const guestData = await guestRes.json();
    assert.equal(guestData.popup, null, "Guest should not receive students-only popup");

    // Query with student session -> Should return popup
    const studentRes = await fetch(`${BASE_URL}/api/popups/active?pathname=/courses`, {
      headers: { Cookie: studentCookie },
    });
    const studentData = await studentRes.json();
    assert.ok(studentData.popup, "Student should receive students-only popup");

    // Reset to "all"
    await fetch(`${BASE_URL}/api/admin/popups/${createdCampaignId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({ targetAudience: "all" }),
    });
  });

  // 10. Destination URL Security Validation
  await test("Admin API rejects dangerous destination URLs (javascript:, data:)", async () => {
    const dangerousRes = await fetch(`${BASE_URL}/api/admin/popups/${createdCampaignId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({ ctaUrl: "javascript:alert('xss')" }),
    });

    assert.equal(dangerousRes.status, 400, "Should reject javascript: link with 400 Bad Request");
    const data = await dangerousRes.json();
    assert.equal(data.success, false);
    assert.ok(data.error.includes("CTA destination URL"));
  });

  // 11. Analytics Tracking Endpoints
  await test("Impression, Click, and Dismissal tracking endpoints increment counts correctly", async () => {
    // Impression
    const impRes = await fetch(`${BASE_URL}/api/popups/${createdCampaignId}/impression`, {
      method: "POST",
    });
    assert.equal(impRes.status, 200);
    const impData = await impRes.json();
    assert.equal(impData.success, true);

    // Click
    const clickRes = await fetch(`${BASE_URL}/api/popups/${createdCampaignId}/click`, {
      method: "POST",
    });
    assert.equal(clickRes.status, 200);
    const clickData = await clickRes.json();
    assert.equal(clickData.success, true);

    // Dismissal
    const disRes = await fetch(`${BASE_URL}/api/popups/${createdCampaignId}/dismiss`, {
      method: "POST",
    });
    assert.equal(disRes.status, 200);
    const disData = await disRes.json();
    assert.equal(disData.success, true);

    // Verify counter persistence in DB
    const verifyDoc = await PopupCampaign.findById(createdCampaignId);
    assert.equal(verifyDoc?.impressions, 1, "DB impressions should be 1");
    assert.equal(verifyDoc?.clicks, 1, "DB clicks should be 1");
    assert.equal(verifyDoc?.dismissals, 1, "DB dismissals should be 1");
  });

  // 12. Campaign Duplication
  let duplicateId = "";
  await test("Admin can duplicate a campaign as a disabled draft", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/popups/${createdCampaignId}/duplicate`, {
      method: "POST",
      headers: { Cookie: adminCookie },
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.campaign.name.includes("(Copy)"));
    assert.equal(data.campaign.status, "draft");
    assert.equal(data.campaign.isEnabled, false);
    duplicateId = data.campaign._id;
  });

  // 13. Clean up / Restore strictly OFF state
  await test("Cleanup: Delete test campaigns and confirm POPUP OFF state", async () => {
    if (createdCampaignId) {
      await fetch(`${BASE_URL}/api/admin/popups/${createdCampaignId}`, {
        method: "DELETE",
        headers: { Cookie: adminCookie },
      });
    }
    if (duplicateId) {
      await fetch(`${BASE_URL}/api/admin/popups/${duplicateId}`, {
        method: "DELETE",
        headers: { Cookie: adminCookie },
      });
    }

    // Ensure zero enabled campaigns exist in DB
    await PopupCampaign.updateMany({}, { isEnabled: false });

    const res = await fetch(`${BASE_URL}/api/popups/active?pathname=/courses`);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.popup, null, "Active popup must remain null after cleanup");
  });

  console.log(`\n======================================================`);
  console.log(`  Popup Verification Results: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runPopupTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Popup test runner failed:", err);
    process.exit(1);
  });
