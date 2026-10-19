import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getSessionUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (!hasPermission(session, "users.manage") && session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";

    const query: Record<string, any> = {};
    if (search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
      ];
    }
    if (role && role !== "all") {
      query.role = role;
    }
    if (status === "suspended") {
      query.isSuspended = true;
    } else if (status === "pending_instructor") {
      query.instructorStatus = "pending";
    }

    const users = await User.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error("Admin users list error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (!hasPermission(session, "users.manage") && session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const { userId, role, isActive, isSuspended, suspensionReason, instructorStatus } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Safety rule: Protect last Super Admin from accidental demotion or suspension
    if (targetUser.role === "super_admin" && (role !== "super_admin" || isSuspended === true || isActive === false)) {
      const superAdminCount = await User.countDocuments({ role: "super_admin", isActive: true, isSuspended: false });
      if (superAdminCount <= 1) {
        return NextResponse.json(
          { success: false, error: "Security protection: Cannot demote or suspend the sole active Super Administrator." },
          { status: 400 }
        );
      }
    }

    const updates: Record<string, any> = {};
    if (role && ["student", "instructor", "admin", "super_admin", "support"].includes(role)) {
      updates.role = role;
    }
    if (typeof isActive === "boolean") {
      updates.isActive = isActive;
    }
    if (typeof isSuspended === "boolean") {
      updates.isSuspended = isSuspended;
      updates.suspensionReason = suspensionReason || "";
    }
    if (instructorStatus && ["approved", "pending", "rejected"].includes(instructorStatus)) {
      updates.instructorStatus = instructorStatus;
    }

    const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true })
      .select("-passwordHash")
      .lean();

    await logAuditEvent({
      action: "user_governance_update",
      category: "user",
      resourceId: userId,
      actorId: session.userId,
      actorRole: session.role,
      details: `Updated user "${targetUser.name}" (${targetUser.email}): ${JSON.stringify(updates)}`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.name} updated successfully`,
      user,
    });
  } catch (error: any) {
    console.error("Admin user update error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}
