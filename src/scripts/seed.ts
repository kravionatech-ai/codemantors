import { runDatabaseSeed } from "../lib/seed";
import mongoose from "mongoose";

async function main() {
  const args = process.argv.slice(2);
  const reset = args.includes("--reset");
  const dryRun = args.includes("--dry-run");
  const forceDev = args.includes("--force-dev");

  console.log("=================================================");
  console.log("🌱 CodeMentors LMS - Database Seeder CLI");
  console.log("=================================================");
  if (dryRun) console.log("Mode: DRY RUN (Validation Only)");
  if (reset) console.log("Mode: HARD RESET (Clearing development collections)");
  if (forceDev) console.log("Flag: --force-dev enabled");

  try {
    const report = await runDatabaseSeed({ reset, dryRun, forceDev });

    console.log("\n=================================================");
    console.log("📊 Seeding Summary Report");
    console.log("=================================================");
    console.table({
      "Users Seeded": report.counts.users,
      "Categories Seeded": report.counts.categories,
      "Courses Seeded": report.counts.courses,
      "Modules Seeded": report.counts.modules,
      "Lessons Seeded": report.counts.lessons,
      "Quizzes Seeded": report.counts.quizzes,
      "Quiz Attempts Seeded": report.counts.quizAttempts,
      "Enrollments Seeded": report.counts.enrollments,
      "Certificates Seeded": report.counts.certificates,
      "Orders Seeded": report.counts.orders,
      "Payments Seeded": report.counts.payments,
      "Refunds Seeded": report.counts.refunds,
      "Popups Seeded": report.counts.popups,
      "SEO Metadata Pages": report.counts.seoPages,
      "Blog Posts Seeded": report.counts.blogPosts,
      "CMS Pages Seeded": report.counts.cmsPages,
      "Instructor Limits": report.counts.instructorLimits,
      "Audit Logs": report.counts.auditLogs,
      "Notifications": report.counts.notifications,
    });
    console.log(`⏱️ Completed in: ${report.durationMs}ms`);
    console.log("=================================================\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Database Seeding Failed:\n", error.message || error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();
