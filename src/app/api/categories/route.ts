import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Category, Course } from "@/models";
import { getSessionUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { sanitizeHtml } from "@/lib/sanitize-html";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");
    const parentOnly = searchParams.get("parentOnly") === "true";

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (parentOnly) {
      query.parentCategory = null;
    }

    const categories = await Category.find(query)
      .populate("parentCategory", "name slug")
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    // Attach real published course count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat: any) => {
        const count = await Course.countDocuments({
          category: { $regex: new RegExp(`^${cat.name}$`, "i") },
          status: "published",
        });
        return {
          ...cat,
          courseCount: count,
        };
      })
    );

    return NextResponse.json({ success: true, categories: categoriesWithCount });
  } catch (error: any) {
    console.error("Categories fetch error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSessionUser(req);
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Administrator authorization required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      slug: customSlug,
      shortDescription,
      description,
      detailedDescription,
      icon,
      thumbnail,
      bannerImage,
      parentCategory,
      displayOrder,
      status,
      isFeatured,
      seo,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Category name is required" }, { status: 400 });
    }

    const cleanName = name.trim();
    let cleanSlug = customSlug?.trim()
      ? customSlug
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      : cleanName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

    if (!cleanSlug) {
      cleanSlug = `category-${Date.now()}`;
    }

    // Check for duplicate name or slug
    const existingName = await Category.findOne({ name: cleanName });
    if (existingName) {
      return NextResponse.json({ success: false, error: "A category with this name already exists" }, { status: 409 });
    }

    const existingSlug = await Category.findOne({ slug: cleanSlug });
    if (existingSlug) {
      return NextResponse.json({ success: false, error: "A category with this URL slug already exists" }, { status: 409 });
    }

    const newCategory = new Category({
      name: cleanName,
      slug: cleanSlug,
      shortDescription: shortDescription?.trim() || "",
      description: description ? sanitizeHtml(description.trim()) : "",
      detailedDescription: detailedDescription ? sanitizeHtml(detailedDescription.trim()) : "",
      icon: icon || "Code",
      thumbnail: thumbnail?.trim() || "",
      bannerImage: bannerImage?.trim() || "",
      parentCategory: parentCategory || null,
      displayOrder: Number(displayOrder || 0),
      status: status || "active",
      isFeatured: Boolean(isFeatured),
      seo: {
        title: seo?.title?.trim() || `${cleanName} Courses | CodeMentors`,
        description:
          seo?.description?.trim() ||
          shortDescription?.trim() ||
          description?.trim() ||
          `Explore verified ${cleanName} courses, hands-on modules, and accredited engineering certifications.`,
        keywords: Array.isArray(seo?.keywords)
          ? seo.keywords
          : typeof seo?.keywords === "string"
          ? seo.keywords.split(",").map((k: string) => k.trim()).filter(Boolean)
          : [cleanName, "Courses", "CodeMentors"],
        ogImage: seo?.ogImage?.trim() || bannerImage?.trim() || thumbnail?.trim() || "",
        canonicalUrl: seo?.canonicalUrl?.trim() || `/categories/${cleanSlug}`,
        noIndex: Boolean(seo?.noIndex),
        noFollow: Boolean(seo?.noFollow),
      },
    });

    await newCategory.save();

    await logAuditEvent({
      action: "category_create",
      category: "course",
      resourceId: newCategory._id.toString(),
      actorId: session.userId,
      actorRole: session.role,
      details: `Created category "${cleanName}" (${cleanSlug})`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: `Category "${cleanName}" created successfully`,
      category: newCategory,
    });
  } catch (error: any) {
    console.error("Category creation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create category" },
      { status: 500 }
    );
  }
}
