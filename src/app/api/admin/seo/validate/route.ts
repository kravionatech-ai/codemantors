import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PageSeo } from "@/models/PageSeo";
import { Course } from "@/models/Course";
import { BlogPost } from "@/models/BlogPost";
import { getSessionUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { auditSeoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (!hasPermission(session, "seo.manage_any") && !hasPermission(session, "seo.read"))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { path, title, description, canonicalUrl, ogImage, noIndex, noFollow, structuredDataType, structuredDataCustom } = body;

    const audit = auditSeoMetadata({
      title,
      description,
      canonicalUrl,
      ogImage,
      noIndex: Boolean(noIndex),
      noFollow: Boolean(noFollow),
    });

    const issues = [...audit.issues];
    let score = audit.score;

    // Check for duplicate titles across other pages
    if (title && title.trim()) {
      const trimmedTitle = title.trim();
      const [duplicateSeo, duplicateCourse, duplicatePost] = await Promise.all([
        PageSeo.findOne({
          path: { $ne: (path || "").toLowerCase() },
          title: { $regex: new RegExp(`^${trimmedTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        }).select("path title").lean(),
        Course.findOne({
          title: { $regex: new RegExp(`^${trimmedTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
          slug: { $ne: (path || "").replace(/^\/courses\//, "") },
        }).select("slug title").lean(),
        BlogPost.findOne({
          title: { $regex: new RegExp(`^${trimmedTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
          slug: { $ne: (path || "").replace(/^\/blog\//, "") },
        }).select("slug title").lean(),
      ]);

      if (duplicateSeo) {
        issues.push(`Duplicate SEO Title detected: Already used by page "${duplicateSeo.path}".`);
        score = Math.max(0, score - 15);
      } else if (duplicateCourse) {
        issues.push(`Duplicate Title detected: Conflicts with course "/courses/${duplicateCourse.slug}".`);
        score = Math.max(0, score - 10);
      } else if (duplicatePost) {
        issues.push(`Duplicate Title detected: Conflicts with blog post "/blog/${duplicatePost.slug}".`);
        score = Math.max(0, score - 10);
      }
    }

    // Validate structured data custom JSON if present
    let jsonLdValid = true;
    let jsonLdError = "";
    if (structuredDataCustom && structuredDataCustom.trim()) {
      try {
        const parsed = JSON.parse(structuredDataCustom);
        if (!parsed["@context"] || !parsed["@type"]) {
          jsonLdValid = false;
          jsonLdError = "Custom JSON-LD missing required '@context' or '@type' schema keys.";
          issues.push(jsonLdError);
          score = Math.max(0, score - 10);
        }
      } catch (err: any) {
        jsonLdValid = false;
        jsonLdError = `Invalid JSON-LD syntax: ${err.message}`;
        issues.push(jsonLdError);
        score = Math.max(0, score - 15);
      }
    }

    return NextResponse.json({
      success: true,
      score,
      issues,
      diagnostics: {
        score,
        issues,
        titleLength: (title || "").length,
        descriptionLength: (description || "").length,
        isTitleOptimal: (title || "").length >= 40 && (title || "").length <= 60,
        isDescriptionOptimal: (description || "").length >= 120 && (description || "").length <= 160,
        jsonLdValid,
        jsonLdError,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
