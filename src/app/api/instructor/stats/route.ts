import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course, Enrollment, Review, Payment, SupportTicket } from "@/models";
import { getSessionUser } from "@/lib/auth";
import { getInstructorUsage } from "@/lib/limits";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== "instructor" && session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    // 1. Find all courses authored by this instructor
    const courses = await Course.find({ instructor: session.userId })
      .sort({ updatedAt: -1 })
      .lean();
    const courseIds = courses.map((c) => c._id);

    // 2. Course breakdown by status
    const publishedCourses = courses.filter((c) => c.status === "published").length;
    const draftCourses = courses.filter((c) => c.status === "draft").length;
    const pendingReviewCourses = courses.filter((c) => c.status === "pending_review").length;
    const archivedCourses = courses.filter((c) => c.status === "archived").length;

    // 3. Real Enrollments
    const allEnrollments = await Enrollment.find({
      courseId: { $in: courseIds },
    })
      .populate("userId", "name email avatar")
      .populate("courseId", "title slug")
      .sort({ createdAt: -1 })
      .lean();

    const activeEnrollmentsCount = allEnrollments.filter((e) => e.status === "active").length;
    const completedEnrollmentsCount = allEnrollments.filter((e) => e.status === "completed").length;
    const totalEnrollmentsCount = allEnrollments.filter((e) => e.status === "active" || e.status === "completed").length;

    // Unique students set
    const uniqueStudentIds = new Set(
      allEnrollments
        .filter((e) => e.status === "active" || e.status === "completed")
        .map((e) => (e.userId as any)?._id?.toString() || e.userId?.toString())
        .filter(Boolean)
    );
    const uniqueStudents = uniqueStudentIds.size;

    // Completion rate
    const completionRate =
      totalEnrollmentsCount > 0
        ? Math.round((completedEnrollmentsCount / totalEnrollmentsCount) * 100)
        : 0;

    // 4. Payments & Verified Revenue
    const payments = await Payment.find({
      courseId: { $in: courseIds },
      status: "completed",
    }).lean();

    const totalRevenue = payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // 5. Reviews
    const reviews = await Review.find({ courseId: { $in: courseIds } })
      .populate("userId", "name avatar email")
      .populate("courseId", "title slug")
      .sort({ createdAt: -1 })
      .lean();

    const unrepliedReviews = reviews.filter((r) => !r.instructorReply?.text);

    // Average rating
    let averageRating = "5.0";
    if (reviews.length > 0) {
      const sumRatings = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
      averageRating = (sumRatings / reviews.length).toFixed(1);
    } else if (courses.length > 0) {
      const ratedCourses = courses.filter((c) => c.ratingCount > 0);
      if (ratedCourses.length > 0) {
        const sum = ratedCourses.reduce((acc, c) => acc + (c.ratingAverage || 5), 0);
        averageRating = (sum / ratedCourses.length).toFixed(1);
      }
    }

    // 6. Courses requiring attention
    const attentionCourses = courses
      .filter((c) => {
        const noLessons = (c.totalLessonsCount || 0) === 0;
        const isPending = c.status === "pending_review";
        return (noLessons && c.status === "draft") || isPending;
      })
      .map((c) => ({
        _id: c._id,
        title: c.title,
        slug: c.slug,
        status: c.status,
        reason:
          c.status === "pending_review"
            ? "Waiting for admin review & approval"
            : "Draft course has 0 lessons added yet",
      }));

    // 7. Open Student Questions / Support tickets on instructor courses
    const openQuestions = await SupportTicket.countDocuments({
      courseId: { $in: courseIds },
      status: { $in: ["open", "in_progress"] },
    });

    // 8. Quota Usage
    const quotaUsage = await getInstructorUsage(session.userId);

    // 9. Course Performance Comparisons
    const courseComparisons = courses.map((c) => {
      const courseEnrs = allEnrollments.filter((e) => (e.courseId as any)?._id?.toString() === c._id.toString() || e.courseId?.toString() === c._id.toString());
      const courseCompleted = courseEnrs.filter((e) => e.status === "completed").length;
      const courseRate = courseEnrs.length > 0 ? Math.round((courseCompleted / courseEnrs.length) * 100) : 0;
      const courseRevenue = payments
        .filter((p) => p.courseId?.toString() === c._id.toString())
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      return {
        _id: c._id,
        title: c.title,
        slug: c.slug,
        status: c.status,
        format: c.format || "Mixed",
        level: c.level,
        price: c.isFree ? 0 : c.price,
        isFree: c.isFree,
        enrolledCount: c.enrolledCount || courseEnrs.length,
        ratingAverage: c.ratingAverage || 5.0,
        ratingCount: c.ratingCount || 0,
        totalLessonsCount: c.totalLessonsCount || 0,
        totalDurationMinutes: c.totalDurationMinutes || 0,
        completionRate: courseRate,
        revenue: courseRevenue,
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalCourses: courses.length,
        publishedCourses,
        draftCourses,
        pendingReviewCourses,
        archivedCourses,
        activeEnrollments: activeEnrollmentsCount,
        completedEnrollments: completedEnrollmentsCount,
        totalEnrollments: totalEnrollmentsCount,
        totalStudents: uniqueStudents,
        uniqueStudents,
        completionRate,
        averageRating,
        totalRevenue,
        unrepliedReviewsCount: unrepliedReviews.length,
        openQuestionsCount: openQuestions,
      },
      quotaUsage,
      attentionCourses,
      courseComparisons,
      courses,
      recentEnrollments: allEnrollments.slice(0, 10),
      recentReviews: reviews.slice(0, 10),
    });
  } catch (error: any) {
    console.error("Instructor stats error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load instructor stats" },
      { status: 500 }
    );
  }
}
