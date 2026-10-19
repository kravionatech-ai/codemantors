import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Course, Enrollment, User, QuizAttempt } from "@/models";
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

    const search = searchParams.get("search") || "";
    const courseId = searchParams.get("courseId") || "";
    const status = searchParams.get("status") || "all";
    const progress = searchParams.get("progress") || "all";
    const sort = searchParams.get("sort") || "enrolled_desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15")));

    // Get instructor's course IDs
    let instructorCourseQuery: any = { instructor: session.userId };
    if (session.role === "admin" || session.role === "super_admin") {
      // Admins can view all if needed, but if instructor dashboard, filter by course if requested
      if (courseId) {
        instructorCourseQuery = { _id: courseId };
      } else {
        instructorCourseQuery = {};
      }
    } else {
      if (courseId) {
        instructorCourseQuery = { _id: courseId, instructor: session.userId };
      }
    }

    const instructorCourses = await Course.find(instructorCourseQuery)
      .select("_id title slug modules totalLessonsCount")
      .lean();
    const courseIds = instructorCourses.map((c) => c._id);

    if (courseIds.length === 0) {
      return NextResponse.json({
        success: true,
        enrollments: [],
        courses: [],
        pagination: { page: 1, limit, total: 0, totalPages: 0 },
      });
    }

    const enrollmentQuery: any = {
      courseId: { $in: courseIds },
    };

    if (status && status !== "all") {
      enrollmentQuery.status = status;
    }

    if (progress === "not_started") {
      enrollmentQuery.progressPercentage = 0;
    } else if (progress === "in_progress") {
      enrollmentQuery.progressPercentage = { $gt: 0, $lt: 100 };
    } else if (progress === "completed") {
      enrollmentQuery.progressPercentage = 100;
    }

    // Search by student name or email
    if (search.trim()) {
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: search.trim(), $options: "i" } },
          { email: { $regex: search.trim(), $options: "i" } },
        ],
      })
        .select("_id")
        .lean();

      const userIds = matchingUsers.map((u) => u._id);
      enrollmentQuery.userId = { $in: userIds };
    }

    // Sort order
    let sortObj: any = { enrolledAt: -1 };
    if (sort === "enrolled_asc") sortObj = { enrolledAt: 1 };
    else if (sort === "progress_desc") sortObj = { progressPercentage: -1 };
    else if (sort === "progress_asc") sortObj = { progressPercentage: 1 };
    else if (sort === "completed_desc") sortObj = { completedAt: -1 };

    const skip = (page - 1) * limit;

    const [enrollments, total] = await Promise.all([
      Enrollment.find(enrollmentQuery)
        .populate("userId", "name email avatar headline")
        .populate("courseId", "title slug totalLessonsCount")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Enrollment.countDocuments(enrollmentQuery),
    ]);

    // Gather quiz attempts for returned enrollments to enrich the drawer telemetry
    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enr: any) => {
        const studentId = enr.userId?._id;
        const cId = enr.courseId?._id;

        let quizAttempts: any[] = [];
        if (studentId && cId) {
          quizAttempts = await QuizAttempt.find({
            userId: studentId,
            courseId: cId,
          })
            .select("attemptNumber totalScore maxScore scorePercentage passed completedAt")
            .sort({ completedAt: -1 })
            .limit(5)
            .lean();
        }

        return {
          ...enr,
          quizAttempts,
        };
      })
    );

    return NextResponse.json({
      success: true,
      enrollments: enrichedEnrollments,
      courses: instructorCourses.map((c) => ({ _id: c._id, title: c.title })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Instructor enrollments query error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load enrollment records" },
      { status: 500 }
    );
  }
}
