import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Category, Course } from "@/models";
import { getSessionUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { sanitizeHtml } from "@/lib/sanitize-html";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  try {
    await connectDB();
    const { idOrSlug } = await params;
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    const query = isObjectId ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] } : { slug: idOrSlug };

    const category = await Category.findOne(query)
      .populate("parentCategory", "name slug")
      .lean();

    if (!category) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    }

    // Fetch published courses for this category
    const courses = await Course.find({
      category: { $regex: new RegExp(`^${category.name}$`, "i") },
      status: "published",
    })
      .populate("instructor", "name avatar headline")
      .select("title slug subtitle thumbnail price discountPrice isFree ratingAverage ratingCount totalLessonsCount totalDurationMinutes level")
      .sort({ enrolledCount: -1, ratingAverage: -1 })
      .lean();

    // Fetch subcategories
    const subcategories = await Category.find({
      parentCategory: category._id,
      status: "active",
    })
      .select("name slug icon description")
      .lean();

    return NextResponse.json({
      success: true,
      category: {
        ...category,
        courseCount: courses.length,
      },
      courses,
      subcategories,
    });
  } catch (error: any) {
    console.error("Get category error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch category" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  try {
    await connectDB();
    const session = await getSessionUser(req);
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Administrator authorization required" }, { status: 403 });
    }

    const { idOrSlug } = await params;
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    const query = isObjectId ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] } : { slug: idOrSlug };

    const category = await Category.findOne(query);
    if (!category) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      name,
      slug: newSlug,
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

    const oldName = category.name;

    // Check slug collision with other categories
    if (newSlug && newSlug.trim() !== category.slug) {
      const cleanSlug = newSlug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const slugExists = await Category.findOne({
        slug: cleanSlug,
        _id: { $ne: category._id },
      });

      if (slugExists) {
        return NextResponse.json({ success: false, error: "Another category already uses this slug" }, { status: 409 });
      }
      category.slug = cleanSlug;
    }

    // Check name collision
    if (name && name.trim() !== category.name) {
      const nameExists = await Category.findOne({
        name: name.trim(),
        _id: { $ne: category._id },
      });

      if (nameExists) {
        return NextResponse.json({ success: false, error: "Another category already uses this name" }, { status: 409 });
      }
      category.name = name.trim();
    }

    // Prevent circular parent-child assignment
    if (parentCategory) {
      if (parentCategory.toString() === category._id.toString()) {
        return NextResponse.json({ success: false, error: "A category cannot be its own parent" }, { status: 400 });
      }

      // Check if candidate parent is currently a child of this category
      const childCategories = await Category.find({ parentCategory: category._id });
      const childIds = childCategories.map((c) => c._id.toString());
      if (childIds.includes(parentCategory.toString())) {
        return NextResponse.json(
          { success: false, error: "Cannot set a child category as this category's parent (circular dependency)" },
          { status: 400 }
        );
      }
      category.parentCategory = parentCategory;
    } else if (parentCategory === null) {
      category.parentCategory = null;
    }

    if (shortDescription !== undefined) category.shortDescription = shortDescription.trim();
    if (description !== undefined) category.description = sanitizeHtml(description.trim());
    if (detailedDescription !== undefined) category.detailedDescription = sanitizeHtml(detailedDescription.trim());
    if (icon !== undefined) category.icon = icon;
    if (thumbnail !== undefined) category.thumbnail = thumbnail.trim();
    if (bannerImage !== undefined) category.bannerImage = bannerImage.trim();
    if (displayOrder !== undefined) category.displayOrder = Number(displayOrder);
    if (status !== undefined) category.status = status;
    if (isFeatured !== undefined) category.isFeatured = Boolean(isFeatured);

    if (seo) {
      category.seo = {
        title: seo.title !== undefined ? seo.title.trim() : category.seo?.title || "",
        description: seo.description !== undefined ? seo.description.trim() : category.seo?.description || "",
        keywords: Array.isArray(seo.keywords)
          ? seo.keywords
          : typeof seo.keywords === "string"
          ? seo.keywords.split(",").map((k: string) => k.trim()).filter(Boolean)
          : category.seo?.keywords || [],
        ogImage: seo.ogImage !== undefined ? seo.ogImage.trim() : category.seo?.ogImage || "",
        canonicalUrl: seo.canonicalUrl !== undefined ? seo.canonicalUrl.trim() : category.seo?.canonicalUrl || "",
        noIndex: seo.noIndex !== undefined ? Boolean(seo.noIndex) : Boolean(category.seo?.noIndex),
        noFollow: seo.noFollow !== undefined ? Boolean(seo.noFollow) : Boolean(category.seo?.noFollow),
      };
    }

    await category.save();

    // If category name changed, update course category strings to keep consistent
    if (category.name !== oldName) {
      await Course.updateMany(
        { category: { $regex: new RegExp(`^${oldName}$`, "i") } },
        { $set: { category: category.name } }
      );
    }

    await logAuditEvent({
      action: "category_update",
      category: "course",
      resourceId: category._id.toString(),
      actorId: session.userId,
      actorRole: session.role,
      details: `Updated category "${category.name}" (${category.slug})`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: `Category "${category.name}" updated successfully`,
      category,
    });
  } catch (error: any) {
    console.error("Update category error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  try {
    await connectDB();
    const session = await getSessionUser(req);
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Administrator authorization required" }, { status: 403 });
    }

    const { idOrSlug } = await params;
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    const query = isObjectId ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] } : { slug: idOrSlug };

    const category = await Category.findOne(query);
    if (!category) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const reassignTo = searchParams.get("reassignTo");
    const force = searchParams.get("force") === "true";

    // Count courses using this category
    const courseCount = await Course.countDocuments({
      category: { $regex: new RegExp(`^${category.name}$`, "i") },
    });

    if (courseCount > 0 && !reassignTo && !force) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete: Category has ${courseCount} associated courses. Please reassign them to another category first, or set category to Archived.`,
          courseCount,
        },
        { status: 400 }
      );
    }

    // If reassignTo is requested, reassign courses to target category
    if (reassignTo) {
      const targetCategory = await Category.findById(reassignTo);
      if (!targetCategory) {
        return NextResponse.json({ success: false, error: "Reassignment target category not found" }, { status: 404 });
      }

      await Course.updateMany(
        { category: { $regex: new RegExp(`^${category.name}$`, "i") } },
        { $set: { category: targetCategory.name } }
      );
    }

    // Reassign subcategories of this category to null parent
    await Category.updateMany(
      { parentCategory: category._id },
      { $set: { parentCategory: null } }
    );

    const deletedName = category.name;
    const deletedId = category._id.toString();
    await Category.findByIdAndDelete(category._id);

    await logAuditEvent({
      action: "category_delete",
      category: "course",
      resourceId: deletedId,
      actorId: session.userId,
      actorRole: session.role,
      details: `Deleted category "${deletedName}" (reassigned ${courseCount} courses to ${reassignTo || "none"})`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: `Category "${deletedName}" deleted successfully`,
    });
  } catch (error: any) {
    console.error("Delete category error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete category" },
      { status: 500 }
    );
  }
}
