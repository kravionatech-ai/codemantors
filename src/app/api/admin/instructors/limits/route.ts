import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { InstructorLimit } from "@/models/InstructorLimit";
import { User } from "@/models/User";
import { getSessionUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getEffectiveInstructorLimits } from "@/lib/limits";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSessionUser(req);
    if (!session || !hasPermission(session, "users.manage")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Insufficient permissions to view instructor limits" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const instructorId = searchParams.get("instructorId");

    if (instructorId) {
      const limits = await getEffectiveInstructorLimits(instructorId);
      const isCustom = Boolean(await InstructorLimit.findOne({ instructorId }));
      return NextResponse.json({ success: true, limits, isCustom });
    }

    const [globalLimit, customOverrides, instructors] = await Promise.all([
      getEffectiveInstructorLimits(),
      InstructorLimit.find({ isGlobalDefault: { $ne: true } })
        .populate("instructorId", "name email avatar headline")
        .lean(),
      User.find({ role: "instructor" })
        .select("name email avatar headline instructorStatus isSuspended createdAt")
        .sort({ name: 1 })
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      globalLimit,
      customOverrides,
      instructors,
    });
  } catch (error: any) {
    console.error("Instructor limits GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load instructor limits" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSessionUser(req);
    if (!session || !hasPermission(session, "users.manage")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Insufficient permissions to modify instructor limits" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { instructorId, isGlobalDefault, limits, removeOverride } = body;

    // 1. Remove custom override and restore global defaults for instructor
    if (instructorId && removeOverride) {
      await InstructorLimit.findOneAndDelete({ instructorId });
      await logAuditEvent({
        action: "instructor_override_removed",
        category: "settings",
        resourceId: instructorId,
        actorId: session.userId,
        actorRole: session.role,
        details: `Restored global default quotas for instructor ${instructorId}`,
        req,
      });

      return NextResponse.json({
        success: true,
        message: "Custom instructor limits removed; global limits now apply.",
      });
    }

    // 2. Set custom override for instructor
    if (instructorId) {
      const updated = await InstructorLimit.findOneAndUpdate(
        { instructorId },
        {
          instructorId,
          isGlobalDefault: false,
          ...limits,
        },
        { new: true, upsert: true }
      );

      await logAuditEvent({
        action: "instructor_override_set",
        category: "settings",
        resourceId: instructorId,
        actorId: session.userId,
        actorRole: session.role,
        details: `Configured customized limits for instructor ${instructorId} (Max Active: ${limits?.maxActiveCourses || 5})`,
        req,
      });

      return NextResponse.json({
        success: true,
        message: "Instructor-specific limits saved successfully",
        limits: updated,
      });
    }

    // 3. Update global platform defaults
    if (isGlobalDefault) {
      const updatedGlobal = await InstructorLimit.findOneAndUpdate(
        { isGlobalDefault: true },
        {
          isGlobalDefault: true,
          ...limits,
        },
        { new: true, upsert: true }
      );

      await logAuditEvent({
        action: "global_instructor_limits_update",
        category: "settings",
        resourceId: "global_limits",
        actorId: session.userId,
        actorRole: session.role,
        details: `Updated platform-wide default instructor limits`,
        req,
      });

      return NextResponse.json({
        success: true,
        message: "Global instructor limits updated successfully",
        limits: updatedGlobal,
      });
    }

    return NextResponse.json(
      { success: false, error: "Must specify either instructorId or isGlobalDefault: true" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Instructor limits PUT error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update instructor limits" },
      { status: 500 }
    );
  }
}
