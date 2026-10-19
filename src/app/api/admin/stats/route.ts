import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User, Course, Enrollment, Payment, Refund } from "@/models";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    await connectDB();

    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      totalCourses,
      publishedCourses,
      pendingCourses,
      totalEnrollments,
      completedPayments,
      refundRecords,
      recentPayments,
      recentRefunds,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "instructor" }),
      Course.countDocuments(),
      Course.countDocuments({ status: "published" }),
      Course.countDocuments({ status: "pending_review" }),
      Enrollment.countDocuments({ status: { $in: ["active", "completed"] } }),
      Payment.find({ status: "completed" }).select("amount").lean(),
      Refund.find({ status: "succeeded" }).select("amount").lean(),
      Payment.find()
        .populate("userId", "name email")
        .populate("courseId", "title")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Refund.find()
        .populate("userId", "name email")
        .populate("courseId", "title")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
    ]);

    const grossRevenue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const refundedAmount = refundRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
    const netRevenue = grossRevenue - refundedAmount;

    return NextResponse.json({
      success: true,
      metrics: {
        totalUsers,
        totalStudents,
        totalInstructors,
        totalCourses,
        publishedCourses,
        pendingCourses,
        totalEnrollments,
        grossRevenue,
        refundedAmount,
        netRevenue,
      },
      recentPayments,
      recentRefunds,
    });
  } catch (error: any) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load admin stats" },
      { status: 500 }
    );
  }
}
