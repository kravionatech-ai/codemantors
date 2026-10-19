import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { CmsPage } from "@/models/CmsPage";
import { getSessionUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";
import { sanitizeHtml } from "@/lib/sanitize-html";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSessionUser(req);
    const isAdmin = session && hasPermission(session, "cms.manage");

    // Admins see all pages (drafts, published, archived); public sees only published
    const filter: Record<string, any> = isAdmin ? {} : { status: "published" };
    const pages = await CmsPage.find(filter)
      .select("title slug status featuredImage publishedAt updatedAt sections.length seo")
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ success: true, pages });
  } catch (error: any) {
    console.error("CMS Pages GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load pages" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSessionUser(req);
    if (!session || !hasPermission(session, "cms.manage")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Insufficient permissions to manage CMS pages" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, slug, status, sections, featuredImage, seo } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { success: false, error: "Page title and unique slug are required" },
        { status: 400 }
      );
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-");

    // Check duplicate slug
    const existing = await CmsPage.findOne({ slug: cleanSlug });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `A CMS page with slug "${cleanSlug}" already exists.` },
        { status: 400 }
      );
    }

    const newPage = await CmsPage.create({
      title: title.trim(),
      slug: cleanSlug,
      status: status || "draft",
      sections: (sections || []).map((sec: any) => ({
        ...sec,
        content: sec.content ? sanitizeHtml(sec.content) : sec.content,
      })),
      featuredImage: featuredImage || "",
      publishedAt: status === "published" ? new Date() : undefined,
      authorId: session.userId,
      seo: seo || {
        title,
        description: "",
      },
    });

    await logAuditEvent({
      action: "cms_page_create",
      category: "cms",
      resourceId: newPage._id.toString(),
      actorId: session.userId,
      actorRole: session.role,
      details: `Created CMS page "${title}" with slug /pages/${cleanSlug}`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: `CMS Page "${title}" created successfully!`,
      page: newPage,
    });
  } catch (error: any) {
    console.error("CMS Page POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create CMS page" },
      { status: 500 }
    );
  }
}
