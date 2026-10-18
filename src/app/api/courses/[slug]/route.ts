import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course, Enrollment, Review } from "@/models";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;
    await connectDB();

    const course = await Course.findOne({ slug })
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

    // Sanitize module lessons if not enrolled and not owner
    const sanitizedModules = course.modules.map((mod: any) => ({
      ...mod,
      lessons: mod.lessons.map((lesson: any) => {
        if (isEnrolled || isInstructorOrAdmin || lesson.isPreview) {
          return lesson;
        }
        // Non-enrolled preview: strip videoUrl and deep content
        const { videoUrl, content, codingExercise, ...safeLesson } = lesson;
        return safeLesson;
      }),
    }));

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
    if (!session || (session.role !== "instructor" && session.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const course = await Course.findOne({ slug });
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

    // Recalculate total duration and lessons count if modules changed
    if (updates.modules) {
      let totalMinutes = 0;
      let totalLessons = 0;
      for (const m of updates.modules) {
        if (m.lessons) {
          totalLessons += m.lessons.length;
          for (const l of m.lessons) {
            totalMinutes += Number(l.durationMinutes || 0);
          }
        }
      }
      updates.totalDurationMinutes = totalMinutes;
      updates.totalLessonsCount = totalLessons;
    }

    Object.assign(course, updates);
    await course.save();

    return NextResponse.json({ success: true, course });
  } catch (error: any) {
    console.error("Course update error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update course" },
      { status: 500 }
    );
  }
}
