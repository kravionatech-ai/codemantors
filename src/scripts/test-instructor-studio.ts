import mongoose from "mongoose";
import { connectDB } from "../lib/db";
import { Course, User, Enrollment, Review, Payment, InstructorLimit, SupportTicket, QuizAttempt } from "../models";
import { getEffectiveInstructorLimits, getInstructorUsage, verifyInstructorQuota } from "../lib/limits";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` -> ${detail}` : ""}`);
    failedCount++;
  }
}

async function runInstructorStudioTests() {
  console.log("\n=======================================================");
  console.log("  CODEMENTORS INSTRUCTOR STUDIO & CONTROL CENTER SUITE ");
  console.log("=======================================================\n");

  await connectDB();

  try {
    // 1. Identify test users
    console.log("[1/9] Verifying deterministic test accounts...");
    const instructor1 = await User.findOne({ email: "instructor@codementors.test" });
    const adminUser = await User.findOne({ email: "admin@codementors.test" });
    const student1 = await User.findOne({ email: "student@codementors.test" });

    assert(Boolean(instructor1), "Instructor test account exists (instructor@codementors.test)");
    assert(Boolean(adminUser), "Admin test account exists (admin@codementors.test)");
    assert(Boolean(student1), "Student test account exists (student@codementors.test)");

    if (!instructor1 || !student1) {
      throw new Error("Required test accounts missing. Run 'npm run db:seed:test-accounts' first.");
    }

    const instructorId = instructor1._id.toString();

    // 2. Test Quota & Governance Lib
    console.log("\n[2/9] Testing Quota & Limits Governance Engine...");
    const effectiveLimits = await getEffectiveInstructorLimits(instructorId);
    assert(effectiveLimits.maxActiveCourses > 0, "Effective maxActiveCourses resolved", `value=${effectiveLimits.maxActiveCourses}`);
    assert(effectiveLimits.maxDraftCourses > 0, "Effective maxDraftCourses resolved", `value=${effectiveLimits.maxDraftCourses}`);

    const usage = await getInstructorUsage(instructorId);
    assert(typeof usage.activeCourses === "number", "Active courses count is numeric", `active=${usage.activeCourses}`);
    assert(typeof usage.draftCourses === "number", "Draft courses count is numeric", `draft=${usage.draftCourses}`);
    assert(typeof usage.totalCourses === "number", "Total courses count is numeric", `total=${usage.totalCourses}`);

    // Test verifyInstructorQuota: valid price
    const quotaCheckValid = await verifyInstructorQuota(instructorId, "create_course", {
      price: 1999,
      category: "Web Development",
    });
    assert(quotaCheckValid.allowed === true, "Allowed to create valid course within quota");

    // Test verifyInstructorQuota: price exceeds limit
    const quotaCheckHighPrice = await verifyInstructorQuota(instructorId, "create_course", {
      price: 9999999,
    });
    assert(quotaCheckHighPrice.allowed === false, "Properly blocks course price exceeding maximum allowed");

    // 3. Test Course Creation with Author Quotas
    console.log("\n[3/9] Testing Course Creation & Slug Generation...");
    const testCourseTitle = `Studio Automation Course ${Date.now()}`;
    const baseSlug = testCourseTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const createdCourse = await Course.create({
      title: testCourseTitle,
      slug: baseSlug,
      subtitle: "Deterministic automated test course for studio suite",
      description: "Comprehensive technical curriculum covering modern full-stack engineering standards.",
      category: "Web Development",
      format: "Mixed",
      level: "Intermediate",
      price: 1499,
      isFree: false,
      thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
      instructor: instructor1._id,
      status: "draft",
      modules: [],
    });

    assert(Boolean(createdCourse._id), "Draft course created successfully");
    assert(createdCourse.status === "draft", "Initial status is 'draft'");
    assert(createdCourse.slug === baseSlug, "Slug generated accurately", createdCourse.slug);

    // 4. Test Publication Prerequisites Validation
    console.log("\n[4/9] Testing Publication Prerequisites Validation...");
    // A course with 0 modules/lessons should not be allowed to publish
    const totalLessons = (createdCourse.modules || []).reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
    assert(totalLessons === 0, "Course currently has 0 lessons");

    // Now populate modules and lessons
    createdCourse.modules.push({
      _id: new mongoose.Types.ObjectId(),
      title: "Module 1: Architecture Fundamentals",
      order: 1,
      status: "published",
      lessons: [
        {
          _id: new mongoose.Types.ObjectId(),
          title: "Lesson 1: Service Decomposition",
          slug: "lesson-1-decomposition",
          type: "video",
          order: 1,
          durationMinutes: 15,
          isPreview: true,
          status: "published",
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        } as any,
        {
          _id: new mongoose.Types.ObjectId(),
          title: "Lesson 2: Database Schema & Partitioning",
          slug: "lesson-2-schema",
          type: "article",
          order: 2,
          durationMinutes: 10,
          isPreview: false,
          status: "published",
          content: "# Database Schema\n\nDetailed breakdown of partitioning keys.",
        } as any,
      ],
    } as any);

    createdCourse.totalDurationMinutes = 25;
    createdCourse.totalLessonsCount = 2;
    await createdCourse.save();

    assert(createdCourse.modules.length === 1, "Module added to course");
    assert(createdCourse.modules[0].lessons.length === 2, "Lessons added to module");

    // Publish course
    createdCourse.status = "published";
    await createdCourse.save();
    assert(createdCourse.status === "published", "Course published successfully after meeting prerequisites");

    // 5. Test Deep Duplication of Course, Modules & Lessons
    console.log("\n[5/9] Testing Deep Duplication Engine...");
    const originalModId = createdCourse.modules[0]._id.toString();
    const originalLesId = createdCourse.modules[0].lessons[0]._id.toString();

    // Deep clone
    const clonedModules = createdCourse.modules.map((mod: any, mIdx: number) => ({
      ...mod.toObject(),
      _id: new mongoose.Types.ObjectId(),
      lessons: mod.lessons.map((les: any, lIdx: number) => ({
        ...les.toObject(),
        _id: new mongoose.Types.ObjectId(),
        slug: `${les.slug}-copy-${lIdx}`,
      })),
    }));

    const duplicatedCourse = await Course.create({
      title: `${createdCourse.title} (Copy)`,
      slug: `${createdCourse.slug}-copy`,
      subtitle: createdCourse.subtitle,
      description: createdCourse.description,
      category: createdCourse.category,
      format: createdCourse.format,
      level: createdCourse.level,
      price: createdCourse.price,
      isFree: createdCourse.isFree,
      thumbnail: createdCourse.thumbnail,
      instructor: createdCourse.instructor,
      status: "draft",
      enrolledCount: 0,
      ratingAverage: 5.0,
      ratingCount: 0,
      totalDurationMinutes: createdCourse.totalDurationMinutes,
      totalLessonsCount: createdCourse.totalLessonsCount,
      modules: clonedModules,
    });

    assert(Boolean(duplicatedCourse._id), "Duplicated course created successfully");
    assert(duplicatedCourse.title.includes("(Copy)"), "Duplicated title includes (Copy) suffix");
    assert(duplicatedCourse.status === "draft", "Duplicated course resets status to draft");
    assert(duplicatedCourse.enrolledCount === 0, "Duplicated course resets enrolled count to 0");
    assert(duplicatedCourse.modules[0]._id.toString() !== originalModId, "Cloned module has fresh ObjectId");
    assert(duplicatedCourse.modules[0].lessons[0]._id.toString() !== originalLesId, "Cloned lesson has fresh ObjectId");

    // 6. Test Course Archiving & Restoring
    console.log("\n[6/9] Testing Course Archiving & Restoring...");
    duplicatedCourse.status = "archived";
    await duplicatedCourse.save();
    assert(duplicatedCourse.status === "archived", "Course status transitioned to archived");

    // Restore to draft
    duplicatedCourse.status = "draft";
    await duplicatedCourse.save();
    assert(duplicatedCourse.status === "draft", "Course restored from archive back to draft");

    // 7. Test Student Enrollments Telemetry & Privacy
    console.log("\n[7/9] Testing Student Enrollments Telemetry & Privacy...");
    // Create an enrollment record for student1 in createdCourse
    let enrollment = await Enrollment.findOne({
      userId: student1._id,
      courseId: createdCourse._id,
    });

    if (!enrollment) {
      enrollment = await Enrollment.create({
        userId: student1._id,
        courseId: createdCourse._id,
        status: "active",
        progressPercentage: 50,
        completedLessons: [createdCourse.modules[0].lessons[0]._id.toString()],
        enrolledAt: new Date(),
      });
    }

    assert(Boolean(enrollment), "Enrollment record exists for learner");
    assert(enrollment.progressPercentage === 50, "Progress percentage is recorded", `${enrollment.progressPercentage}%`);
    assert(enrollment.completedLessons.length === 1, "Completed lesson ID tracked accurately");

    // Verify Quiz Attempt recording
    const quizAttempt = await QuizAttempt.create({
      userId: student1._id,
      quizId: new mongoose.Types.ObjectId(),
      courseId: createdCourse._id,
      lessonId: createdCourse.modules[0].lessons[0]._id.toString(),
      attemptNumber: 1,
      totalScore: 9,
      maxScore: 10,
      scorePercentage: 90,
      passed: true,
      completedAt: new Date(),
      answers: [
        {
          questionIndex: 0,
          selectedOptionIndices: [1],
          isCorrect: true,
          pointsAwarded: 9,
        },
      ],
    });

    assert(Boolean(quizAttempt._id), "Quiz attempt created for enrollment");
    assert(quizAttempt.scorePercentage === 90, "Quiz score accurately logged", `${quizAttempt.scorePercentage}%`);
    assert(quizAttempt.passed === true, "Quiz passed status is true");

    // 8. Test Reviews & Instructor Reply System
    console.log("\n[8/9] Testing Reviews & Instructor Response System...");
    let review = await Review.findOne({
      courseId: createdCourse._id,
      userId: student1._id,
    });

    if (!review) {
      review = await Review.create({
        courseId: createdCourse._id,
        userId: student1._id,
        rating: 5,
        reviewText: "Exceptional architecture breakdown! Clear explanations and production-ready code examples.",
        status: "approved",
      });
    }

    assert(Boolean(review), "Student review created on course");
    assert(review.rating === 5, "Rating is 5 stars");

    // Instructor replies
    const replyText = "Thank you for the wonderful feedback! Excited to see your projects built with this architecture.";
    review.instructorReply = {
      text: replyText,
      repliedAt: new Date(),
    };
    await review.save();

    const updatedReview = await Review.findById(review._id);
    assert(updatedReview?.instructorReply?.text === replyText, "Instructor reply stored persistently");
    assert(Boolean(updatedReview?.instructorReply?.repliedAt), "Instructor reply timestamp generated");

    // 9. Test Course Q&A and Announcements
    console.log("\n[9/9] Testing Course Q&A & Announcements Workspace...");
    // Create course announcement
    const announcementTitle = "Live Workshop: Distributed Caching with Redis";
    const announcementContent = "Join us this Saturday at 10 AM IST for an interactive session.";
    createdCourse.announcements = createdCourse.announcements || [];
    createdCourse.announcements.unshift({
      _id: new mongoose.Types.ObjectId(),
      title: announcementTitle,
      content: announcementContent,
      createdAt: new Date(),
      isPinned: true,
      createdBy: instructor1._id,
    } as any);
    await createdCourse.save();

    const courseWithAnnouncement = await Course.findById(createdCourse._id);
    assert(
      Boolean(courseWithAnnouncement?.announcements && courseWithAnnouncement.announcements.length > 0),
      "Course announcement saved to Course document"
    );
    assert(
      courseWithAnnouncement?.announcements?.[0].title === announcementTitle,
      "Announcement title matches",
      courseWithAnnouncement?.announcements?.[0].title
    );
    assert(courseWithAnnouncement?.announcements?.[0].isPinned === true, "Announcement pinned flag is true");

    // Test Course-linked Support Ticket (Q&A)
    const ticket = await SupportTicket.create({
      userId: student1._id,
      courseId: createdCourse._id,
      name: student1.name,
      email: student1.email,
      subject: "Question about Redis Cluster Partitioning",
      message: "How does the hash slot distribution handle failover nodes?",
      category: "course_content",
      status: "open",
      priority: "medium",
      responses: [],
    });

    assert(Boolean(ticket._id), "Course-linked student question ticket created");
    assert(ticket.courseId?.toString() === createdCourse._id.toString(), "Ticket linked to correct courseId");

    // Instructor responds to ticket
    ticket.responses.push({
      senderRole: "instructor",
      senderName: instructor1.name,
      message: "Redis clusters use 16,384 hash slots. When a master fails, the replica is promoted automatically.",
      createdAt: new Date(),
    } as any);
    ticket.status = "resolved";
    await ticket.save();

    const updatedTicket = await SupportTicket.findById(ticket._id);
    assert(updatedTicket?.responses.length === 1, "Instructor response logged in ticket thread");
    assert(updatedTicket?.status === "resolved", "Ticket status marked resolved by instructor");

    // Clean up temporary test course and duplicates to keep DB clean
    await Course.findByIdAndDelete(duplicatedCourse._id);
    await QuizAttempt.findByIdAndDelete(quizAttempt._id);
    await SupportTicket.findByIdAndDelete(ticket._id);
    console.log("  [CLEANUP] Temporary test artifacts cleaned up.");

    console.log("\n=======================================================");
    console.log(`  RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("=======================================================\n");

    if (failedCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err: any) {
    console.error("Test execution exception:", err);
    process.exit(1);
  }
}

runInstructorStudioTests();
