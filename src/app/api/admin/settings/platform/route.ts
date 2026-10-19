import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { SiteSettings } from "@/models/SiteSettings";
import { getSessionUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (!hasPermission(session, "settings.manage") && session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    let settings = await SiteSettings.findOne({ key: "global_config" }).lean();
    if (!settings) {
      settings = await SiteSettings.create({ key: "global_config" });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (!hasPermission(session, "settings.manage") && session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const section = (body.section || body.category || "").toLowerCase();
    const data = body.data || body.settings || {};

    if (!section || !data) {
      return NextResponse.json({ success: false, error: "Section and data are required" }, { status: 400 });
    }

    const updateQuery: Record<string, any> = {};

    switch (section) {
      case "general":
        if (data.siteName) updateQuery.siteName = data.siteName.trim();
        if (data.tagline) updateQuery.tagline = data.tagline.trim();
        if (data.siteTagline) updateQuery.tagline = data.siteTagline.trim();
        if (data.logoUrl !== undefined) updateQuery.logoUrl = data.logoUrl.trim();
        if (data.faviconUrl !== undefined) updateQuery.faviconUrl = data.faviconUrl.trim();
        if (data.contactSettings) updateQuery.contactSettings = data.contactSettings;
        if (data.supportEmail) {
          updateQuery["contactSettings.supportEmail"] = data.supportEmail;
        }
        break;

      case "branding":
        if (data.companyBranding) updateQuery.companyBranding = data.companyBranding;
        if (data.brandColors) updateQuery.brandColors = data.brandColors;
        if (data.companyName || data.companyUrl || data.poweredByText) {
          updateQuery.companyBranding = {
            enabled: true,
            companyName: data.companyName || "Kraviona Tech Solutions",
            companyUrl: data.companyUrl || "https://kraviona.com/",
            tagline: data.poweredByText || "Powered by Kraviona",
            shortDescription:
              data.shortDescription ||
              "Web Development | Backend Engineering | Technical SEO | AI Automation",
            services: data.services || [
              "MERN Stack Development",
              "React.js and Next.js Development",
              "Node.js Backend and API Development",
              "Technical SEO and Website Performance Optimization",
              "UI/UX and Web Application Development",
              "AI Automation and AI Chatbot Development",
              "E-commerce Development",
            ],
            contact: data.contact || {
              website: "https://kraviona.com/contact",
              email: "contact@kraviona.com",
              phone: "+91 96085 53167",
            },
            displayPosition: "both",
            openInNewTab: true,
          };
        }
        if (data.primaryNavy || data.primaryBlue || data.primaryColor) {
          updateQuery.brandColors = {
            primaryNavy: data.primaryNavy || "#172554",
            primaryBlue: data.primaryBlue || data.primaryColor || "#2563EB",
            accentCyan: data.accentCyan || data.accentColor || "#06B6D4",
            background: data.background || "#F8FAFC",
          };
        }
        break;

      case "email":
        updateQuery.emailSettings = data;
        break;

      case "storage":
        updateQuery.storageSettings = data;
        break;

      case "limits":
        updateQuery.limitsSettings = data;
        if (data.requireCourseApproval !== undefined) {
          updateQuery["features.courseApprovalRequired"] = data.requireCourseApproval;
        }
        break;

      case "integrations":
        updateQuery.integrationsSettings = data;
        break;

      case "security":
        updateQuery.securitySettings = data;
        break;

      default:
        return NextResponse.json({ success: false, error: `Invalid settings section: ${section}` }, { status: 400 });
    }

    await connectDB();
    const updated = await SiteSettings.findOneAndUpdate(
      { key: "global_config" },
      { $set: updateQuery },
      { new: true, upsert: true }
    );

    await logAuditEvent({
      action: `settings_update_${section}`,
      category: "settings",
      resourceId: "global_config",
      actorId: session.userId,
      actorRole: session.role,
      details: { section, changedFields: Object.keys(data) },
      req,
    });

    return NextResponse.json({
      success: true,
      message: `Platform ${section.toUpperCase()} settings updated successfully.`,
      settings: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
