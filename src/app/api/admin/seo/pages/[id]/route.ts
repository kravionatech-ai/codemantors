import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PageSeo } from "@/models/PageSeo";
import { getSessionUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";
import { auditSeoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session || (!hasPermission(session, "seo.manage_any") && !hasPermission(session, "seo.read"))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await props.params;
    await connectDB();

    const pageSeo = await PageSeo.findById(id).lean();
    if (!pageSeo) {
      return NextResponse.json({ success: false, error: "Page SEO record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, page: pageSeo });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session || !hasPermission(session, "seo.manage_any")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await props.params;
    await connectDB();
    const body = await req.json();

    const pageSeo = await PageSeo.findById(id);
    if (!pageSeo) {
      return NextResponse.json({ success: false, error: "Page SEO record not found" }, { status: 404 });
    }

    const audit = auditSeoMetadata({
      title: body.title !== undefined ? body.title : pageSeo.title,
      description: body.description !== undefined ? body.description : pageSeo.description,
      canonicalUrl: body.canonicalUrl !== undefined ? body.canonicalUrl : pageSeo.canonicalUrl,
      ogImage: body.ogImage !== undefined ? body.ogImage : pageSeo.ogImage,
      noIndex: body.noIndex !== undefined ? body.noIndex : pageSeo.noIndex,
      noFollow: body.noFollow !== undefined ? body.noFollow : pageSeo.noFollow,
    });

    if (body.title !== undefined) pageSeo.title = body.title.trim();
    if (body.description !== undefined) pageSeo.description = body.description.trim();
    if (body.canonicalUrl !== undefined) pageSeo.canonicalUrl = body.canonicalUrl.trim();
    if (body.noIndex !== undefined) pageSeo.noIndex = Boolean(body.noIndex);
    if (body.noFollow !== undefined) pageSeo.noFollow = Boolean(body.noFollow);
    if (body.ogTitle !== undefined) pageSeo.ogTitle = body.ogTitle.trim();
    if (body.ogDescription !== undefined) pageSeo.ogDescription = body.ogDescription.trim();
    if (body.ogImage !== undefined) pageSeo.ogImage = body.ogImage.trim();
    if (body.twitterCard !== undefined) pageSeo.twitterCard = body.twitterCard;
    if (body.twitterTitle !== undefined) pageSeo.twitterTitle = body.twitterTitle.trim();
    if (body.twitterDescription !== undefined) pageSeo.twitterDescription = body.twitterDescription.trim();
    if (body.twitterImage !== undefined) pageSeo.twitterImage = body.twitterImage.trim();
    if (body.structuredDataType !== undefined) pageSeo.structuredDataType = body.structuredDataType;
    if (body.structuredDataCustom !== undefined) pageSeo.structuredDataCustom = body.structuredDataCustom;
    if (body.status !== undefined) pageSeo.status = body.status;

    pageSeo.seoScore = audit.score;
    pageSeo.issues = audit.issues;
    pageSeo.lastAuditedAt = new Date();
    pageSeo.updatedBy = session.userId;

    await pageSeo.save();

    await logAuditEvent({
      action: "seo_page_update",
      category: "seo",
      resourceId: pageSeo._id.toString(),
      actorId: session.userId,
      actorRole: session.role,
      details: {
        path: pageSeo.path,
        title: pageSeo.title,
        seoScore: audit.score,
      },
      req,
    });

    return NextResponse.json({
      success: true,
      message: `SEO settings updated for ${pageSeo.path}`,
      page: pageSeo,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session || !hasPermission(session, "seo.manage_any")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await props.params;
    await connectDB();

    const pageSeo = await PageSeo.findByIdAndDelete(id);
    if (!pageSeo) {
      return NextResponse.json({ success: false, error: "Record not found" }, { status: 404 });
    }

    await logAuditEvent({
      action: "seo_page_delete_override",
      category: "seo",
      resourceId: id,
      actorId: session.userId,
      actorRole: session.role,
      details: { path: pageSeo.path },
      req,
    });

    return NextResponse.json({
      success: true,
      message: `SEO override deleted for ${pageSeo.path}. Page will now use dynamic content defaults.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
