import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PopupCampaign } from "@/models/PopupCampaign";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const SENSITIVE_PREFIXES = [
  "/checkout",
  "/order-confirmation",
  "/login",
  "/register",
  "/learn",
  "/admin",
  "/cart",
  "/course-basket",
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawPathname = searchParams.get("pathname") || "/";
    const pathname = rawPathname.toLowerCase();

    // 1. Immediately bypass sensitive flows so promotional overlays NEVER interfere
    if (
      SENSITIVE_PREFIXES.some((prefix) => {
        if (prefix === "/learn") {
          return pathname === "/learn" || pathname.startsWith("/learn/");
        }
        return pathname.startsWith(prefix);
      })
    ) {
      return NextResponse.json({ success: true, popup: null });
    }

    await connectDB();

    const now = new Date();
    const session = await getSessionUser(req);

    // 2. Query published, enabled campaigns within active schedule window
    const candidates = await PopupCampaign.find({
      isEnabled: true,
      status: "published",
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ success: true, popup: null });
    }

    // 3. Filter candidates based on audience, page targeting, and impression limits
    const eligible = candidates.filter((camp) => {
      // Check maximum impressions threshold
      if (camp.maxImpressionsTotal && camp.maxImpressionsTotal > 0) {
        if ((camp.impressions || 0) >= camp.maxImpressionsTotal) {
          return false;
        }
      }

      // Check excluded pages
      if (camp.excludedPages && Array.isArray(camp.excludedPages)) {
        for (const excluded of camp.excludedPages) {
          if (excluded && pathname.startsWith(excluded.toLowerCase())) {
            return false;
          }
        }
      }

      // Check target pages
      if (camp.targetPages && Array.isArray(camp.targetPages) && !camp.targetPages.includes("all")) {
        const matchesTarget = camp.targetPages.some((tp) => {
          const cleanTp = tp.toLowerCase().trim();
          if (cleanTp === pathname) return true;
          if (cleanTp.endsWith("/*") && pathname.startsWith(cleanTp.slice(0, -2))) return true;
          return false;
        });
        if (!matchesTarget) return false;
      }

      // Check target audience
      const audience = camp.targeting?.targetAudience || camp.targetAudience || "all";
      switch (audience) {
        case "guests":
          if (session) return false;
          break;
        case "authenticated":
          if (!session) return false;
          break;
        case "students":
          if (!session || session.role !== "student") return false;
          break;
        case "instructors":
          if (!session || session.role !== "instructor") return false;
          break;
        case "all":
        default:
          break;
      }

      return true;
    });

    if (eligible.length === 0) {
      return NextResponse.json({ success: true, popup: null });
    }

    // Pick top priority eligible campaign
    const top = eligible[0];

    return NextResponse.json({
      success: true,
      popup: {
        _id: top._id.toString(),
        name: top.name,
        headline: top.headline,
        description: top.description,
        badgeText: top.badgeText,
        badgeColor: top.badgeColor,
        imageUrl: top.imageUrl,
        mobileImageUrl: top.mobileImageUrl,
        imageAlt: top.imageAlt,
        ctaText: top.ctaText,
        ctaUrl: top.ctaUrl,
        secondaryCtaText: top.secondaryCtaText,
        secondaryCtaUrl: top.secondaryCtaUrl,
        displayFrequency: top.displayFrequency,
        displayDelaySeconds: top.displayDelaySeconds,
        dismissalBehavior: top.dismissalBehavior,
      },
    });
  } catch (error: any) {
    console.error("Active popup resolution error:", error);
    return NextResponse.json(
      { success: false, popup: null, error: error.message },
      { status: 500 }
    );
  }
}
