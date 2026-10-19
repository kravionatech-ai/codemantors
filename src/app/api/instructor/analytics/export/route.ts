import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course, Enrollment, Payment, QuizAttempt } from "@/models";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== "instructor" && session.role !== "admin" && session.role !== "super_admin")) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    await connectDB();
    const courses = await Course.find({ instructor: session.userId }).lean();
    const courseIds = courses.map((c) => c._id);

    const [enrollments, payments, quizAttempts] = await Promise.all([
      Enrollment.find({ courseId: { $in: courseIds } }).lean(),
      Payment.find({ courseId: { $in: courseIds }, status: "completed" }).lean(),
      QuizAttempt.find({ courseId: { $in: courseIds } }).lean(),
    ]);

    const headers = [
      "Course Title",
      "Category",
      "Format",
      "Level",
      "Status",
      "Price INR",
      "Total Enrollments",
      "Completed Learners",
      "Completion Rate %",
      "Rating Average",
      "Rating Count",
      "Total Revenue INR",
      "Quiz Pass Rate %",
    ];

    const escapeCsv = (val: any) => {
      if (val == null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = courses.map((c) => {
      const cEnrs = enrollments.filter((e) => e.courseId.toString() === c._id.toString());
      const cCompleted = cEnrs.filter((e) => e.status === "completed").length;
      const cRate = cEnrs.length > 0 ? Math.round((cCompleted / cEnrs.length) * 100) : 0;
      const cRev = payments
        .filter((p) => p.courseId?.toString() === c._id.toString())
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const cQuizzes = quizAttempts.filter((q) => q.courseId?.toString() === c._id.toString());
      const cQuizPassed = cQuizzes.filter((q) => q.passed).length;
      const cQuizRate = cQuizzes.length > 0 ? Math.round((cQuizPassed / cQuizzes.length) * 100) : 0;

      return [
        escapeCsv(c.title),
        escapeCsv(c.category),
        escapeCsv(c.format || "Mixed"),
        escapeCsv(c.level),
        escapeCsv(c.status),
        escapeCsv(c.isFree ? "Free" : c.price),
        escapeCsv(cEnrs.length),
        escapeCsv(cCompleted),
        escapeCsv(`${cRate}%`),
        escapeCsv(c.ratingAverage || 5.0),
        escapeCsv(c.ratingCount || 0),
        escapeCsv(cRev),
        escapeCsv(`${cQuizRate}%`),
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="instructor_analytics_${Date.now()}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Analytics CSV export error:", error);
    return new NextResponse("Failed to export analytics report", { status: 500 });
  }
}
