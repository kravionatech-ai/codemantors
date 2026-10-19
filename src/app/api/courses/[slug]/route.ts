import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Course, Enrollment, Review, AuditLog } from "@/models";
import { getSessionUser } from "@/lib/auth";
import { sanitizeHtml } from "@/lib/sanitize-html";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;
    await connectDB();

    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const query = isObjectId ? { $or: [{ slug }, { _id: slug }] } : { slug };

    const course = await Course.findOne(query)
      .populate("instructor", "name avatar headline bio socialLinks")
      .lean();

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    const session = await getSessionUser(req);
    let isEnrolled = false;
    let enrollmentData = null;

    if (session) {
      const enrollment = await Enrollment.findOne({
        userId: session.userId,
        courseId: course._id,
        status: { $in: ["active", "completed"] },
      }).lean();

      if (enrollment) {
        isEnrolled = true;
        enrollmentData = enrollment;
      }
    }

    const isInstructorOrAdmin =
      session &&
      (session.role === "admin" ||
        (session.role === "instructor" &&
          (course.instructor as any)?._id?.toString() === session.userId));

    // Fetch top approved reviews
    const reviews = await Review.find({ courseId: course._id, status: "approved" })
      .populate("userId", "name avatar")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Sanitize module and lessons if not enrolled and not owner
    const sanitizedModules = course.modules.map((mod: any) => {
      const safeMod = { ...mod };
      if (!isEnrolled && !isInstructorOrAdmin) {
        safeMod.hasVideo = Boolean(mod.videoUrl);
        safeMod.hasPdf = Boolean(mod.pdfUrl);
        safeMod.hasNotes = Boolean(mod.notes);
        delete safeMod.videoUrl;
        delete safeMod.pdfUrl;
        delete safeMod.notes;
      } else {
        safeMod.hasVideo = Boolean(mod.videoUrl);
        safeMod.hasPdf = Boolean(mod.pdfUrl);
        safeMod.hasNotes = Boolean(mod.notes);
      }

      safeMod.lessons = mod.lessons.map((lesson: any) => {
        if (isEnrolled || isInstructorOrAdmin || lesson.isPreview) {
          return lesson;
        }
        // Non-enrolled preview: strip videoUrl and deep content
        const { videoUrl, content, codingExercise, ...safeLesson } = lesson;
        return safeLesson;
      });

      return safeMod;
    });

    return NextResponse.json({
      success: true,
      course: {
        ...course,
        modules: sanitizedModules,
      },
      isEnrolled,
      enrollment: enrollmentData,
      reviews,
    });
  } catch (error: any) {
    console.error("Get course error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch course" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;
    const session = await getSessionUser(req);
    if (!session || (session.role !== "instructor" && session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const query = isObjectId ? { $or: [{ slug }, { _id: slug }] } : { slug };
    const course = await Course.findOne(query);
    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    // Check ownership if instructor
    if (session.role === "instructor" && course.instructor.toString() !== session.userId) {
      return NextResponse.json({ success: false, error: "Forbidden: Not your course" }, { status: 403 });
    }

    const updates = await req.json();
    delete updates._id;
    delete updates.instructor;

    if (updates.description) {
      updates.description = sanitizeHtml(updates.description);
    }

    // Recalculate total duration and lessons count if modules changed, and sanitize lesson content
    if (updates.modules && Array.isArray(updates.modules)) {
      let totalMinutes = 0;
      let totalLessons = 0;
      for (const m of updates.modules) {
        if (m.description) {
          m.description = sanitizeHtml(m.description);
        }
        if (m.lessons && Array.isArray(m.lessons)) {
          totalLessons += m.lessons.length;
          for (const l of m.lessons) {
            totalMinutes += Number(l.durationMinutes || 0);
            if (l.content) {
              l.content = sanitizeHtml(l.content);
            }
          }
        }
      }
      updates.totalDurationMinutes = totalMinutes;
      updates.totalLessonsCount = totalLessons;
    }

    // Enforce limits and approval rules if status is being updated to published
    if (updates.status === "published" && course.status !== "published") {
      const { verifyInstructorQuota, getEffectiveInstructorLimits } = await import("@/lib/limits");
      const quotaCheck = await verifyInstructorQuota(course.instructor.toString(), "publish_course");
      if (!quotaCheck.allowed) {
        return NextResponse.json({ success: false, error: quotaCheck.reason }, { status: 400 });
      }

      const limits = await getEffectiveInstructorLimits(course.instructor.toString());
      if (limits.requireCourseApproval && session.role !== "admin" && session.role !== "super_admin") {
        updates.status = "pending_review";
      }
    }

    if (updates.price != null || updates.category) {
      const { verifyInstructorQuota } = await import("@/lib/limits");
      const quotaCheck = await verifyInstructorQuota(course.instructor.toString(), "create_course", {
        price: updates.price != null ? Number(updates.price) : course.price,
        category: updates.category || course.category,
      });
      if (!quotaCheck.allowed) {
        return NextResponse.json({ success: false, error: quotaCheck.reason }, { status: 400 });
      }
    }

    if (updates.seo && session.role === "instructor") {
      const { getEffectiveInstructorLimits } = await import("@/lib/limits");
      const limits = await getEffectiveInstructorLimits(course.instructor.toString());
      if (!limits.canEditSeo) {
        delete updates.seo;
      }
    }

    Object.assign(course, updates);
    await course.save();

    const { logAuditEvent } = await import("@/lib/audit");
    await logAuditEvent({
      action: "course_update",
      category: "course",
      resourceId: course._id.toString(),
      actorId: session.userId,
      actorRole: session.role,
      details: `Updated course "${course.title}" (Status: ${course.status})`,
      req,
    });

    return NextResponse.json({
      success: true,
      message:
        course.status === "pending_review"
          ? "Course submitted for administrator review and approval."
          : "Course updated successfully",
      course,
    });
  } catch (error: any) {
    console.error("Course update error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update course" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;
    const session = await getSessionUser(req);
    if (!session || (session.role !== "instructor" && session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const query = isObjectId ? { $or: [{ slug }, { _id: slug }] } : { slug };
    const course = await Course.findOne(query);

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    // Ownership check
    if (session.role === "instructor" && course.instructor.toString() !== session.userId) {
      return NextResponse.json({ success: false, error: "Forbidden: Not your course" }, { status: 403 });
    }

    // Check if students are enrolled
    const activeEnrollments = await Enrollment.countDocuments({
      courseId: course._id,
      status: { $in: ["active", "completed"] },
    });

    if (activeEnrollments > 0) {
      // Soft-delete: archive course so active students do not lose access
      course.status = "archived";
      await course.save();

      await AuditLog.create({
        action: "course_archived",
        category: "course",
        userId: session.userId,
        resourceId: course._id.toString(),
        resourceType: "Course",
        details: { title: course.title, activeEnrollments },
      });

      return NextResponse.json({
        success: true,
        message: "Course has enrolled students and was safely archived rather than deleted.",
        course,
      });
    }

    // No enrollments: safe hard delete
    await Course.findByIdAndDelete(course._id);

    await AuditLog.create({
      action: "course_deleted",
      category: "course",
      userId: session.userId,
      resourceId: course._id.toString(),
      resourceType: "Course",
      details: { title: course.title },
    });

    return NextResponse.json({ success: true, message: "Course deleted successfully" });
  } catch (error: any) {
    console.error("Course deletion error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete course" },
      { status: 500 }
    );
  }
}
