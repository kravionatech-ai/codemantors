import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course, Enrollment } from "@/models";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== "instructor" && session.role !== "admin" && session.role !== "super_admin")) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    await connectDB();
    const { searchParams } = req.nextUrl;
    const courseId = searchParams.get("courseId");

    const courseQuery: any = { instructor: session.userId };
    if (courseId) {
      courseQuery._id = courseId;
    }

    const instructorCourses = await Course.find(courseQuery).select("_id title").lean();
    const courseIds = instructorCourses.map((c) => c._id);

    const enrollments = await Enrollment.find({ courseId: { $in: courseIds } })
      .populate("userId", "name email")
      .populate("courseId", "title")
      .sort({ enrolledAt: -1 })
      .lean();

    const headers = [
      "Enrollment ID",
      "Student Name",
      "Student Email",
      "Course Title",
      "Progress Percentage",
      "Completed Lessons Count",
      "Status",
      "Enrolled Date",
      "Completed Date",
    ];

    const escapeCsv = (val: any) => {
      if (val == null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = enrollments.map((e: any) => [
      escapeCsv(e._id),
      escapeCsv(e.userId?.name || "Student"),
      escapeCsv(e.userId?.email || ""),
      escapeCsv(e.courseId?.title || ""),
      escapeCsv(`${e.progressPercentage || 0}%`),
      escapeCsv(e.completedLessons?.length || 0),
      escapeCsv(e.status),
      escapeCsv(e.enrolledAt ? new Date(e.enrolledAt).toISOString().split("T")[0] : ""),
      escapeCsv(e.completedAt ? new Date(e.completedAt).toISOString().split("T")[0] : "N/A"),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="instructor_enrollments_${Date.now()}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Enrollment CSV export error:", error);
    return new NextResponse("Failed to generate CSV export", { status: 500 });
  }
}
