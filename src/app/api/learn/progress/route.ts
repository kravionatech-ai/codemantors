import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course, Enrollment, LessonProgress, Certificate, User } from "@/models";
import { getSessionUser } from "@/lib/auth";
import { sendEmailAndNotify, generateCertificateEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { courseId, lessonId, isCompleted, lastPositionSeconds, notes, isBookmarked } = body;

    if (!courseId || !lessonId) {
      return NextResponse.json(
        { success: false, error: "Course ID and Lesson ID are required" },
        { status: 400 }
      );
    }

    // Find enrollment
    const enrollment = await Enrollment.findOne({
      userId: session.userId,
      courseId,
    });

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: "Enrollment not found for this course" },
        { status: 404 }
      );
    }

    // Upsert lesson progress
    const updateFields: Record<string, any> = {};
    if (typeof isCompleted === "boolean") updateFields.isCompleted = isCompleted;
    if (typeof lastPositionSeconds === "number") updateFields.lastPositionSeconds = lastPositionSeconds;
    if (typeof notes === "string") updateFields.notes = notes;
    if (typeof isBookmarked === "boolean") updateFields.isBookmarked = isBookmarked;
    if (isCompleted) updateFields.completedAt = new Date();

    const progress = await LessonProgress.findOneAndUpdate(
      { userId: session.userId, courseId, lessonId },
      { $set: updateFields },
      { new: true, upsert: true }
    );

    // If completion state toggled, recalculate course progress
    let newlyEarnedCertificate = null;

    if (typeof isCompleted === "boolean") {
      let completedSet = new Set(enrollment.completedLessons.map((id) => id.toString()));
      if (isCompleted) {
        completedSet.add(lessonId);
      } else {
        completedSet.delete(lessonId);
      }

      enrollment.completedLessons = Array.from(completedSet);
      enrollment.lastAccessedLessonId = lessonId;

      // Count total lessons in course
      const course = await Course.findById(courseId).populate("instructor", "name headline");
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

      // Check certificate eligibility
      if (calculatedPercent >= 100 && course && course.certificateEnabled) {
        enrollment.status = "completed";
        if (!enrollment.completedAt) enrollment.completedAt = new Date();

        // Check if certificate already issued
        let certificate = await Certificate.findOne({
          userId: session.userId,
          courseId,
        });

        if (!certificate) {
          const certCode = `CM-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          const student = await User.findById(session.userId);
          const instructorName = (course.instructor as any)?.name || "CodeMentors Instructor";

          certificate = await Certificate.create({
            certificateCode: certCode,
            userId: session.userId,
            courseId,
            gradePercentage: 100,
            verificationUrl: `/certificates/${certCode}`,
            metadata: {
              studentName: student?.name || session.name,
              courseTitle: course.title,
              instructorName,
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

          // Dispatch notification and email
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

          newlyEarnedCertificate = certificate;
        }
      }

      await enrollment.save();
    }

    return NextResponse.json({
      success: true,
      progress,
      progressPercentage: enrollment.progressPercentage,
      completedLessons: enrollment.completedLessons,
      isCompleted: progress.isCompleted,
      isBookmarked: progress.isBookmarked,
      newlyEarnedCertificate,
    });
  } catch (error: any) {
    console.error("Update progress error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update progress" },
      { status: 500 }
    );
  }
}
