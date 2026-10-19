import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { getSessionUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(
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
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ _id: id }, { slug: id }] } : { slug: id };

    const course = await Course.findOne(query);
    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    if (session.role === "instructor" && course.instructor.toString() !== session.userId) {
      return NextResponse.json({ success: false, error: "Forbidden: Not your course" }, { status: 403 });
    }

    const isCurrentlyArchived = course.status === "archived";
    const newStatus = isCurrentlyArchived ? "draft" : "archived";

    course.status = newStatus;
    await course.save();

    await logAuditEvent({
      action: isCurrentlyArchived ? "course_restore" : "course_archive",
      category: "course",
      resourceId: course._id.toString(),
      actorId: session.userId,
      actorRole: session.role,
      details: `${isCurrentlyArchived ? "Restored" : "Archived"} course "${course.title}" (${course.slug})`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: isCurrentlyArchived
        ? "Course restored to draft status. You may now edit or publish it."
        : "Course archived successfully. Enrolled students retain access, but it is unlisted from public discovery.",
      status: newStatus,
      course,
    });
  } catch (error: any) {
    console.error("Course archive error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update archive status" },
      { status: 500 }
    );
  }
}
