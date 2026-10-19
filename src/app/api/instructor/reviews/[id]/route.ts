import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course, Review } from "@/models";
import { getSessionUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function PUT(
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
    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ success: false, error: "Review not found" }, { status: 404 });
    }

    // Verify ownership of the course
    if (session.role === "instructor") {
      const course = await Course.findById(review.courseId);
      if (!course || course.instructor.toString() !== session.userId) {
        return NextResponse.json({ success: false, error: "Forbidden: Not your course" }, { status: 403 });
      }
    }

    const body = await req.json();
    const { replyText } = body;

    if (!replyText || !replyText.trim()) {
      return NextResponse.json({ success: false, error: "Reply text cannot be empty" }, { status: 400 });
    }

    review.instructorReply = {
      text: replyText.trim(),
      repliedAt: new Date(),
    };

    await review.save();

    await logAuditEvent({
      action: "review_reply",
      category: "course",
      resourceId: review._id.toString(),
      actorId: session.userId,
      actorRole: session.role,
      details: `Replied to review by student for courseId ${review.courseId}`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Reply saved successfully",
      review,
    });
  } catch (error: any) {
    console.error("Review reply error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit reply" },
      { status: 500 }
    );
  }
}
