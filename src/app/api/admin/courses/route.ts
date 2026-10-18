import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status") || "";

    const query: Record<string, any> = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const courses = await Course.find(query)
      .populate("instructor", "name email avatar")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, courses });
  } catch (error: any) {
    console.error("Admin courses list error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const { courseId, status, isFeatured } = await req.json();

    if (!courseId) {
      return NextResponse.json({ success: false, error: "Course ID is required" }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (status && ["draft", "pending_review", "published", "archived"].includes(status)) {
      updates.status = status;
    }
    if (typeof isFeatured === "boolean") {
      updates.isFeatured = isFeatured;
    }

    const course = await Course.findByIdAndUpdate(courseId, { $set: updates }, { new: true })
      .populate("instructor", "name email")
      .lean();

    return NextResponse.json({ success: true, course });
  } catch (error: any) {
    console.error("Admin course update error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to moderate course" },
      { status: 500 }
    );
  }
}
