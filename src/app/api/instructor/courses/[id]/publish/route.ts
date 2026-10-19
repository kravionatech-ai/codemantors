import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { getSessionUser } from "@/lib/auth";
import { verifyInstructorQuota, getEffectiveInstructorLimits } from "@/lib/limits";
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

    const body = await req.json().catch(() => ({}));
    const action = body.action || "publish"; // "publish" or "unpublish"

    if (action === "unpublish") {
      course.status = "draft";
      await course.save();

      await logAuditEvent({
        action: "course_unpublish",
        category: "course",
        resourceId: course._id.toString(),
        actorId: session.userId,
        actorRole: session.role,
        details: `Unpublished course "${course.title}" back to draft`,
        req,
      });

      return NextResponse.json({
        success: true,
        message: "Course reverted to draft mode.",
        course,
      });
    }

    // 1. Validation Before Publishing
    const validationErrors: string[] = [];

    if (!course.title || course.title.trim().length < 5) {
      validationErrors.push("Course title must be at least 5 characters long.");
    }
    if (!course.description || course.description.trim().length < 20) {
      validationErrors.push("Course description must be at least 20 characters long.");
    }
    if (!course.category) {
      validationErrors.push("Course category is required.");
    }
    if (!course.modules || course.modules.length === 0) {
      validationErrors.push("Course must have at least one curriculum module.");
    } else {
      const totalLessons = course.modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
      if (totalLessons === 0) {
        validationErrors.push("Course must contain at least one lesson before publishing.");
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Course failed publication prerequisites.",
          validationErrors,
        },
        { status: 400 }
      );
    }

    // 2. Check Instructor Limits
    if (session.role === "instructor") {
      const quotaCheck = await verifyInstructorQuota(session.userId, "publish_course");
      if (!quotaCheck.allowed) {
        return NextResponse.json({ success: false, error: quotaCheck.reason }, { status: 400 });
      }
    }

    const limits = await getEffectiveInstructorLimits(course.instructor.toString());
    const isApprovalRequired = limits.requireCourseApproval && session.role !== "admin" && session.role !== "super_admin";

    const newStatus = isApprovalRequired ? "pending_review" : "published";
    course.status = newStatus;
    await course.save();

    await logAuditEvent({
      action: isApprovalRequired ? "course_submit_review" : "course_publish",
      category: "course",
      resourceId: course._id.toString(),
      actorId: session.userId,
      actorRole: session.role,
      details: isApprovalRequired
        ? `Submitted course "${course.title}" for administrator approval`
        : `Published course "${course.title}" live to public catalog`,
      req,
    });

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: isApprovalRequired
        ? "Course submitted for administrator review and approval."
        : "Course published successfully! It is now live in the CodeMentors catalog.",
      course,
    });
  } catch (error: any) {
    console.error("Course publish error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update publication status" },
      { status: 500 }
    );
  }
}
