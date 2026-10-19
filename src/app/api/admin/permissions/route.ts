import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Role } from "@/models/Role";
import { User } from "@/models/User";
import { getSessionUser } from "@/lib/auth";
import { hasPermission, ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSessionUser(req);
    if (!session || !hasPermission(session, "permissions.manage")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Insufficient permissions to view RBAC matrix" },
        { status: 403 }
      );
    }

    // Seed default system roles if collection is empty
    const existingRoles = await Role.find().lean();
    if (existingRoles.length === 0) {
      const systemRoles = [
        {
          name: "Super Administrator",
          slug: "super_admin",
          description: "Full unchecked administrative governance over every platform feature.",
          isSystem: true,
          permissions: [...ALL_PERMISSIONS],
        },
        {
          name: "Platform Administrator",
          slug: "admin",
          description: "Operational management of courses, users, orders, refunds, CMS, and SEO.",
          isSystem: true,
          permissions: DEFAULT_ROLE_PERMISSIONS.admin,
        },
        {
          name: "Course Instructor",
          slug: "instructor",
          description: "Curriculum authoring, course publishing, and learner analytics within limits.",
          isSystem: true,
          permissions: DEFAULT_ROLE_PERMISSIONS.instructor,
        },
        {
          name: "Student",
          slug: "student",
          description: "Course enrollment, video learning, quiz attempts, and certificates.",
          isSystem: true,
          permissions: DEFAULT_ROLE_PERMISSIONS.student,
        },
        {
          name: "Support Specialist",
          slug: "support",
          description: "User assistance, refund requests, and ticket resolution.",
          isSystem: true,
          permissions: DEFAULT_ROLE_PERMISSIONS.support,
        },
      ];
      await Role.insertMany(systemRoles);
    }

    const roles = await Role.find().sort({ isSystem: -1, name: 1 }).lean();

    return NextResponse.json({
      success: true,
      permissions: ALL_PERMISSIONS,
      roles,
    });
  } catch (error: any) {
    console.error("Permissions GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load permissions matrix" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSessionUser(req);
    if (!session || !hasPermission(session, "permissions.manage")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Insufficient permissions to modify RBAC matrix" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { roleSlug, permissions, userId, userPermissions } = body;

    // 1. Updating role permissions
    if (roleSlug) {
      if (roleSlug === "super_admin") {
        return NextResponse.json(
          { success: false, error: "The Super Administrator role possesses immutable full platform permissions." },
          { status: 400 }
        );
      }

      const role = await Role.findOneAndUpdate(
        { slug: roleSlug },
        { permissions: Array.isArray(permissions) ? permissions : [] },
        { new: true }
      );

      if (!role) {
        return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
      }

      await logAuditEvent({
        action: "role_permissions_update",
        category: "permission",
        resourceId: roleSlug,
        actorId: session.userId,
        actorRole: session.role,
        details: `Updated permissions for role "${role.name}" (${role.permissions.length} permissions assigned)`,
        req,
      });

      return NextResponse.json({
        success: true,
        message: `Updated permissions for role "${role.name}"`,
        role,
      });
    }

    // 2. Updating per-user permission overrides
    if (userId) {
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
      }

      targetUser.permissions = Array.isArray(userPermissions) ? userPermissions : [];
      await targetUser.save();

      await logAuditEvent({
        action: "user_permissions_override",
        category: "permission",
        resourceId: userId,
        actorId: session.userId,
        actorRole: session.role,
        details: `Set custom permission overrides for user "${targetUser.name}" (${targetUser.email})`,
        req,
      });

      return NextResponse.json({
        success: true,
        message: `Updated custom permissions for ${targetUser.name}`,
        user: {
          id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email,
          permissions: targetUser.permissions,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Either roleSlug or userId must be specified" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Permissions PUT error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update permissions" },
      { status: 500 }
    );
  }
}
