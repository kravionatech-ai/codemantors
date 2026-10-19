import { runDatabaseSeed } from "../lib/seed";
import mongoose from "mongoose";

async function main() {
  const args = process.argv.slice(2);
  const forceDev = args.includes("--force-dev");

  console.log("=================================================");
  console.log("⚠️  CodeMentors LMS - Development Database Reset");
  console.log("=================================================");
  console.log("Resetting all development collections and re-seeding fresh data...");

  try {
    const report = await runDatabaseSeed({ reset: true, forceDev });

    console.log("\n=================================================");
    console.log("✨ Reset and Reseed Complete");
    console.log("=================================================");
    console.log(`⏱️ Completed in: ${report.durationMs}ms`);
    console.log(`Users: ${report.counts.users} | Courses: ${report.counts.courses} | Lessons: ${report.counts.lessons}`);
    console.log("=================================================\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Database Reset Failed:\n", error.message || error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();
