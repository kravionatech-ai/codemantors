import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { LearningPath } from "@/models/LearningPath";
import "@/models/Course";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const level = searchParams.get("level")?.trim();
    const category = searchParams.get("category")?.trim();

    const query: any = { isPublished: true };

    if (level && level !== "all") {
      query.level = level;
    }

    if (category && category !== "all") {
      query.category = { $regex: new RegExp(category, "i") };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { learningObjectives: { $elemMatch: { $regex: search, $options: "i" } } },
      ];
    }

    const paths = await LearningPath.find(query)
      .populate({
        path: "courses",
        select: "title slug subtitle thumbnail level totalDurationMinutes enrolledCount ratingAverage isFree price discountPrice",
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, paths });
  } catch (error: any) {
    console.error("Learning paths error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch learning paths" },
      { status: 500 }
    );
  }
}
