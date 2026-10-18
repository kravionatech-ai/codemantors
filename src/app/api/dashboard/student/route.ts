import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Enrollment, Course, Certificate, QuizAttempt, LessonProgress } from "@/models";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // 1. Fetch user's enrollments with course details
    const enrollments = await Enrollment.find({
      userId: session.userId,
      status: { $in: ["active", "completed"] },
    })
      .populate({
        path: "courseId",
        select: "title slug subtitle thumbnail category level totalDurationMinutes totalLessonsCount modules instructor",
        populate: { path: "instructor", select: "name avatar" },
      })
      .sort({ updatedAt: -1 })
      .lean();

    // 2. Fetch certificates
    const certificates = await Certificate.find({ userId: session.userId })
      .populate("courseId", "title slug thumbnail")
      .sort({ issueDate: -1 })
      .lean();

    // 3. Fetch recent quiz attempts
    const quizAttempts = await QuizAttempt.find({ userId: session.userId })
      .populate("courseId", "title slug")
      .sort({ completedAt: -1 })
      .limit(5)
      .lean();

    // 4. Fetch bookmarked lessons
    const bookmarkedLessons = await LessonProgress.find({
      userId: session.userId,
      isBookmarked: true,
    })
      .populate("courseId", "title slug")
      .limit(10)
      .lean();

    // 5. Compute statistics
    const totalEnrolled = enrollments.length;
    const completedCoursesCount = enrollments.filter((e) => e.progressPercentage >= 100).length;
    const inProgressCount = totalEnrolled - completedCoursesCount;
    const totalCertificates = certificates.length;

    let totalMinutesLearned = 0;
    enrollments.forEach((e: any) => {
      const course = e.courseId;
      if (course && course.totalDurationMinutes) {
        totalMinutesLearned += Math.round((course.totalDurationMinutes * (e.progressPercentage || 0)) / 100);
      }
    });

    // 6. Continue Learning: most recently updated active course
    let continueLearning = null;
    const activeCourseEnrollment = enrollments.find((e) => (e.progressPercentage || 0) < 100);
    if (activeCourseEnrollment && activeCourseEnrollment.courseId) {
      const course: any = activeCourseEnrollment.courseId;
      let lastLessonId = activeCourseEnrollment.lastAccessedLessonId;
      let lessonTitle = "Continue Course";

      if (!lastLessonId && course.modules?.[0]?.lessons?.[0]) {
        lastLessonId = course.modules[0].lessons[0]._id.toString();
        lessonTitle = course.modules[0].lessons[0].title;
      } else if (lastLessonId) {
        for (const m of course.modules || []) {
          const l = (m.lessons || []).find((les: any) => les._id.toString() === lastLessonId);
          if (l) {
            lessonTitle = l.title;
            break;
          }
        }
      }

      continueLearning = {
        courseId: course._id,
        courseTitle: course.title,
        courseSlug: course.slug,
        thumbnail: course.thumbnail,
        progressPercentage: activeCourseEnrollment.progressPercentage,
        lastLessonId,
        lessonTitle,
      };
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalEnrolled,
        inProgressCount,
        completedCoursesCount,
        totalCertificates,
        totalHoursLearned: (totalMinutesLearned / 60).toFixed(1),
      },
      continueLearning,
      enrollments,
      certificates,
      quizAttempts,
      bookmarkedLessons,
    });
  } catch (error: any) {
    console.error("Student dashboard API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
