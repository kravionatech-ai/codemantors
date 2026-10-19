import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { connectDB } from "../lib/db";
import { Course } from "../models/Course";
import { User } from "../models/User";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:3005";
const SCREENSHOTS_DIR = path.resolve(process.cwd(), "docs", "screenshots");
const DEV_PASSWORD = process.env.DEV_TEST_PASSWORD || "DevOnly123!ChangeMe";

interface CaptureTarget {
  name: string;
  figure: string;
  caption: string;
  filename: string;
  role: "public" | "admin" | "instructor" | "student";
  path: string;
  actionBefore?: (page: any) => Promise<void>;
}

async function run() {
  console.log("=== CodeMentors Documentation Screenshot Automation ===");
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    console.log(`Created screenshots directory at: ${SCREENSHOTS_DIR}`);
  }

  await connectDB();
  const instructor = await User.findOne({ email: "instructor@codementors.test" });
  const instructorCourse = await Course.findOne({
    instructor: instructor?._id,
  }).sort({ updatedAt: -1 });

  const publishedCourse = await Course.findOne({ status: "published" });

  let curriculumUrl = "/instructor/courses/new";
  if (instructorCourse) {
    curriculumUrl = `/instructor/courses/${instructorCourse._id}/curriculum`;
  }

  let studentLearnUrl = "/student/dashboard";
  if (publishedCourse && publishedCourse.modules?.[0]?.lessons?.[0]) {
    const mod = publishedCourse.modules[0];
    const lesson = mod.lessons[0];
    studentLearnUrl = `/learn/${publishedCourse.slug}/${lesson._id}`;
  }

  console.log(`Curriculum target: ${curriculumUrl}`);
  console.log(`Student learning target: ${studentLearnUrl}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1440,900",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  async function loginAs(email: string) {
    console.log(`Authenticating session as: ${email}...`);
    // Navigate to /login first to establish origin context
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });

    // Call /api/auth/login directly inside the page context
    const loginResult = await page.evaluate(
      async (em, pw) => {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: em, password: pw }),
        });
        return res.json();
      },
      email,
      DEV_PASSWORD
    );

    console.log(`Login response for ${email}:`, loginResult?.success ? "Success" : "Failed");
    await new Promise((r) => setTimeout(r, 800));
  }

  const results: Array<{
    figure: string;
    caption: string;
    filename: string;
    url: string;
    role: string;
    status: "Captured" | "Error";
    sizeBytes?: number;
  }> = [];

  async function capture(target: CaptureTarget) {
    console.log(`Capturing [${target.figure}] ${target.name}...`);
    const filePath = path.join(SCREENSHOTS_DIR, target.filename);
    try {
      await page.goto(`${BASE_URL}${target.path}`, { waitUntil: "networkidle0", timeout: 25000 });
      await new Promise((r) => setTimeout(r, 1500));

      if (target.actionBefore) {
        await target.actionBefore(page);
        await new Promise((r) => setTimeout(r, 1000));
      }

      await page.screenshot({ path: filePath, fullPage: false });
      const stats = fs.statSync(filePath);
      console.log(`✔ [${target.figure}] Saved: ${target.filename} (${Math.round(stats.size / 1024)} KB)`);
      results.push({
        figure: target.figure,
        caption: target.caption,
        filename: target.filename,
        url: target.path,
        role: target.role,
        status: "Captured",
        sizeBytes: stats.size,
      });
    } catch (err: any) {
      console.error(`✖ Failed to capture ${target.figure}:`, err.message);
      results.push({
        figure: target.figure,
        caption: target.caption,
        filename: target.filename,
        url: target.path,
        role: target.role,
        status: "Error",
      });
    }
  }

  // 1. PUBLIC
  await capture({
    figure: "Figure 1",
    name: "User Authentication & Sign-In Interface",
    caption: "CodeMentors secure authentication and login screen with role redirection",
    filename: "fig01_login_portal.png",
    role: "public",
    path: "/login",
  });

  // 2. ADMIN
  await loginAs("admin@codementors.test");

  await capture({
    figure: "Figure 2",
    name: "Admin Executive Dashboard",
    caption: "Executive platform analytics, active counts, and platform status",
    filename: "fig02_admin_dashboard.png",
    role: "admin",
    path: "/admin/dashboard",
  });

  await capture({
    figure: "Figure 3",
    name: "User & Role Permissions Management",
    caption: "Administrative user table with role badges, status switches, and permission controls",
    filename: "fig03_admin_users.png",
    role: "admin",
    path: "/admin/users",
  });

  await capture({
    figure: "Figure 4",
    name: "Course Governance & Moderation",
    caption: "Course catalog governance table showing publication state, instructor assignments, and actions",
    filename: "fig04_admin_course_moderation.png",
    role: "admin",
    path: "/admin/courses",
  });

  await capture({
    figure: "Figure 5",
    name: "Course Category Hierarchy & Taxonomy",
    caption: "Category management view with parent-child nesting, slug, icon, and course count",
    filename: "fig05_admin_category_management.png",
    role: "admin",
    path: "/admin/categories",
  });

  await capture({
    figure: "Figure 6",
    name: "SEO Control Center & Page Metadata",
    caption: "Centralized technical SEO manager with audit indicators and OpenGraph configuration",
    filename: "fig06_admin_seo_center.png",
    role: "admin",
    path: "/admin/seo",
  });

  await capture({
    figure: "Figure 7",
    name: "Event & Marketing Popup Campaign Studio",
    caption: "Promotional campaign studio managing lifecycle triggers, frequency caps, and CTA buttons",
    filename: "fig07_admin_popup_campaigns.png",
    role: "admin",
    path: "/admin/marketing/popups",
  });

  await capture({
    figure: "Figure 8",
    name: "Razorpay Payment & Gateway Settings",
    caption: "Financial settings console with Mode switch (Test/Live), Webhook secret, and theme customization",
    filename: "fig08_admin_razorpay_settings.png",
    role: "admin",
    path: "/admin/settings/payments",
  });

  // 3. INSTRUCTOR
  await loginAs("instructor@codementors.test");

  await capture({
    figure: "Figure 9",
    name: "Instructor Studio Dashboard",
    caption: "Instructor Studio KPI cards, course performance comparisons, and quota usage",
    filename: "fig09_instructor_studio_dashboard.png",
    role: "instructor",
    path: "/instructor/dashboard",
  });

  await capture({
    figure: "Figure 10",
    name: "Course Creation Studio",
    caption: "Multi-step course wizard with RichTextEditor, pricing controls, and metadata fields",
    filename: "fig10_instructor_course_builder.png",
    role: "instructor",
    path: "/instructor/courses/new",
  });

  await capture({
    figure: "Figure 11",
    name: "Curriculum Builder & Module Structure",
    caption: "Curriculum tree builder showing nested modules, lessons, and hierarchy controls",
    filename: "fig11_instructor_curriculum_builder.png",
    role: "instructor",
    path: curriculumUrl,
  });

  await capture({
    figure: "Figure 12",
    name: "Video & Media Lesson Editor",
    caption: "Video lesson modal configuring streaming URLs, duration minutes, and rich lesson notes",
    filename: "fig12_instructor_video_lesson_editor.png",
    role: "instructor",
    path: curriculumUrl,
    actionBefore: async (p) => {
      // Find and click the edit button for first lesson
      const editBtn = await p.$('button[title="Edit Lesson"]');
      if (editBtn) {
        await editBtn.click();
      }
    },
  });

  await capture({
    figure: "Figure 13",
    name: "PDF & Text Document Lesson Studio",
    caption: "Interactive rich-text and document lesson editor with Markdown importer and live preview tabs",
    filename: "fig13_instructor_document_lesson_studio.png",
    role: "instructor",
    path: curriculumUrl,
    actionBefore: async (p) => {
      // Open lesson modal
      const editBtn = await p.$('button[title="Edit Lesson"]');
      if (editBtn) {
        await editBtn.click();
        await new Promise((r) => setTimeout(r, 600));
        // Select Text / Article Lesson option in type selector if present
        const typeSelect = await p.$('select[name="lessonType"]');
        if (typeSelect) {
          await p.select('select[name="lessonType"]', "text");
        }
      }
    },
  });

  // 4. STUDENT
  await loginAs("student@codementors.test");

  await capture({
    figure: "Figure 14",
    name: "Student Learning Center Dashboard",
    caption: "Student portal with active enrolled courses, progress bars, certificate shelf, and announcements",
    filename: "fig14_student_learning_center.png",
    role: "student",
    path: "/student/dashboard",
  });

  await capture({
    figure: "Figure 15",
    name: "Interactive Learning Player & Notes Reader",
    caption: "Immersive course player with video stream, curriculum sidebar, and formatted study notebook",
    filename: "fig15_student_course_player.png",
    role: "student",
    path: studentLearnUrl,
  });

  await capture({
    figure: "Figure 16",
    name: "Course Basket & Checkout Workspace",
    caption: "Multi-item course shopping cart and Razorpay checkout order summary",
    filename: "fig16_student_course_basket.png",
    role: "student",
    path: "/cart",
  });

  await browser.close();

  console.log("\n=======================================================");
  console.log("SCREENSHOT AUTOMATION COMPLETE");
  console.log(`Total Target Figures: ${results.length}`);
  console.log(`Successfully Captured: ${results.filter((r) => r.status === "Captured").length}`);
  console.log("=======================================================\n");

  return results;
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal screenshot runner error:", err);
    process.exit(1);
  });
