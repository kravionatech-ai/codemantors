import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Review, Course, Enrollment } from "@/models";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const courseId = req.nextUrl.searchParams.get("courseId");

    const query: Record<string, any> = { status: "approved" };
    if (courseId) {
      query.courseId = courseId;
    }

    const reviews = await Review.find(query)
      .populate("userId", "name avatar headline")
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return NextResponse.json({ success: true, reviews });
  } catch (error: any) {
    console.error("Fetch reviews error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { courseId, rating, reviewText } = await req.json();

    if (!courseId || !rating || !reviewText) {
      return NextResponse.json(
        { success: false, error: "Course ID, rating (1-5), and review text are required" },
        { status: 400 }
      );
    }

    // Verify enrollment
    const enrollment = await Enrollment.findOne({
      userId: session.userId,
      courseId,
      status: { $in: ["active", "completed"] },
    });

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: "You must be enrolled in this course to leave a review" },
        { status: 403 }
      );
    }

    const review = await Review.findOneAndUpdate(
      { courseId, userId: session.userId },
      {
        $set: {
          rating: Number(rating),
          reviewText: reviewText.trim(),
          status: "approved", // Automatically approved or moderated
        },
      },
      { new: true, upsert: true }
    );

    // Recalculate course rating average
    const allCourseReviews = await Review.find({ courseId, status: "approved" });
    const count = allCourseReviews.length;
    const avg = count > 0 ? allCourseReviews.reduce((sum, r) => sum + r.rating, 0) / count : 5.0;

    await Course.findByIdAndUpdate(courseId, {
      $set: {
        ratingAverage: Math.round(avg * 10) / 10,
        ratingCount: count,
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    console.error("Submit review error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit review" },
      { status: 500 }
    );
  }
}
