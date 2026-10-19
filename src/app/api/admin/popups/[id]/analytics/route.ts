import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PopupCampaign } from "@/models/PopupCampaign";
import { PopupEvent } from "@/models/PopupEvent";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
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

    const popup = await PopupCampaign.findById(id).select("name internalName impressions clicks dismissals").lean();
    if (!popup) {
      return NextResponse.json({ success: false, error: "Popup campaign not found" }, { status: 404 });
    }

    const impressions = popup.impressions || 0;
    const clicks = popup.clicks || 0;
    const dismissals = popup.dismissals || 0;
    const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;

    // Fetch recent events breakdown
    const recentEvents = await PopupEvent.find({ campaignId: id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({
      success: true,
      analytics: {
        campaignId: id,
        name: popup.internalName || popup.name,
        impressions,
        clicks,
        dismissals,
        ctr,
        recentEvents,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
