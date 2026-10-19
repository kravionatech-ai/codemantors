import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PopupCampaign } from "@/models/PopupCampaign";
import { PopupAuditLog } from "@/models/PopupAuditLog";
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

// GET /api/admin/popups: List all popups with search, filters, pagination, and metrics
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const enabled = searchParams.get("enabled");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));

    const query: any = { softDeleted: { $ne: true } };

    if (status && status !== "all") {
      query.$or = [{ status }, { publicationStatus: status }];
    }

    if (type && type !== "all") {
      query.type = type;
    }

    if (enabled !== null && enabled !== undefined && enabled !== "" && enabled !== "all") {
      query.isEnabled = enabled === "true";
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: "i" } },
        { internalName: { $regex: s, $options: "i" } },
        { headline: { $regex: s, $options: "i" } },
        { "content.title": { $regex: s, $options: "i" } },
        { slug: { $regex: s, $options: "i" } },
        { campaignId: { $regex: s, $options: "i" } },
      ];
    }

    const [popups, total] = await Promise.all([
      PopupCampaign.find(query)
        .sort({ priority: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      PopupCampaign.countDocuments(query),
    ]);

    // Aggregate statistics across non-deleted campaigns
    const allActive = await PopupCampaign.find({ softDeleted: { $ne: true } }).lean();

    const stats = {
      total: allActive.length,
      activeNow: allActive.filter(
        (p) =>
          p.isEnabled &&
          (p.status === "published" || p.publicationStatus === "published") &&
          new Date(p.startDate || p.schedule?.startDate) <= new Date() &&
          new Date(p.endDate || p.schedule?.endDate) >= new Date()
      ).length,
      totalImpressions: allActive.reduce((acc, p) => acc + (p.impressions || 0), 0),
      totalClicks: allActive.reduce((acc, p) => acc + (p.clicks || 0), 0),
      totalDismissals: allActive.reduce((acc, p) => acc + (p.dismissals || 0), 0),
      averageCtr: 0,
    };

    if (stats.totalImpressions > 0) {
      stats.averageCtr = Number(
        ((stats.totalClicks / stats.totalImpressions) * 100).toFixed(2)
      );
    }

    return NextResponse.json({
      success: true,
      popups,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Fetch popups error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load popups" },
      { status: 500 }
    );
  }
}

// POST /api/admin/popups: Create new popup campaign
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();

    // Support both structured format and legacy flat fields
    const internalName = (body.internalName || body.name || "").trim();
    const title = (body.content?.title || body.headline || internalName || "").trim();
    const description = (body.content?.description || body.description || "").trim();
    const type = body.type || "offer";
    const primaryCtaLabel = (body.primaryCTA?.label || body.ctaText || "Explore Courses").trim();
    const primaryCtaUrl = (body.primaryCTA?.url || body.ctaUrl || "/courses").trim();
    const secondaryCtaLabel = (body.secondaryCTA?.label || body.secondaryCtaText || "").trim();
    const secondaryCtaUrl = (body.secondaryCTA?.url || body.secondaryCtaUrl || "").trim();

    // Primary image
    const primaryImageUrl = (body.images?.primary?.url || body.imageUrl || "").trim();
    const primaryImageAlt = (body.images?.primary?.alt || body.imageAlt || title || "Campaign Image").trim();

    // Validations
    if (!internalName) {
      return NextResponse.json({ success: false, error: "Campaign name is required" }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ success: false, error: "Popup title/headline is required" }, { status: 400 });
    }
    if (primaryImageUrl && !primaryImageAlt) {
      return NextResponse.json({ success: false, error: "Image alt text is required for accessibility when an image is provided" }, { status: 400 });
    }
    if (!primaryCtaLabel) {
      return NextResponse.json({ success: false, error: "CTA button text is required" }, { status: 400 });
    }
    if (!primaryCtaUrl || !isSafeUrl(primaryCtaUrl)) {
      return NextResponse.json(
        { success: false, error: "CTA destination URL must be a valid path (e.g. /courses) or safe HTTPS link" },
        { status: 400 }
      );
    }
    if (secondaryCtaUrl && !isSafeUrl(secondaryCtaUrl)) {
      return NextResponse.json(
        { success: false, error: "Secondary CTA URL must be a valid path or safe HTTPS link" },
        { status: 400 }
      );
    }

    // Schedule validation
    const rawStart = body.schedule?.startDate || body.startDate;
    const rawEnd = body.schedule?.endDate || body.endDate;
    const start = rawStart ? new Date(rawStart) : new Date();
    const end = rawEnd ? new Date(rawEnd) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (end <= start) {
      return NextResponse.json(
        { success: false, error: "Campaign end date must be after start date" },
        { status: 400 }
      );
    }

    // Generate unique slug
    let slug = (body.slug || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!slug) {
      slug = internalName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }
    const existingSlug = await PopupCampaign.findOne({ slug });
    if (existingSlug) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    // Generate unique campaign reference ID
    const year = new Date().getFullYear();
    const campaignId = body.campaignId || `CMP-${year}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const publicationStatus = body.publicationStatus || body.status || "draft";
    const isEnabled = Boolean(body.isEnabled); // STRICT DEFAULT FALSE

    const newCampaign = new PopupCampaign({
      campaignId,
      internalName,
      slug,
      type,
      name: internalName,
      headline: title,
      description,
      badgeText: (body.content?.badgeText || body.badgeText || "").trim(),
      badgeColor: body.content?.badgeColor || body.badgeColor || "#2563EB",
      ctaText: primaryCtaLabel,
      ctaUrl: primaryCtaUrl,
      secondaryCtaText: secondaryCtaLabel,
      secondaryCtaUrl: secondaryCtaUrl,
      imageUrl: primaryImageUrl,
      imageAlt: primaryImageAlt,
      mobileImageUrl: (body.images?.mobile?.url || body.mobileImageUrl || "").trim(),
      targetAudience: body.targeting?.targetAudience || body.targetAudience || "all",
      displayFrequency: body.frequency?.frequencyType || body.displayFrequency || "once_per_session",
      displayDelaySeconds: Number(body.frequency?.displayDelaySeconds ?? body.displayDelaySeconds ?? 3),
      dismissalBehavior: body.frequency?.dismissalBehavior || body.dismissalBehavior || "both",

      content: {
        title,
        subtitle: (body.content?.subtitle || "").trim(),
        description,
        badgeText: (body.content?.badgeText || body.badgeText || "").trim(),
        badgeColor: body.content?.badgeColor || body.badgeColor || "#2563EB",
      },

      images: {
        primary: {
          url: primaryImageUrl,
          assetId: body.images?.primary?.assetId || "",
          alt: primaryImageAlt,
          caption: body.images?.primary?.caption || "",
          width: body.images?.primary?.width || 1200,
          height: body.images?.primary?.height || 630,
          size: body.images?.primary?.size || 0,
          provider: body.images?.primary?.provider || "local",
        },
        desktop: body.images?.desktop || (primaryImageUrl ? { url: primaryImageUrl, alt: primaryImageAlt } : undefined),
        mobile: body.images?.mobile || (body.mobileImageUrl ? { url: body.mobileImageUrl, alt: primaryImageAlt } : undefined),
      },

      eventDetails: {
        isEvent: Boolean(body.eventDetails?.isEvent || type === "event" || type === "webinar"),
        eventName: body.eventDetails?.eventName || "",
        eventType: body.eventDetails?.eventType || "webinar",
        eventDescription: body.eventDetails?.eventDescription || "",
        startDateTime: body.eventDetails?.startDateTime ? new Date(body.eventDetails.startDateTime) : undefined,
        endDateTime: body.eventDetails?.endDateTime ? new Date(body.eventDetails.endDateTime) : undefined,
        registrationUrl: body.eventDetails?.registrationUrl || "",
      },

      offerDetails: {
        isOffer: Boolean(body.offerDetails?.isOffer || type === "offer"),
        offerTitle: body.offerDetails?.offerTitle || "",
        offerDescription: body.offerDetails?.offerDescription || "",
        discountType: body.offerDetails?.discountType || "none",
        discountValue: Number(body.offerDetails?.discountValue || 0),
        couponCode: (body.offerDetails?.couponCode || "").trim(),
        validUntil: body.offerDetails?.validUntil ? new Date(body.offerDetails.validUntil) : undefined,
        terms: body.offerDetails?.terms || "",
        featuredCourse: body.offerDetails?.featuredCourse || undefined,
        featuredCategory: body.offerDetails?.featuredCategory || "",
        price: Number(body.offerDetails?.price || 0),
        discountPrice: Number(body.offerDetails?.discountPrice || 0),
      },

      primaryCTA: {
        label: primaryCtaLabel,
        url: primaryCtaUrl,
        isExternal: Boolean(body.primaryCTA?.isExternal || primaryCtaUrl.startsWith("http")),
        openInNewTab: Boolean(body.primaryCTA?.openInNewTab),
        referenceType: body.primaryCTA?.referenceType || "none",
        referenceId: body.primaryCTA?.referenceId || "",
      },

      secondaryCTA: {
        label: secondaryCtaLabel,
        url: secondaryCtaUrl,
        isExternal: Boolean(body.secondaryCTA?.isExternal || secondaryCtaUrl.startsWith("http")),
        openInNewTab: Boolean(body.secondaryCTA?.openInNewTab),
      },

      appearance: {
        layout: body.appearance?.layout || "modal",
        imagePosition: body.appearance?.imagePosition || "top",
        theme: {
          bgColor: body.appearance?.theme?.bgColor || "#FFFFFF",
          textColor: body.appearance?.theme?.textColor || "#0F172A",
          accentColor: body.appearance?.theme?.accentColor || "#2563EB",
          borderRadius: body.appearance?.theme?.borderRadius || "xl",
        },
        ctaStyle: body.appearance?.ctaStyle || "solid_primary",
        showCloseButton: body.appearance?.showCloseButton !== false,
        showBackdrop: body.appearance?.showBackdrop !== false,
        animation: body.appearance?.animation || "zoom",
        reducedMotion: Boolean(body.appearance?.reducedMotion),
      },

      targeting: {
        targetAudience: body.targeting?.targetAudience || body.targetAudience || "all",
        targetPages: Array.isArray(body.targeting?.targetPages) && body.targeting.targetPages.length > 0
          ? body.targeting.targetPages
          : Array.isArray(body.targetPages) && body.targetPages.length > 0
          ? body.targetPages
          : ["all"],
        targetCourses: body.targeting?.targetCourses || [],
        excludedPages: Array.isArray(body.targeting?.excludedPages) && body.targeting.excludedPages.length > 0
          ? body.targeting.excludedPages
          : Array.isArray(body.excludedPages) && body.excludedPages.length > 0
          ? body.excludedPages
          : ["/checkout", "/order-confirmation", "/learn", "/login", "/register", "/admin", "/cart", "/course-basket"],
        deviceTargeting: body.targeting?.deviceTargeting || "all",
      },

      frequency: {
        frequencyType: body.frequency?.frequencyType || body.displayFrequency || "once_per_session",
        daysInterval: Number(body.frequency?.daysInterval || 1),
        displayDelaySeconds: Number(body.frequency?.displayDelaySeconds ?? body.displayDelaySeconds ?? 3),
        dismissalBehavior: body.frequency?.dismissalBehavior || body.dismissalBehavior || "both",
        maxImpressionsPerVisitor: Number(body.frequency?.maxImpressionsPerVisitor || 0),
        maxImpressionsTotal: Number(body.frequency?.maxImpressionsTotal || body.maxImpressionsTotal || 0),
      },

      schedule: {
        startDate: start,
        endDate: end,
        timezone: body.schedule?.timezone || "UTC",
      },

      publicationStatus,
      isEnabled,
      priority: Number(body.priority || 1),
      approvalStatus: body.approvalStatus || "approved",
      adminNotes: body.adminNotes || "",
      assignedAdmin: body.assignedAdmin || undefined,

      seo: {
        metaTitle: body.seo?.metaTitle || "",
        metaDescription: body.seo?.metaDescription || "",
        socialImage: body.seo?.socialImage || "",
        canonicalUrl: body.seo?.canonicalUrl || "",
      },

      createdBy: session.userId as any,
    });

    await newCampaign.save();

    // Record dedicated PopupAuditLog
    await PopupAuditLog.create({
      campaignId: newCampaign._id,
      campaignName: newCampaign.internalName,
      campaignSlug: newCampaign.slug,
      actorId: session.userId,
      actorRole: session.role,
      actorEmail: session.email,
      action: "create",
      changedFields: Object.keys(body),
      afterValues: {
        name: newCampaign.name,
        slug: newCampaign.slug,
        status: newCampaign.publicationStatus,
        isEnabled: newCampaign.isEnabled,
        priority: newCampaign.priority,
      },
      status: "success",
      details: `Created campaign "${newCampaign.name}" (${newCampaign.campaignId}) in ${newCampaign.publicationStatus} state.`,
    });

    // Record system-wide audit trail
    await recordAuditLog({
      userId: session.userId,
      userRole: session.role,
      action: "create_popup",
      category: "cms",
      resourceId: newCampaign._id.toString(),
      details: { name: newCampaign.name, status: newCampaign.publicationStatus, isEnabled: newCampaign.isEnabled },
      req,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Popup campaign created successfully",
        popup: newCampaign,
        campaign: newCampaign,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create popup error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create popup campaign" },
      { status: 500 }
    );
  }
}
