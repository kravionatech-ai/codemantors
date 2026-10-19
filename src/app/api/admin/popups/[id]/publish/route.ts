import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PopupCampaign } from "@/models/PopupCampaign";
import { PopupAuditLog } from "@/models/PopupAuditLog";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

// POST /api/admin/popups/[id]/publish: Validate and publish campaign
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await props.params;
    await connectDB();

    const popup = await PopupCampaign.findById(id);
    if (!popup) {
      return NextResponse.json({ success: false, error: "Popup campaign not found" }, { status: 404 });
    }

    // Validate required fields for publishing
    const title = popup.content?.title || popup.headline || popup.name;
    const desc = popup.content?.description || popup.description;
    const ctaUrl = popup.primaryCTA?.url || popup.ctaUrl;

    if (!title?.trim() || !desc?.trim() || !ctaUrl?.trim()) {
      return NextResponse.json(
        { success: false, error: "Cannot publish campaign: Title, description, and CTA URL are required." },
        { status: 400 }
      );
    }

    const now = new Date();
    const endDate = popup.schedule?.endDate || popup.endDate;
    if (endDate && new Date(endDate) <= now) {
      return NextResponse.json(
        { success: false, error: "Cannot publish campaign: End date is in the past. Please extend the schedule." },
        { status: 400 }
      );
    }

    popup.publicationStatus = "published";
    popup.status = "published";
    popup.isEnabled = true;
    popup.publishedAt = now;
    popup.updatedBy = session.userId as any;
    await popup.save();

    await PopupAuditLog.create({
      campaignId: popup._id,
      campaignName: popup.internalName || popup.name,
      campaignSlug: popup.slug,
      actorId: session.userId,
      actorRole: session.role,
      actorEmail: session.email,
      action: "publish",
      status: "success",
      details: `Published and enabled campaign "${popup.name}"`,
    });

    await recordAuditLog({
      userId: session.userId,
      userRole: session.role,
      action: "publish_popup",
      category: "cms",
      resourceId: popup._id.toString(),
      details: { name: popup.name },
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Popup campaign published and activated successfully",
      popup,
      campaign: popup,
    });
  } catch (error: any) {
    console.error("Publish popup error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to publish popup" },
      { status: 500 }
    );
  }
}
