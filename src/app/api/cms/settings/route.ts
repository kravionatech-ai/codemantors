import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { SiteSettings } from "@/models/SiteSettings";
import { getSessionUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    await connectDB();
    let settings = await SiteSettings.findOne({ key: "global_config" }).lean();

    if (!settings) {
      // Seed initial default settings if empty
      const created = await SiteSettings.create({
        key: "global_config",
        siteName: "CodeMentors",
        tagline: "Learn to Code. Build Real Skills. Grow Your Career.",
        navigation: {
          headerLinks: [
            { label: "Courses", href: "/courses", order: 1, isVisible: true },
            { label: "Learning Paths", href: "/learning-paths", order: 2, isVisible: true },
            { label: "Blog", href: "/blog", order: 3, isVisible: true },
            { label: "Verify Certificate", href: "/certificates/verify", order: 4, isVisible: true },
          ],
          footerColumns: [
            {
              title: "Learning",
              links: [
                { label: "Explore Courses", href: "/courses" },
                { label: "Learning Paths", href: "/learning-paths" },
                { label: "Certificate Verification", href: "/certificates/verify" },
                { label: "Technical Blog", href: "/blog" },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "About Us", href: "/about" },
                { label: "Contact Support", href: "/contact" },
                { label: "Frequently Asked Questions", href: "/faq" },
                { label: "Help Center", href: "/help" },
              ],
            },
            {
              title: "Legal & Policies",
              links: [
                { label: "Terms of Service", href: "/terms" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Refund Policy", href: "/refund-policy" },
              ],
            },
          ],
        },
      });
    }

    const defaultCompanyBranding = {
      enabled: true,
      companyName: "Kraviona Tech Solutions",
      companyUrl: "https://kraviona.com/",
      logoUrl: "",
      tagline: "Web Development | Backend Engineering | Technical SEO | AI Automation",
      shortDescription:
        "Kraviona Tech Solutions is a technology company focused on web development, full-stack application development, backend engineering, technical SEO, web performance, and AI automation.",
      services: [
        "MERN Stack Development",
        "React.js and Next.js Development",
        "Node.js Backend and API Development",
        "Technical SEO and Website Performance Optimization",
        "UI/UX and Web Application Development",
        "AI Automation and AI Chatbot Development",
        "E-commerce Development",
      ],
      contact: {
        website: "https://kraviona.com/contact",
        email: "contact@kraviona.com",
        phone: "+91 96085 53167",
      },
      displayPosition: "both" as const,
      openInNewTab: true,
    };

    if (settings && !settings.companyBranding) {
      settings.companyBranding = defaultCompanyBranding;
    }

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error("Site Settings GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load site settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSessionUser(req);
    if (!session || !hasPermission(session, "settings.manage")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Insufficient permissions to modify platform settings" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Server-side validation for company branding if present in updates
    if (body.companyBranding) {
      const { companyUrl, contact } = body.companyBranding;
      if (companyUrl && !/^https?:\/\//i.test(companyUrl)) {
        return NextResponse.json(
          { success: false, error: "Company website URL must start with http:// or https://" },
          { status: 400 }
        );
      }
      if (contact?.website && !/^https?:\/\//i.test(contact.website)) {
        return NextResponse.json(
          { success: false, error: "Contact website URL must start with http:// or https://" },
          { status: 400 }
        );
      }
      if (contact?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
        return NextResponse.json(
          { success: false, error: "Invalid contact email address format" },
          { status: 400 }
        );
      }
    }

    const settings = await SiteSettings.findOneAndUpdate(
      { key: "global_config" },
      { $set: body },
      { new: true, upsert: true }
    );

    await logAuditEvent({
      action: "settings_update",
      category: "settings",
      resourceId: "global_config",
      actorId: session.userId,
      actorRole: session.role,
      details: "Updated platform settings, company branding, and SEO defaults",
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Platform settings updated successfully",
      settings,
    });
  } catch (error: any) {
    console.error("Site Settings PUT error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update platform settings" },
      { status: 500 }
    );
  }
}
