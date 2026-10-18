import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { LearningPath } from "@/models/LearningPath";

export async function GET() {
  try {
    await connectDB();
    const paths = await LearningPath.find({ isPublished: true })
      .populate({
        path: "courses",
        select: "title slug subtitle thumbnail level totalDurationMinutes enrolledCount ratingAverage",
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
