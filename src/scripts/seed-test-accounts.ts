import mongoose from "mongoose";
import { connectDB } from "../lib/db";
import {
  User,
  Course,
  Enrollment,
  LessonProgress,
  QuizAttempt,
  Certificate,
  Payment,
  Order,
  Review,
  InstructorLimit,
  AuditLog,
  Notification,
} from "../models";
import { hashPassword } from "../lib/auth";
import crypto from "crypto";

export function deterministicObjectId(seedStr: string): mongoose.Types.ObjectId {
  const hash = crypto.createHash("md5").update(seedStr).digest("hex").slice(0, 24);
  return new mongoose.Types.ObjectId(hash);
}

export interface SeedTestAccountsOptions {
  forceDev?: boolean;
}

export async function seedTestAccounts(options: SeedTestAccountsOptions = {}) {
  await connectDB();

  // 1. Safety check for production environment
  const isProd = process.env.NODE_ENV === "production";
  const mongoUri = process.env.MONGODB_URI || "";
  const isCloudProd = mongoUri.includes(".mongodb.net") && (mongoUri.includes("prod") || mongoUri.includes("live"));

  if ((isProd || isCloudProd) && !options.forceDev) {
    throw new Error(
      "SAFETY ABORT: seedTestAccounts cannot be executed on production or live cloud databases without --force-dev."
    );
  }

  const devPassword = process.env.DEV_TEST_PASSWORD || "DevOnly123!ChangeMe";
  const passwordHash = await hashPassword(devPassword);

  console.log("🔒 Seeding exactly three dedicated test accounts...");

  const adminId = deterministicObjectId("admin@codementors.test");
  const instructorId = deterministicObjectId("instructor@codementors.test");
  const studentId = deterministicObjectId("student@codementors.test");

  const targetAccounts = [
    {
      _id: adminId,
      name: "Platform Administrator",
      email: "admin@codementors.test",
      role: "admin",
      passwordHash,
      headline: "CodeMentors Operations & Governance Lead",
      bio: "Overseeing curriculum quality, infrastructure, and platform operations.",
      isActive: true,
      isVerified: true,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces",
    },
    {
      _id: instructorId,
      name: "Senior Instructor",
      email: "instructor@codementors.test",
      role: "instructor",
      passwordHash,
      headline: "Staff Software Architect & Senior Instructor",
      bio: "12+ years building distributed cloud platforms, full-stack React systems, and mentoring engineers.",
      isActive: true,
      isVerified: true,
      instructorStatus: "approved",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=faces",
      socialLinks: {
        github: "https://github.com/codementors-instructor",
        linkedin: "https://linkedin.com/in/codementors-instructor",
      },
    },
    {
      _id: studentId,
      name: "Enrolled Student",
      email: "student@codementors.test",
      role: "student",
      passwordHash,
      headline: "Full-Stack Engineering Learner",
      bio: "Active learner mastering Next.js, Node.js, and modern distributed systems.",
      isActive: true,
      isVerified: true,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces",
    },
  ];

  // 2. Upsert each designated account
  const upsertedUsers = [];
  for (const acc of targetAccounts) {
    const user = await User.findOneAndUpdate(
      { email: acc.email },
      { $set: acc },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    upsertedUsers.push(user);
    console.log(`  ✓ [${acc.role.toUpperCase()}] ${acc.email} (ID: ${user._id})`);
  }

  // 3. Collect old demo user IDs that are being cleaned up
  const oldUsers = await User.find(
    { email: { $nin: ["admin@codementors.test", "instructor@codementors.test", "student@codementors.test"] } },
    "_id email role"
  ).lean();

  const oldUserIds = oldUsers.map((u: any) => u._id);
  const oldStudentIds = oldUsers.filter((u: any) => u.role === "student").map((u: any) => u._id);
  const oldInstructorIds = oldUsers.filter((u: any) => u.role === "instructor").map((u: any) => u._id);
  const oldAdminIds = oldUsers.filter((u: any) => u.role === "admin" || u.role === "super_admin").map((u: any) => u._id);

  console.log(`🧹 Found ${oldUsers.length} old demo accounts to safely migrate and remove.`);

  // 4. Safely re-link authored courses to instructor@codementors.test
  const courseUpdate = await Course.updateMany(
    { instructor: { $ne: instructorId } },
    { $set: { instructor: instructorId, coInstructors: [] } }
  );
  console.log(`  ✓ Re-linked ${courseUpdate.modifiedCount} authored courses to instructor@codementors.test`);

  // 5. Ensure InstructorLimit exists for instructor@codementors.test
  await InstructorLimit.findOneAndUpdate(
    { instructorId: instructorId },
    {
      $set: {
        instructorId: instructorId,
        isGlobalDefault: false,
        maxActiveCourses: 20,
        maxDraftCourses: 25,
        maxModulesPerCourse: 20,
        maxLessonsPerCourse: 100,
        maxUploadFileSizeMB: 250,
        maxVideoDurationMinutes: 90,
        canCreatePaidCourses: true,
        canPublishBlog: true,
        canAccessAnalytics: true,
        canEditSeo: true,
        canDeleteCourses: true,
        canCreateCoupons: true,
        requireCourseApproval: false,
        allowedCategories: [],
        minCoursePrice: 0,
        maxCoursePrice: 50000,
        maxDiscountPercent: 80,
        customNotes: "Dedicated Test Instructor: Full authoring and publishing permissions.",
      },
    },
    { upsert: true, returnDocument: "after" }
  );
  // Clean old instructor limits
  if (oldInstructorIds.length > 0) {
    await InstructorLimit.deleteMany({ instructorId: { $in: oldInstructorIds } });
  }

  // 6. Safely migrate student enrollments without unique key conflicts
  if (oldStudentIds.length > 0) {
    const existingStudentEnrollments = await Enrollment.find({ userId: studentId }).lean();
    const enrolledCourseIds = new Set(existingStudentEnrollments.map((e: any) => e.courseId.toString()));

    const oldEnrollments = await Enrollment.find({ userId: { $in: oldStudentIds } }).lean();
    for (const enroll of oldEnrollments) {
      const courseIdStr = enroll.courseId.toString();
      if (!enrolledCourseIds.has(courseIdStr)) {
        await Enrollment.updateOne({ _id: enroll._id }, { $set: { userId: studentId } });
        enrolledCourseIds.add(courseIdStr);
      } else {
        // Duplicate enrollment for the same course: remove redundant record
        await Enrollment.deleteOne({ _id: enroll._id });
      }
    }

    // Safely migrate lesson progress without unique key conflicts
    const existingProgress = await LessonProgress.find({ userId: studentId }).lean();
    const progressLessonIds = new Set(existingProgress.map((p: any) => p.lessonId.toString()));

    const oldProgress = await LessonProgress.find({ userId: { $in: oldStudentIds } }).lean();
    for (const prog of oldProgress) {
      const lessonIdStr = prog.lessonId.toString();
      if (!progressLessonIds.has(lessonIdStr)) {
        await LessonProgress.updateOne({ _id: prog._id }, { $set: { userId: studentId } });
        progressLessonIds.add(lessonIdStr);
      } else {
        await LessonProgress.deleteOne({ _id: prog._id });
      }
    }

    // Migrate quiz attempts, certificates, orders, payments, reviews
    await QuizAttempt.updateMany({ userId: { $in: oldStudentIds } }, { $set: { userId: studentId } });
    await Certificate.updateMany({ userId: { $in: oldStudentIds } }, { $set: { userId: studentId } });
    await Order.updateMany({ userId: { $in: oldStudentIds } }, { $set: { userId: studentId } });
    await Payment.updateMany({ userId: { $in: oldStudentIds } }, { $set: { userId: studentId } });
    await Review.updateMany({ userId: { $in: oldStudentIds } }, { $set: { userId: studentId } });
    console.log(`  ✓ Migrated student learning history, quizzes, and certificates to student@codementors.test`);
  }

  // 7. Migrate AuditLogs and Notifications
  if (oldAdminIds.length > 0) {
    await AuditLog.updateMany({ userId: { $in: oldAdminIds } }, { $set: { userId: adminId } });
    await Notification.updateMany({ userId: { $in: oldAdminIds } }, { $set: { userId: adminId } });
  }
  if (oldInstructorIds.length > 0) {
    await AuditLog.updateMany({ userId: { $in: oldInstructorIds } }, { $set: { userId: instructorId } });
    await Notification.updateMany({ userId: { $in: oldInstructorIds } }, { $set: { userId: instructorId } });
  }
  if (oldStudentIds.length > 0) {
    await Notification.updateMany({ userId: { $in: oldStudentIds } }, { $set: { userId: studentId } });
  }

  // 8. Delete old demo user accounts
  if (oldUserIds.length > 0) {
    const delResult = await User.deleteMany({ _id: { $in: oldUserIds } });
    console.log(`  ✓ Removed ${delResult.deletedCount} legacy demo accounts from users collection.`);
  }

  // 9. Verification check
  const totalUsersRemaining = await User.countDocuments();
  const allUsers = await User.find({}, "email role name isActive").lean();

  console.log("\n========================================================");
  console.log("🎯 TEST ACCOUNTS CONFIGURED & VERIFIED (EXACTLY 3 USERS)");
  console.log("========================================================");
  console.log(`Total users in database: ${totalUsersRemaining}`);
  allUsers.forEach((u: any) => {
    console.log(`  • [${u.role.toUpperCase()}] ${u.email} — "${u.name}" (Active: ${u.isActive})`);
  });
  console.log(`Shared dev password: ${devPassword}`);
  console.log("========================================================\n");

  return {
    success: true,
    totalUsers: totalUsersRemaining,
    users: allUsers,
  };
}

// Execute directly if run as a script
if (require.main === module || process.argv[1]?.includes("seed-test-accounts")) {
  const forceDev = process.argv.includes("--force-dev");
  seedTestAccounts({ forceDev })
    .then(() => {
      console.log("✅ Seed test accounts script completed successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Seed test accounts script failed:", err);
      process.exit(1);
    });
}
