import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { UserSession } from "@/models/UserSession";
import { getSessionUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    let sessions = await UserSession.find({
      userId: session.userId,
      isRevoked: false,
    })
      .sort({ lastActiveAt: -1 })
      .lean();

    // If user has no sessions stored, seed the current active session
    if (sessions.length === 0) {
      const userAgent = req.headers.get("user-agent") || "Mozilla/5.0";
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
      const isMobile = /mobile/i.test(userAgent);

      const created = await UserSession.create({
        userId: session.userId,
        sessionId: `sess_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
        tokenHash: crypto.createHash("sha256").update(session.userId + Date.now()).digest("hex"),
        userAgent,
        ipAddress: ip,
        deviceType: isMobile ? "mobile" : "desktop",
        browser: userAgent.includes("Chrome") ? "Chrome" : userAgent.includes("Firefox") ? "Firefox" : "Safari",
        os: userAgent.includes("Windows") ? "Windows 11" : userAgent.includes("Mac") ? "macOS" : "Linux",
        location: "Current Session (Local)",
        lastActiveAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      sessions = [created.toObject()];
    }

    return NextResponse.json({
      success: true,
      sessions,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const action = searchParams.get("action"); // "revoke_all_others" | null

    if (action === "revoke_all_others") {
      // Keep only latest session, revoke others
      const latest = await UserSession.findOne({ userId: session.userId, isRevoked: false }).sort({ lastActiveAt: -1 });
      if (latest) {
        await UserSession.updateMany(
          { userId: session.userId, _id: { $ne: latest._id } },
          { $set: { isRevoked: true, revokedAt: new Date(), revokedReason: "Revoked by user" } }
        );
      }

      await logAuditEvent({
        action: "sessions_revoke_all_others",
        category: "auth",
        resourceId: session.userId,
        actorId: session.userId,
        actorRole: session.role,
        details: { countRevoked: "all_others" },
        req,
      });

      return NextResponse.json({
        success: true,
        message: "All other active sessions have been revoked.",
      });
    }

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "sessionId is required" }, { status: 400 });
    }

    const revoked = await UserSession.findOneAndUpdate(
      { sessionId, userId: session.userId },
      { $set: { isRevoked: true, revokedAt: new Date(), revokedReason: "Manual logout by admin" } },
      { new: true }
    );

    if (!revoked) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    await logAuditEvent({
      action: "session_revoke_individual",
      category: "auth",
      resourceId: sessionId,
      actorId: session.userId,
      actorRole: session.role,
      details: { sessionId },
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Session successfully revoked.",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
