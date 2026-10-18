import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course, Enrollment, Review, Payment } from "@/models";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== "instructor" && session.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    // Find all courses authored by this instructor
    const courses = await Course.find({ instructor: session.userId }).lean();
    const courseIds = courses.map((c) => c._id);

    // Enrollments in these courses
    const enrollments = await Enrollment.find({
      courseId: { $in: courseIds },
      status: { $in: ["active", "completed"] },
    })
      .populate("userId", "name email avatar")
      .populate("courseId", "title slug")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Payments for these courses
    const payments = await Payment.find({
      courseId: { $in: courseIds },
      status: "completed",
    }).lean();

    const totalRevenue = payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // Reviews for instructor courses
    const reviews = await Review.find({ courseId: { $in: courseIds } })
      .populate("userId", "name avatar")
      .populate("courseId", "title")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Total students count
    const totalStudents = courses.reduce((acc, c) => acc + (c.enrolledCount || 0), 0);
    const averageRating =
      courses.length > 0
        ? (courses.reduce((acc, c) => acc + (c.ratingAverage || 0), 0) / courses.length).toFixed(1)
        : "5.0";

    return NextResponse.json({
      success: true,
      stats: {
        totalCourses: courses.length,
        totalStudents,
        totalRevenue,
        averageRating,
      },
      courses,
      recentEnrollments: enrollments,
      recentReviews: reviews,
    });
  } catch (error: any) {
    console.error("Instructor stats error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load instructor stats" },
      { status: 500 }
    );
  }
}
