import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { CmsPage } from "@/models/CmsPage";
import { BlogPost } from "@/models/BlogPost";
import { Redirect } from "@/models/Redirect";
import { SiteSettings } from "@/models/SiteSettings";
import { getSessionUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSessionUser(req);
    if (!session || !hasPermission(session, "seo.manage_any")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Insufficient permissions to view SEO diagnostics" },
        { status: 403 }
      );
    }

    const [
      publishedCourses,
      publishedPages,
      publishedPosts,
      totalRedirects,
      settings,
    ] = await Promise.all([
      Course.find({ status: "published" }).select("title slug seo").lean(),
      CmsPage.find({ status: "published" }).select("title slug seo").lean(),
      BlogPost.find({ status: "published" }).select("title slug seo").lean(),
      Redirect.countDocuments(),
      SiteSettings.findOne({ key: "global_config" }).lean(),
    ]);

    // Calculate diagnostics
    const coursesMissingSeo = publishedCourses.filter(
      (c) => !c.seo?.title || !c.seo?.description || c.seo.description.length < 50
    );

    const pagesMissingSeo = publishedPages.filter(
      (p) => !p.seo?.title || !p.seo?.description
    );

    const postsMissingSeo = publishedPosts.filter(
      (b) => !b.seo?.title || !b.seo?.description
    );

    return NextResponse.json({
      success: true,
      diagnostics: {
        totalIndexedEntities: publishedCourses.length + publishedPages.length + publishedPosts.length,
        publishedCoursesCount: publishedCourses.length,
        publishedPagesCount: publishedPages.length,
        publishedPostsCount: publishedPosts.length,
        totalRedirectsCount: totalRedirects,
        warnings: {
          coursesMissingSeoCount: coursesMissingSeo.length,
          pagesMissingSeoCount: pagesMissingSeo.length,
          postsMissingSeoCount: postsMissingSeo.length,
          coursesMissingSeoList: coursesMissingSeo.slice(0, 10).map((c) => ({ id: c._id, title: c.title, slug: c.slug })),
        },
      },
      seoDefaults: settings?.seoDefaults || {},
    });
  } catch (error: any) {
    console.error("SEO Diagnostics GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load SEO diagnostics" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSessionUser(req);
    if (!session || !hasPermission(session, "seo.manage_any")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Insufficient permissions to update SEO settings" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const settings = await SiteSettings.findOneAndUpdate(
      { key: "global_config" },
      { $set: { seoDefaults: body } },
      { new: true, upsert: true }
    );

    await logAuditEvent({
      action: "seo_settings_update",
      category: "seo",
      resourceId: "global_seo_config",
      actorId: session.userId,
      actorRole: session.role,
      details: "Updated global SEO metadata defaults and robots rules",
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Global SEO configurations updated successfully",
      seoDefaults: settings.seoDefaults,
    });
  } catch (error: any) {
    console.error("SEO Settings PUT error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update SEO configuration" },
      { status: 500 }
    );
  }
}
