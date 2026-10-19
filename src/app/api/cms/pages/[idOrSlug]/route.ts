import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { CmsPage } from "@/models/CmsPage";
import { Redirect } from "@/models/Redirect";
import { getSessionUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";
import { sanitizeHtml } from "@/lib/sanitize-html";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  try {
    await connectDB();
    const { idOrSlug } = await params;

    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() };

    const page = await CmsPage.findOne(query).lean();
    if (!page) {
      return NextResponse.json({ success: false, error: "Page not found" }, { status: 404 });
    }

    // Sort sections by order
    if (page.sections && Array.isArray(page.sections)) {
      page.sections.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    }

    return NextResponse.json({ success: true, page });
  } catch (error: any) {
    console.error("CMS Page GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load page" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  try {
    await connectDB();
    const session = await getSessionUser(req);
    if (!session || !hasPermission(session, "cms.manage")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Insufficient permissions to edit CMS pages" },
        { status: 403 }
      );
    }

    const { idOrSlug } = await params;
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() };

    const page = await CmsPage.findOne(query);
    if (!page) {
      return NextResponse.json({ success: false, error: "Page not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, slug, status, sections, featuredImage, seo } = body;

    const oldSlug = page.slug;

    if (title) page.title = title.trim();
    if (status) {
      if (status === "published" && page.status !== "published") {
        page.publishedAt = new Date();
      }
      page.status = status;
    }
    if (sections !== undefined && Array.isArray(sections)) {
      page.sections = sections.map((sec: any) => ({
        ...sec,
        content: sec.content ? sanitizeHtml(sec.content) : sec.content,
      }));
    }
    if (featuredImage !== undefined) page.featuredImage = featuredImage;
    if (seo) page.seo = { ...page.seo, ...seo };

    // Handle slug change & create automatic 301 redirect if requested
    if (slug && slug.trim().toLowerCase() !== oldSlug) {
      const cleanNewSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-");
      const conflict = await CmsPage.findOne({ slug: cleanNewSlug, _id: { $ne: page._id } });
      if (conflict) {
        return NextResponse.json(
          { success: false, error: `Slug "${cleanNewSlug}" is already in use by another page.` },
          { status: 400 }
        );
      }

      page.slug = cleanNewSlug;

      // Automatically register 301 redirect from old slug to new slug
      try {
        await Redirect.findOneAndUpdate(
          { sourcePath: `/pages/${oldSlug}` },
          {
            sourcePath: `/pages/${oldSlug}`,
            destinationPath: `/pages/${cleanNewSlug}`,
            statusCode: 301,
            isActive: true,
            notes: `Auto-generated redirect after CMS page slug change`,
          },
          { upsert: true }
        );
      } catch (redirErr) {
        console.warn("Could not register automatic redirect for page:", redirErr);
      }
    }

    await page.save();

    await logAuditEvent({
      action: "cms_page_update",
      category: "cms",
      resourceId: page._id.toString(),
      actorId: session.userId,
      actorRole: session.role,
      details: `Updated CMS page "${page.title}" (${page.slug})`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Page updated successfully",
      page,
    });
  } catch (error: any) {
    console.error("CMS Page PUT error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update page" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  try {
    await connectDB();
    const session = await getSessionUser(req);
    if (!session || !hasPermission(session, "cms.manage")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Insufficient permissions to delete CMS pages" },
        { status: 403 }
      );
    }

    const { idOrSlug } = await params;
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() };

    const page = await CmsPage.findOneAndDelete(query);
    if (!page) {
      return NextResponse.json({ success: false, error: "Page not found" }, { status: 404 });
    }

    await logAuditEvent({
      action: "cms_page_delete",
      category: "cms",
      resourceId: page._id.toString(),
      actorId: session.userId,
      actorRole: session.role,
      details: `Deleted CMS page "${page.title}" (${page.slug})`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: `Page "${page.title}" deleted successfully`,
    });
  } catch (error: any) {
    console.error("CMS Page DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete page" },
      { status: 500 }
    );
  }
}
