import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Notification";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const notifications = await Notification.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({
      userId: session.userId,
      isRead: false,
    });

    return NextResponse.json({ success: true, notifications, unreadCount });
  } catch (error: any) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { notificationId } = await req.json();

    if (notificationId) {
      await Notification.findOneAndUpdate(
        { _id: notificationId, userId: session.userId },
        { $set: { isRead: true } }
      );
    } else {
      // Mark all as read
      await Notification.updateMany(
        { userId: session.userId, isRead: false },
        { $set: { isRead: true } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Notifications update error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update notifications" },
      { status: 500 }
    );
  }
}
