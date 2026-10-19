import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PopupCampaign } from "@/models/PopupCampaign";
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

    const popup = await PopupCampaign.findById(id).lean();
    if (!popup) {
      return NextResponse.json({ success: false, error: "Popup campaign not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      popup,
      preview: {
        title: popup.content?.title || popup.headline || popup.name,
        subtitle: popup.content?.subtitle,
        description: popup.content?.description || popup.description,
        badgeText: popup.content?.badgeText || popup.badgeText,
        imageUrl: popup.images?.primary?.url || popup.imageUrl,
        mobileImageUrl: popup.images?.mobile?.url || popup.mobileImageUrl,
        primaryCTA: popup.primaryCTA || { label: popup.ctaText, url: popup.ctaUrl },
        secondaryCTA: popup.secondaryCTA || (popup.secondaryCtaText ? { label: popup.secondaryCtaText, url: popup.secondaryCtaUrl } : undefined),
        appearance: popup.appearance,
        eventDetails: popup.eventDetails,
        offerDetails: popup.offerDetails,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
