import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course, Enrollment, LessonProgress, Quiz } from "@/models";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ courseSlug: string; lessonId: string }> }
) {
  try {
    const { courseSlug, lessonId } = await props.params;
    const session = await getSessionUser(req);

    if (!session) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    await connectDB();

    const course = await Course.findOne({ slug: courseSlug }).lean();
    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    // Locate module and lesson
    let targetLesson: any = null;
    let targetModule: any = null;
    let prevLessonId: string | null = null;
    let nextLessonId: string | null = null;

    const allLessons: Array<{ id: string; title: string }> = [];
    for (const mod of course.modules) {
      for (const les of mod.lessons) {
        allLessons.push({ id: (les as any)._id.toString(), title: les.title });
      }
    }

    const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
    if (currentIndex !== -1) {
      if (currentIndex > 0) prevLessonId = allLessons[currentIndex - 1].id;
      if (currentIndex < allLessons.length - 1) nextLessonId = allLessons[currentIndex + 1].id;
    }

    for (const mod of course.modules) {
      const found = mod.lessons.find((l: any) => l._id.toString() === lessonId);
      if (found) {
        targetLesson = found;
        targetModule = mod;
        break;
      }
    }

    if (!targetLesson) {
      return NextResponse.json({ success: false, error: "Lesson not found" }, { status: 404 });
    }

    // Verify enrollment or instructor/admin authorization
    const isOwnerOrAdmin =
      session.role === "admin" ||
      (session.role === "instructor" && course.instructor.toString() === session.userId);

    const enrollment = await Enrollment.findOne({
      userId: session.userId,
      courseId: course._id,
      status: { $in: ["active", "completed"] },
    });

    if (!enrollment && !isOwnerOrAdmin && !targetLesson.isPreview) {
      return NextResponse.json(
        { success: false, error: "You must be enrolled in this course to access this lesson" },
        { status: 403 }
      );
    }

    // Update last accessed lesson on enrollment
    if (enrollment) {
      enrollment.lastAccessedLessonId = lessonId;
      await enrollment.save();
    }

    // Get student's personal progress for this lesson
    let progress = await LessonProgress.findOne({
      userId: session.userId,
      courseId: course._id,
      lessonId,
    }).lean();

    if (!progress) {
      progress = {
        userId: session.userId as any,
        courseId: course._id as any,
        lessonId,
        isCompleted: enrollment?.completedLessons?.includes(lessonId) || false,
        lastPositionSeconds: 0,
        notes: "",
        isBookmarked: false,
      } as any;
    }

    // If lesson is a quiz, load quiz definition and sanitize answers
    let quizData = null;
    if (targetLesson.type === "quiz") {
      const quiz = await Quiz.findOne({
        courseId: course._id,
        lessonId,
      }).lean();

      if (quiz) {
        // Strip correct answer flags so answers are not exposed in network payloads
        const sanitizedQuestions = quiz.questions.map((q: any) => ({
          _id: q._id,
          questionText: q.questionText,
          codeSnippet: q.codeSnippet,
          type: q.type,
          points: q.points,
          options: q.options.map((opt: any, idx: number) => ({
            index: idx,
            text: opt.text,
          })),
        }));

        quizData = {
          _id: quiz._id,
          title: quiz.title,
          description: quiz.description,
          timeLimitMinutes: quiz.timeLimitMinutes,
          passingPercentage: quiz.passingPercentage,
          maxAttempts: quiz.maxAttempts,
          questions: sanitizedQuestions,
        };
      }
    }

    return NextResponse.json({
      success: true,
      course: {
        _id: course._id,
        title: course.title,
        slug: course.slug,
        certificateEnabled: course.certificateEnabled,
        modules: course.modules.map((m: any) => ({
          _id: m._id,
          title: m.title,
          description: m.description,
          lessons: m.lessons.map((l: any) => ({
            _id: l._id,
            title: l.title,
            slug: l.slug,
            type: l.type,
            durationMinutes: l.durationMinutes,
            isPreview: l.isPreview,
            isCompleted: enrollment?.completedLessons?.includes(l._id.toString()) || false,
          })),
        })),
      },
      currentModule: {
        _id: targetModule._id,
        title: targetModule.title,
      },
      lesson: targetLesson,
      quiz: quizData,
      navigation: {
        prevLessonId,
        nextLessonId,
      },
      progress,
      enrollment: enrollment
        ? {
            progressPercentage: enrollment.progressPercentage,
            completedLessons: enrollment.completedLessons,
            status: enrollment.status,
            certificateId: enrollment.certificateId,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Learn lesson access error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load lesson" },
      { status: 500 }
    );
  }
}
