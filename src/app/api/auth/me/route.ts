import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AUTH_COOKIE_NAME, clearAuthCookie, getSessionUser, verifyAuthToken } from "@/lib/auth";
import { User, Enrollment, Notification } from "@/models";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      const response = NextResponse.json({ success: false, user: null }, { status: 401 });
      const cookieToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;
      return cookieToken && !(await verifyAuthToken(cookieToken))
        ? clearAuthCookie(response)
        : response;
    }

    await connectDB();
    const user = await User.findById(session.userId).select("-passwordHash").lean();
    if (!user) {
      return clearAuthCookie(
        NextResponse.json({ success: false, user: null }, { status: 404 })
      );
    }

    const [unreadNotifications, activeEnrollmentsCount] = await Promise.all([
      Notification.countDocuments({ userId: user._id, isRead: false }),
      Enrollment.countDocuments({ userId: user._id, status: { $in: ["active", "completed"] } }),
    ]);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          headline: user.headline,
          bio: user.bio,
          website: user.website,
          socialLinks: user.socialLinks,
          unreadNotifications,
          activeEnrollmentsCount,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    console.error("Get session error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch user" },
      { status: 500 }
    );
  }
}
