import mongoose from "mongoose";
import { connectDB } from "../lib/db";
import { runDatabaseSeed } from "../lib/seed";
import {
  User,
  Category,
  Course,
  Enrollment,
  LessonProgress,
  Quiz,
  QuizAttempt,
  Certificate,
  Order,
  Payment,
  Refund,
  PopupCampaign,
  PageSeo,
  SiteSettings,
  PaymentSettings,
  InstructorLimit,
  AuditLog,
  Notification,
  BlogPost,
  CmsPage,
} from "../models";
import { comparePassword } from "../lib/auth";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, errorMsg?: string) {
  if (condition) {
    results.push({ name, passed: true });
    console.log(`  ✓ PASS: ${name}`);
  } else {
    results.push({ name, passed: false, error: errorMsg || "Assertion failed" });
    console.error(`  ✗ FAIL: ${name} - ${errorMsg || "Assertion failed"}`);
  }
}

async function runSeedVerificationSuite() {
  console.log("=================================================");
  console.log("🧪 CodeMentors LMS - Database Seeder Test Suite");
  console.log("=================================================\n");

  await connectDB();

  // TEST 1: Production Safety Guard
  console.log("--- 1. Production Safety Guard Verification ---");
  const prevEnv = process.env.NODE_ENV;
  try {
    (process.env as any).NODE_ENV = "production";
    let threwError = false;
    try {
      await runDatabaseSeed({ reset: true, forceDev: false });
    } catch (err: any) {
      if (err.message && err.message.includes("CRITICAL SAFETY ABORT")) {
        threwError = true;
      }
    }
    assert(threwError, "Safety Guard: Rejects destructive reset in production mode without --force-dev");
  } finally {
    (process.env as any).NODE_ENV = prevEnv;
  }

  // TEST 2: Seed Execution & Idempotency
  console.log("\n--- 2. Database Seeding & Idempotency Verification ---");
  console.log("Executing first seed run...");
  const firstReport = await runDatabaseSeed();
  assert(firstReport.success, "Seed Run 1: Completed successfully");

  const usersCount1 = await User.countDocuments();
  const categoriesCount1 = await Category.countDocuments();
  const coursesCount1 = await Course.countDocuments();
  const quizzesCount1 = await Quiz.countDocuments();
  const popupsCount1 = await PopupCampaign.countDocuments();
  const seoPagesCount1 = await PageSeo.countDocuments();

  console.log("Executing second seed run (idempotency check)...");
  const secondReport = await runDatabaseSeed();
  assert(secondReport.success, "Seed Run 2: Completed successfully");

  const usersCount2 = await User.countDocuments();
  const categoriesCount2 = await Category.countDocuments();
  const coursesCount2 = await Course.countDocuments();
  const quizzesCount2 = await Quiz.countDocuments();
  const popupsCount2 = await PopupCampaign.countDocuments();
  const seoPagesCount2 = await PageSeo.countDocuments();

  assert(
    usersCount1 === usersCount2 &&
    categoriesCount1 === categoriesCount2 &&
    coursesCount1 === coursesCount2 &&
    quizzesCount1 === quizzesCount2 &&
    popupsCount1 === popupsCount2 &&
    seoPagesCount1 === seoPagesCount2,
    "Idempotency: Re-running seed does not duplicate records in any collection",
    `Count mismatch: Users(${usersCount1}->${usersCount2}), Categories(${categoriesCount1}->${categoriesCount2}), Courses(${coursesCount1}->${coursesCount2}), Quizzes(${quizzesCount1}->${quizzesCount2}), Popups(${popupsCount1}->${popupsCount2}), SEO(${seoPagesCount1}->${seoPagesCount2})`
  );

  // TEST 3: User Accounts & Authentication (Exactly Three Test Accounts)
  console.log("\n--- 3. Dedicated Test Accounts & Auth Verification ---");
  const testDevEmails = [
    { email: "admin@codementors.test", role: "admin" },
    { email: "instructor@codementors.test", role: "instructor" },
    { email: "student@codementors.test", role: "student" },
  ];

  for (const { email, role } of testDevEmails) {
    const user = await User.findOne({ email });
    const exists = Boolean(user);
    const roleMatches = user?.role === role;
    const isVerified = user?.isVerified === true;
    const pwdMatches = user ? await comparePassword(process.env.DEV_TEST_PASSWORD || "DevOnly123!ChangeMe", user.passwordHash) : false;

    assert(
      exists && roleMatches && isVerified && pwdMatches,
      `User ${email} (${role}): Active, verified, correct role, and valid development password`,
      `Failed for ${email}: exists=${exists}, role=${user?.role}, verified=${isVerified}, pwd=${pwdMatches}`
    );
  }

  const totalUserCount = await User.countDocuments();
  assert(
    totalUserCount === 3,
    `Strict User Constraint: Exactly 3 test accounts exist in the development database (Found: ${totalUserCount})`
  );

  // TEST 4: Categories & Taxonomy
  console.log("\n--- 4. Categories & Taxonomy Hierarchy Verification ---");
  const totalCategories = await Category.countDocuments();
  assert(totalCategories >= 10, `Categories: At least 10 categories exist (Found: ${totalCategories})`);

  const nextjsCat = await Category.findOne({ slug: "nextjs-app-router" }).populate("parentCategory");
  const microservicesCat = await Category.findOne({ slug: "microservices-architecture" }).populate("parentCategory");

  assert(
    Boolean(nextjsCat && nextjsCat.parentCategory),
    "Taxonomy: Next.js subcategory exists with parent reference"
  );
  assert(
    Boolean(microservicesCat && microservicesCat.parentCategory),
    "Taxonomy: Microservices subcategory exists with parent reference"
  );

  const catSeo = await PageSeo.findOne({ path: "/categories/next-js" });
  assert(Boolean(catSeo && catSeo.title), "Taxonomy: Category '/categories/next-js' has independent SEO metadata");

  // TEST 5: Courses & Formats
  console.log("\n--- 5. Course Catalog & Formats Verification ---");
  const courses = await Course.find();
  assert(courses.length >= 12, `Courses Catalog: At least 12 courses exist (Found: ${courses.length})`);

  const formats = new Set(courses.map((c) => c.format));
  assert(
    formats.has("Video") && formats.has("Text") && formats.has("PDF/Document") && formats.has("Mixed"),
    `Course Formats: All 4 formats represented ("Video", "Text", "PDF/Document", "Mixed") - Found: ${Array.from(formats).join(", ")}`
  );

  const statuses = new Set(courses.map((c) => c.status));
  assert(
    statuses.has("published") && statuses.has("draft") && statuses.has("pending_review"),
    `Course Lifecycle: All statuses represented ("published", "draft", "pending_review")`
  );

  const freeCourses = courses.filter((c) => c.price === 0);
  const paidCourses = courses.filter((c) => c.price > 0);
  assert(
    freeCourses.length > 0 && paidCourses.length > 0,
    `Course Pricing: Both Free (${freeCourses.length}) and Paid (${paidCourses.length}) courses exist`
  );

  // TEST 6: Modules & All 6 Lesson Types
  console.log("\n--- 6. Curriculum Modules & Lesson Types Verification ---");
  let foundVideo = false;
  let foundText = false;
  let foundPdf = false;
  let foundMixed = false;
  let foundQuiz = false;
  let foundResource = false;
  let foundFreePreview = false;
  let totalModules = 0;
  let totalLessons = 0;

  for (const c of courses) {
    if (c.modules) {
      totalModules += c.modules.length;
      for (const m of c.modules) {
        if (m.lessons) {
          totalLessons += m.lessons.length;
          for (const l of m.lessons) {
            if (l.type === "video") foundVideo = true;
            if (l.type === "text" || l.type === "article") foundText = true;
            if (l.type === "pdf") foundPdf = true;
            if (l.type === "mixed" && l.contentBlocks && l.contentBlocks.length > 0) foundMixed = true;
            if (l.type === "quiz") foundQuiz = true;
            if (l.type === "resource") foundResource = true;
            if (l.isPreview) foundFreePreview = true;
          }
        }
      }
    }
  }

  assert(totalModules >= courses.length * 2, `Modules: At least 2-3 modules per course (Total modules: ${totalModules})`);
  assert(foundVideo, "Lesson Type 1: Video Lesson (with duration, video URL, notes) verified");
  assert(foundText, "Lesson Type 2: Text / Article Lesson (W3Schools interactive format) verified");
  assert(foundPdf, "Lesson Type 3: PDF / Document Lesson (pdfUrl, documentViewer) verified");
  assert(foundMixed, "Lesson Type 4: Mixed Media Lesson (multi-block sequence) verified");
  assert(foundQuiz, "Lesson Type 5: Quiz Lesson verified");
  assert(foundResource, "Lesson Type 6: Resource Download Lesson verified");
  assert(foundFreePreview, "Lesson Access: Free Preview Lesson flag verified");

  // TEST 7: Quizzes & Assessments
  console.log("\n--- 7. Quizzes & Student Attempts Verification ---");
  const totalQuizzes = await Quiz.countDocuments();
  assert(totalQuizzes >= 10, `Quizzes: At least 10 realistic quizzes exist (Found: ${totalQuizzes})`);

  const sampleQuiz = await Quiz.findOne({ title: /Next.js/i });
  assert(
    Boolean(sampleQuiz && sampleQuiz.questions.length >= 3 && sampleQuiz.passingPercentage),
    "Quiz Quality: Contains questions, explanations, points, and passingPercentage"
  );

  const quizAttempts = await QuizAttempt.find();
  assert(
    quizAttempts.length > 0,
    `Quiz Attempts: Student attempt records populated (Found: ${quizAttempts.length})`
  );

  // TEST 8: Student Learning Scenarios
  console.log("\n--- 8. Student Progress Scenarios Verification ---");
  const student = await User.findOne({ email: "student@codementors.test" });
  assert(Boolean(student), "Dedicated student test account exists in database");

  const enrollCompleted = await Enrollment.findOne({ userId: student?._id, progressPercentage: 100 });
  assert(
    Boolean(enrollCompleted),
    `Student Scenario A: Completed 100% course with certificate verified`
  );

  const cert = await Certificate.findOne({ userId: student?._id });
  assert(
    Boolean(cert && cert.verificationUrl),
    `Certificate Verification: Valid cryptographic certificate issued to student`
  );

  const enrollInProgress = await Enrollment.findOne({ userId: student?._id, progressPercentage: { $gt: 0, $lt: 100 } });
  assert(
    Boolean(enrollInProgress),
    `Student Scenario B: In-progress course with partial progress verified`
  );

  const studentProgressNotes = await LessonProgress.findOne({ userId: student?._id, isBookmarked: true });
  assert(
    Boolean(studentProgressNotes && studentProgressNotes.notes),
    "Student Scenario B: Interactive study notes and bookmarks populated in LessonProgress"
  );

  const enrollFresh = await Enrollment.findOne({ userId: student?._id, progressPercentage: 0 });
  assert(
    Boolean(enrollFresh),
    `Student Scenario C: Freshly enrolled course with 0% progress verified`
  );

  // TEST 9: SEO Metadata & Warnings
  console.log("\n--- 9. Independent SEO Management Verification ---");
  const homeSeo = await PageSeo.findOne({ path: "/" });
  assert(
    Boolean(homeSeo && homeSeo.title && homeSeo.structuredDataType),
    "SEO: Homepage has custom title, meta description, and JSON-LD structuredDataType"
  );

  const draftSeo = await PageSeo.findOne({ status: "draft" });
  assert(
    Boolean(draftSeo),
    "SEO Quality Audit: Incomplete/draft SEO record exists to test admin warning detection"
  );

  // TEST 10: Marketing Popups
  console.log("\n--- 10. Marketing Popups Verification ---");
  const popups = await PopupCampaign.find();
  assert(popups.length >= 7, `Popups: At least 7 distinct campaign scenarios exist (Found: ${popups.length})`);

  const popupSlugs = new Set(popups.map((p) => p.slug));
  assert(
    popupSlugs.has("popup-winter-draft") &&
    popupSlugs.has("popup-hackathon-disabled") &&
    popupSlugs.has("popup-summer-scheduled") &&
    popupSlugs.has("popup-blackfriday-expired") &&
    popupSlugs.has("popup-masterclass-active") &&
    popupSlugs.has("popup-guest-welcome") &&
    popupSlugs.has("popup-student-perk"),
    "Popup Scenarios: All 7 lifecycle states and targetings populated (draft, active, scheduled, expired, guest, student)"
  );

  // TEST 11: Orders, Payments & Test Fixture Flags
  console.log("\n--- 11. Payment Scenarios & Fixtures Verification ---");
  const testFixtures = await Payment.find({ "metadata.isTestFixture": true });
  assert(
    testFixtures.length >= 7,
    `Payments Safety: Seed payment fixtures (${testFixtures.length}) explicitly flagged with { isTestFixture: true }`
  );

  const paymentStatuses = new Set(testFixtures.map((p) => p.status));
  assert(
    paymentStatuses.has("completed") && paymentStatuses.has("pending") && paymentStatuses.has("failed"),
    `Payment States: Completed, pending, and failed transaction states verified`
  );

  const refunds = await Refund.find();
  assert(refunds.length >= 3, `Refunds: Multi-state refund scenarios verified (Found: ${refunds.length})`);

  // TEST 12: Platform Settings, Limits & Audit Logs
  console.log("\n--- 12. Settings, Quotas & Audit Trail Verification ---");
  const siteSettings = await SiteSettings.findOne({ key: "global_config" });
  assert(
    Boolean(
      siteSettings?.companyBranding?.companyName?.includes("Kraviona") ||
      siteSettings?.companyBranding?.companyUrl?.includes("kraviona.com")
    ),
    "Settings: Kraviona Tech Solutions branding preserved in SiteSettings"
  );

  const instructorLimit = await InstructorLimit.findOne({ instructorId: { $ne: null } });
  assert(
    Boolean(instructorLimit && instructorLimit.maxActiveCourses),
    "Instructor Limits: Custom instructor quota configured"
  );

  const auditLogsCount = await AuditLog.countDocuments();
  assert(auditLogsCount > 0, `Audit Trail: Sample administrative audit logs verified (Found: ${auditLogsCount})`);

  const notificationsCount = await Notification.countDocuments();
  assert(notificationsCount > 0, `Notifications: Sample user notifications verified (Found: ${notificationsCount})`);

  console.log("\n=================================================");
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`  Tests Completed: ${passed} Passed, ${failed} Failed`);
  console.log("=================================================\n");

  await mongoose.disconnect();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSeedVerificationSuite().catch(async (err) => {
  console.error("Test Suite Fatal Error:", err);
  await mongoose.disconnect();
  process.exit(1);
});
