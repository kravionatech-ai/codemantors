import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getSessionUser } from "@/lib/auth";
import { getInstructorUsage } from "@/lib/limits";
import { logAuditEvent } from "@/lib/audit";
import { sanitizeHtml } from "@/lib/sanitize-html";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== "instructor" && session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const user = await User.findById(session.userId)
      .select("-passwordHash -resetPasswordToken -resetPasswordExpires")
      .lean();

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const quotaUsage = await getInstructorUsage(session.userId);

    return NextResponse.json({
      success: true,
      profile: user,
      quotaUsage,
    });
  } catch (error: any) {
    console.error("Instructor settings GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load instructor settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== "instructor" && session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      name,
      headline,
      bio,
      avatar,
      website,
      skills,
      experienceYears,
      profileSlug,
      isPublicProfileVisible,
      socialLinks,
      notificationPreferences,
    } = body;

    // Validate name
    if (name && name.trim().length < 2) {
      return NextResponse.json({ success: false, error: "Name must be at least 2 characters" }, { status: 400 });
    }

    // Validate profileSlug uniqueness if provided
    if (profileSlug && profileSlug.trim()) {
      const cleanSlug = profileSlug.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
      const existing = await User.findOne({
        profileSlug: cleanSlug,
        _id: { $ne: user._id },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "Profile URL slug is already taken. Please choose another." },
          { status: 400 }
        );
      }
      user.profileSlug = cleanSlug;
    }

    if (name) user.name = name.trim();
    if (headline !== undefined) user.headline = headline.trim();
    if (bio !== undefined) user.bio = sanitizeHtml(bio.trim());
    if (avatar !== undefined) user.avatar = avatar.trim();
    if (website !== undefined) user.website = website.trim();
    if (experienceYears !== undefined) user.experienceYears = Number(experienceYears) || 0;
    if (isPublicProfileVisible !== undefined) user.isPublicProfileVisible = Boolean(isPublicProfileVisible);

    if (Array.isArray(skills)) {
      user.skills = skills.map((s: string) => String(s).trim()).filter(Boolean);
    }

    if (socialLinks) {
      user.socialLinks = {
        github: socialLinks.github ? socialLinks.github.trim() : "",
        twitter: socialLinks.twitter ? socialLinks.twitter.trim() : "",
        linkedin: socialLinks.linkedin ? socialLinks.linkedin.trim() : "",
        youtube: socialLinks.youtube ? socialLinks.youtube.trim() : "",
      };
    }

    if (notificationPreferences) {
      user.notificationPreferences = {
        newEnrollment: Boolean(notificationPreferences.newEnrollment ?? true),
        newReview: Boolean(notificationPreferences.newReview ?? true),
        studentQuestion: Boolean(notificationPreferences.studentQuestion ?? true),
        platformUpdate: Boolean(notificationPreferences.platformUpdate ?? true),
      };
    }

    await user.save();

    await logAuditEvent({
      action: "instructor_profile_update",
      category: "user",
      resourceId: user._id.toString(),
      actorId: session.userId,
      actorRole: session.role,
      details: `Instructor updated public profile & studio settings`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Studio profile and preferences updated successfully",
      profile: {
        _id: user._id,
        name: user.name,
        email: user.email,
        headline: user.headline,
        bio: user.bio,
        avatar: user.avatar,
        website: user.website,
        skills: user.skills,
        experienceYears: user.experienceYears,
        profileSlug: user.profileSlug,
        isPublicProfileVisible: user.isPublicProfileVisible,
        socialLinks: user.socialLinks,
        notificationPreferences: user.notificationPreferences,
      },
    });
  } catch (error: any) {
    console.error("Instructor settings PUT error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update instructor settings" },
      { status: 500 }
    );
  }
}
