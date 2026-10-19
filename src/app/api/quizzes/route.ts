import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Quiz } from "@/models/Quiz";
import { Course } from "@/models/Course";
import { getSessionUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    const query = courseId ? { courseId } : {};
    const quizzes = await Quiz.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, quizzes });
  } catch (error: any) {
    console.error("Quizzes GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load quizzes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSessionUser(req);
    if (!session || (session.role !== "instructor" && session.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const {
      courseId,
      lessonId,
      title,
      description,
      timeLimitMinutes,
      passingPercentage,
      maxAttempts,
      questions,
    } = body;

    if (!courseId || !title || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { success: false, error: "Course ID, title, and questions array are required" },
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

    const quiz = await Quiz.create({
      courseId,
      lessonId: lessonId || "",
      title: title.trim(),
      description: description?.trim() || "",
      timeLimitMinutes: Number(timeLimitMinutes || 15),
      passingPercentage: Number(passingPercentage || 70),
      maxAttempts: Number(maxAttempts || 3),
      shuffleQuestions: true,
      showExplanationImmediately: true,
      questions,
    });

    await logAuditEvent({
      action: "quiz_create",
      category: "course",
      resourceId: quiz._id.toString(),
      actorId: session.userId,
      actorRole: session.role,
      details: `Created quiz "${title}" with ${questions.length} questions for course "${course.title}"`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: `Quiz "${title}" created successfully`,
      quiz,
    });
  } catch (error: any) {
    console.error("Quiz creation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create quiz" },
      { status: 500 }
    );
  }
}
