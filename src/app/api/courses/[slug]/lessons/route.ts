import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { getSessionUser } from "@/lib/auth";
import { verifyInstructorQuota } from "@/lib/limits";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const session = await getSessionUser(req);
    if (!session || (session.role !== "instructor" && session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { slug } = await params;
    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const query = isObjectId ? { $or: [{ slug }, { _id: slug }] } : { slug };

    const course = await Course.findOne(query);
    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    if (session.role === "instructor" && course.instructor.toString() !== session.userId) {
      return NextResponse.json({ success: false, error: "Forbidden: Not your course" }, { status: 403 });
    }

    const body = await req.json();

    // Check for duplicate lesson action
    if (body.action === "duplicate" && body.sourceModuleId && body.sourceLessonId) {
      const sourceModule = course.modules.find((m: any) => m._id.toString() === body.sourceModuleId.toString());
      if (!sourceModule) {
        return NextResponse.json({ success: false, error: "Source module not found" }, { status: 404 });
      }

      const sourceLesson = sourceModule.lessons.find((l: any) => l._id.toString() === body.sourceLessonId.toString());
      if (!sourceLesson) {
        return NextResponse.json({ success: false, error: "Source lesson not found" }, { status: 404 });
      }

      const targetModule = body.targetModuleId
        ? course.modules.find((m: any) => m._id.toString() === body.targetModuleId.toString()) || sourceModule
        : sourceModule;

      const cleanSlug = `${sourceLesson.slug}-copy-${Date.now().toString().slice(-4)}`;
      const duplicatedLesson = {
        ...JSON.parse(JSON.stringify(sourceLesson)),
        _id: new mongoose.Types.ObjectId(),
        title: `${sourceLesson.title} (Copy)`,
        slug: cleanSlug,
        order: (targetModule.lessons?.length || 0) + 1,
        status: "draft",
      };

      targetModule.lessons.push(duplicatedLesson as any);

      // Recalculate totals
      let totalLessons = 0;
      let totalMinutes = 0;
      course.modules.forEach((m: any) => {
        (m.lessons || []).forEach((l: any) => {
          totalLessons++;
          totalMinutes += Number(l.durationMinutes || 0);
        });
      });
      course.totalLessonsCount = totalLessons;
      course.totalDurationMinutes = totalMinutes;

      await course.save();

      await logAuditEvent({
        action: "lesson_duplicate",
        category: "course",
        resourceId: course._id.toString(),
        actorId: session.userId,
        actorRole: session.role,
        details: `Duplicated lesson "${sourceLesson.title}" in module "${targetModule.title}"`,
        req,
      });

      return NextResponse.json({
        success: true,
        message: `Lesson "${sourceLesson.title}" duplicated successfully`,
        lesson: duplicatedLesson,
        modules: course.modules,
      });
    }

    // Normal Create Lesson
    const {
      moduleId,
      title,
      slug: customSlug,
      type,
      description,
      durationMinutes,
      isPreview,
      isRequired,
      status,
      videoUrl,
      videoDuration,
      videoProvider,
      captionsUrl,
      content,
      pdfUrl,
      pdfTitle,
      fileSize,
      downloadAllowed,
      readingTimeMinutes,
      contentBlocks,
      resources,
      quizId,
      codingExercise,
      seo,
    } = body;

    if (!moduleId || !title || !title.trim()) {
      return NextResponse.json({ success: false, error: "Module ID and lesson title are required" }, { status: 400 });
    }

    const targetModule = course.modules.find((m: any) => m._id.toString() === moduleId.toString());
    if (!targetModule) {
      return NextResponse.json({ success: false, error: "Target module not found" }, { status: 404 });
    }

    // Quota validation for instructors
    if (session.role === "instructor") {
      const quotaCheck = await verifyInstructorQuota(session.userId, "add_lesson", {
        courseId: course._id,
        moduleId,
        durationMinutes: Number(durationMinutes || 5),
      });

      if (!quotaCheck.allowed) {
        return NextResponse.json({ success: false, error: quotaCheck.reason }, { status: 400 });
      }
    }

    const cleanTitle = title.trim();
    let cleanSlug = customSlug?.trim()
      ? customSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      : cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    if (!cleanSlug) {
      cleanSlug = `lesson-${Date.now()}`;
    }

    // Ensure unique slug within this course
    const allLessonSlugs = new Set();
    course.modules.forEach((m: any) => {
      (m.lessons || []).forEach((l: any) => allLessonSlugs.add(l.slug));
    });

    if (allLessonSlugs.has(cleanSlug)) {
      cleanSlug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;
    }

    // Determine default video provider
    let resolvedProvider = videoProvider || "youtube";
    if (videoUrl) {
      if (videoUrl.includes("vimeo.com")) resolvedProvider = "vimeo";
      else if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) resolvedProvider = "youtube";
      else if (videoUrl.endsWith(".mp4") || videoUrl.endsWith(".webm")) resolvedProvider = "html5";
      else resolvedProvider = "custom";
    }

    const newLesson = {
      _id: new mongoose.Types.ObjectId(),
      title: cleanTitle,
      slug: cleanSlug,
      type: type || "video",
      description: description?.trim() || "",
      order: (targetModule.lessons?.length || 0) + 1,
      durationMinutes: Number(durationMinutes || 10),
      isPreview: Boolean(isPreview),
      isRequired: isRequired !== false,
      status: status || "published",
      videoUrl: videoUrl?.trim() || "",
      videoDuration: Number(videoDuration || 0),
      videoProvider: resolvedProvider,
      captionsUrl: captionsUrl?.trim() || "",
      content: content || "",
      pdfUrl: pdfUrl?.trim() || "",
      pdfTitle: pdfTitle?.trim() || "",
      fileSize: fileSize?.trim() || "",
      downloadAllowed: downloadAllowed !== false,
      readingTimeMinutes: Number(readingTimeMinutes || 5),
      contentBlocks: Array.isArray(contentBlocks) ? contentBlocks : [],
      resources: Array.isArray(resources) ? resources : [],
      quizId: quizId || undefined,
      codingExercise: codingExercise || undefined,
      seo: {
        title: seo?.title?.trim() || `${cleanTitle} | ${course.title}`,
        description: seo?.description?.trim() || description?.trim() || `Learn ${cleanTitle} in ${course.title} on CodeMentors.`,
        keywords: Array.isArray(seo?.keywords) ? seo.keywords : [cleanTitle, course.title],
        ogImage: seo?.ogImage?.trim() || course.thumbnail || "",
        canonicalUrl: seo?.canonicalUrl?.trim() || `/learn/${course.slug}/${cleanSlug}`,
        noIndex: Boolean(seo?.noIndex),
        noFollow: Boolean(seo?.noFollow),
      },
    };

    targetModule.lessons.push(newLesson as any);

    // Recalculate totals
    let totalLessons = 0;
    let totalMinutes = 0;
    course.modules.forEach((m: any) => {
      (m.lessons || []).forEach((l: any) => {
        totalLessons++;
        totalMinutes += Number(l.durationMinutes || 0);
      });
    });
    course.totalLessonsCount = totalLessons;
    course.totalDurationMinutes = totalMinutes;

    await course.save();

    await logAuditEvent({
      action: "lesson_create",
      category: "course",
      resourceId: course._id.toString(),
      actorId: session.userId,
      actorRole: session.role,
      details: `Added ${type || "video"} lesson "${cleanTitle}" to module "${targetModule.title}"`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: `Lesson "${cleanTitle}" added successfully`,
      lesson: newLesson,
      modules: course.modules,
    });
  } catch (error: any) {
    console.error("Lesson creation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add lesson" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const session = await getSessionUser(req);
    if (!session || (session.role !== "instructor" && session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { slug } = await params;
    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const query = isObjectId ? { $or: [{ slug }, { _id: slug }] } : { slug };

    const course = await Course.findOne(query);
    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    if (session.role === "instructor" && course.instructor.toString() !== session.userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { moduleId, lessonId, lessonsOrder, updates } = body;

    // 1. Reorder lessons within a module if lessonsOrder is provided
    if (moduleId && Array.isArray(lessonsOrder)) {
      const targetModule = course.modules.find((m: any) => m._id.toString() === moduleId.toString());
      if (!targetModule) {
        return NextResponse.json({ success: false, error: "Module not found" }, { status: 404 });
      }

      const lessonMap = new Map((targetModule.lessons || []).map((l: any) => [l._id.toString(), l]));
      const reordered: any[] = [];

      lessonsOrder.forEach((id: string, idx: number) => {
        const found = lessonMap.get(id);
        if (found) {
          found.order = idx + 1;
          reordered.push(found);
        }
      });

      targetModule.lessons.forEach((l: any) => {
        if (!lessonsOrder.includes(l._id.toString())) {
          reordered.push(l);
        }
      });

      targetModule.lessons = reordered as any;
      await course.save();

      return NextResponse.json({
        success: true,
        message: "Lessons reordered successfully",
        modules: course.modules,
      });
    }

    // 2. Update specific lesson details
    if (!moduleId || !lessonId || !updates) {
      return NextResponse.json({ success: false, error: "Module ID, Lesson ID, and updates are required" }, { status: 400 });
    }

    const targetModule = course.modules.find((m: any) => m._id.toString() === moduleId.toString());
    if (!targetModule) {
      return NextResponse.json({ success: false, error: "Module not found" }, { status: 404 });
    }

    const lesson = targetModule.lessons.find((l: any) => l._id.toString() === lessonId.toString());
    if (!lesson) {
      return NextResponse.json({ success: false, error: "Lesson not found" }, { status: 404 });
    }

    // Apply updates
    if (updates.title !== undefined) lesson.title = updates.title.trim();
    if (updates.slug !== undefined) {
      lesson.slug = updates.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    }
    if (updates.type !== undefined) lesson.type = updates.type;
    if (updates.description !== undefined) lesson.description = updates.description.trim();
    if (updates.durationMinutes !== undefined) lesson.durationMinutes = Number(updates.durationMinutes);
    if (updates.isPreview !== undefined) lesson.isPreview = Boolean(updates.isPreview);
    if (updates.isRequired !== undefined) lesson.isRequired = Boolean(updates.isRequired);
    if (updates.status !== undefined) lesson.status = updates.status;
    if (updates.videoUrl !== undefined) lesson.videoUrl = updates.videoUrl.trim();
    if (updates.videoDuration !== undefined) lesson.videoDuration = Number(updates.videoDuration);
    if (updates.videoProvider !== undefined) lesson.videoProvider = updates.videoProvider;
    if (updates.captionsUrl !== undefined) lesson.captionsUrl = updates.captionsUrl.trim();
    if (updates.content !== undefined) lesson.content = updates.content;
    if (updates.pdfUrl !== undefined) lesson.pdfUrl = updates.pdfUrl.trim();
    if (updates.pdfTitle !== undefined) lesson.pdfTitle = updates.pdfTitle.trim();
    if (updates.fileSize !== undefined) lesson.fileSize = updates.fileSize.trim();
    if (updates.downloadAllowed !== undefined) lesson.downloadAllowed = Boolean(updates.downloadAllowed);
    if (updates.readingTimeMinutes !== undefined) lesson.readingTimeMinutes = Number(updates.readingTimeMinutes);
    if (updates.contentBlocks !== undefined) lesson.contentBlocks = updates.contentBlocks;
    if (updates.resources !== undefined) lesson.resources = updates.resources;
    if (updates.codingExercise !== undefined) lesson.codingExercise = updates.codingExercise;
    if (updates.quizId !== undefined) lesson.quizId = updates.quizId;
    if (updates.seo !== undefined) {
      lesson.seo = {
        title: updates.seo.title !== undefined ? updates.seo.title.trim() : lesson.seo?.title || "",
        description: updates.seo.description !== undefined ? updates.seo.description.trim() : lesson.seo?.description || "",
        keywords: Array.isArray(updates.seo.keywords) ? updates.seo.keywords : lesson.seo?.keywords || [],
        ogImage: updates.seo.ogImage !== undefined ? updates.seo.ogImage.trim() : lesson.seo?.ogImage || "",
        canonicalUrl: updates.seo.canonicalUrl !== undefined ? updates.seo.canonicalUrl.trim() : lesson.seo?.canonicalUrl || "",
        noIndex: updates.seo.noIndex !== undefined ? Boolean(updates.seo.noIndex) : Boolean(lesson.seo?.noIndex),
        noFollow: updates.seo.noFollow !== undefined ? Boolean(updates.seo.noFollow) : Boolean(lesson.seo?.noFollow),
      };
    }

    // Recalculate totals
    let totalLessons = 0;
    let totalMinutes = 0;
    course.modules.forEach((m: any) => {
      (m.lessons || []).forEach((l: any) => {
        totalLessons++;
        totalMinutes += Number(l.durationMinutes || 0);
      });
    });
    course.totalLessonsCount = totalLessons;
    course.totalDurationMinutes = totalMinutes;

    await course.save();

    return NextResponse.json({
      success: true,
      message: "Lesson updated successfully",
      lesson,
      modules: course.modules,
    });
  } catch (error: any) {
    console.error("Lesson update error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update lesson" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const session = await getSessionUser(req);
    if (!session || (session.role !== "instructor" && session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { slug } = await params;
    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const query = isObjectId ? { $or: [{ slug }, { _id: slug }] } : { slug };

    const course = await Course.findOne(query);
    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    if (session.role === "instructor" && course.instructor.toString() !== session.userId) {
      return NextResponse.json({ success: false, error: "Forbidden: Not your course" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const moduleId = searchParams.get("moduleId");
    const lessonId = searchParams.get("lessonId");

    if (!moduleId || !lessonId) {
      return NextResponse.json({ success: false, error: "Module ID and Lesson ID required" }, { status: 400 });
    }

    const targetModule = course.modules.find((m: any) => m._id.toString() === moduleId.toString());
    if (!targetModule) {
      return NextResponse.json({ success: false, error: "Module not found" }, { status: 404 });
    }

    const lesson = targetModule.lessons.find((l: any) => l._id.toString() === lessonId.toString());
    const lessonTitle = lesson?.title || "Lesson";

    targetModule.lessons = targetModule.lessons.filter((l: any) => l._id.toString() !== lessonId.toString());

    // Recalculate totals
    let totalLessons = 0;
    let totalMinutes = 0;
    course.modules.forEach((m: any) => {
      (m.lessons || []).forEach((l: any) => {
        totalLessons++;
        totalMinutes += Number(l.durationMinutes || 0);
      });
    });
    course.totalLessonsCount = totalLessons;
    course.totalDurationMinutes = totalMinutes;

    await course.save();

    await logAuditEvent({
      action: "lesson_delete",
      category: "course",
      resourceId: course._id.toString(),
      actorId: session.userId,
      actorRole: session.role,
      details: `Deleted lesson "${lessonTitle}" (${lessonId}) from module "${targetModule.title}"`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: `Lesson "${lessonTitle}" deleted successfully`,
      modules: course.modules,
    });
  } catch (error: any) {
    console.error("Lesson delete error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete lesson" },
      { status: 500 }
    );
  }
}
