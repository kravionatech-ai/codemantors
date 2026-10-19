import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PopupCampaign } from "@/models/PopupCampaign";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

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

    const original = await PopupCampaign.findById(id).lean();
    if (!original) {
      return NextResponse.json({ success: false, error: "Original popup campaign not found" }, { status: 404 });
    }

    const {
      _id,
      slug,
      campaignId,
      createdAt,
      updatedAt,
      impressions,
      clicks,
      dismissals,
      ...cloneData
    } = original as any;

    const baseSlug = (original.internalName || original.name || "campaign")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const newSlug = `${baseSlug}-copy-${Math.random().toString(36).substring(2, 7)}`;
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newCampaignId = `CMP-${new Date().getFullYear()}-${rand}`;

    const duplicate = await PopupCampaign.create({
      ...cloneData,
      slug: newSlug,
      campaignId: newCampaignId,
      internalName: `${original.internalName || original.name} (Copy)`,
      name: `${original.name} (Copy)`,
      publicationStatus: "draft",
      status: "draft",
      isEnabled: false, // Always default duplicated campaigns to disabled
      impressions: 0,
      clicks: 0,
      dismissals: 0,
      createdBy: session.userId as any,
    });

    await recordAuditLog({
      userId: session.userId,
      userRole: session.role,
      action: "duplicate_popup",
      resource: "marketing",
      resourceId: duplicate._id.toString(),
      details: { originalId: id, newName: duplicate.name },
      req,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Popup campaign duplicated successfully as draft",
        popup: duplicate,
        campaign: duplicate,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Duplicate popup error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to duplicate popup" },
      { status: 500 }
    );
  }
}
