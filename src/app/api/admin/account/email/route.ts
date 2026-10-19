import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getSessionUser, comparePassword } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { newEmail, currentPassword } = body;

    if (!newEmail || !currentPassword) {
      return NextResponse.json(
        { success: false, error: "New email address and current password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = newEmail.toLowerCase().trim();
    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 });
    }

    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Reauthentication
    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Incorrect password. Security re-authentication required to change email." },
        { status: 403 }
      );
    }

    // Check uniqueness
    const existing = await User.findOne({ email: cleanEmail });
    if (existing && existing._id.toString() !== session.userId) {
      return NextResponse.json(
        { success: false, error: "This email address is already associated with another account." },
        { status: 409 }
      );
    }

    const oldEmail = user.email;
    user.email = cleanEmail;
    await user.save();

    await logAuditEvent({
      action: "account_email_change",
      category: "auth",
      resourceId: session.userId,
      actorId: session.userId,
      actorRole: session.role,
      details: { oldEmail, newEmail: cleanEmail },
      req,
    });

    return NextResponse.json({
      success: true,
      message: `Account email address updated to ${cleanEmail}. Please use this new address on next sign in.`,
      email: cleanEmail,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
