import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getSessionUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { sanitizeHtml } from "@/lib/sanitize-html";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.userId)
      .select("-passwordHash -resetPasswordToken -resetPasswordExpires")
      .lean();

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
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

    await connectDB();
    const body = await req.json();
    const { name, headline, bio, avatar, website, socialLinks } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      session.userId,
      {
        $set: {
          name: name.trim(),
          headline: headline !== undefined ? headline.trim() : undefined,
          bio: bio !== undefined ? sanitizeHtml(bio.trim()) : undefined,
          avatar: avatar !== undefined ? avatar.trim() : undefined,
          website: website !== undefined ? website.trim() : undefined,
          socialLinks: socialLinks || {},
        },
      },
      { new: true }
    ).select("-passwordHash -resetPasswordToken -resetPasswordExpires");

    await logAuditEvent({
      action: "account_profile_update",
      category: "auth",
      resourceId: session.userId,
      actorId: session.userId,
      actorRole: session.role,
      details: { name: updatedUser?.name },
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
