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
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const session = await getSessionUser(req);
    if (!session || (session.role !== "instructor" && session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ _id: id }, { slug: id }] } : { slug: id };

    const originalCourse = await Course.findOne(query).lean();
    if (!originalCourse) {
      return NextResponse.json({ success: false, error: "Source course not found" }, { status: 404 });
    }

    // Ownership check
    if (session.role === "instructor" && originalCourse.instructor.toString() !== session.userId) {
      return NextResponse.json({ success: false, error: "Forbidden: Not your course" }, { status: 403 });
    }

    // Quota check
    if (session.role === "instructor") {
      const quotaCheck = await verifyInstructorQuota(session.userId, "create_course", {
        price: originalCourse.price,
        category: originalCourse.category,
      });
      if (!quotaCheck.allowed) {
        return NextResponse.json({ success: false, error: quotaCheck.reason }, { status: 400 });
      }
    }

    // Unique slug generation
    let baseSlug = `${originalCourse.slug}-copy`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    let newSlug = baseSlug;
    let count = 1;
    while (await Course.findOne({ slug: newSlug })) {
      newSlug = `${baseSlug}-${count++}`;
    }

    // Deep clone modules and lessons with fresh IDs
    const clonedModules = (originalCourse.modules || []).map((mod: any, mIdx: number) => {
      const newModuleId = new mongoose.Types.ObjectId();
      const clonedLessons = (mod.lessons || []).map((les: any, lIdx: number) => {
        const newLessonId = new mongoose.Types.ObjectId();
        const clonedBlocks = (les.contentBlocks || []).map((blk: any) => ({
          ...blk,
          _id: new mongoose.Types.ObjectId(),
        }));

        return {
          ...les,
          _id: newLessonId,
          slug: `${les.slug || "lesson"}-${Date.now().toString().slice(-4)}-${lIdx}`,
          contentBlocks: clonedBlocks,
        };
      });

      return {
        ...mod,
        _id: newModuleId,
        lessons: clonedLessons,
      };
    });

    const duplicatedCourse = await Course.create({
      title: `${originalCourse.title} (Copy)`,
      slug: newSlug,
      subtitle: originalCourse.subtitle || "",
      description: originalCourse.description,
      category: originalCourse.category,
      subcategory: originalCourse.subcategory || "",
      format: originalCourse.format || "Mixed",
      level: originalCourse.level || "All Levels",
      language: originalCourse.language || "English",
      price: originalCourse.price || 0,
      discountPrice: originalCourse.discountPrice,
      isFree: Boolean(originalCourse.isFree),
      thumbnail: originalCourse.thumbnail,
      previewVideoUrl: originalCourse.previewVideoUrl || "",
      instructor: session.userId,
      coInstructors: originalCourse.coInstructors || [],
      requirements: originalCourse.requirements || [],
      whatYouWillLearn: originalCourse.whatYouWillLearn || [],
      targetAudience: originalCourse.targetAudience || [],
      status: "draft",
      isFeatured: false,
      ratingAverage: 5.0,
      ratingCount: 0,
      enrolledCount: 0,
      totalDurationMinutes: originalCourse.totalDurationMinutes || 0,
      totalLessonsCount: originalCourse.totalLessonsCount || 0,
      certificateEnabled: originalCourse.certificateEnabled ?? true,
      passingScore: originalCourse.passingScore || 70,
      tags: originalCourse.tags || [],
      coverImage: originalCourse.coverImage || "",
      accessDurationDays: originalCourse.accessDurationDays || 0,
      seo: {
        title: `${originalCourse.title} (Copy) | CodeMentors`,
        description: originalCourse.seo?.description || originalCourse.description.slice(0, 160),
        keywords: originalCourse.seo?.keywords || [originalCourse.title, originalCourse.category],
        ogImage: originalCourse.seo?.ogImage || originalCourse.thumbnail,
        canonicalUrl: `/courses/${newSlug}`,
        noIndex: true, // safe default for duplicated draft
        noFollow: true,
      },
      modules: clonedModules,
    });

    await logAuditEvent({
      action: "course_duplicate",
      category: "course",
      resourceId: duplicatedCourse._id.toString(),
      actorId: session.userId,
      actorRole: session.role,
      details: `Duplicated course "${originalCourse.title}" -> "${duplicatedCourse.title}" (${newSlug})`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Course duplicated successfully as a new draft",
      course: duplicatedCourse,
    });
  } catch (error: any) {
    console.error("Course duplication error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to duplicate course" },
      { status: 500 }
    );
  }
}
