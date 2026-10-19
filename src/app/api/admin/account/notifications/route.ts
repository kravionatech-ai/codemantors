import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getSessionUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Default notifications
    const defaults = {
      orderAlerts: true,
      enrollmentAlerts: true,
      refundRequests: true,
      securityAlerts: true,
      weeklySummary: false,
    };

    return NextResponse.json({ success: true, notifications: defaults });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    await logAuditEvent({
      action: "notifications_preferences_update",
      category: "settings",
      resourceId: session.userId,
      actorId: session.userId,
      actorRole: session.role,
      details: body,
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Notification preferences saved successfully.",
      notifications: body,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
