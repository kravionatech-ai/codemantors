import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Course, SupportTicket, User } from "@/models";
import { getSessionUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { sanitizeHtml } from "@/lib/sanitize-html";

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
    const status = searchParams.get("status") || "all";

    const courseQuery: any = { instructor: session.userId };
    if (courseId) {
      courseQuery._id = courseId;
    }

    const courses = await Course.find(courseQuery).select("_id title slug announcements").lean();
    const courseIds = courses.map((c) => c._id);

    // 1. Fetch Course-linked Support Tickets / Questions
    const ticketQuery: any = { courseId: { $in: courseIds } };
    if (status && status !== "all") {
      ticketQuery.status = status;
    }

    const tickets = await SupportTicket.find(ticketQuery)
      .populate("userId", "name avatar email")
      .populate("courseId", "title slug")
      .sort({ createdAt: -1 })
      .lean();

    // 2. Extract and organize all announcements across instructor's courses
    const allAnnouncements: any[] = [];
    courses.forEach((c) => {
      if (Array.isArray(c.announcements)) {
        c.announcements.forEach((a: any) => {
          allAnnouncements.push({
            ...a,
            courseId: c._id,
            courseTitle: c.title,
            courseSlug: c.slug,
          });
        });
      }
    });

    allAnnouncements.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({
      success: true,
      questions: tickets,
      announcements: allAnnouncements,
      courses: courses.map((c) => ({ _id: c._id, title: c.title })),
    });
  } catch (error: any) {
    console.error("Instructor QA GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load Q&A and announcements" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== "instructor" && session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { action } = body;

    // A. Reply to student question
    if (action === "reply_question") {
      const { ticketId, message, resolve } = body;
      if (!ticketId || !message?.trim()) {
        return NextResponse.json(
          { success: false, error: "Ticket ID and message are required" },
          { status: 400 }
        );
      }

      const ticket = await SupportTicket.findById(ticketId);
      if (!ticket) {
        return NextResponse.json({ success: false, error: "Question not found" }, { status: 404 });
      }

      // Verify course ownership
      if (session.role === "instructor" && ticket.courseId) {
        const course = await Course.findById(ticket.courseId);
        if (!course || course.instructor.toString() !== session.userId) {
          return NextResponse.json({ success: false, error: "Forbidden: Not your course" }, { status: 403 });
        }
      }

      const instructorUser = await User.findById(session.userId);

      ticket.responses.push({
        senderRole: "instructor",
        senderName: instructorUser?.name || "Course Instructor",
        message: sanitizeHtml(message.trim()),
        createdAt: new Date(),
      } as any);

      if (resolve) {
        ticket.status = "resolved";
      } else {
        ticket.status = "in_progress";
      }

      await ticket.save();

      return NextResponse.json({
        success: true,
        message: "Reply posted successfully",
        ticket,
      });
    }

    // B. Create course announcement
    if (action === "create_announcement") {
      const { courseId, title, content, isPinned } = body;
      if (!courseId || !title?.trim() || !content?.trim()) {
        return NextResponse.json(
          { success: false, error: "Course, announcement title, and content are required" },
          { status: 400 }
        );
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
      }

      if (session.role === "instructor" && course.instructor.toString() !== session.userId) {
        return NextResponse.json({ success: false, error: "Forbidden: Not your course" }, { status: 403 });
      }

      if (!course.announcements) {
        course.announcements = [];
      }

      const newAnnouncement = {
        _id: new mongoose.Types.ObjectId(),
        title: title.trim(),
        content: sanitizeHtml(content.trim()),
        createdAt: new Date(),
        isPinned: Boolean(isPinned),
        createdBy: new mongoose.Types.ObjectId(session.userId),
      };

      course.announcements.unshift(newAnnouncement as any);
      await course.save();

      await logAuditEvent({
        action: "course_announcement_create",
        category: "course",
        resourceId: course._id.toString(),
        actorId: session.userId,
        actorRole: session.role,
        details: `Created announcement "${title}" for course "${course.title}"`,
        req,
      });

      return NextResponse.json({
        success: true,
        message: "Announcement broadcasted successfully",
        announcement: newAnnouncement,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Instructor QA POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
