import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Quiz } from "@/models/Quiz";
import { Course } from "@/models/Course";
import { getSessionUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    await connectDB();
    const { quizId } = await params;
    const session = await getSessionUser(req);

    const quiz = await Quiz.findById(quizId).lean();
    if (!quiz) {
      return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 });
    }

    const isPrivileged =
      session && (session.role === "instructor" || session.role === "admin" || session.role === "super_admin");

    // If student taking quiz, do NOT expose isCorrect answer keys in questions
    if (!isPrivileged) {
      quiz.questions = quiz.questions.map((q: any) => ({
        ...q,
        options: q.options.map((opt: any) => ({
          _id: opt._id,
          text: opt.text,
        })),
        explanation: "", // Hide explanation until after submission
      }));
    }

    return NextResponse.json({ success: true, quiz });
  } catch (error: any) {
    console.error("Quiz GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load quiz" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    await connectDB();
    const session = await getSessionUser(req);
    if (!session || (session.role !== "instructor" && session.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { quizId } = await params;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 });
    }

    const course = await Course.findById(quiz.courseId);
    if (session.role === "instructor" && course && course.instructor.toString() !== session.userId) {
      return NextResponse.json({ success: false, error: "Forbidden: Not your course" }, { status: 403 });
    }

    const updates = await req.json();
    Object.assign(quiz, updates);
    await quiz.save();

    await logAuditEvent({
      action: "quiz_update",
      category: "course",
      resourceId: quiz._id.toString(),
      actorId: session.userId,
      actorRole: session.role,
      details: `Updated quiz "${quiz.title}" (${quiz.questions.length} questions)`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Quiz updated successfully",
      quiz,
    });
  } catch (error: any) {
    console.error("Quiz PUT error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update quiz" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    await connectDB();
    const session = await getSessionUser(req);
    if (!session || (session.role !== "instructor" && session.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { quizId } = await params;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 });
    }

    const course = await Course.findById(quiz.courseId);
    if (session.role === "instructor" && course && course.instructor.toString() !== session.userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await Quiz.findByIdAndDelete(quizId);

    await logAuditEvent({
      action: "quiz_delete",
      category: "course",
      resourceId: quizId,
      actorId: session.userId,
      actorRole: session.role,
      details: `Deleted quiz "${quiz.title}"`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error: any) {
    console.error("Quiz DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete quiz" },
      { status: 500 }
    );
  }
}
