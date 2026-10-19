import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course, Review, User } from "@/models";
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

    const courseId = searchParams.get("courseId");
    const rating = searchParams.get("rating");
    const status = searchParams.get("status") || "all"; // "all", "replied", "unreplied"
    const search = searchParams.get("search") || "";

    const courseQuery: any = { instructor: session.userId };
    if (courseId) {
      courseQuery._id = courseId;
    }

    const courses = await Course.find(courseQuery).select("_id title").lean();
    const courseIds = courses.map((c) => c._id);

    if (courseIds.length === 0) {
      return NextResponse.json({
        success: true,
        reviews: [],
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        totalReviews: 0,
        averageRating: "5.0",
        courses: [],
      });
    }

    const reviewQuery: any = {
      courseId: { $in: courseIds },
    };

    if (rating && rating !== "all") {
      reviewQuery.rating = parseInt(rating);
    }

    if (status === "replied") {
      reviewQuery["instructorReply.text"] = { $exists: true, $ne: "" };
    } else if (status === "unreplied") {
      reviewQuery.$or = [
        { instructorReply: { $exists: false } },
        { "instructorReply.text": { $exists: false } },
        { "instructorReply.text": "" },
      ];
    }

    if (search.trim()) {
      const matchingUsers = await User.find({
        name: { $regex: search.trim(), $options: "i" },
      }).select("_id");
      const userIds = matchingUsers.map((u) => u._id);

      reviewQuery.$and = [
        ...(reviewQuery.$and || []),
        {
          $or: [
            { reviewText: { $regex: search.trim(), $options: "i" } },
            { userId: { $in: userIds } },
          ],
        },
      ];
    }

    // All reviews for distribution computation
    const allInstructorReviews = await Review.find({ courseId: { $in: courseIds } })
      .select("rating instructorReply")
      .lean();

    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sumRating = 0;
    for (const r of allInstructorReviews) {
      const rounded = Math.round(r.rating || 5);
      if (distribution[rounded] !== undefined) {
        distribution[rounded] += 1;
      }
      sumRating += r.rating || 5;
    }
    const avgRating =
      allInstructorReviews.length > 0
        ? (sumRating / allInstructorReviews.length).toFixed(1)
        : "5.0";

    const reviews = await Review.find(reviewQuery)
      .populate("userId", "name avatar email")
      .populate("courseId", "title slug")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      success: true,
      reviews,
      ratingDistribution: distribution,
      totalReviews: allInstructorReviews.length,
      averageRating: avgRating,
      courses: courses.map((c) => ({ _id: c._id, title: c.title })),
    });
  } catch (error: any) {
    console.error("Instructor reviews GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load reviews" },
      { status: 500 }
    );
  }
}
