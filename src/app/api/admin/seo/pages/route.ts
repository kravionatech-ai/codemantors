import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PageSeo } from "@/models/PageSeo";
import { Course } from "@/models/Course";
import { Category } from "@/models/Category";
import { BlogPost } from "@/models/BlogPost";
import { LearningPath } from "@/models/LearningPath";
import { User } from "@/models/User";
import { SiteSettings } from "@/models/SiteSettings";
import { getSessionUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";
import { auditSeoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

const STATIC_PLATFORM_PAGES = [
  { path: "/", pageName: "Homepage", entityType: "homepage" },
  { path: "/about", pageName: "About Kraviona & CodeMentors", entityType: "about" },
  { path: "/contact", pageName: "Contact & Support", entityType: "contact" },
  { path: "/courses", pageName: "Course Catalog & Directory", entityType: "course_catalog" },
  { path: "/learning-paths", pageName: "Structured Learning Paths", entityType: "learning_path" },
  { path: "/blog", pageName: "Engineering & Tech Blog", entityType: "blog_index" },
  { path: "/terms", pageName: "Terms of Service", entityType: "cms_page" },
  { path: "/privacy", pageName: "Privacy Policy", entityType: "cms_page" },
  { path: "/refund-policy", pageName: "Refund & Cancellation Policy", entityType: "cms_page" },
  { path: "/help", pageName: "Help Center", entityType: "cms_page" },
  { path: "/faq", pageName: "Frequently Asked Questions", entityType: "cms_page" },
];

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (!hasPermission(session, "seo.manage_any") && !hasPermission(session, "seo.read"))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const entityTypeFilter = searchParams.get("type") || "all";
    const statusFilter = searchParams.get("status") || "all";

    // 1. Fetch all explicit overrides from DB
    const overrides = await PageSeo.find().lean();
    const overrideMap = new Map<string, any>();
    overrides.forEach((o) => overrideMap.set(o.path.toLowerCase(), o));

    // 2. Fetch catalog items to discover all eligible pages
    const [courses, categories, posts, paths, instructors, settings] = await Promise.all([
      Course.find({ status: { $ne: "archived" } }).select("title slug subtitle description thumbnail seo").lean(),
      Category.find().select("name slug description").lean(),
      BlogPost.find({ status: { $ne: "archived" } }).select("title slug excerpt coverImage seo").lean(),
      LearningPath.find().select("title slug description icon").lean(),
      User.find({ role: "instructor", isActive: true }).select("name headline avatar").lean(),
      SiteSettings.findOne({ key: "global_config" }).lean(),
    ]);

    const canonicalDomain = settings?.seoDefaults?.canonicalDomain || "http://localhost:3005";

    // 3. Assemble complete registry
    const allPages: any[] = [];

    // Static pages
    for (const sp of STATIC_PLATFORM_PAGES) {
      const override = overrideMap.get(sp.path.toLowerCase());
      const title = override?.title || `${sp.pageName} | CodeMentors`;
      const description = override?.description || `Explore ${sp.pageName} on CodeMentors platform.`;
      const audit = auditSeoMetadata({
        title,
        description,
        canonicalUrl: override?.canonicalUrl || `${canonicalDomain}${sp.path}`,
        ogImage: override?.ogImage || settings?.seoDefaults?.defaultOgImage,
        noIndex: override?.noIndex,
      });

      allPages.push({
        _id: override?._id || `virtual_${sp.path.replace(/[^a-zA-Z0-9]/g, "_")}`,
        path: sp.path,
        slug: sp.path.replace(/^\//, ""),
        pageName: sp.pageName,
        entityType: sp.entityType,
        hasOverride: Boolean(override),
        title,
        description,
        canonicalUrl: override?.canonicalUrl || `${canonicalDomain}${sp.path}`,
        noIndex: override?.noIndex || false,
        noFollow: override?.noFollow || false,
        ogTitle: override?.ogTitle || title,
        ogDescription: override?.ogDescription || description,
        ogImage: override?.ogImage || settings?.seoDefaults?.defaultOgImage,
        twitterCard: override?.twitterCard || "summary_large_image",
        status: override?.status || "published",
        seoScore: audit.score,
        issues: audit.issues,
        updatedAt: override?.updatedAt || new Date(),
      });
    }

    // Courses
    for (const c of courses) {
      const coursePath = `/courses/${c.slug}`;
      const override = overrideMap.get(coursePath.toLowerCase());
      const title = override?.title || c.seo?.title || `${c.title} | CodeMentors Masterclass`;
      const description =
        override?.description || c.seo?.description || c.subtitle || c.description?.substring(0, 150) || "";
      const audit = auditSeoMetadata({
        title,
        description,
        canonicalUrl: override?.canonicalUrl || `${canonicalDomain}${coursePath}`,
        ogImage: override?.ogImage || c.thumbnail,
        noIndex: override?.noIndex || c.seo?.noIndex,
      });

      allPages.push({
        _id: override?._id || `virtual_course_${c._id}`,
        path: coursePath,
        slug: c.slug,
        pageName: c.title,
        entityType: "course",
        entityId: c._id.toString(),
        hasOverride: Boolean(override),
        title,
        description,
        canonicalUrl: override?.canonicalUrl || `${canonicalDomain}${coursePath}`,
        noIndex: override?.noIndex || c.seo?.noIndex || false,
        noFollow: override?.noFollow || c.seo?.noFollow || false,
        ogTitle: override?.ogTitle || title,
        ogDescription: override?.ogDescription || description,
        ogImage: override?.ogImage || c.thumbnail || settings?.seoDefaults?.defaultOgImage,
        twitterCard: override?.twitterCard || "summary_large_image",
        status: override?.status || "published",
        seoScore: audit.score,
        issues: audit.issues,
        updatedAt: override?.updatedAt || new Date(),
      });
    }

    // Categories
    for (const cat of categories) {
      const catPath = `/courses/category/${cat.slug}`;
      const override = overrideMap.get(catPath.toLowerCase());
      const title = override?.title || `${cat.name} Courses & Masterclasses | CodeMentors`;
      const description = override?.description || cat.description || `Browse top rated ${cat.name} programming courses and masterclasses.`;
      const audit = auditSeoMetadata({
        title,
        description,
        canonicalUrl: override?.canonicalUrl || `${canonicalDomain}${catPath}`,
        ogImage: override?.ogImage,
      });

      allPages.push({
        _id: override?._id || `virtual_category_${cat._id}`,
        path: catPath,
        slug: cat.slug,
        pageName: `${cat.name} Category`,
        entityType: "category",
        entityId: cat._id.toString(),
        hasOverride: Boolean(override),
        title,
        description,
        canonicalUrl: override?.canonicalUrl || `${canonicalDomain}${catPath}`,
        noIndex: override?.noIndex || false,
        noFollow: override?.noFollow || false,
        ogTitle: override?.ogTitle || title,
        ogDescription: override?.ogDescription || description,
        ogImage: override?.ogImage || settings?.seoDefaults?.defaultOgImage,
        status: override?.status || "published",
        seoScore: audit.score,
        issues: audit.issues,
        updatedAt: override?.updatedAt || new Date(),
      });
    }

    // Blog Posts
    for (const post of posts) {
      const postPath = `/blog/${post.slug}`;
      const override = overrideMap.get(postPath.toLowerCase());
      const title = override?.title || post.seo?.title || `${post.title} | CodeMentors Tech Blog`;
      const description = override?.description || post.seo?.description || post.excerpt || "";
      const audit = auditSeoMetadata({
        title,
        description,
        canonicalUrl: override?.canonicalUrl || `${canonicalDomain}${postPath}`,
        ogImage: override?.ogImage || post.coverImage,
        noIndex: override?.noIndex || post.seo?.noIndex,
      });

      allPages.push({
        _id: override?._id || `virtual_post_${post._id}`,
        path: postPath,
        slug: post.slug,
        pageName: post.title,
        entityType: "blog_post",
        entityId: post._id.toString(),
        hasOverride: Boolean(override),
        title,
        description,
        canonicalUrl: override?.canonicalUrl || `${canonicalDomain}${postPath}`,
        noIndex: override?.noIndex || post.seo?.noIndex || false,
        noFollow: override?.noFollow || post.seo?.noFollow || false,
        ogTitle: override?.ogTitle || title,
        ogDescription: override?.ogDescription || description,
        ogImage: override?.ogImage || post.coverImage || settings?.seoDefaults?.defaultOgImage,
        status: override?.status || "published",
        seoScore: audit.score,
        issues: audit.issues,
        updatedAt: override?.updatedAt || new Date(),
      });
    }

    // Learning Paths
    for (const lp of paths) {
      const lpPath = `/learning-paths/${lp.slug}`;
      const override = overrideMap.get(lpPath.toLowerCase());
      const title = override?.title || `${lp.title} Career Track | CodeMentors`;
      const description = override?.description || lp.description || "";
      const audit = auditSeoMetadata({
        title,
        description,
        canonicalUrl: override?.canonicalUrl || `${canonicalDomain}${lpPath}`,
        ogImage: override?.ogImage,
      });

      allPages.push({
        _id: override?._id || `virtual_lp_${lp._id}`,
        path: lpPath,
        slug: lp.slug,
        pageName: lp.title,
        entityType: "learning_path",
        entityId: lp._id.toString(),
        hasOverride: Boolean(override),
        title,
        description,
        canonicalUrl: override?.canonicalUrl || `${canonicalDomain}${lpPath}`,
        noIndex: override?.noIndex || false,
        noFollow: override?.noFollow || false,
        ogTitle: override?.ogTitle || title,
        ogDescription: override?.ogDescription || description,
        ogImage: override?.ogImage || settings?.seoDefaults?.defaultOgImage,
        status: override?.status || "published",
        seoScore: audit.score,
        issues: audit.issues,
        updatedAt: override?.updatedAt || new Date(),
      });
    }

    // Instructors
    for (const inst of instructors) {
      const instPath = `/instructors/${inst._id}`;
      const override = overrideMap.get(instPath.toLowerCase());
      const title = override?.title || `${inst.name} — Instructor & Mentor Profile | CodeMentors`;
      const description = override?.description || inst.headline || `Learn software engineering and architecture directly with ${inst.name}.`;
      const audit = auditSeoMetadata({
        title,
        description,
        canonicalUrl: override?.canonicalUrl || `${canonicalDomain}${instPath}`,
        ogImage: override?.ogImage || inst.avatar,
      });

      allPages.push({
        _id: override?._id || `virtual_inst_${inst._id}`,
        path: instPath,
        slug: inst._id.toString(),
        pageName: `${inst.name} (Instructor)`,
        entityType: "instructor",
        entityId: inst._id.toString(),
        hasOverride: Boolean(override),
        title,
        description,
        canonicalUrl: override?.canonicalUrl || `${canonicalDomain}${instPath}`,
        noIndex: override?.noIndex || false,
        noFollow: override?.noFollow || false,
        ogTitle: override?.ogTitle || title,
        ogDescription: override?.ogDescription || description,
        ogImage: override?.ogImage || inst.avatar || settings?.seoDefaults?.defaultOgImage,
        status: override?.status || "published",
        seoScore: audit.score,
        issues: audit.issues,
        updatedAt: override?.updatedAt || new Date(),
      });
    }

    // Apply Filters
    let filtered = allPages;
    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.pageName.toLowerCase().includes(search) ||
          p.path.toLowerCase().includes(search) ||
          p.title.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search)
      );
    }
    if (entityTypeFilter !== "all") {
      filtered = filtered.filter((p) => p.entityType === entityTypeFilter);
    }
    if (statusFilter !== "all") {
      if (statusFilter === "override_only") {
        filtered = filtered.filter((p) => p.hasOverride);
      } else if (statusFilter === "has_issues") {
        filtered = filtered.filter((p) => p.issues && p.issues.length > 0);
      } else {
        filtered = filtered.filter((p) => p.status === statusFilter);
      }
    }

    // Global Stats
    const totalPages = allPages.length;
    const overriddenCount = allPages.filter((p) => p.hasOverride).length;
    const withIssuesCount = allPages.filter((p) => p.issues && p.issues.length > 0).length;
    const avgScore =
      allPages.length > 0
        ? Math.round(allPages.reduce((acc, p) => acc + (p.seoScore || 0), 0) / allPages.length)
        : 100;

    return NextResponse.json({
      success: true,
      pages: filtered,
      stats: {
        totalPages,
        overriddenCount,
        withIssuesCount,
        healthyCount: totalPages - withIssuesCount,
        avgScore,
      },
    });
  } catch (error: any) {
    console.error("Admin SEO pages GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list SEO pages" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !hasPermission(session, "seo.manage_any")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { path, pageName, entityType, title, description, canonicalUrl, noIndex, noFollow, ogTitle, ogDescription, ogImage, twitterCard, twitterTitle, twitterDescription, twitterImage, structuredDataType, structuredDataCustom, status } = body;

    if (!path || !path.trim()) {
      return NextResponse.json({ success: false, error: "Page path is required" }, { status: 400 });
    }

    const normalizedPath = path.toLowerCase().trim();
    const audit = auditSeoMetadata({
      title,
      description,
      canonicalUrl,
      ogImage,
      noIndex: Boolean(noIndex),
      noFollow: Boolean(noFollow),
    });

    const pageSeo = await PageSeo.findOneAndUpdate(
      { path: normalizedPath },
      {
        $set: {
          path: normalizedPath,
          slug: normalizedPath.replace(/^\//, ""),
          pageName: pageName?.trim() || normalizedPath,
          entityType: entityType || "custom",
          title: title?.trim() || "",
          description: description?.trim() || "",
          canonicalUrl: canonicalUrl?.trim() || "",
          noIndex: Boolean(noIndex),
          noFollow: Boolean(noFollow),
          ogTitle: ogTitle?.trim() || title?.trim() || "",
          ogDescription: ogDescription?.trim() || description?.trim() || "",
          ogImage: ogImage?.trim() || "",
          twitterCard: twitterCard || "summary_large_image",
          twitterTitle: twitterTitle?.trim() || ogTitle?.trim() || title?.trim() || "",
          twitterDescription: twitterDescription?.trim() || ogDescription?.trim() || description?.trim() || "",
          twitterImage: twitterImage?.trim() || ogImage?.trim() || "",
          structuredDataType: structuredDataType || "None",
          structuredDataCustom: structuredDataCustom || "",
          status: status || "published",
          seoScore: audit.score,
          issues: audit.issues,
          lastAuditedAt: new Date(),
          updatedBy: session.userId,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await logAuditEvent({
      action: "seo_page_upsert",
      category: "seo",
      resourceId: pageSeo._id.toString(),
      actorId: session.userId,
      actorRole: session.role,
      details: {
        path: normalizedPath,
        title: pageSeo.title,
        seoScore: audit.score,
      },
      req,
    });

    return NextResponse.json({
      success: true,
      message: `SEO settings saved for ${normalizedPath}`,
      page: pageSeo,
    });
  } catch (error: any) {
    console.error("Admin SEO pages POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save SEO page settings" },
      { status: 500 }
    );
  }
}
