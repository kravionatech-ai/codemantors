import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PopupCampaign } from "@/models/PopupCampaign";
import { PopupAuditLog } from "@/models/PopupAuditLog";
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

    const popup = await PopupCampaign.findById(id);
    if (!popup) {
      return NextResponse.json({ success: false, error: "Popup campaign not found" }, { status: 404 });
    }

    popup.isEnabled = false;
    popup.publicationStatus = "paused";
    popup.status = "draft";
    popup.updatedBy = session.userId as any;
    await popup.save();

    await PopupAuditLog.create({
      campaignId: popup._id,
      campaignName: popup.internalName || popup.name,
      campaignSlug: popup.slug,
      action: "disable",
      actorId: session.userId,
      actorEmail: session.email || "",
      actorRole: session.role,
      status: "success",
      details: JSON.stringify({ isEnabled: false, publicationStatus: "paused" }),
    });

    await recordAuditLog({
      userId: session.userId,
      userRole: session.role,
      action: "disable_popup",
      resource: "marketing",
      resourceId: popup._id.toString(),
      details: { campaignName: popup.internalName || popup.name },
      req,
    });

    return NextResponse.json({
      success: true,
      message: `Popup campaign "${popup.internalName || popup.name}" has been disabled and paused.`,
      popup,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
