import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PopupCampaign } from "@/models/PopupCampaign";
import { PopupAuditLog } from "@/models/PopupAuditLog";
import { PopupEvent } from "@/models/PopupEvent";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

function isSafeUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    try {
      new URL(trimmed);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

// GET /api/admin/popups/[id]: Returns single campaign with audit history & event analytics summary
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

    // Retrieve recent audit history
    const recentAuditLogs = await PopupAuditLog.find({ campaignId: id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Event summary counts
    const [impressionCount, clickCount, dismissalCount] = await Promise.all([
      PopupEvent.countDocuments({ campaignId: id, eventType: "impression" }),
      PopupEvent.countDocuments({ campaignId: id, eventType: { $in: ["click", "cta_primary", "cta_secondary"] } }),
      PopupEvent.countDocuments({ campaignId: id, eventType: "dismissal" }),
    ]);

    return NextResponse.json({
      success: true,
      popup,
      campaign: popup,
      auditLogs: recentAuditLogs,
      analytics: {
        impressions: Math.max(popup.impressions || 0, impressionCount),
        clicks: Math.max(popup.clicks || 0, clickCount),
        dismissals: Math.max(popup.dismissals || 0, dismissalCount),
        ctr:
          Math.max(popup.impressions || 0, impressionCount) > 0
            ? Number(
                (
                  (Math.max(popup.clicks || 0, clickCount) /
                    Math.max(popup.impressions || 0, impressionCount)) *
                  100
                ).toFixed(2)
              )
            : 0,
      },
    });
  } catch (error: any) {
    console.error("Get popup error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load popup" },
      { status: 500 }
    );
  }
}

// PUT & PATCH /api/admin/popups/[id]: Update campaign
async function handleUpdate(
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

    const body = await req.json();

    // Validate URLs
    const primaryUrl = body.primaryCTA?.url || body.ctaUrl;
    if (primaryUrl && !isSafeUrl(primaryUrl)) {
      return NextResponse.json(
        { success: false, error: "CTA destination URL must be a valid path (e.g. /courses) or safe HTTPS link" },
        { status: 400 }
      );
    }

    const secondaryUrl = body.secondaryCTA?.url || body.secondaryCtaUrl;
    if (secondaryUrl && !isSafeUrl(secondaryUrl)) {
      return NextResponse.json(
        { success: false, error: "Secondary CTA URL must be a valid path or safe HTTPS link" },
        { status: 400 }
      );
    }

    // Date validation
    const rawStart = body.schedule?.startDate || body.startDate || popup.startDate;
    const rawEnd = body.schedule?.endDate || body.endDate || popup.endDate;
    if (rawStart && rawEnd) {
      const start = new Date(rawStart);
      const end = new Date(rawEnd);
      if (end <= start) {
        return NextResponse.json(
          { success: false, error: "Campaign end date must be after start date" },
          { status: 400 }
        );
      }
    }

    // Capture before values for audit
    const beforeValues: Record<string, any> = {
      internalName: popup.internalName || popup.name,
      status: popup.publicationStatus || popup.status,
      isEnabled: popup.isEnabled,
      priority: popup.priority,
      targetAudience: popup.targeting?.targetAudience || popup.targetAudience,
      startDate: popup.schedule?.startDate || popup.startDate,
      endDate: popup.schedule?.endDate || popup.endDate,
    };

    // Update flat fields
    const directFields = [
      "name",
      "headline",
      "description",
      "badgeText",
      "badgeColor",
      "imageUrl",
      "mobileImageUrl",
      "imageAlt",
      "ctaText",
      "ctaUrl",
      "secondaryCtaText",
      "secondaryCtaUrl",
      "startDate",
      "endDate",
      "status",
      "isEnabled",
      "priority",
      "targetAudience",
      "targetPages",
      "excludedPages",
      "displayFrequency",
      "displayDelaySeconds",
      "dismissalBehavior",
      "maxImpressionsTotal",
      "internalName",
      "type",
      "publicationStatus",
      "adminNotes",
      "approvalStatus",
    ];

    directFields.forEach((field) => {
      if (body[field] !== undefined) {
        (popup as any)[field] = body[field];
      }
    });

    if (body.status !== undefined && body.publicationStatus === undefined) {
      popup.publicationStatus = body.status as any;
    }
    if (body.publicationStatus !== undefined && body.status === undefined) {
      popup.status = body.publicationStatus === "published" ? "published" : body.publicationStatus === "archived" ? "archived" : "draft";
    }
    if (body.targetAudience !== undefined) {
      popup.targetAudience = body.targetAudience;
      if (!popup.targeting) {
        popup.targeting = {
          targetAudience: body.targetAudience,
          targetPages: popup.targetPages || ["all"],
          excludedPages: popup.excludedPages || [],
          deviceTargeting: "all",
        };
      } else {
        popup.targeting.targetAudience = body.targetAudience;
      }
    }

    if (body.ctaText !== undefined) {
      popup.ctaText = body.ctaText;
      if (!popup.primaryCTA) {
        popup.primaryCTA = {
          label: body.ctaText,
          url: popup.ctaUrl || "/courses",
          isExternal: false,
          openInNewTab: false,
        };
      } else {
        popup.primaryCTA.label = body.ctaText;
      }
    }

    if (body.ctaUrl !== undefined) {
      popup.ctaUrl = body.ctaUrl;
      if (!popup.primaryCTA) {
        popup.primaryCTA = {
          label: popup.ctaText || "Explore Courses",
          url: body.ctaUrl,
          isExternal: false,
          openInNewTab: false,
        };
      } else {
        popup.primaryCTA.url = body.ctaUrl;
      }
    }

    // Update nested objects if supplied
    if (body.content) {
      popup.content = {
        title: body.content.title ?? popup.content?.title ?? popup.headline ?? "",
        subtitle: body.content.subtitle ?? popup.content?.subtitle ?? "",
        description: body.content.description ?? popup.content?.description ?? popup.description ?? "",
        badgeText: body.content.badgeText ?? popup.content?.badgeText ?? popup.badgeText ?? "",
        badgeColor: body.content.badgeColor ?? popup.content?.badgeColor ?? popup.badgeColor ?? "#2563EB",
      };
    }

    if (body.images) {
      popup.images = {
        primary: body.images.primary ?? popup.images?.primary ?? { url: popup.imageUrl, alt: popup.imageAlt },
        desktop: body.images.desktop ?? popup.images?.desktop,
        mobile: body.images.mobile ?? popup.images?.mobile,
      };
    }

    if (body.eventDetails) {
      popup.eventDetails = { ...popup.eventDetails, ...body.eventDetails };
    }

    if (body.offerDetails) {
      popup.offerDetails = { ...popup.offerDetails, ...body.offerDetails };
    }

    if (body.primaryCTA) {
      popup.primaryCTA = { ...popup.primaryCTA, ...body.primaryCTA };
    }

    if (body.secondaryCTA) {
      popup.secondaryCTA = { ...popup.secondaryCTA, ...body.secondaryCTA };
    }

    if (body.appearance) {
      popup.appearance = { ...popup.appearance, ...body.appearance };
    }

    if (body.targeting) {
      popup.targeting = { ...popup.targeting, ...body.targeting };
    }

    if (body.frequency) {
      popup.frequency = { ...popup.frequency, ...body.frequency };
    }

    if (body.schedule) {
      popup.schedule = { ...popup.schedule, ...body.schedule };
    }

    if (body.seo) {
      popup.seo = { ...popup.seo, ...body.seo };
    }

    popup.updatedBy = session.userId as any;
    popup.version = (popup.version || 1) + 1;

    await popup.save();

    const changedKeys = Object.keys(body);

    // Record dedicated PopupAuditLog
    await PopupAuditLog.create({
      campaignId: popup._id,
      campaignName: popup.internalName || popup.name,
      campaignSlug: popup.slug,
      actorId: session.userId,
      actorRole: session.role,
      actorEmail: session.email,
      action: "update",
      changedFields: changedKeys,
      beforeValues,
      afterValues: {
        internalName: popup.internalName,
        status: popup.publicationStatus,
        isEnabled: popup.isEnabled,
        priority: popup.priority,
        targetAudience: popup.targetAudience,
      },
      status: "success",
      details: `Updated fields: ${changedKeys.slice(0, 6).join(", ")}${changedKeys.length > 6 ? "..." : ""}`,
    });

    // Record system audit log
    await recordAuditLog({
      userId: session.userId,
      userRole: session.role,
      action: "update_popup",
      category: "cms",
      resourceId: popup._id.toString(),
      details: { name: popup.name, status: popup.status, isEnabled: popup.isEnabled },
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Popup campaign updated successfully",
      popup,
      campaign: popup,
    });
  } catch (error: any) {
    console.error("Update popup error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update popup" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  return handleUpdate(req, props);
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  return handleUpdate(req, props);
}

// DELETE /api/admin/popups/[id]: Soft delete or permanent delete with audit log
export async function DELETE(
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

    const { searchParams } = new URL(req.url);
    const permanent = searchParams.get("permanent") === "true";

    if (permanent) {
      await PopupCampaign.findByIdAndDelete(id);
    } else {
      popup.softDeleted = true;
      popup.isEnabled = false;
      popup.deletedAt = new Date();
      await popup.save();
    }

    await PopupAuditLog.create({
      campaignId: id,
      campaignName: popup.internalName || popup.name,
      campaignSlug: popup.slug,
      actorId: session.userId,
      actorRole: session.role,
      actorEmail: session.email,
      action: "delete",
      status: "success",
      details: permanent ? `Permanently removed campaign "${popup.name}"` : `Soft deleted campaign "${popup.name}"`,
    });

    await recordAuditLog({
      userId: session.userId,
      userRole: session.role,
      action: "delete_popup",
      category: "cms",
      resourceId: id,
      details: { name: popup.name, permanent },
      req,
    });

    return NextResponse.json({
      success: true,
      message: permanent ? "Popup campaign permanently deleted" : "Popup campaign archived & soft-deleted",
    });
  } catch (error: any) {
    console.error("Delete popup error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete popup" },
      { status: 500 }
    );
  }
}
