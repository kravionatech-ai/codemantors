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

    // Check for duplicate module action
    if (body.action === "duplicate" && body.sourceModuleId) {
      const source = course.modules.find((m: any) => m._id.toString() === body.sourceModuleId.toString());
      if (!source) {
        return NextResponse.json({ success: false, error: "Source module not found" }, { status: 404 });
      }

      // Deep copy lessons with new IDs
      const duplicatedLessons = (source.lessons || []).map((l: any, lIdx: number) => ({
        ...JSON.parse(JSON.stringify(l)),
        _id: new mongoose.Types.ObjectId(),
        title: `${l.title} (Copy)`,
        slug: `${l.slug}-copy-${Date.now().toString().slice(-4)}`,
        order: lIdx + 1,
      }));

      const cleanSlug = `${source.slug || "mod"}-copy-${Date.now().toString().slice(-4)}`;
      const duplicatedModule = {
        _id: new mongoose.Types.ObjectId(),
        title: `${source.title} (Copy)`,
        slug: cleanSlug,
        description: source.description || "",
        order: course.modules.length + 1,
        status: "draft",
        isRequired: source.isRequired !== false,
        learningObjectives: source.learningObjectives ? [...source.learningObjectives] : [],
        estimatedDurationMinutes: source.estimatedDurationMinutes || 0,
        videoUrl: source.videoUrl || "",
        videoDuration: source.videoDuration || 0,
        pdfUrl: source.pdfUrl || "",
        pdfTitle: source.pdfTitle || "",
        notes: source.notes || "",
        lessons: duplicatedLessons,
      };

      course.modules.push(duplicatedModule as any);

      // Recalculate course totals
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
        action: "module_duplicate",
        category: "course",
        resourceId: course._id.toString(),
        actorId: session.userId,
        actorRole: session.role,
        details: `Duplicated module "${source.title}" in course "${course.title}"`,
        req,
      });

      return NextResponse.json({
        success: true,
        message: `Module "${source.title}" duplicated successfully`,
        module: duplicatedModule,
        modules: course.modules,
      });
    }

    // Normal Create Module
    const {
      title,
      description,
      slug: moduleSlug,
      status,
      isRequired,
      learningObjectives,
      estimatedDurationMinutes,
      videoUrl,
      videoDuration,
      pdfUrl,
      pdfTitle,
      notes,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: "Module title is required" }, { status: 400 });
    }

    // Quota check for instructors
    if (session.role === "instructor") {
      const quotaCheck = await verifyInstructorQuota(session.userId, "add_module", { courseId: course._id });
      if (!quotaCheck.allowed) {
        return NextResponse.json({ success: false, error: quotaCheck.reason }, { status: 400 });
      }
    }

    const cleanTitle = title.trim();
    const cleanSlug = moduleSlug?.trim()
      ? moduleSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      : cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const newModule = {
      _id: new mongoose.Types.ObjectId(),
      title: cleanTitle,
      slug: cleanSlug || `module-${Date.now()}`,
      description: description?.trim() || "",
      order: course.modules.length + 1,
      status: status || "published",
      isRequired: isRequired !== false,
      learningObjectives: Array.isArray(learningObjectives) ? learningObjectives : [],
      estimatedDurationMinutes: Number(estimatedDurationMinutes || 0),
      videoUrl: videoUrl?.trim() || "",
      videoDuration: Number(videoDuration || 0),
      pdfUrl: pdfUrl?.trim() || "",
      pdfTitle: pdfTitle?.trim() || "",
      notes: notes?.trim() || "",
      lessons: [],
    };

    course.modules.push(newModule as any);
    await course.save();

    await logAuditEvent({
      action: "module_create",
      category: "course",
      resourceId: course._id.toString(),
      actorId: session.userId,
      actorRole: session.role,
      details: `Added module "${cleanTitle}" to course "${course.title}"`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: `Module "${cleanTitle}" added successfully`,
      module: newModule,
      modules: course.modules,
    });
  } catch (error: any) {
    console.error("Module creation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add module" },
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
      return NextResponse.json({ success: false, error: "Forbidden: Not your course" }, { status: 403 });
    }

    const body = await req.json();
    const { moduleId, modulesOrder, updates } = body;

    // 1. Reorder modules array if modulesOrder is provided
    if (Array.isArray(modulesOrder)) {
      const moduleMap = new Map(course.modules.map((m: any) => [m._id.toString(), m]));
      const reordered: any[] = [];

      modulesOrder.forEach((id: string, idx: number) => {
        const found = moduleMap.get(id);
        if (found) {
          found.order = idx + 1;
          reordered.push(found);
        }
      });

      course.modules.forEach((m: any) => {
        if (!modulesOrder.includes(m._id.toString())) {
          reordered.push(m);
        }
      });

      course.modules = reordered as any;
      await course.save();

      return NextResponse.json({
        success: true,
        message: "Modules reordered successfully",
        modules: course.modules,
      });
    }

    // 2. Update specific module details
    const targetModuleId = moduleId || updates?.moduleId;
    if (targetModuleId) {
      const mod = course.modules.find((m: any) => m._id.toString() === targetModuleId.toString());
      if (!mod) {
        return NextResponse.json({ success: false, error: "Module not found" }, { status: 404 });
      }

      const patch = updates || body;

      if (patch.title !== undefined) mod.title = patch.title.trim();
      if (patch.slug !== undefined) mod.slug = patch.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      if (patch.description !== undefined) mod.description = patch.description.trim();
      if (patch.status !== undefined) mod.status = patch.status;
      if (patch.isRequired !== undefined) mod.isRequired = Boolean(patch.isRequired);
      if (patch.learningObjectives !== undefined) mod.learningObjectives = patch.learningObjectives;
      if (patch.estimatedDurationMinutes !== undefined) mod.estimatedDurationMinutes = Number(patch.estimatedDurationMinutes);
      if (patch.videoUrl !== undefined) mod.videoUrl = patch.videoUrl.trim();
      if (patch.videoDuration !== undefined) mod.videoDuration = Number(patch.videoDuration);
      if (patch.pdfUrl !== undefined) mod.pdfUrl = patch.pdfUrl.trim();
      if (patch.pdfTitle !== undefined) mod.pdfTitle = patch.pdfTitle.trim();
      if (patch.notes !== undefined) mod.notes = patch.notes;

      await course.save();

      return NextResponse.json({
        success: true,
        message: "Module updated successfully",
        module: mod,
        modules: course.modules,
      });
    }

    return NextResponse.json({ success: false, error: "Must specify moduleId or modulesOrder" }, { status: 400 });
  } catch (error: any) {
    console.error("Module update error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update module" },
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
    if (!moduleId) {
      return NextResponse.json({ success: false, error: "Module ID required" }, { status: 400 });
    }

    const targetModule = course.modules.find((m: any) => m._id.toString() === moduleId.toString());
    const moduleTitle = targetModule?.title || "Module";

    course.modules = course.modules.filter((m: any) => m._id.toString() !== moduleId.toString()) as any;

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
      action: "module_delete",
      category: "course",
      resourceId: course._id.toString(),
      actorId: session.userId,
      actorRole: session.role,
      details: `Deleted module "${moduleTitle}" (${moduleId}) from course "${course.title}"`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Module removed successfully",
      modules: course.modules,
    });
  } catch (error: any) {
    console.error("Module delete error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove module" },
      { status: 500 }
    );
  }
}
