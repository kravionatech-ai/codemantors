import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Quiz, QuizAttempt, Enrollment, LessonProgress, Course, Certificate, User } from "@/models";
import { getSessionUser } from "@/lib/auth";
import { sendEmailAndNotify, generateCertificateEmail } from "@/lib/email";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await props.params;
    const session = await getSessionUser(req);

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { answers, timeSpentSeconds = 0 } = body; // answers: [{ questionIndex: number, selectedOptionIndices: number[] }]

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 });
    }

    // Check existing attempts
    const previousAttemptsCount = await QuizAttempt.countDocuments({
      userId: session.userId,
      quizId: quiz._id,
    });

    if (quiz.maxAttempts > 0 && previousAttemptsCount >= quiz.maxAttempts) {
      return NextResponse.json(
        {
          success: false,
          error: `You have reached the maximum allowed attempts (${quiz.maxAttempts}) for this quiz.`,
        },
        { status: 400 }
      );
    }

    let totalScore = 0;
    let maxScore = 0;
    const evaluatedAnswers: any[] = [];
    const questionReview: any[] = [];

    quiz.questions.forEach((q, index) => {
      const qPoints = q.points || 1;
      maxScore += qPoints;

      const userSubmission = answers?.find((a: any) => a.questionIndex === index);
      const selectedIndices: number[] = userSubmission ? userSubmission.selectedOptionIndices : [];

      // Find correct indices
      const correctIndices = q.options
        .map((opt, idx) => (opt.isCorrect ? idx : -1))
        .filter((idx) => idx !== -1);

      // Check if selected matches correct exactly
      const isMatch =
        selectedIndices.length === correctIndices.length &&
        selectedIndices.every((idx) => correctIndices.includes(idx));

      const pointsAwarded = isMatch ? qPoints : 0;
      totalScore += pointsAwarded;

      evaluatedAnswers.push({
        questionIndex: index,
        questionId: q._id?.toString(),
        selectedOptionIndices: selectedIndices,
        isCorrect: isMatch,
        pointsAwarded,
      });

      questionReview.push({
        questionIndex: index,
        questionText: q.questionText,
        codeSnippet: q.codeSnippet,
        type: q.type,
        options: q.options.map((opt, idx) => ({
          index: idx,
          text: opt.text,
          isCorrect: opt.isCorrect,
          isSelected: selectedIndices.includes(idx),
        })),
        isCorrect: isMatch,
        pointsAwarded,
        explanation: q.explanation,
      });
    });

    const scorePercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const passed = scorePercentage >= quiz.passingPercentage;

    const attempt = await QuizAttempt.create({
      userId: session.userId,
      quizId: quiz._id,
      courseId: quiz.courseId,
      lessonId: quiz.lessonId,
      attemptNumber: previousAttemptsCount + 1,
      answers: evaluatedAnswers,
      totalScore,
      maxScore,
      scorePercentage,
      passed,
      timeSpentSeconds,
      completedAt: new Date(),
    });

    // If passed, mark quiz lesson as completed on enrollment and progress
    let certificateAwarded = null;
    if (passed) {
      await LessonProgress.findOneAndUpdate(
        { userId: session.userId, courseId: quiz.courseId, lessonId: quiz.lessonId },
        { $set: { isCompleted: true, completedAt: new Date() } },
        { upsert: true }
      );

      const enrollment = await Enrollment.findOne({
        userId: session.userId,
        courseId: quiz.courseId,
      });

      if (enrollment) {
        const completedSet = new Set(enrollment.completedLessons.map((id) => id.toString()));
        completedSet.add(quiz.lessonId);
        enrollment.completedLessons = Array.from(completedSet);

        // Recalculate course percentage
        const course = await Course.findById(quiz.courseId).populate("instructor", "name headline");
        let totalLessons = 0;
        if (course && course.modules) {
          for (const m of course.modules) {
            totalLessons += (m.lessons || []).length;
          }
        }

        const calculatedPercent = totalLessons > 0
          ? Math.min(100, Math.round((enrollment.completedLessons.length / totalLessons) * 100))
          : 0;

        enrollment.progressPercentage = calculatedPercent;

        if (calculatedPercent >= 100 && course && course.certificateEnabled) {
          enrollment.status = "completed";
          if (!enrollment.completedAt) enrollment.completedAt = new Date();

          let certificate = await Certificate.findOne({
            userId: session.userId,
            courseId: course._id,
          });

          if (!certificate) {
            const certCode = `CM-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            const student = await User.findById(session.userId);

            certificate = await Certificate.create({
              certificateCode: certCode,
              userId: session.userId,
              courseId: course._id,
              gradePercentage: scorePercentage,
              verificationUrl: `/certificates/${certCode}`,
              metadata: {
                studentName: student?.name || session.name,
                courseTitle: course.title,
                instructorName: (course.instructor as any)?.name || "CodeMentors Instructor",
                instructorHeadline: (course.instructor as any)?.headline || "Senior Staff Architect",
                completionDate: new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }),
                durationHours: Math.ceil((course.totalDurationMinutes || 120) / 60),
              },
            });

            enrollment.certificateId = certificate._id;

            const certEmail = generateCertificateEmail(
              student?.name || session.name,
              course.title,
              certCode
            );
            sendEmailAndNotify({
              to: session.email,
              subject: certEmail.subject,
              text: certEmail.text,
              html: certEmail.html,
              userId: session.userId,
              type: "certificate",
              link: `/certificates/${certCode}`,
            }).catch(console.error);

            certificateAwarded = certificate;
          }
        }

        await enrollment.save();
      }
    }

    return NextResponse.json({
      success: true,
      results: {
        attemptId: attempt._id,
        attemptNumber: attempt.attemptNumber,
        totalScore,
        maxScore,
        scorePercentage,
        passed,
        passingPercentage: quiz.passingPercentage,
        timeSpentSeconds,
        questionReview,
        certificateAwarded,
      },
    });
  } catch (error: any) {
    console.error("Quiz submission error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit quiz" },
      { status: 500 }
    );
  }
}
