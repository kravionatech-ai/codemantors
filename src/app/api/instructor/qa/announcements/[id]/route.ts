import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const session = await getSessionUser(req);
    if (!session || (session.role !== "instructor" && session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const course = await Course.findOne({
      "announcements._id": id,
      ...(session.role === "instructor" ? { instructor: session.userId } : {}),
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Announcement not found or unauthorized" }, { status: 404 });
    }

    course.announcements = (course.announcements || []).filter(
      (a: any) => a._id.toString() !== id
    );
    await course.save();

    return NextResponse.json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error: any) {
    console.error("Announcement delete error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete announcement" },
      { status: 500 }
    );
  }
}
