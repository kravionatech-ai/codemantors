import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course, Enrollment, Payment, Review, QuizAttempt, Refund } from "@/models";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== "instructor" && session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = req.nextUrl;
    const range = searchParams.get("range") || "30d"; // 7d, 30d, 90d, 1y, all

    // Determine startDate
    const now = new Date();
    let startDate = new Date();
    if (range === "7d") {
      startDate.setDate(now.getDate() - 7);
    } else if (range === "30d") {
      startDate.setDate(now.getDate() - 30);
    } else if (range === "90d") {
      startDate.setDate(now.getDate() - 90);
    } else if (range === "1y") {
      startDate.setFullYear(now.getFullYear() - 1);
    } else {
      startDate = new Date(0); // all time
    }

    const courses = await Course.find({ instructor: session.userId }).lean();
    const courseIds = courses.map((c) => c._id);

    if (courseIds.length === 0) {
      return NextResponse.json({
        success: true,
        summary: {
          totalCourses: 0,
          totalEnrollments: 0,
          rangeEnrollments: 0,
          totalRevenue: 0,
          rangeRevenue: 0,
          averageRating: "5.0",
          overallCompletionRate: 0,
          quizAttemptsCount: 0,
          quizPassRate: 0,
          totalRefundsCount: 0,
          totalRefundedAmount: 0,
        },
        timeSeries: [],
        courseMatrix: [],
        quizMetrics: { totalAttempts: 0, averageScore: 0, passRate: 0 },
        refundSummary: { count: 0, amount: 0 },
      });
    }

    // 1. Enrollments in range and all-time
    const allEnrollments = await Enrollment.find({
      courseId: { $in: courseIds },
    }).lean();

    const rangeEnrollments = allEnrollments.filter(
      (e) => new Date(e.enrolledAt) >= startDate
    );

    // 2. Payments & Revenue in range and all-time
    const allPayments = await Payment.find({
      courseId: { $in: courseIds },
      status: "completed",
    }).lean();

    const rangePayments = allPayments.filter(
      (p) => new Date(p.createdAt) >= startDate
    );

    const totalRevenue = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const rangeRevenue = rangePayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // 3. Time Series Data for charts
    // Generate buckets (days for <= 30d, weeks/months for > 30d)
    const timeSeriesMap = new Map<string, { date: string; enrollments: number; revenue: number }>();
    const daysCount = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const displayDays = Math.min(daysCount, 30); // keep chart clean up to 30 points

    for (let i = displayDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split("T")[0];
      timeSeriesMap.set(key, { date: key, enrollments: 0, revenue: 0 });
    }

    for (const e of rangeEnrollments) {
      const key = new Date(e.enrolledAt).toISOString().split("T")[0];
      if (timeSeriesMap.has(key)) {
        timeSeriesMap.get(key)!.enrollments += 1;
      }
    }

    for (const p of rangePayments) {
      const key = new Date(p.createdAt).toISOString().split("T")[0];
      if (timeSeriesMap.has(key)) {
        timeSeriesMap.get(key)!.revenue += p.amount || 0;
      }
    }

    const timeSeries = Array.from(timeSeriesMap.values());

    // 4. Quiz Performance
    const quizAttempts = await QuizAttempt.find({
      courseId: { $in: courseIds },
      ...(range !== "all" ? { completedAt: { $gte: startDate } } : {}),
    }).lean();

    const totalQuizAttempts = quizAttempts.length;
    const passedAttempts = quizAttempts.filter((q) => q.passed).length;
    const avgScore =
      totalQuizAttempts > 0
        ? Math.round(quizAttempts.reduce((sum, q) => sum + (q.scorePercentage || 0), 0) / totalQuizAttempts)
        : 0;
    const quizPassRate =
      totalQuizAttempts > 0 ? Math.round((passedAttempts / totalQuizAttempts) * 100) : 0;

    // 5. Refund Summary
    const refunds = await Refund.find({
      courseId: { $in: courseIds },
      ...(range !== "all" ? { createdAt: { $gte: startDate } } : {}),
    }).lean();

    const totalRefundedAmount = refunds.reduce((sum, r) => sum + (r.amount || 0), 0);

    // 6. Course Performance Matrix
    const courseMatrix = courses.map((c) => {
      const cEnrs = allEnrollments.filter((e) => e.courseId.toString() === c._id.toString());
      const cRangeEnrs = rangeEnrollments.filter((e) => e.courseId.toString() === c._id.toString());
      const cCompleted = cEnrs.filter((e) => e.status === "completed").length;
      const cRate = cEnrs.length > 0 ? Math.round((cCompleted / cEnrs.length) * 100) : 0;
      const cRev = allPayments
        .filter((p) => p.courseId?.toString() === c._id.toString())
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const cQuizzes = quizAttempts.filter((q) => q.courseId?.toString() === c._id.toString());
      const cQuizPassed = cQuizzes.filter((q) => q.passed).length;
      const cQuizRate = cQuizzes.length > 0 ? Math.round((cQuizPassed / cQuizzes.length) * 100) : 0;

      return {
        _id: c._id,
        title: c.title,
        slug: c.slug,
        category: c.category,
        format: c.format || "Mixed",
        level: c.level,
        status: c.status,
        price: c.isFree ? 0 : c.price,
        isFree: c.isFree,
        totalEnrollments: cEnrs.length,
        rangeEnrollments: cRangeEnrs.length,
        completedCount: cCompleted,
        completionRate: cRate,
        ratingAverage: c.ratingAverage || 5.0,
        ratingCount: c.ratingCount || 0,
        revenue: cRev,
        quizAttemptsCount: cQuizzes.length,
        quizPassRate: cQuizRate,
      };
    });

    // 7. Overall Summary
    const completedTotal = allEnrollments.filter((e) => e.status === "completed").length;
    const overallCompletionRate =
      allEnrollments.length > 0 ? Math.round((completedTotal / allEnrollments.length) * 100) : 0;

    let averageRating = "5.0";
    const ratedCourses = courses.filter((c) => c.ratingCount > 0);
    if (ratedCourses.length > 0) {
      const sum = ratedCourses.reduce((acc, c) => acc + (c.ratingAverage || 5), 0);
      averageRating = (sum / ratedCourses.length).toFixed(1);
    }

    return NextResponse.json({
      success: true,
      range,
      summary: {
        totalCourses: courses.length,
        totalEnrollments: allEnrollments.length,
        rangeEnrollments: rangeEnrollments.length,
        totalRevenue,
        rangeRevenue,
        averageRating,
        overallCompletionRate,
        quizAttemptsCount: totalQuizAttempts,
        quizPassRate,
        totalRefundsCount: refunds.length,
        totalRefundedAmount,
      },
      timeSeries,
      courseMatrix,
      quizMetrics: {
        totalAttempts: totalQuizAttempts,
        averageScore: avgScore,
        passRate: quizPassRate,
      },
      refundSummary: {
        count: refunds.length,
        amount: totalRefundedAmount,
      },
    });
  } catch (error: any) {
    console.error("Instructor analytics error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load instructor analytics" },
      { status: 500 }
    );
  }
}
